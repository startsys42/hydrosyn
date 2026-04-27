from pathlib import Path
import re

ROOT = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn")
SRC = ROOT / "servidor" / "hydrosyn-react" / "src"
DST = ROOT / "plantuml" / "diseno" / "secuencia_detallada"

ACTOR_BY_UC = {
    **{n: "Usuario No Logueado" for n in (1, 2)},
    3: "Usuario",
    4: "Usuario",
    5: "Usuario",
    **{n: "Administrador" for n in (6, 7, 8, 9, 10)},
    **{n: "Propietario" for n in (11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25)},
    26: "Propietario",
    27: "Propietario",
    28: "Propietario",
    29: "Usuario",
    30: "Usuario",
    31: "Propietario",
    32: "Usuario",
    33: "Propietario",
    34: "Usuario",
    35: "Usuario",
    36: "Propietario",
    37: "Propietario",
    38: "Usuario",
    39: "Propietario",
    40: "Propietario",
    41: "ESP32",
    42: "Propietario",
    43: "Propietario",
    44: "Propietario",
    45: "Propietario",
    46: "Usuario",
    47: "Propietario",
    48: "Propietario",
    49: "ESP32",
    50: "Usuario",
    51: "Propietario",
    52: "Usuario",
    53: "Usuario",
    54: "Propietario",
}

COMPONENT_BY_UC = {
    1: "Login",
    2: "RecoverPassword",
    3: "Sidebar",
    4: "ChangeEmail",
    5: "ChangePassword",
    6: "CreateUserAdmin",
    7: "ActivateUserAdmin",
    8: "ActivateDeleteUserAdmin",
    9: "NotificationsAdmin",
    10: "NotificationsAdmin",
    11: "NotificationsAccordion",
    12: "CreateUserSystem",
    13: "ActivateUserSystem",
    14: "DeleteUserSystem",
    15: "AssociateUserSystem",
    16: "CreateSystem",
    17: "RenameSystem",
    18: "ChangeSecret",
    19: "DeleteSystem",
    20: "CreateESP32",
    21: "RenameESP32",
    22: "DeleteESP32",
    23: "CreateTank",
    24: "RenameTank",
    25: "DeleteTank",
    26: "CreatePump",
    27: "UpdatePump",
    28: "DeletePump",
    29: "CalibratePump",
    30: "ListCalibrate",
    31: "ListCalibrate",
    32: "ListCalibration",
    33: "ListCalibration",
    34: "InsertPumping",
    35: "ListRecordsPump",
    36: "ListRecordsPump",
    37: "CreateProgrammingPump",
    38: "ListProgrammingPumps",
    39: "ListProgrammingPumps",
    40: "ListProgrammingPumps",
    41: "Esp32RuntimePump",
    42: "CreateLight",
    43: "UpdateLight",
    44: "DeleteLight",
    45: "CreateProgrammingLight",
    46: "ListProgrammingLights",
    47: "ListProgrammingLights",
    48: "ListProgrammingLights",
    49: "Esp32RuntimeLight",
    50: "ListRecordsLights",
    51: "ListRecordsLights",
    52: "CreateRecord",
    53: "ListRecords",
    54: "ListRecords",
}


def find_component_file(component: str) -> Path | None:
    for p in SRC.rglob("*.js"):
        txt = p.read_text(encoding="utf-8", errors="ignore")
        if re.search(rf"export\s+default\s+function\s+{re.escape(component)}\s*\(", txt):
            return p
    return None


def extract_ops(code: str) -> list[str]:
    ops: list[str] = []
    for m in re.finditer(r"supabase\.auth\.([A-Za-z0-9_]+)\s*\(", code):
        ops.append(f"auth.{m.group(1)}()")
    for m in re.finditer(r"supabase\.functions\.invoke\(\s*['\"]([^'\"]+)['\"]", code):
        ops.append(f"functions.invoke('{m.group(1)}')")
    for m in re.finditer(r"supabase\.rpc\(\s*['\"]([^'\"]+)['\"]", code):
        ops.append(f"rpc('{m.group(1)}')")
    for m in re.finditer(r"from\(\s*['\"]([^'\"]+)['\"]\s*\)", code):
        table = m.group(1)
        tail = code[m.end(): m.end() + 160]
        action = "query"
        am = re.search(r"\.(select|insert|update|delete)\s*\(", tail)
        if am:
            action = am.group(1)
        ops.append(f"{action}('{table}')")
    # keep order, unique
    dedup: list[str] = []
    for op in ops:
        if op not in dedup:
            dedup.append(op)
    return dedup[:8]


