import pathlib
import re

BASE = pathlib.Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/servidor/supabase bd/functions")


def extract_signature(sql: str):
    m = re.search(r"create\s+(?:or\s+replace\s+)?function\s+([^\(\s]+)\s*\(", sql, re.I)
    if not m:
        return None, None

    fname = m.group(1).split(".")[-1].strip('"')
    start = m.end() - 1
    depth = 0
    end = None
    for i, ch in enumerate(sql[start:], start):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                end = i
                break

    params = ""
    if end is not None:
        params = sql[start + 1 : end]

    flat = " ".join(params.replace("\n", " ").replace("\r", " ").split())
    return fname, flat


def main():
    for f in sorted(BASE.glob("*.sql")):
        sql = f.read_text(encoding="utf-8", errors="ignore")
        name, params = extract_signature(sql)
        if not name:
            continue
        print(f"{name}\t{params}")


if __name__ == "__main__":
    main()
