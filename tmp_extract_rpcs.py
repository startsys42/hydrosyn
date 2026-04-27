import pathlib
import re

base = pathlib.Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/servidor/supabase bd/functions")

rows = []
for f in sorted(base.glob("*.sql")):
    s = f.read_text(encoding="utf-8", errors="ignore")
    m = re.search(r"create\s+(?:or\s+replace\s+)?function\s+([^\(\s]+)\s*\(", s, re.I)
    if not m:
        continue

    fname = m.group(1).split(".")[-1].strip('"')
    start = m.end() - 1

    depth = 0
    end = None
    for i, ch in enumerate(s[start:], start):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                end = i
                break

    params = ""
    if end is not None:
        params = s[start + 1 : end]

    flat = " ".join(params.replace("\n", " ").replace("\r", " ").split())
    param_names = []
    if flat:
        for raw in re.split(r",(?![^()]*\))", flat):
            raw = raw.strip()
            if not raw:
                continue
            tokens = raw.split()
            if tokens[0].lower() in {"in", "out", "inout", "variadic"} and len(tokens) > 1:
                name = tokens[1]
            else:
                name = tokens[0]
            param_names.append(name.strip('"'))

    rows.append((f.name, fname, ", ".join(param_names)))

for row in rows:
    print("\t".join(row))
