import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

odt = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/Diseño del sistema software.odt")
imgs = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/imagenes_secuencia_detallada")

ns = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "xlink": "http://www.w3.org/1999/xlink",
    "manifest": "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0",
}

with zipfile.ZipFile(odt, "r") as zin:
    croot = ET.fromstring(zin.read("content.xml"))
    mroot = ET.fromstring(zin.read("META-INF/manifest.xml"))

    for fr in croot.findall(".//draw:frame", ns):
        name = fr.attrib.get("{urn:oasis:names:tc:opendocument:xmlns:drawing:1.0}name", "")
        m = re.match(r"UC-(\d{3})$", name)
        if not m:
            continue
        uc = int(m.group(1))
        im = fr.find("draw:image", ns)
        if im is not None:
            im.set("{http://www.w3.org/1999/xlink}href", f"Pictures/UC-{uc:03d}.png")
        fr.set("{urn:oasis:names:tc:opendocument:xmlns:text:1.0}anchor-type", "as-char")

    existing = {
        e.attrib.get("{urn:oasis:names:tc:opendocument:xmlns:manifest:1.0}full-path")
        for e in mroot.findall(".//manifest:file-entry", ns)
    }

    tmp = odt.with_suffix(".tmp.odt")
    with zipfile.ZipFile(tmp, "w") as zout:
        for item in zin.infolist():
            if re.match(r"^Pictures/UC-\d{3}\.png$", item.filename):
                continue
            data = zin.read(item.filename)
            if item.filename == "content.xml":
                data = ET.tostring(croot, encoding="utf-8", xml_declaration=True)
            if item.filename == "META-INF/manifest.xml":
                continue
            zout.writestr(item, data)

        for uc in range(1, 55):
            matches = sorted(imgs.glob(f"UC-{uc:03d}_*.png"))
            if not matches:
                continue
            internal_name = f"Pictures/UC-{uc:03d}.png"
            zout.writestr(internal_name, matches[0].read_bytes())
            if internal_name not in existing:
                ET.SubElement(
                    mroot,
                    "{urn:oasis:names:tc:opendocument:xmlns:manifest:1.0}file-entry",
                    {
                        "{urn:oasis:names:tc:opendocument:xmlns:manifest:1.0}full-path": internal_name,
                        "{urn:oasis:names:tc:opendocument:xmlns:manifest:1.0}media-type": "image/png",
                    },
                )

        zout.writestr("META-INF/manifest.xml", ET.tostring(mroot, encoding="utf-8", xml_declaration=True))

try:
    odt.unlink()
    tmp.rename(odt)
    print("updated_original")
except Exception as e:
    fallback = odt.with_name("Diseño del sistema software_actualizado.odt")
    if fallback.exists():
        fallback.unlink()
    tmp.rename(fallback)
    print(f"fallback:{fallback}")
    print(f"reason:{type(e).__name__}:{e}")
