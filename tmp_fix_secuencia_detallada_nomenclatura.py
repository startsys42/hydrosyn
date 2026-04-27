from pathlib import Path
import re

BASE = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/plantuml/diseno/secuencia_detallada")

ACTOR_ALIAS_BY_UC = {
    **{n: "UN" for n in (1, 2)},
    3: "U",
    4: "U",
    5: "U",
    **{n: "A" for n in (6, 7, 8, 9, 10)},
    **{n: "P" for n in (11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25)},
    26: "P",
    27: "P",
    28: "P",
    29: "U",
    30: "U",
    31: "P",
    32: "U",
    33: "P",
    34: "U",
    35: "U",
    36: "P",
    37: "P",
    38: "U",
    39: "P",
    40: "P",
    41: "ESP32",
    42: "P",
    43: "P",
    44: "P",
    45: "P",
    46: "U",
    47: "P",
    48: "P",
    49: "ESP32",
    50: "U",
    51: "P",
    52: "U",
    53: "U",
    54: "P",
}

ACTOR_LABEL = {
    "UN": "Usuario No Logueado",
    "U": "Usuario",
    "P": "Propietario",
    "A": "Administrador",
    "ESP32": "ESP32",
}

BOUNDARY_LABEL = {
    "VA": "Vista Autenticacion",
    "VO": "Vista Perfil Usuario",
    "VSA": "Vista Administrador",
    "VP": "Vista Propietario",
    "VS": "Vista Sistemas",
    "VCH": "Vista ESP32",
    "VT": "Vista Tanques",
    "VB": "Vista Bombas",
    "VL": "Vista Luces",
    "VR": "Vista Registros",
}

CONTROL_LABEL = {
    "CA": "Control Autenticacion",
    "CU": "Control Usuarios",
    "CS": "Control Sistemas",
    "CH": "Control ESP32",
    "CT": "Control Tanques",
    "CB": "Control Bombas",
    "CL": "Control Luces",
    "CR": "Control Registros",
}

ENTITY_LABEL = {
    "UP": "Repositorio Usuarios",
    "NO": "Repositorio Notificaciones",
    "ASI": "Repositorio Asociaciones",
    "S": "Repositorio Sistemas",
    "ESP32": "Repositorio ESP32",
    "T": "Repositorio Tanques",
    "B": "Repositorio Bombas",
    "PB": "Repositorio Programacion Bombas",
    "PL": "Repositorio Programacion Luces",
    "L": "Repositorio Luces",
    "CBO": "Repositorio Calibraciones y Bombeos",
    "R": "Repositorio Registros",
}


def uc_number_from_name(name: str) -> int | None:
    m = re.match(r"UC-(\d{3})_", name, re.I)
    return int(m.group(1)) if m else None


def actor_aliases(lines: list[str]) -> list[str]:
    aliases: list[str] = []
    for ln in lines:
        m = re.match(r'^\s*actor\s+(?:"[^"]+"\s+as\s+)?([A-Za-z0-9_]+)', ln)
        if m:
            aliases.append(m.group(1))
    return aliases


def normalize_decl(ln: str) -> str:
    m = re.match(r'^\s*actor\s+(?:"[^"]+"\s+as\s+)?([A-Za-z0-9_]+)', ln)
    if m:
        alias = m.group(1)
        if alias == "ESP32":
            return f'actor "{ACTOR_LABEL[alias]}" as {alias} <<device>>'
        return f'actor "{ACTOR_LABEL.get(alias, alias)}" as {alias}'

    m = re.match(r'^\s*(?:boundary|participant)\s+(?:"[^"]+"\s+as\s+)?([A-Za-z0-9_]+)', ln)
    if m:
        alias = m.group(1)
        if alias in BOUNDARY_LABEL:
            return f'participant "{BOUNDARY_LABEL[alias]} ({alias})" as {alias}'
        if alias in CONTROL_LABEL:
            return f'participant "{CONTROL_LABEL[alias]} ({alias})" as {alias}'
        if alias in ENTITY_LABEL:
            return f'participant "{ENTITY_LABEL[alias]} ({alias})" as {alias}'
        return ln

    m = re.match(r'^\s*control\s+([A-Za-z0-9_]+)', ln)
    if m:
        alias = m.group(1)
        return f'participant "{CONTROL_LABEL.get(alias, "Control")} ({alias})" as {alias}'

    m = re.match(r'^\s*entity\s+([A-Za-z0-9_]+)', ln)
    if m:
        alias = m.group(1)
        return f'participant "{ENTITY_LABEL.get(alias, "Repositorio")} ({alias})" as {alias}'

    return ln


changed = 0
for p in BASE.glob("*.[pP][uU][mM][lL]"):
    text = p.read_text(encoding="utf-8", errors="ignore")
    lines = text.splitlines()
    uc = uc_number_from_name(p.name)
    expected = ACTOR_ALIAS_BY_UC.get(uc) if uc else None

    aliases = actor_aliases(lines)
    non_device = [a for a in aliases if a != "ESP32"]
    if expected and expected != "ESP32" and non_device:
        old = non_device[0]
        if old != expected:
            token = re.compile(rf"\b{re.escape(old)}\b")
            lines = [token.sub(expected, ln) for ln in lines]

    out: list[str] = []
    has_autonumber = any(re.match(r"^\s*autonumber\b", ln) for ln in lines)
    for ln in lines:
        out.append(normalize_decl(ln))

    if not has_autonumber:
        for i, ln in enumerate(out):
            if re.match(r"^\s*@startuml\s*$", ln):
                out.insert(i + 1, "autonumber")
                out.insert(i + 2, "")
                break

    new_text = "\n".join(out) + "\n"
    if new_text != text:
        p.write_text(new_text, encoding="utf-8")
        changed += 1

print(changed)
