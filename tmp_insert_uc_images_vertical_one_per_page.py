import re
import struct
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

from tmp_rotate_landscape_uc_pngs_in_odt import rotate_png_if_landscape

ODT = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/Diseño del sistema software.odt")
IMG_DIR = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/imagenes_secuencia_detallada")

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "svg": "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
    "xlink": "http://www.w3.org/1999/xlink",
    "manifest": "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
}


def ensure_pagebreak_style(content_root: ET.Element, style_name: str) -> None:
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


def png_wh(png_bytes: bytes) -> tuple[int, int]:
    if len(png_bytes) < 24 or png_bytes[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not png")
    w, h = struct.unpack(">II", png_bytes[16:24])
    return w, h


def fit_size_cm(img_w: int, img_h: int, max_w_cm: float, max_h_cm: float) -> tuple[str, str]:
    # preserve aspect; choose largest that fits.
    img_ratio = img_w / img_h
    box_ratio = max_w_cm / max_h_cm
    if img_ratio <= box_ratio:
        h = max_h_cm
        w = h * img_ratio
    else:
        w = max_w_cm
        h = w / img_ratio
    return f"{w:.3f}cm", f"{h:.3f}cm"


def main() -> None:
    # A4 portrait typical usable area (approx). This avoids deformation and maximizes size.
    MAX_W_CM = 17.0
    MAX_H_CM = 24.0

    # Build rotated (portrait) PNG bytes per UC.
    uc_png: dict[int, bytes] = {}
    uc_wh: dict[int, tuple[int, int]] = {}
    for uc in range(1, 55):
        matches = sorted(IMG_DIR.glob(f"UC-{uc:03d}_*.png"))
        if not matches:
            continue
        b = matches[0].read_bytes()
        b2, _ = rotate_png_if_landscape(b, ratio_threshold=1.0)
        uc_png[uc] = b2
        uc_wh[uc] = png_wh(b2)

    with zipfile.ZipFile(ODT, "r") as zin:
        content_root = ET.fromstring(zin.read("content.xml"))
        manifest_root = ET.fromstring(zin.read("META-INF/manifest.xml"))

    ensure_pagebreak_style(content_root, "PB_UC_IMAGE")

    office_text = content_root.find("office:body", NS).find("office:text", NS)
    paras = office_text.findall(".//text:p", NS)

    existing_manifest = {
        e.attrib.get(f"{{{NS['manifest']}}}full-path", "")
        for e in manifest_root.findall(".//manifest:file-entry", NS)
    }

    inserted = 0
    for i, p in enumerate(paras):
        txt = "".join(p.itertext()).strip()
        m = re.match(r"^UC-(\d{3})\b", txt)
        if not m:
            continue
        uc = int(m.group(1))
        if uc not in uc_png:
            continue

        # Find the next paragraph after the UC title to host the image
        if i + 1 >= len(paras):
            continue
        host = paras[i + 1]

        # Clear existing children/text in host and set page-break style
        for ch in list(host):
            host.remove(ch)
        host.text = ""
        host.set(f"{{{NS['text']}}}style-name", "PB_UC_IMAGE")

        w_px, h_px = uc_wh[uc]
        w_cm, h_cm = fit_size_cm(w_px, h_px, MAX_W_CM, MAX_H_CM)

        frame = ET.Element(
            f"{{{NS['draw']}}}frame",
            {
                f"{{{NS['draw']}}}name": f"UC-{uc:03d}",
                f"{{{NS['text']}}}anchor-type": "as-char",
                f"{{{NS['svg']}}}width": w_cm,
                f"{{{NS['svg']}}}height": h_cm,
                f"{{{NS['draw']}}}z-index": "0",
            },
        )
        ET.SubElement(
            frame,
            f"{{{NS['draw']}}}image",
            {
                f"{{{NS['xlink']}}}href": f"Pictures/UC-{uc:03d}.png",
                f"{{{NS['xlink']}}}type": "simple",
                f"{{{NS['xlink']}}}show": "embed",
                f"{{{NS['xlink']}}}actuate": "onLoad",
            },
        )
        host.append(frame)
        inserted += 1

    # write new odt with embedded images
    tmp = ODT.with_suffix(".tmp.odt")
    with zipfile.ZipFile(ODT, "r") as zin, zipfile.ZipFile(tmp, "w") as zout:
        for item in zin.infolist():
            # drop any previous UC images if they exist
            if re.match(r"^Pictures/UC-\d{3}\.png$", item.filename):
                continue
            data = zin.read(item.filename)
            if item.filename == "content.xml":
                data = ET.tostring(content_root, encoding="utf-8", xml_declaration=True)
            elif item.filename == "META-INF/manifest.xml":
                # we will rewrite after adding entries
                continue
            zout.writestr(item, data)

        for uc, b in uc_png.items():
            internal = f"Pictures/UC-{uc:03d}.png"
            zout.writestr(internal, b)
            if internal not in existing_manifest:
                ET.SubElement(
                    manifest_root,
                    f"{{{NS['manifest']}}}file-entry",
                    {
                        f"{{{NS['manifest']}}}full-path": internal,
                        f"{{{NS['manifest']}}}media-type": "image/png",
                    },
                )

        zout.writestr(
            "META-INF/manifest.xml",
            ET.tostring(manifest_root, encoding="utf-8", xml_declaration=True),
        )

    ODT.unlink()
    tmp.rename(ODT)
    print(f"inserted:{inserted}")


if __name__ == "__main__":
    main()

