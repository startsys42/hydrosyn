import pathlib
import re

FILE = pathlib.Path(r"C:/Users/SANTIAGO/Desktop/projects/hydrosyn/servidor/supabase bd/rpcs esp32/rpc_esp32.sql")


def extract_all(sql: str):
    pattern = re.compile(r"create\s+or\s+replace\s+function\s+([^\(\s]+)\s*\(", re.I)
    for m in pattern.finditer(sql):
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
        print(f"{fname}\t{flat}")


def main():
    sql = FILE.read_text(encoding="utf-8", errors="ignore")
    extract_all(sql)


if __name__ == "__main__":
    main()
