import re
import struct
import zlib
import zipfile
from dataclasses import dataclass
from pathlib import Path


ODT = Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/Diseño del sistema software.odt")


PNG_SIG = b"\x89PNG\r\n\x1a\n"


def iter_chunks(png: bytes):
    if not png.startswith(PNG_SIG):
        raise ValueError("not a png")
    i = len(PNG_SIG)
    while i + 8 <= len(png):
        ln = struct.unpack(">I", png[i : i + 4])[0]
        typ = png[i + 4 : i + 8]
        data = png[i + 8 : i + 8 + ln]
        crc = png[i + 8 + ln : i + 12 + ln]
        yield typ, data, crc
        i += 12 + ln
        if typ == b"IEND":
            break


@dataclass
class IHDR:
    width: int
    height: int
    bit_depth: int
    color_type: int
    compression: int
    filter: int
    interlace: int


def parse_ihdr(data: bytes) -> IHDR:
    w, h, bd, ct, comp, flt, inter = struct.unpack(">IIBBBBB", data)
    return IHDR(w, h, bd, ct, comp, flt, inter)


def paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def bpp_for(ct: int) -> int:
    # bytes per pixel for 8-bit depth only (what PlantUML outputs)
    if ct == 0:  # grayscale
        return 1
    if ct == 2:  # rgb
        return 3
    if ct == 3:  # indexed
        return 1
    if ct == 4:  # gray+alpha
        return 2
    if ct == 6:  # rgba
        return 4
    raise ValueError(f"unsupported color_type {ct}")


def unfilter_scanlines(raw: bytes, width: int, height: int, bpp: int) -> list[bytes]:
    stride = width * bpp
    out: list[bytes] = []
    pos = 0
    prev = bytearray(stride)
    for _ in range(height):
        ft = raw[pos]
        pos += 1
        scan = bytearray(raw[pos : pos + stride])
        pos += stride

        if ft == 0:
            pass
        elif ft == 1:  # Sub
            for i in range(stride):
                left = scan[i - bpp] if i >= bpp else 0
                scan[i] = (scan[i] + left) & 0xFF
        elif ft == 2:  # Up
            for i in range(stride):
                scan[i] = (scan[i] + prev[i]) & 0xFF
        elif ft == 3:  # Average
            for i in range(stride):
                left = scan[i - bpp] if i >= bpp else 0
                up = prev[i]
                scan[i] = (scan[i] + ((left + up) >> 1)) & 0xFF
        elif ft == 4:  # Paeth
            for i in range(stride):
                left = scan[i - bpp] if i >= bpp else 0
                up = prev[i]
                up_left = prev[i - bpp] if i >= bpp else 0
                scan[i] = (scan[i] + paeth(left, up, up_left)) & 0xFF
        else:
            raise ValueError(f"unsupported filter {ft}")

        out.append(bytes(scan))
        prev = scan
    return out


def filter_none(scanlines: list[bytes]) -> bytes:
    return b"".join(b"\x00" + s for s in scanlines)


def rotate_ccw(pixels: list[bytes], width: int, height: int, bpp: int) -> tuple[list[bytes], int, int]:
    # pixels: list of rows, each row bytes length width*bpp
    new_w, new_h = height, width
    new_rows = [bytearray(new_w * bpp) for _ in range(new_h)]
    for y in range(height):
        row = pixels[y]
        for x in range(width):
            src = row[x * bpp : (x + 1) * bpp]
            nx = y
            ny = new_h - 1 - x
            dst_row = new_rows[ny]
            dst_row[nx * bpp : (nx + 1) * bpp] = src
    return [bytes(r) for r in new_rows], new_w, new_h


def build_png(ihdr: IHDR, idat_raw: bytes, extra_chunks: list[tuple[bytes, bytes]] | None = None) -> bytes:
    if extra_chunks is None:
        extra_chunks = []

    def chunk(typ: bytes, data: bytes) -> bytes:
        ln = struct.pack(">I", len(data))
        crc = struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        return ln + typ + data + crc

    out = bytearray(PNG_SIG)
    ihdr_bytes = struct.pack(
        ">IIBBBBB",
        ihdr.width,
        ihdr.height,
        ihdr.bit_depth,
        ihdr.color_type,
        ihdr.compression,
        ihdr.filter,
        ihdr.interlace,
    )
    out += chunk(b"IHDR", ihdr_bytes)
    for typ, data in extra_chunks:
        out += chunk(typ, data)
    out += chunk(b"IDAT", zlib.compress(idat_raw))
    out += chunk(b"IEND", b"")
    return bytes(out)


def rotate_png_if_landscape(png: bytes, ratio_threshold: float = 1.0) -> tuple[bytes, bool]:
    # supports 8-bit RGB/RGBA and indexed (PlantUML output)
    chunks = list(iter_chunks(png))
    ihdr_data = next(data for typ, data, _ in chunks if typ == b"IHDR")
    ihdr = parse_ihdr(ihdr_data)
    if ihdr.bit_depth != 8 or ihdr.color_type not in (2, 3, 6):
        return png, False

    # rotate if it is landscape (width > height)
    if ihdr.width <= ihdr.height * ratio_threshold:
        return png, False

    idat = b"".join(data for typ, data, _ in chunks if typ == b"IDAT")
    raw = zlib.decompress(idat)
    bpp = bpp_for(ihdr.color_type)
    scanlines = unfilter_scanlines(raw, ihdr.width, ihdr.height, bpp)
    rotated, new_w, new_h = rotate_ccw(scanlines, ihdr.width, ihdr.height, bpp)

    new_ihdr = IHDR(
        width=new_w,
        height=new_h,
        bit_depth=ihdr.bit_depth,
        color_type=ihdr.color_type,
        compression=ihdr.compression,
        filter=ihdr.filter,
        interlace=ihdr.interlace,
    )
    new_raw = filter_none(rotated)
    # preserve PLTE/tRNS if present (indexed images)
    extra: list[tuple[bytes, bytes]] = []
    if ihdr.color_type == 3:
        for typ, data, _ in chunks:
            if typ in (b"PLTE", b"tRNS"):
                extra.append((typ, data))
    return build_png(new_ihdr, new_raw, extra_chunks=extra), True


def main() -> None:
    tmp = ODT.with_suffix(".tmp.odt")
    rotated = 0
    touched = 0

    with zipfile.ZipFile(ODT, "r") as zin, zipfile.ZipFile(tmp, "w") as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            m = re.match(r"^Pictures/UC-(\d{3})\.png$", item.filename)
            if m:
                touched += 1
                new_data, did = rotate_png_if_landscape(data)
                if did:
                    rotated += 1
                data = new_data
            zout.writestr(item, data)

    ODT.unlink()
    tmp.rename(ODT)
    print(f"touched:{touched}")
    print(f"rotated:{rotated}")


if __name__ == "__main__":
    main()

