#!/usr/bin/env bun
import { resolve, join, dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import { parseArgs } from "node:util";
import type { Resume, Template } from "./lib/types";
import { renderPdf } from "./lib/pdf";
import { renderText } from "./lib/text";

import minimal from "./templates/minimal";
import editorial from "./templates/editorial";

const TEMPLATES: Record<string, Template> = {
  minimal,
  editorial,
};

type Format = "html" | "pdf" | "txt";
const ALL_FORMATS: readonly Format[] = ["html", "pdf", "txt"] as const;

interface Options {
  input: string;
  outputDir: string;
  template: string;
  formats: Set<Format>;
  serve: boolean;
  port: number;
}

function parseFormats(raw: string | undefined): Set<Format> {
  if (!raw) return new Set(ALL_FORMATS);
  const set = new Set<Format>();
  for (const part of raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)) {
    if (!ALL_FORMATS.includes(part as Format)) {
      throw new Error(
        `Unknown format "${part}". Valid: ${ALL_FORMATS.join(", ")}`,
      );
    }
    set.add(part as Format);
  }
  return set;
}

function parseOptions(): Options {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      input: { type: "string", default: "cv.json" },
      "output-dir": { type: "string", default: "." },
      template: { type: "string", default: "minimal" },
      formats: { type: "string" },
      serve: { type: "boolean", default: false },
      port: { type: "string", default: "3000" },
    },
    strict: true,
    allowPositionals: false,
  });

  return {
    input: values.input!,
    outputDir: values["output-dir"]!,
    template: values.template!,
    formats: parseFormats(values.formats),
    serve: values.serve!,
    port: Number(values.port),
  };
}

async function loadResume(path: string): Promise<Resume> {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error(`Resume not found at ${path}`);
  }
  return (await file.json()) as Resume;
}

function pickTemplate(name: string): Template {
  const template = TEMPLATES[name];
  if (!template) {
    throw new Error(
      `Unknown template "${name}". Available: ${Object.keys(TEMPLATES).join(", ")}`,
    );
  }
  return template;
}

async function writeOut(
  path: string,
  contents: string | Uint8Array,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, contents);
  console.log(`Wrote ${path}`);
}

async function serve(
  template: Template,
  resume: Resume,
  port: number,
): Promise<void> {
  const server = Bun.serve({
    port,
    fetch() {
      // Re-render on every request so iterating on the template gives live output.
      return new Response(template.render(resume), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    },
  });
  console.log(`Serving ${template.name} on http://localhost:${server.port}`);
}

async function build(opts: Options): Promise<void> {
  const resume = await loadResume(resolve(opts.input));
  const template = pickTemplate(opts.template);

  if (opts.serve) {
    await serve(template, resume, opts.port);
    return;
  }

  const outDir = resolve(opts.outputDir);

  const needsHtml = opts.formats.has("html") || opts.formats.has("pdf");
  const html = needsHtml ? template.render(resume) : undefined;

  if (opts.formats.has("html")) {
    await writeOut(join(outDir, "cv.html"), html!);
  }

  if (opts.formats.has("pdf")) {
    const pdfPath = join(outDir, "cv.pdf");
    await renderPdf(html!, pdfPath);
    console.log(`Wrote ${pdfPath}`);
  }

  if (opts.formats.has("txt")) {
    await writeOut(join(outDir, "cv.txt"), renderText(resume));
  }
}

build(parseOptions()).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
