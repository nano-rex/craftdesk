# Craftdesk

A static, browser-only workspace combining four local tools:

- **Project planner**: Gantt timeline creation, dependencies, JSON, PNG, and PDF export.
- **File converter**: browser-native image, CSV, JSON, text, and HTML conversions.
- **PDF editor**: view, annotate, fill, merge, rearrange, and save PDFs with vendored PDF.js and pdf-lib.
- **Weather report**: paint daily observations and export PNG, PDF, or JSON.

No backend server, account, CDN, upload, or network request is required at runtime. Open `index.html` directly or serve this directory with any static file server.

The converter's server-only document and media routes are intentionally unavailable in this distribution; browser-native routes are marked `native` in its format matrix.

## Structure

- `index.html`, `shell.css`, `shell.js`: unified launcher
- `apps/gantt`: Gantt planner
- `apps/converter`: offline converter frontend
- `apps/min-doc`: web PDF viewer/editor and vendored libraries
- `apps/weather`: monthly weather wheel and report exporter

The original project licenses are preserved in each app directory.
