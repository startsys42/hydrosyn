import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ODT = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/Diseño del sistema software.odt")

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
    "svg": "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
}


def ensure_paragraph_style_break_before(content_root: ET.Element, style_name: str) -> None:
    auto = content_root.find("office:automatic-styles", NS)
    if auto is None:
        auto = ET.SubElement(content_root, f"{{{NS['office']}}}automatic-styles")

    for st in auto.findall("style:style", NS):
        if st.attrib.get(f"{{{NS['style']}}}name") == style_name:
            return

    st = ET.SubElement(
        auto,
        f"{{{NS['style']}}}style",
        {
            f"{{{NS['style']}}}name": style_name,
            f"{{{NS['style']}}}family": "paragraph",
        },
    )
    ET.SubElement(
        st,
        f"{{{NS['style']}}}paragraph-properties",
        {f"{{{NS['fo']}}}break-before": "page"},
    )


def main() -> None:
    with zipfile.ZipFile(ODT, "r") as zin:
        content_root = ET.fromstring(zin.read("content.xml"))

    ensure_paragraph_style_break_before(content_root, "PB_UC_IMAGE")

    office_text = content_root.find("office:body", NS).find("office:text", NS)
    paragraphs = office_text.findall(".//text:p", NS)

    uc_image_paras = 0
    for p in paragraphs:
        fr = p.find("draw:frame", NS)
        if fr is None:
            continue
        name = fr.attrib.get(f"{{{NS['draw']}}}name", "")
        if not re.match(r"^UC-\d{3}$", name):
            continue

        # One per page: page break before this paragraph
        p.set(f"{{{NS['text']}}}style-name", "PB_UC_IMAGE")

        # Big vertical frame (fits page better)
        fr.set(f"{{{NS['svg']}}}width", "9cm")
        fr.set(f"{{{NS['svg']}}}height", "16cm")

        uc_image_paras += 1

    tmp = ODT.with_suffix(".tmp.odt")
    with zipfile.ZipFile(ODT, "r") as zin, zipfile.ZipFile(tmp, "w") as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "content.xml":
                data = ET.tostring(content_root, encoding="utf-8", xml_declaration=True)
            zout.writestr(item, data)

    ODT.unlink()
    tmp.rename(ODT)
    print(f"uc_image_paras:{uc_image_paras}")


if __name__ == "__main__":
    main()

