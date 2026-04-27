import pathlib
import re

ROOT = pathlib.Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/servidor/hydrosyn-react/src")
OUT = pathlib.Path(
    r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/plantuml/analisis/clases/diagrama_clases_servidor_src.puml"
)


def to_class_name(rel_path: str) -> str:
    return "C_" + re.sub(r"[^A-Za-z0-9_]", "_", rel_path.replace(".js", ""))


def extract_internal_functions(source: str) -> list[str]:
    names: list[str] = []

    # function foo(...) { ... }
    for match in re.finditer(r"(?m)^\s*function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(", source):
        name = match.group(1)
        if name not in names:
            names.append(name)

    # const foo = (...) => { ... }
    for match in re.finditer(
        r"(?m)^\s*(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>",
        source,
    ):
        name = match.group(1)
        if name not in names:
            names.append(name)

    # const foo = x => { ... }
    for match in re.finditer(
        r"(?m)^\s*(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?[A-Za-z_][A-Za-z0-9_]*\s*=>",
        source,
    ):
        name = match.group(1)
        if name not in names:
            names.append(name)

    # Collect exported names to avoid considering them "internal methods"
    export_default_fn_names = {
        m.group(1)
        for m in re.finditer(
            r"(?m)^\s*export\s+default\s+function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(",
            source,
        )
    }

    export_named_fn_names = {
        m.group(1)
        for m in re.finditer(
            r"(?m)^\s*export\s+function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(",
            source,
        )
    }

    export_named_const_names = {
        m.group(1)
        for m in re.finditer(
            r"(?m)^\s*export\s+(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=",
            source,
        )
    }

    export_default_symbol_names = {
        m.group(1)
        for m in re.finditer(
            r"(?m)^\s*export\s+default\s+([A-Za-z_][A-Za-z0-9_]*)\s*;?",
            source,
        )
    }

    export_block_names: set[str] = set()
    for m in re.finditer(r"(?m)^\s*export\s*\{([^}]*)\}\s*;?", source):
        body = m.group(1)
        parts = [p.strip() for p in body.split(",") if p.strip()]
        for part in parts:
            left = part.split(" as ")[0].strip()
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", left):
                export_block_names.add(left)

    exported_names = (
        export_default_fn_names
        | export_named_fn_names
        | export_named_const_names
        | export_default_symbol_names
        | export_block_names
    )

    return [n for n in names if n not in exported_names]


def main() -> None:
    files = sorted(ROOT.rglob("*.js"))
    OUT.parent.mkdir(parents=True, exist_ok=True)

    lines: list[str] = [
        "@startuml",
        "skinparam classAttributeIconSize 0",
        "hide empty members",
        "",
        'package "servidor/hydrosyn-react/src" {',
        "",
    ]

    for file_path in files:
        rel = file_path.relative_to(ROOT).as_posix()
        class_name = to_class_name(rel)
        source = file_path.read_text(encoding="utf-8", errors="ignore")
        methods = extract_internal_functions(source)

        lines.append(f'class "{rel}" as {class_name} {{')
        for method in methods[:80]:
            lines.append(f"  -{method}()")
        lines.append("}")
        lines.append("")

    lines.append("}")
    lines.append("")
    lines.append("@enduml")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {OUT} with {len(files)} classes.")


if __name__ == "__main__":
    main()
