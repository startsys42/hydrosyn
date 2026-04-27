from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn")
TABLES_SQL = ROOT / "servidor" / "supabase bd" / "tables" / "tables.sql"
OUT = ROOT / "plantuml" / "analisis" / "clases" / "diagrama_bd_tables_sql.puml"


@dataclass
class Column:
    name: str
    type: str
    not_null: bool = False
    default: str | None = None


@dataclass
class ForeignKey:
    cols: list[str]
    ref_table: str
    ref_cols: list[str]
    on_delete: str | None = None
    on_update: str | None = None


@dataclass
class Table:
    name: str
    columns: list[Column] = field(default_factory=list)
    pk: list[str] = field(default_factory=list)
    fks: list[ForeignKey] = field(default_factory=list)


def norm_ident(ident: str) -> str:
    ident = ident.strip()
    if ident.startswith('"') and ident.endswith('"'):
        ident = ident[1:-1]
    return ident


def _merge_fk_continuation_lines(lines: list[str]) -> list[str]:
    """Join lines where ON UPDATE follows ON DELETE on the next line (common in this SQL)."""
    out: list[str] = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        if i + 1 < len(lines) and re.search(
            r"ON\s+DELETE\s+[A-Z]+\s*$", ln, re.IGNORECASE
        ) and re.match(r"^\s*ON\s+UPDATE\s+", lines[i + 1], re.IGNORECASE):
            ln = ln.rstrip() + " " + lines[i + 1].strip()
            i += 2
            out.append(ln)
            continue
        i += 1
        out.append(ln)
    return out


def parse_create_tables(sql: str) -> dict[str, Table]:
    # very pragmatic parser for the CREATE TABLE style used in this repo
    tables: dict[str, Table] = {}

    # Remove /* */ comments, keep line comments for readability but ignore parsing in them
    sql = re.sub(r"/\*[\s\S]*?\*/", "", sql)

    create_re = re.compile(
        r"CREATE\s+TABLE\s+(?P<name>(?:public\.)?[A-Za-z0-9_]+)\s*\((?P<body>[\s\S]*?)\)\s*;",
        re.IGNORECASE,
    )

    for m in create_re.finditer(sql):
        name = m.group("name")
        name = name.split(".", 1)[1] if name.lower().startswith("public.") else name
        body = m.group("body")

        t = Table(name=name)

        raw_lines = [ln.strip().rstrip(",") for ln in body.splitlines() if ln.strip()]
        lines = _merge_fk_continuation_lines(raw_lines)

        for ln in lines:
            # FK rule continuations alone on a line
            if re.match(r"^\s*ON\s+(DELETE|UPDATE)\b", ln, re.IGNORECASE):
                continue

            if ln.upper().startswith("CONSTRAINT "):
                pk_m = re.search(r"PRIMARY\s+KEY\s*\(([^)]+)\)", ln, re.IGNORECASE)
                if pk_m:
                    t.pk = [norm_ident(x) for x in pk_m.group(1).split(",")]

                fk_m = re.search(
                    r"FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?P<ref>(?:public\.)?[A-Za-z0-9_]+)\s*\(([^)]+)\)",
                    ln,
                    re.IGNORECASE,
                )
                if fk_m:
                    cols = [norm_ident(x) for x in fk_m.group(1).split(",")]
                    ref = fk_m.group("ref")
                    ref = ref.split(".", 1)[1] if ref.lower().startswith("public.") else ref
                    ref_cols = [norm_ident(x) for x in fk_m.group(3).split(",")]
                    on_del = None
                    on_upd = None
                    od = re.search(r"ON\s+DELETE\s+([A-Z]+)", ln, re.IGNORECASE)
                    ou = re.search(r"ON\s+UPDATE\s+([A-Z]+)", ln, re.IGNORECASE)
                    if od:
                        on_del = od.group(1).upper()
                    if ou:
                        on_upd = ou.group(1).upper()
                    t.fks.append(
                        ForeignKey(
                            cols=cols,
                            ref_table=ref,
                            ref_cols=ref_cols,
                            on_delete=on_del,
                            on_update=on_upd,
                        )
                    )
                continue

            if re.match(r"^(PRIMARY|FOREIGN)\s+KEY\b", ln, re.IGNORECASE):
                continue
            if ln.upper().startswith("CHECK "):
                continue
            if re.match(r"^\s*UNIQUE\s*\(", ln, re.IGNORECASE):
                continue

            # Column definition
            col_m = re.match(r'^("?[A-Za-z0-9_]+"?)\s+(.+)$', ln)
            if not col_m:
                continue
            col_name = norm_ident(col_m.group(1))
            rest = col_m.group(2).strip()

            stop = re.search(
                r"\b(NOT\s+NULL|DEFAULT|CONSTRAINT|CHECK|REFERENCES|GENERATED|UNIQUE|PRIMARY\s+KEY)\b",
                rest,
                re.IGNORECASE,
            )
            col_type = rest if not stop else rest[: stop.start()].strip()

            not_null = bool(re.search(r"\bNOT\s+NULL\b", rest, re.IGNORECASE))
            default_m = re.search(
                r"\bDEFAULT\s+(.+?)(?:\s+CONSTRAINT|\s+CHECK|\s+UNIQUE|\s+NOT\s+NULL|$)",
                rest,
                re.IGNORECASE,
            )
            default = default_m.group(1).strip() if default_m else None
            t.columns.append(Column(name=col_name, type=col_type, not_null=not_null, default=default))

            if re.search(r"\bPRIMARY\s+KEY\b", rest, re.IGNORECASE) and col_name not in t.pk:
                t.pk.append(col_name)

        # inline REFERENCES on column lines only (not CONSTRAINT lines)
        for ln in lines:
            if ln.upper().startswith("CONSTRAINT "):
                continue
            if re.match(r"^\s*ON\s+(DELETE|UPDATE)\b", ln, re.IGNORECASE):
                continue
            col_fk = re.match(
                r'^("?[A-Za-z0-9_]+"?)\s+.+?\bREFERENCES\s+(?P<ref>(?:public\.)?[A-Za-z0-9_]+)\s*\(([^)]+)\)(?P<tail>.*)$',
                ln,
                re.IGNORECASE,
            )
            if not col_fk:
                continue
            col = norm_ident(col_fk.group(1))
            ref = col_fk.group("ref")
            ref = ref.split(".", 1)[1] if ref.lower().startswith("public.") else ref
            ref_cols = [norm_ident(x) for x in col_fk.group(3).split(",")]
            tail = col_fk.group("tail") or ""
            od = re.search(r"ON\s+DELETE\s+([A-Z]+)", tail, re.IGNORECASE)
            ou = re.search(r"ON\s+UPDATE\s+([A-Z]+)", tail, re.IGNORECASE)
            t.fks.append(
                ForeignKey(
                    cols=[col],
                    ref_table=ref,
                    ref_cols=ref_cols,
                    on_delete=(od.group(1).upper() if od else None),
                    on_update=(ou.group(1).upper() if ou else None),
                )
            )

        # de-duplicate FKs (same cols + ref)
        seen: set[tuple[tuple[str, ...], str, tuple[str, ...]]] = set()
        uniq: list[ForeignKey] = []
        for fk in t.fks:
            key = (tuple(fk.cols), fk.ref_table, tuple(fk.ref_cols))
            if key in seen:
                continue
            seen.add(key)
            uniq.append(fk)
        t.fks = uniq

        tables[t.name] = t

    return tables


