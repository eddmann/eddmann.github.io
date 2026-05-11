# CV

My CV in [JSON Resume](https://jsonresume.org) format (`cv.json`), rendered to HTML, PDF and plain text by a small Bun pipeline.

`cv.json` is the only file I edit. Everything else is generated:

- `generate.ts` is the entry point.
- HTML templates live in `templates/<name>.ts` and return a single self-contained HTML string that loads Tailwind from the CDN.
- The PDF is the HTML template printed via Puppeteer.
- The text version is generated directly from `cv.json` and aims for 80-column readability.

## Usage

From this directory:

```bash
bun install
bun run build       # cv.html, cv.pdf, cv.txt
bun run build:html
bun run build:pdf
bun run build:txt
bun run serve       # preview on http://localhost:3000
```

Direct invocation:

```bash
bun run generate.ts --template minimal --formats html,pdf,txt
bun run generate.ts --input cv.json --output-dir . --formats html
bun run generate.ts --serve --port 4000
```

Flags: `--input` (default `cv.json`), `--output-dir` (default `.`), `--template` (default `minimal`), `--formats` (default `html,pdf,txt`), `--serve`, `--port` (default `3000`).

## Adding a template

Drop a new file in `templates/`, default-export an object with `name`, `description`, and `render(resume)`, and register it in the `TEMPLATES` map at the top of `generate.ts`. `bun run serve --template <name>` re-renders on every request, which is the fastest way to iterate.

## CI

`.github/workflows/build-cv.yml` runs `bun install` and `bun run build` on every push to `cv/**`, then copies the four artifacts (`cv.html`, `cv.pdf`, `cv.json`, `cv.txt`) into `static/` and commits.
