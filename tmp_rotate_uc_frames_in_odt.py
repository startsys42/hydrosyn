import re
import struct
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ODT = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/Diseño del sistema software.odt")

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "svg": "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
}


def parse_cm(s: str) -> float:
    s = s.strip()
    if not s.endswith("cm"):
        raise ValueError(f"unsupported unit: {s}")
    return float(s[:-2])


def fmt_cm(v: float) -> str:
    return f"{v:.3f}cm"


def main() -> None:
    with zipfile.ZipFile(ODT, "r") as zin:
        croot = ET.fromstring(zin.read("content.xml"))
        # read embedded image dimensions from PNG header (IHDR)
        png_dims: dict[str, tuple[int, int]] = {}
        for name in zin.namelist():
            m = re.match(r"^Pictures/(UC-\d{3})\.png$", name)
            if not m:
                continue
            b = zin.read(name)
            # width/height are big-endian at offset 16..24
            if len(b) >= 24 and b.startswith(b"\x89PNG"):
                w, h = struct.unpack(">II", b[16:24])
                png_dims[m.group(1)] = (w, h)

    # First, reset any previous rotation and normalize frame sizes.
    # Then, rotate ONLY if the embedded PNG itself is landscape (w > h).
    rotated = 0
    total = 0

    for fr in croot.findall(".//draw:frame", NS):
        name = fr.attrib.get("{urn:oasis:names:tc:opendocument:xmlns:drawing:1.0}name", "")
        if not re.match(r"^UC-\d{3}$", name):
            continue
        total += 1
        # clear any previous transform
        tr_key = "{urn:oasis:names:tc:opendocument:xmlns:drawing:1.0}transform"
        if tr_key in fr.attrib:
            del fr.attrib[tr_key]

        # default landscape frame size (fits most)
        fr.set("{urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0}width", "16cm")
        fr.set("{urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0}height", "9cm")

        dims = png_dims.get(name)
        if not dims:
            continue
        img_w, img_h = dims
        if img_w <= img_h:
            continue  # already portrait

        # rotate frame for landscape images
        # swap to portrait-ish frame and apply transform to rotate content
        fr.set("{urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0}width", "9cm")
        fr.set("{urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0}height", "16cm")
        fr.set(tr_key, "rotate(-90) translate(-9cm 0cm)")
        rotated += 1

    tmp = ODT.with_suffix(".tmp.odt")
    with zipfile.ZipFile(ODT, "r") as zin, zipfile.ZipFile(tmp, "w") as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "content.xml":
                data = ET.tostring(croot, encoding="utf-8", xml_declaration=True)
            zout.writestr(item, data)

    ODT.unlink()
    tmp.rename(ODT)
    print(f"uc_frames:{total}")
    print(f"rotated_frames:{rotated}")


if __name__ == "__main__":
    main()

