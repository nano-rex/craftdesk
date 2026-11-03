#!/usr/bin/env python3
"""Append ?v=<build> to local .js/.css references so a deploy never mixes cached old and new files.

GitHub Pages serves everything with max-age=600, and browsers cache each file independently; an
old cached page running a new script (or the reverse) breaks. Run on the deploy checkout only.
Usage: stamp-assets.py <build-id> [root]
"""
import pathlib
import re
import sys

build = sys.argv[1]
root = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else '.')
ref = re.compile(r'''((?:src|href)=["'])(?![a-z]+:|//|#)([^"'?#]+\.(?:js|css))(["'])''')

for page in root.rglob('*.html'):
    if 'vendor' in page.parts or '.git' in page.parts:
        continue
    text = page.read_text(encoding='utf-8')
    stamped = ref.sub(lambda m: f'{m.group(1)}{m.group(2)}?v={build}{m.group(3)}', text)
    if stamped != text:
        page.write_text(stamped, encoding='utf-8')
        print(f'stamped {page}')

shell = root / 'shell.js'
shell.write_text(shell.read_text(encoding='utf-8').replace('const BUILD = "dev";', f'const BUILD = "{build}";'), encoding='utf-8')
