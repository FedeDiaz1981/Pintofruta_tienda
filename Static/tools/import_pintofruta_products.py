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
        "vegano": "vegano" in text or "vegan" in text,
        "kosher": "kosher" in text,
        "testeadoEnAnimales": not any(
            token in text
            for token in [
                "no testea en animales",
                "no testeado en animales",
                "cruelty free",
            ]
        ),
    }


def clean_brand(value: str) -> str:
    text = ascii_text(value)
    text = re.sub(r"\bSIN STOCK\b", "", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip(" -")

    tokens = text.split()
    if not tokens:
        return ""

    kept: list[str] = []
    for token in tokens:
        if token and token[0].islower():
            break
        kept.append(token)

    return " ".join(kept or tokens[:1]).strip()


def clean_section_label(value: str) -> str:
    text = ascii_text(value)
    text = re.sub(r"^([RTM])\s+", "", text, flags=re.I)
    text = re.sub(r"\bSIN STOCK\b", "", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip(" -")

    tokens = text.split()
    if not tokens:
        return ""

    kept: list[str] = []
    for token in tokens:
        if token and token[0].islower():
            break
        kept.append(token)

    return " ".join(kept or tokens[:1]).strip()


def slugify(value: str) -> str:
    text = normalize_key(value)
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def letter_bucket(value: str) -> str:
    first = ascii_text(value)[:1].upper()
    group_order = [
        ("A", "B"),
        ("C", "D"),
        ("E", "F"),
        ("G", "H"),
        ("I", "J"),
        ("K", "L"),
        ("M", "N"),
        ("O", "P"),
        ("Q", "R"),
        ("S", "T"),
        ("U", "V"),
        ("W", "X"),
        ("Y", "Z"),
    ]
    for start, end in group_order:
        if first in {start, end}:
            return f"{start}-{end}"
    return "Y-Z"


def bucketed_items(values: list[str]) -> list[dict[str, object]]:
    group_order = [
        "A-B",
        "C-D",
        "E-F",
        "G-H",
        "I-J",
        "K-L",
        "M-N",
        "O-P",
        "Q-R",
        "S-T",
        "U-V",
        "W-X",
        "Y-Z",
    ]
    groups: dict[str, list[dict[str, str]]] = {bucket: [] for bucket in group_order}
    for value in values:
        bucket = letter_bucket(value)
        groups[bucket].append(
            {
                "id": slugify(value),
                "label": value,
                "href": f"#{slugify(value)}",
            }
        )

    return [
        {
            "id": slugify(bucket),
            "label": bucket,
            "href": "#2-marcas",
            "items": groups[bucket],
        }
        for bucket in group_order
    ]


def build_navigation_section(section_id: str, label: str, values: list[str], icon: str) -> dict:
    cleaned_values = []
    seen = set()
    for value in values:
        normalized = ascii_text(value)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        cleaned_values.append(normalized)

    cleaned_values.sort(key=normalize_key)

    return {
        "id": section_id,
        "label": label,
        "icon": icon,
        "href": f"#{2 if section_id == 'brands' else 1}-{slugify(label)}",
        "groups": bucketed_items(cleaned_values),
    }


def build_categories(products: list[dict[str, object]]) -> tuple[list[dict[str, object]], dict[str, int]]:
    labels: list[str] = []
    seen = set()
    for product in products:
        raw_section = ascii_text(product.get("sourceSection", ""))
        label = clean_section_label(raw_section)
        if not label:
            label = clean_brand(str(product.get("brand", ""))) or "General"
        if label in seen:
            continue
        seen.add(label)
        labels.append(label)

    labels.sort(key=normalize_key)
    categories = [
        {
            "id": index + 1,
            "name": label,
            "slug": slugify(label),
            "visible": True,
        }
        for index, label in enumerate(labels)
    ]
    category_map = {category["name"]: category["id"] for category in categories}
    return categories, category_map


def build_brands(products: list[dict[str, object]]) -> list[dict[str, object]]:
    brands: list[dict[str, object]] = []
    seen_names: set[str] = set()
    used_codes: set[str] = set()

    for product in products:
        name = ascii_text(product.get("brand", ""))
        normalized_name = normalize_key(name)
        if not normalized_name or normalized_name in seen_names:
            continue
        seen_names.add(normalized_name)

        base_code = slugify(name).upper()
        if not base_code:
            base_code = f"MARCA-{len(brands) + 1:03d}"

        code = base_code
        suffix = 2
        while code in used_codes:
            code = f"{base_code}-{suffix}"
            suffix += 1

        used_codes.add(code)
        brands.append(
            {
                "id": code,
                "code": code,
                "name": name,
            }
        )

    return brands


def build_header_navigation(products: list[dict[str, object]]) -> dict:
    brands = []
    seen_brands = set()
    for product in products:
        brand = clean_brand(str(product.get("brand", "")))
        if not brand or brand in seen_brands:
            continue
        seen_brands.add(brand)
        brands.append(brand)

    product_labels = []
    seen_products = set()
    for product in products:
        label = ascii_text(product.get("detail") or product.get("name") or "")
        if not label or label in seen_products:
            continue
        seen_products.add(label)
        product_labels.append(label)

    return {
        "searchScopes": [
            {"id": "products", "label": "PRODUCTOS", "href": "#1-productos"},
            {"id": "brands", "label": "MARCAS", "href": "#2-marcas"},
        ],
        "sections": [
            build_navigation_section("products", "PRODUCTOS", product_labels, "Content/Iconos/CATEGORIAS.png"),
            build_navigation_section("brands", "MARCAS", brands, "Content/Iconos/MARCAS.png"),
        ],
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


def product_initial(row: dict[str, str]) -> str:
    text = normalize_key(row.get("detail") or row.get("brand") or "")
    for char in text.upper():
        if char.isalpha():
            return char
    return ""


def select_spread_products(products: list[dict[str, str]], limit: int = 20) -> list[dict[str, str]]:
    buckets: dict[str, list[dict[str, str]]] = {}
    order: list[str] = []

    for row in products:
        initial = product_initial(row)
        if not initial:
            continue
        if initial not in buckets:
            buckets[initial] = []
            order.append(initial)
        buckets[initial].append(row)

    selected: list[dict[str, str]] = []
    for initial in sorted(order):
        if len(selected) >= limit:
            break
        bucket = buckets.get(initial, [])
        if bucket:
            selected.append(bucket.pop(0))

    if len(selected) < limit:
        for row in products:
            if len(selected) >= limit:
                break
            if row in selected:
                continue
            selected.append(row)

    return selected[:limit]


def merge_pair(row_d: dict[str, str], row_i: dict[str, str]) -> dict[str, object]:
    public_price = parse_price(row_i["price"]) or parse_price(row_d["price"]) or 0
    member_price = parse_price(row_d["price"]) or public_price
    return build_product(row_d, public_price=public_price, member_price=member_price)


def merge_single(row: dict[str, str], source: str) -> dict[str, object]:
    price = parse_price(row["price"]) or 0
    return build_product(row, public_price=price, member_price=price)


def build_product(row: dict[str, str], public_price: int, member_price: int) -> dict[str, object]:
    cleaned_brand = clean_brand(row["brand"])
    cleaned_detail = ascii_text(row["detail"])
    cleaned_presentation = ascii_text(row["presentation"])
    sku = f"IMP{len(PRODUCTS) + 1:04d}"

    product = {
        "id": len(PRODUCTS) + 1,
        "sku": sku,
        "name": cleaned_detail,
        "detail": cleaned_detail,
        "presentation": cleaned_presentation,
        "categoryId": 1,
        "categoryName": "Catalogo importado",
        "brand": cleaned_brand,
        "vegano": bool(row["flags"]["vegano"]),
        "kosher": bool(row["flags"]["kosher"]),
        "testeadoEnAnimales": bool(row["flags"]["testeadoEnAnimales"]),
        "publicPrice": int(public_price),
        "memberPrice": int(member_price),
        "image": "assets/images/metaimage.jpg",
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

limited_products = select_spread_products(merged_products, 20)

categories, category_map = build_categories(limited_products)
brands = build_brands(limited_products)
for product in limited_products:
    raw_section = ascii_text(product.get("sourceSection", ""))
    category_name = clean_section_label(raw_section) or clean_brand(str(product.get("brand", ""))) or "General"
    category_id = category_map.get(category_name)
    if category_id is None:
        category_name = "General"
        category_id = category_map.get(category_name)
    if category_id is None:
        category_id = len(categories) + 1
        category_map[category_name] = category_id
        categories.append(
            {
                "id": category_id,
                "name": category_name,
                "slug": slugify(category_name),
                "visible": True,
            }
        )
    product["categoryId"] = category_id
    product["categoryName"] = category_name

content = load_content_json()
content["products"] = limited_products
content["brands"] = brands
content["categories"] = categories
content["headerNavigation"] = build_header_navigation(limited_products)
content.setdefault("nextIds", {})
content["nextIds"]["product"] = len(limited_products) + 1
content["nextIds"]["category"] = len(categories) + 1

save_json(content)
save_js(content)

print(f"Imported {len(limited_products)} products from {SOURCE_D.name} and {SOURCE_I.name}.")
