#!/usr/bin/env python3
"""Import a POS stock export (xlsx) into the products table as POS-only products.

Usage:
  python3 scripts/import_pos_stock.py "<path.xlsx>" [--local-only|--remote-only] [--dry-run]

- Products get channels='pos' (POS only), vendor Bazaf, price 0, stock from "Akhir".
- Idempotent: rows whose SKU already exists are skipped.
"""
import sys
import os
import uuid
import zipfile
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
DB = 'baf-kitchen-db'
CHUNK = 300

UNIT_MAP = {
    'pieces': 'pcs',
    'pack': 'pack',
    'box': 'box',
    'boks': 'box',
    'kilogram': 'kg',
    'gram': 'gr',
    'liter': 'liter',
    'mililiter': 'ml',
    'botol': 'botol',
    'paket': 'paket',
    'porsi': 'porsi',
    'cup': 'cup',
    'buah': 'buah',
    'toples': 'toples',
    'sachet': 'sachet',
    'pouch': 'pouch',
    'karung': 'karung',
    'lembar': 'lembar',
}


def map_unit(raw: str) -> str:
    key = (raw or '').strip().lower()
    return UNIT_MAP.get(key, (raw or '').strip().lower() or 'pcs')


def colnum(ref: str) -> int:
    n = 0
    for ch in ''.join(c for c in ref if c.isalpha()):
        n = n * 26 + (ord(ch) - 64)
    return n


def parse_xlsx(path: str):
    z = zipfile.ZipFile(path)
    shared = [
        ''.join(t.text or '' for t in si.iter(NS + 't'))
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).iter(NS + 'si')
    ]
    sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = []
    for r in sheet.iter(NS + 'row'):
        cells = {}
        for c in r.iter(NS + 'c'):
            t = c.get('t')
            v = c.find(NS + 'v')
            val = ''
            if v is not None:
                val = shared[int(v.text)] if t == 's' else v.text
            cells[colnum(c.get('r'))] = val
        maxc = max(cells) if cells else 0
        rows.append([cells.get(i, '') for i in range(1, maxc + 1)])
    return rows


def esc(value: str) -> str:
    return str(value).replace("'", "''")


def to_number(value, default=0):
    try:
        s = str(value).strip()
        if s == '':
            return default
        f = float(s)
        return int(f) if f.is_integer() else f
    except ValueError:
        return default


def build_statements(rows):
    ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    stmts = []
    for row in rows:
        padded = row + [''] * (13 - len(row))
        sku = str(padded[1]).strip()
        name = str(padded[2]).strip()
        unit = map_unit(padded[12])
        stock = to_number(padded[11], 0)
        if not name:
            continue
        pid = str(uuid.uuid4())
        stmts.append(
            "INSERT INTO products (id, name, sku, unit, is_active, price_base, price, stock, vendor, category_ids, description, image_url, image_key, availability, preorder_start, preorder_end, channels, availability_type, weekly_days, specific_dates, preorder_lead_days, preorder_cutoff_time, preorder_min_qty, preorder_max_qty, preorder_capacity, fulfillment_type, approval_status, created_at, updated_at) "
            f"SELECT '{pid}', '{esc(name)}', '{esc(sku)}', '{esc(unit)}', 1, 0, 0, {stock}, "
            "'{\"id\":\"bazaf\",\"name\":\"Bazaf\"}', '[]', '', '', NULL, 'ready', NULL, NULL, 'pos', 'always', "
            f"NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'takeaway', 'approved', '{ts}', '{ts}' "
            f"WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = '{esc(sku)}');"
        )
    return stmts


def run_wrangler(sql_file: str, target: str):
    cmd = ['npx', 'wrangler', 'd1', 'execute', DB, f'--{target}', '--file', sql_file]
    print(f'  → {target}: {os.path.basename(sql_file)}')
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = {a for a in sys.argv[1:] if a.startswith('--')}
    if not args:
        print('Usage: python3 scripts/import_pos_stock.py "<path.xlsx>" [--local-only|--remote-only] [--dry-run]')
        sys.exit(1)

    rows = parse_xlsx(args[0])
    # data starts after the header row (index 11), skip leading blank/header rows
    data = [r for r in rows[12:] if any(str(x).strip() for x in r)]
    statements = build_statements(data)
    print(f'Parsed {len(data)} rows → {len(statements)} insert statements')

    if '--dry-run' in flags:
        print(statements[0])
        return

    targets = ['local', 'remote']
    if '--local-only' in flags:
        targets = ['local']
    if '--remote-only' in flags:
        targets = ['remote']

    with tempfile.TemporaryDirectory() as tmp:
        files = []
        for i in range(0, len(statements), CHUNK):
            chunk = statements[i:i + CHUNK]
            path = os.path.join(tmp, f'pos_import_{i // CHUNK:03d}.sql')
            with open(path, 'w') as fh:
                fh.write('\n'.join(chunk) + '\n')
            files.append(path)
        for target in targets:
            for path in files:
                run_wrangler(path, target)
    print('Done.')


if __name__ == '__main__':
    main()
