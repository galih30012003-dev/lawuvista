#!/usr/bin/env python3
"""
cache-bust.py — Jalankan sebelum deploy.
Setiap asset /assets/... dapat ?v=HASH dari isi filenya sendiri.
Hash hanya berubah kalau file berubah → cache user lama otomatis invalid.

Usage:
    python3 cache-bust.py
"""

import re, hashlib, os, glob

ROOT   = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(ROOT, "assets")
PAGES  = glob.glob(f"{ROOT}/*.html") + glob.glob(f"{ROOT}/*/index.html")
CSS_FILES = glob.glob(f"{ASSETS}/css/*.css")
EXT    = re.compile(r'\.(webp|svg|css|js|png|jpg|ico|woff2|woff)$')


def file_hash(path: str) -> str:
    """8-char MD5 dari isi file."""
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:8]


# 1. Bangun map awal untuk font & aset di dalam CSS
asset_map: dict[str, str] = {}
for dirpath, _, files in os.walk(ASSETS):
    for fname in files:
        if EXT.search(fname):
            abs_path = os.path.join(dirpath, fname)
            rel_path = "/" + os.path.relpath(abs_path, ROOT).replace("\\", "/")
            asset_map[rel_path] = f"?v={file_hash(abs_path)}"

# 2. Regex: cocokkan /assets/... (strip ?v=... lama dulu)
STRIP  = re.compile(r'(/assets/[^\s"\'?#]+' + EXT.pattern.replace('$','') + r'[a-z]*)\?v=[0-9a-f]+')
MATCH  = re.compile(r'(/assets/[^\s"\'?#]+' + EXT.pattern.replace('$','') + r'[a-z]*)')

def process(text: str) -> tuple[str, int]:
    # Strip old versions
    text = STRIP.sub(r'\1', text)
    count = 0
    def replace(m):
        nonlocal count
        key = m.group(1)
        if key in asset_map:
            count += 1
            return key + asset_map[key]
        return key
    return MATCH.sub(replace, text), count

# 3. Update CSS files dulu (misal font URLs)
for cpath in sorted(CSS_FILES):
    with open(cpath, "r", encoding="utf-8") as f:
        css = f.read()
    updated, n = process(css)
    if n > 0:
        with open(cpath, "w", encoding="utf-8") as f:
            f.write(updated)
        rel = os.path.relpath(cpath, ROOT)
        print(f"  {rel:45s} - {n} URLs")

# 4. Refresh asset_map setelah CSS berubah
print("Scanning assets...")
asset_map.clear()
for dirpath, _, files in os.walk(ASSETS):
    for fname in files:
        if EXT.search(fname):
            abs_path = os.path.join(dirpath, fname)
            rel_path = "/" + os.path.relpath(abs_path, ROOT).replace("\\", "/")
            asset_map[rel_path] = f"?v={file_hash(abs_path)}"

print(f"  {len(asset_map)} asset files hashed")

# 5. Update semua HTML
print("\nUpdating HTML files:")
total = 0
for fpath in sorted(PAGES):
    with open(fpath, "r", encoding="utf-8") as f:
        html = f.read()
    updated, n = process(html)
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(updated)
    rel = os.path.relpath(fpath, ROOT)
    print(f"  {rel:45s} - {n} URLs")
    total += n

print(f"\n[OK] Done - {total} asset URLs cache-busted")
