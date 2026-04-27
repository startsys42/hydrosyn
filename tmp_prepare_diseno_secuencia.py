import pathlib
import re

root = pathlib.Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn")
src_dir = root / "plantuml" / "analisis" / "secuencia"
dst_dir = root / "plantuml" / "diseno" / "secuencia"
dst_dir.mkdir(parents=True, exist_ok=True)

files = sorted(src_dir.glob("*.puml"), key=lambda p: int(re.match(r"(\d+)_", p.name, re.I).group(1)))

index_lines = [
    "SECCION PARA ODT - DIAGRAMAS DE SECUENCIA",
    "",
    "Formato sugerido por bloque:",
    "UC-XXX Nombre del caso de uso",
    "[Insertar imagen del diagrama aquí]",
    "Figura N: Diagrama de Secuencia UC-XXX Nombre del caso de uso",
    "",
]

for i, f in enumerate(files, start=1):
    text = f.read_text(encoding="utf-8", errors="ignore")
    n = re.match(r"(\d+)_", f.name, re.I).group(1)
    slug = re.sub(r"\.puml$", "", f.name, flags=re.I)
    title_raw = re.sub(r"^\d+_", "", slug)
    title_raw = title_raw.replace("_", " ").strip()
    title = f"UC-{int(n):03d} {title_raw}"

    # Ensure title exists
    if "@startuml" in text and "title " not in text:
        text = text.replace("@startuml", f"@startuml\ntitle {title}", 1)

    # Save in separate design folder
    new_name = f"UC-{int(n):03d}_{slug}.puml"
    (dst_dir / new_name).write_text(text, encoding="utf-8")

    # ODT insertion helper
    index_lines.append(title)
    index_lines.append(f"[Imagen: {new_name.replace('.puml', '.png')}]")
    index_lines.append(f"Figura {i}: Diagrama de Secuencia {title}")
    index_lines.append("")

(dst_dir / "00_plantilla_odt_secuencia.txt").write_text("\n".join(index_lines), encoding="utf-8")
print(f"Generated {len(files)} sequence diagrams in {dst_dir}")