def build_puml(uc: int, file: Path | None, component: str) -> str:
    actor = ACTOR_BY_UC.get(uc, "Usuario")
    actor_alias = "A"
    ui_alias = "UI"
    c_alias = "APP"
    sb_alias = "SB"
    db_alias = "DB"
    fn_alias = "FN"
    code = file.read_text(encoding="utf-8", errors="ignore") if file else ""
    ops = extract_ops(code)
    has_fn = any(op.startswith("functions.invoke") for op in ops)

    lines: list[str] = []
    lines.append("@startuml")
    lines.append("autonumber")
    lines.append("")
    if actor == "ESP32":
        lines.append(f'actor "{actor}" as {actor_alias} <<device>>')
    else:
        lines.append(f'actor "{actor}" as {actor_alias}')
    lines.append(f'participant "{component} (React)" as {ui_alias}')
    lines.append('participant "Aplicacion (Logica Cliente)" as APP')
    lines.append('participant "Supabase JS Client" as SB')
    if has_fn:
        lines.append('participant "Supabase Edge Function" as FN')
    lines.append('database "PostgreSQL" as DB')
    lines.append("")
    lines.append(f"{actor_alias} -> {ui_alias}: iniciarCasoUso()")
    lines.append(f"activate {ui_alias}")
    lines.append(f"{ui_alias} -> {c_alias}: validarEntradaYContexto()")
    lines.append(f"activate {c_alias}")
    lines.append(f"alt validacion incorrecta")
    lines.append(f"  {c_alias} --> {ui_alias}: errorValidacion")
    lines.append(f"  {ui_alias} --> {actor_alias}: mostrarError()")
    lines.append("else validacion correcta")
    if ops:
        for op in ops:
            if op.startswith("functions.invoke"):
                lines.append(f"  {c_alias} -> {sb_alias}: {op}")
                lines.append(f"  activate {sb_alias}")
                lines.append(f"  {sb_alias} -> {fn_alias}: ejecutarEdgeFunction()")
                lines.append(f"  activate {fn_alias}")
                lines.append(f"  {fn_alias} -> {db_alias}: query/transaction")
                lines.append(f"  activate {db_alias}")
                lines.append(f"  {db_alias} --> {fn_alias}: resultado")
                lines.append(f"  deactivate {db_alias}")
                lines.append(f"  {fn_alias} --> {sb_alias}: payload")
                lines.append(f"  deactivate {fn_alias}")
                lines.append(f"  {sb_alias} --> {c_alias}: respuesta")
                lines.append(f"  deactivate {sb_alias}")
            elif op.startswith("auth.") or op.startswith("rpc(") or op.startswith(("select", "insert", "update", "delete", "query")):
                lines.append(f"  {c_alias} -> {sb_alias}: {op}")
                lines.append(f"  activate {sb_alias}")
                lines.append(f"  {sb_alias} -> {db_alias}: query/rpc")
                lines.append(f"  activate {db_alias}")
                lines.append(f"  {db_alias} --> {sb_alias}: datos/estado")
                lines.append(f"  deactivate {db_alias}")
                lines.append(f"  {sb_alias} --> {c_alias}: respuesta")
                lines.append(f"  deactivate {sb_alias}")
    else:
        lines.append(f"  {c_alias} -> {sb_alias}: ejecutarOperacionSupabase()")
        lines.append(f"  activate {sb_alias}")
        lines.append(f"  {sb_alias} -> {db_alias}: query")
        lines.append(f"  activate {db_alias}")
        lines.append(f"  {db_alias} --> {sb_alias}: resultado")
        lines.append(f"  deactivate {db_alias}")
        lines.append(f"  {sb_alias} --> {c_alias}: respuesta")
        lines.append(f"  deactivate {sb_alias}")
    lines.append(f"  {c_alias} --> {ui_alias}: respuestaOK")
    lines.append(f"  {ui_alias} --> {actor_alias}: mostrarConfirmacion()")
    lines.append("end")
    lines.append(f"deactivate {c_alias}")
    lines.append(f"deactivate {ui_alias}")
    lines.append("@enduml")
    return "\n".join(lines) + "\n"


def main() -> None:
    generated = 0
    for p in sorted(DST.glob("*.[pP][uU][mM][lL]")):
        m = re.match(r"UC-(\d{3})_", p.name, re.I)
        if not m:
            continue
        uc = int(m.group(1))
        component = COMPONENT_BY_UC.get(uc, "UI")
        file = find_component_file(component)
        p.write_text(build_puml(uc, file, component), encoding="utf-8")
        generated += 1
    print(generated)


if __name__ == "__main__":
    main()
