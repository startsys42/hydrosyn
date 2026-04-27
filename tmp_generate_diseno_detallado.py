import pathlib
import re

ROOT = pathlib.Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn")
SRC = ROOT / "plantuml" / "analisis" / "secuencia"
DST = ROOT / "plantuml" / "diseno" / "secuencia_detallada"
DST.mkdir(parents=True, exist_ok=True)

ACTOR_BY_UC = {
    **{n: "UsuarioNoLogueado" for n in (1, 2)},
    6: "Administrador",
    7: "Administrador",
    8: "Administrador",
    9: "Administrador",
    10: "Administrador",
    11: "Propietario",
    12: "Propietario",
    13: "Propietario",
    14: "Propietario",
    15: "Propietario",
    16: "Propietario",
    17: "Propietario",
    18: "Propietario",
    19: "Propietario",
    20: "Propietario",
    21: "Propietario",
    22: "Propietario",
    23: "Propietario",
    24: "Propietario",
    25: "Propietario",
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

RPC_BY_UC = {
    9: "get_admin_login_attempts_with_user_email",
    10: "delete_login_attempts_between",
    11: "get_login_attempts_with_user_email",
    12: "associate_user_to_system",
    13: "active_user_associate_system",
    14: "delete_user_system",
    15: "associate_user_to_system",
    16: "insert_system_with_secret",
    18: "insert_system_with_secret",
    19: "delete_system",
    20: "insert_system_with_secret",
    23: "insert_record_for_system",
    26: "get_pumps_for_system",
    29: "get_pending_calibrations + complete_calibration",
    30: "get_calibrates_for_system",
    31: "delete_calibrations_between",
    32: "get_calibrations_for_system",
    33: "delete_calibrate_between",
    34: "get_pending_manual_records + complete_manual_record",
    35: "get_records_pumps_for_system",
    36: "delete_records_pumps_between",
    37: "get_programming_pumps_for_system",
    38: "get_programming_pumps_for_system",
    39: "get_programming_pumps_for_system",
    40: "delete_records_pumps_between",
    41: "get_pending_programs + register_execution",
    42: "get_lights_for_system",
    45: "get_programming_lights_for_system",
    46: "get_programming_lights_for_system",
    47: "get_programming_lights_for_system",
    48: "delete_records_between",
    49: "get_pending_light_events + register_light_event",
    50: "get_lights_history",
    51: "delete_records_between",
    52: "insert_record_for_system",
    53: "get_records_for_system",
    54: "delete_records_between",
}

def uc_title_from_file(name: str) -> tuple[int, str]:
    m = re.match(r"(\d+)_", name, re.I)
    n = int(m.group(1)) if m else 0
    slug = re.sub(r"^\d+_", "", re.sub(r"\.puml$", "", name, flags=re.I))
    slug = slug.replace("_", " ").strip()
    return n, slug


def actor_for_uc(num: int) -> str:
    return ACTOR_BY_UC.get(num, "Usuario")


def needs_esp32(num: int) -> bool:
    return num in (29, 34, 41, 49)


def domain_from_num(num: int) -> str:
    if 1 <= num <= 3:
        return "Auth"
    if 4 <= num <= 15:
        return "Users"
    if 16 <= num <= 19:
        return "Systems"
    if 20 <= num <= 22:
        return "ESP32"
    if 23 <= num <= 25:
        return "Tanks"
    if 26 <= num <= 41:
        return "Pumps"
    if 42 <= num <= 51:
        return "Lights"
    return "Records"


def operation_kind(title: str) -> str:
    t = title.lower()
    if "crear" in t:
        return "create"
    if "eliminar" in t:
        return "delete"
    if "renombrar" in t or "cambiar" in t or "actualizar" in t or "modificar" in t:
        return "update"
    if "listar" in t or "ver" in t:
        return "read"
    if "ejecutar" in t or "realizar" in t:
        return "execute"
    return "read"


def build_diagram(num: int, title: str) -> str:
    uc = f"UC-{num:03d} {title}"
    actor = actor_for_uc(num)
    domain = domain_from_num(num)
    kind = operation_kind(title)
    esp = needs_esp32(num)

    lines: list[str] = []
    lines.append("@startuml")
    lines.append("!include ../../common.puml")
    lines.append(f"title {uc} - Realizacion de Diseno")
    lines.append("autonumber")
    lines.append("")
    lines.append(f"actor {actor} as A")
    if actor == "ESP32":
        lines.append('boundary "ESP32Runtime" as UI')
    else:
        lines.append(f'boundary "{COMPONENT_BY_UC.get(num, "WebUI")} (React)" as UI')
    lines.append(f'control "{domain}Controller" as C')
    lines.append(f'control "{domain}Service" as S')
    lines.append('entity "SupabaseClient/RPC" as R')
    lines.append('database "PostgreSQL" as DB')
    if esp:
        lines.append('control "ESP32Gateway" as G')
        lines.append('entity "ESP32Device" as E')
    lines.append("")
    lines.append("A -> UI: iniciarCasoUso()")
    lines.append("activate UI")
    lines.append("UI -> C: enviarComando(dto, authContext)")
    lines.append("activate C")
    lines.append("C -> C: validarPermisosYFormato()")
    lines.append("C -> C: validarSistemaSeleccionado()")
    lines.append("")
    lines.append("alt datos/permisos invalidos")
    lines.append("  C --> UI: errorValidacion")
    lines.append("  UI --> A: mostrarError()")
    lines.append("else datos validos")
    lines.append("  C -> S: ejecutarCasoUso(dto, contexto)")
    lines.append("  activate S")
    rpc = RPC_BY_UC.get(num, "consulta/operacion SQL")
    lines.append(f"  S -> R: invocar({rpc})")
    lines.append("  activate R")
    lines.append("  R -> DB: begin + query/rpc")
    lines.append("  activate DB")
    lines.append("")
    if kind == "create":
        lines.append("  DB --> R: id_creado")
    elif kind == "delete":
        lines.append("  DB --> R: filas_eliminadas")
    elif kind == "update":
        lines.append("  DB --> R: filas_actualizadas")
    elif kind == "execute":
        lines.append("  DB --> R: datos_ejecucion")
    else:
        lines.append("  DB --> R: datos")
    lines.append("")
    if esp and actor != "ESP32":
        lines.append("  R -> G: publicarTrabajo(dispositivo, payload)")
        lines.append("  activate G")
        lines.append("  G -> E: enviarOrden()")
        lines.append("  activate E")
        lines.append("  E --> G: resultadoEjecucion")
        lines.append("  deactivate E")
        lines.append("  G --> R: ack/resultado")
        lines.append("  deactivate G")
    if actor == "ESP32":
        lines.append("  DB --> R: tareasPendientes")
        lines.append("  R --> S: payloadEjecucion")
        lines.append("  S --> C: planEjecucion")
        lines.append("  C --> UI: ejecutarLocalmente(GPIO/tiempo)")
        lines.append("  UI -> C: confirmarResultado(success)")
        lines.append("  C -> S: registrarResultado()")
        lines.append("  S -> R: invocarRPCRegistro()")
        lines.append("  R -> DB: update ejecucion/history")
        lines.append("  DB --> R: ok_registro")
    lines.append("")
    lines.append("  alt error de DB/RPC")
    lines.append("    DB --> R: error")
    lines.append("    R --> S: errorTecnico")
    lines.append("    S --> C: errorDTO")
    lines.append("    C --> UI: mostrarErrorOperacion()")
    lines.append("    UI --> A: notificarFallo()")
    lines.append("  else operacion correcta")
    lines.append("    R -> DB: commit/registroAuditoria")
    lines.append("    DB --> R: ok")
    lines.append("    R --> S: resultadoNegocio")
    lines.append("    S --> C: respuestaDTO")
    lines.append("    C --> UI: respuestaOK")
    lines.append("    UI --> A: mostrarConfirmacion()")
    lines.append("  end")
    lines.append("  deactivate DB")
    lines.append("  deactivate R")
    lines.append("  deactivate S")
    lines.append("end")
    lines.append("")
    lines.append("deactivate C")
    lines.append("deactivate UI")
    lines.append("@enduml")
    return "\n".join(lines) + "\n"


def main() -> None:
    files = sorted(SRC.glob("*.puml"), key=lambda p: int(re.match(r"(\d+)_", p.name, re.I).group(1)))
    index: list[str] = [
        "SECCION ODT - DISENO DETALLADO",
        "",
        "Formato:",
        "UC-XXX Nombre",
        "[Imagen: UC-XXX_nombre.png]",
        "Figura N: Diagrama de Secuencia UC-XXX Nombre",
        "",
    ]
    for i, f in enumerate(files, start=1):
        num, title = uc_title_from_file(f.name)
        out_name = f"UC-{num:03d}_{f.name}"
        content = build_diagram(num, title)
        (DST / out_name).write_text(content, encoding="utf-8")

        uc = f"UC-{num:03d} {title}"
        index.append(uc)
        index.append(f"[Imagen: {out_name.replace('.puml', '.png')}]")
        index.append(f"Figura {i}: Diagrama de Secuencia {uc}")
        index.append("")

    (DST / "00_plantilla_odt_diseno_detallado.txt").write_text("\n".join(index), encoding="utf-8")
    print(f"Generated {len(files)} detailed design diagrams in {DST}")


if __name__ == "__main__":
    main()
