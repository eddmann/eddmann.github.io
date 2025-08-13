# CV

This directory contains my CV in the JSON Resume format (`cv.json`) along with a custom theme designed to reflect the styling of my blog.

- **Format**: JSON Resume (`cv.json`)
- **Theme**: Custom Handlebars/CSS theme that mirrors my blog's styling; the build renders Markdown, inlines styles, and outputs a single, minified HTML CV.

## Usage

From this directory:

```bash
npm ci --no-audit --no-fund
npm run build:html   # generates cv.html
npm run build:pdf    # generates cv.pdf
npm run build:txt    # generates cv.txt
npm run serve        # preview using resume-cli
```

Build artifacts (`cv.html`, `cv.pdf`, `cv.txt`) are produced in this folder. A GitHub Actions workflow (`.github/workflows/build-cv.yml`) also copies `cv.html`, `cv.pdf`, and `cv.json` into the site `static/` directory so they are published.