def puml_escape(s: str) -> str:
    return s.replace('"', '\\"')


def generate_puml(tables: dict[str, Table]) -> str:
    lines: list[str] = []
    lines.append("@startuml")
    lines.append("hide circle")
    lines.append("skinparam classAttributeIconSize 0")
    lines.append("skinparam linetype ortho")
    lines.append("skinparam shadowing false")
    lines.append("")
    lines.append('title Diseño BD (tables.sql)')
    lines.append("")

    # Entities
    for name in sorted(tables.keys()):
        t = tables[name]
        lines.append(f'entity "{puml_escape(name)}" as {name} {{')
        # Show PK first if present
        pk_set = set(t.pk)
        for c in t.columns:
            prefix = "* " if c.name in pk_set else "  "
            nn = " NOT NULL" if c.not_null else ""
            lines.append(f"{prefix}{puml_escape(c.name)} : {puml_escape(c.type)}{nn}")
        lines.append("}")
        lines.append("")

    # Relationships from FKs
    rels: set[str] = set()
    for t in tables.values():
        for fk in t.fks:
            if fk.ref_table not in tables:
                # skip external refs e.g. auth.users
                continue
            label = ", ".join(fk.cols) + " -> " + ", ".join(fk.ref_cols)
            # Note: PlantUML relationship syntax contains "}"; avoid f-string brace parsing issues.
            rule = (
                f'{t.name} '
                + "}o--|| "
                + f'{fk.ref_table} : "{puml_escape(label)}"'
            )
            rels.add(rule)
    lines.extend(sorted(rels))
    lines.append("")
    lines.append("@enduml")
    return "\n".join(lines) + "\n"


def main() -> None:
    sql = TABLES_SQL.read_text(encoding="utf-8", errors="ignore")
    tables = parse_create_tables(sql)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(generate_puml(tables), encoding="utf-8")
    print(f"tables:{len(tables)} out:{OUT}")


if __name__ == "__main__":
    main()

