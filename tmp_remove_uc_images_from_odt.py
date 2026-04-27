import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ODT = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/Diseño del sistema software.odt")
OUT = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/Diseño del sistema software_sin_imagenes.odt")

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "manifest": "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0",
}


def main() -> None:
    removed_frames = 0
    removed_pictures = 0
    removed_manifest = 0

    with zipfile.ZipFile(ODT, "r") as zin:
        content_root = ET.fromstring(zin.read("content.xml"))
        manifest_root = ET.fromstring(zin.read("META-INF/manifest.xml"))

        # Remove UC frames from content.xml
        for p in content_root.findall(".//text:p", NS):
            for fr in list(p.findall("draw:frame", NS)):
                name = fr.attrib.get(
                    "{urn:oasis:names:tc:opendocument:xmlns:drawing:1.0}name", ""
                )
                if re.match(r"^UC-\d{3}$", name):
                    p.remove(fr)
                    removed_frames += 1
                    # leave a small placeholder text so the paragraph isn't empty
                    if (p.text or "").strip() == "" and len(list(p)) == 0:
                        p.text = "[Diagrama eliminado]"

        # Remove manifest entries for UC images
        for fe in list(manifest_root.findall(".//manifest:file-entry", NS)):
            full_path = fe.attrib.get(
                "{urn:oasis:names:tc:opendocument:xmlns:manifest:1.0}full-path", ""
            )
            if re.match(r"^Pictures/UC-\d{3}\.png$", full_path):
                manifest_root.remove(fe)
                removed_manifest += 1

        tmp = OUT.with_suffix(".tmp.odt")
        with zipfile.ZipFile(tmp, "w") as zout:
            for item in zin.infolist():
                # drop embedded UC pngs
                if re.match(r"^Pictures/UC-\d{3}\.png$", item.filename):
                    removed_pictures += 1
                    continue

                data = zin.read(item.filename)
                if item.filename == "content.xml":
                    data = ET.tostring(
                        content_root, encoding="utf-8", xml_declaration=True
                    )
                elif item.filename == "META-INF/manifest.xml":
                    data = ET.tostring(
                        manifest_root, encoding="utf-8", xml_declaration=True
                    )
                zout.writestr(item, data)

    if OUT.exists():
        OUT.unlink()
    tmp.rename(OUT)

    print(f"removed_frames:{removed_frames}")
    print(f"removed_pictures:{removed_pictures}")
    print(f"removed_manifest:{removed_manifest}")
    print(f"out:{OUT}")


if __name__ == "__main__":
    main()

