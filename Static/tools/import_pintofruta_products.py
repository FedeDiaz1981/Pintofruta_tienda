from __future__ import annotations

import difflib
import json
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(r"C:\FD\WBI\Maxi\Proyectos\En curso\NATIER\MAQUTA\Repo\Static")
SOURCE_D = Path(r"C:\FD\WBI\Maxi\Proyectos\En curso\NATIER\Docs\D 03-06-26.xlsx")
SOURCE_I = Path(r"C:\FD\WBI\Maxi\Proyectos\En curso\NATIER\Docs\I 03-06-26.xlsx")
JSON_OUT = ROOT / "data" / "site-content.json"
JS_OUT = ROOT / "data" / "site-content-data.js"


NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def ascii_text(value: object) -> str:
    text = str(value or "")
    text = text.replace("\u00a0", " ").replace("�", "")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_key(value: object) -> str:
    text = ascii_text(value).casefold()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_price(value: object) -> int | None:
    text = ascii_text(value)
    text = re.sub(r"[^\d-]", "", text)
    if not text:
        return None
    try:
        return int(text)
    except ValueError:
        return None


def infer_flags(blob: str) -> dict[str, bool]:
    text = normalize_key(blob)
    return {
        "kosher": "kosher" in text,
        "sinTacc": "sin tacc" in text or "sin gluten" in text,
        "sinAditivos": any(
            token in text
            for token in [
                "sin aditivos",
                "sin conservantes",
                "sin colorantes",
                "sin siliconas",
                "sin parabenos",
                "sin aluminio",
                "sin petroleo",
                "sin derivados de aluminio",
            ]
        ),
        "noTesteadoEnAnimales": any(
            token in text
            for token in [
                "no testea en animales",
                "no testeado en animales",
                "cruelty free",
            ]
        ),
    }


def read_sheet_rows(path: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(path) as zf:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in zf.namelist():
            root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            for si in root.findall("m:si", NS):
                shared_strings.append("".join(t.text or "" for t in si.findall(".//m:t", NS)))

        root = ET.fromstring(zf.read("xl/worksheets/sheet1.xml"))
        rows: list[dict[str, str]] = []
        current_section = ""

        for row in root.findall(".//m:sheetData/m:row", NS):
            values: dict[str, str] = {}
            for cell in row.findall("m:c", NS):
                ref = cell.attrib["r"]
                col = re.sub(r"\d+", "", ref)
                cell_type = cell.attrib.get("t")
                value_node = cell.find("m:v", NS)

                if cell_type == "s" and value_node is not None:
                    raw = shared_strings[int(value_node.text or "0")]
                elif cell_type == "inlineStr":
                    raw = "".join(t.text or "" for t in cell.findall(".//m:t", NS))
                else:
                    raw = value_node.text if value_node is not None else ""
                values[col] = ascii_text(raw)

            row_num = int(row.attrib["r"])
            brand = values.get("B", "").strip()
            detail = values.get("C", "").strip()
            presentation = values.get("D", "").strip()
            price = values.get("E", "").strip()

            if detail and not brand and not price and row_num > 14:
                current_section = detail
                continue

            if brand and detail and price and row_num > 14:
                rows.append(
                    {
                        "row": row_num,
                        "brand": brand,
                        "detail": detail,
                        "presentation": presentation,
                        "price": price,
                        "section": current_section,
                        "flags": infer_flags(f"{current_section} {detail}"),
                    }
                )

        return rows


def align_rows(rows_d: list[dict[str, str]], rows_i: list[dict[str, str]]) -> list[dict[str, str]]:
    brands_d = [normalize_key(row["brand"]) for row in rows_d]
    brands_i = [normalize_key(row["brand"]) for row in rows_i]
    matcher = difflib.SequenceMatcher(a=brands_d, b=brands_i, autojunk=False)

    merged: list[dict[str, str]] = []
    used_i = set()

    for tag, a1, a2, b1, b2 in matcher.get_opcodes():
        span_d = a2 - a1
        span_i = b2 - b1

        if tag in {"equal", "replace"}:
            span = min(span_d, span_i)
            for offset in range(span):
                merged.append(merge_pair(rows_d[a1 + offset], rows_i[b1 + offset]))
                used_i.add(b1 + offset)

            for offset in range(span, span_d):
                merged.append(merge_single(rows_d[a1 + offset], source="d"))

            for offset in range(span, span_i):
                merged.append(merge_single(rows_i[b1 + offset], source="i"))
                used_i.add(b1 + offset)
            continue

        if tag == "delete":
            for index in range(a1, a2):
                merged.append(merge_single(rows_d[index], source="d"))
            continue

        if tag == "insert":
            for index in range(b1, b2):
                merged.append(merge_single(rows_i[index], source="i"))
                used_i.add(index)

    # keep any unvisited rows from I in their original order, just in case
    for index, row in enumerate(rows_i):
        if index not in used_i:
            merged.append(merge_single(row, source="i"))

    return merged


def merge_pair(row_d: dict[str, str], row_i: dict[str, str]) -> dict[str, object]:
    public_price = parse_price(row_i["price"]) or parse_price(row_d["price"]) or 0
    member_price = parse_price(row_d["price"]) or public_price
    return build_product(row_d, public_price=public_price, member_price=member_price)


def merge_single(row: dict[str, str], source: str) -> dict[str, object]:
    price = parse_price(row["price"]) or 0
    return build_product(row, public_price=price, member_price=price)


def build_product(row: dict[str, str], public_price: int, member_price: int) -> dict[str, object]:
    cleaned_brand = ascii_text(row["brand"])
    cleaned_detail = ascii_text(row["detail"])
    cleaned_presentation = ascii_text(row["presentation"])
    sku = f"IMP{len(PRODUCTS) + 1:04d}"

    product = {
        "id": len(PRODUCTS) + 1,
        "sku": sku,
        "name": cleaned_detail,
        "brand": cleaned_brand,
        "detail": cleaned_detail,
        "presentation": cleaned_presentation,
        "description": cleaned_detail,
        "publicPrice": int(public_price),
        "memberPrice": int(member_price),
        "kosher": bool(row["flags"]["kosher"]),
        "sinTacc": bool(row["flags"]["sinTacc"]),
        "sinAditivos": bool(row["flags"]["sinAditivos"]),
        "noTesteadoEnAnimales": bool(row["flags"]["noTesteadoEnAnimales"]),
        "image": "assets/images/metaimage.jpg",
        "categoryId": 1,
        "categoryName": "Catalogo importado",
        "stock": 0,
        "status": "published",
        "featured": False,
        "sourceSection": ascii_text(row["section"]),
    }
    PRODUCTS.append(product)
    return product


def load_content_json() -> dict:
    with JSON_OUT.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def save_json(content: dict) -> None:
    JSON_OUT.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def save_js(content: dict) -> None:
    JS_OUT.write_text(
        "window.PF_BASE_CONTENT = " + json.dumps(content, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )


rows_d = read_sheet_rows(SOURCE_D)
rows_i = read_sheet_rows(SOURCE_I)
PRODUCTS: list[dict[str, object]] = []
merged_products = align_rows(rows_d, rows_i)

content = load_content_json()
content["products"] = merged_products
content["categories"] = [
    {
        "id": 1,
        "name": "Catalogo importado",
        "slug": "catalogo-importado",
        "visible": True,
    }
]
content.setdefault("nextIds", {})
content["nextIds"]["product"] = len(merged_products) + 1
content["nextIds"]["category"] = 2

save_json(content)
save_js(content)

print(f"Imported {len(merged_products)} products from {SOURCE_D.name} and {SOURCE_I.name}.")
