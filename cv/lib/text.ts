import type { Resume } from "./types";
import { formatDate } from "./dates";

const WIDTH = 80;
const BULLET = "-";
const DASH = "-";

function wrap(
  text: string,
  width = WIDTH,
  firstIndent = "",
  nextIndent = "",
): string {
  if (!text) return "";
  const paras = String(text).split(/\n+/);
  const out: string[] = [];
  for (const p of paras) {
    const words = p.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push("");
      continue;
    }
    let line = firstIndent;
    let lineLen = line.length;
    for (const w of words) {
      const needsSpace = line.length > 0 && !line.endsWith(" ");
      const nextLen = lineLen + (needsSpace ? 1 : 0) + w.length;
      if (nextLen <= width) {
        line += (needsSpace ? " " : "") + w;
        lineLen = nextLen;
      } else {
        out.push(line);
        line = nextIndent + w;
        lineLen = line.length;
      }
    }
    if (line.trim().length) out.push(line);
  }
  return out.join("\n");
}

function underline(text: string, ch: string): string {
  return ch.repeat([...text].length);
}

export function renderText(resume: Resume): string {
  const { basics } = resume;
  let out = "";

  const title = `${basics.name}${basics.label ? ` ${DASH} ${basics.label}` : ""}`;
  out += `${title}\n${underline(title, "=")}\n\n`;
  out += `Email: ${basics.email ?? ""} | Website: ${basics.url ?? basics.website ?? ""}\n\n`;

  if (basics.summary) {
    out += `${wrap(basics.summary, WIDTH)}\n\n`;
  }

  if (basics.profiles?.length) {
    const heading = `\nPROFILES`;
    out += `${heading}\n${underline(heading, "=")}\n\n`;
    for (const p of basics.profiles) {
      const left = p.username ? `${p.network}: ${p.username}` : p.network;
      out += `- ${left} ${DASH} ${p.url ?? ""}\n`;
    }
    out += `\n`;
  }

  if (resume.work?.length) {
    const heading = `\nWORK EXPERIENCE`;
    out += `${heading}\n${underline(heading, "=")}\n\n`;
    for (const w of resume.work) {
      const company = w.name ?? w.company ?? "";
      const position = w.position ?? "";
      const dates = w.startDate
        ? ` (${formatDate(w.startDate)} - ${formatDate(w.endDate)})`
        : "";
      const line = `${position} at ${company}${dates}`.trim();
      out += `${line}\n${underline(line, "-")}\n\n`;
      if (w.summary) out += `${wrap(w.summary, WIDTH)}\n\n`;
      if (w.highlights?.length) {
        for (const h of w.highlights) {
          out += `${wrap(String(h), WIDTH, `  ${BULLET} `, "    ")}\n`;
        }
        out += `\n`;
      }
    }
  }

  if (resume.education?.length) {
    const heading = `\nEDUCATION`;
    out += `${heading}\n${underline(heading, "=")}\n\n`;
    for (const e of resume.education) {
      const qual =
        e.studyType && e.area
          ? `${e.studyType} in ${e.area}`
          : (e.studyType ?? e.area ?? "");
      const line = `${qual}, ${e.institution} (${formatDate(e.startDate)} - ${formatDate(e.endDate)})`;
      out += `${line}\n${underline(line, "-")}\n`;
      if (e.score) out += `Score: ${e.score}\n`;
      out += `\n`;
    }
  }

  if (resume.awards?.length) {
    const heading = `\nAWARDS`;
    out += `${heading}\n${underline(heading, "=")}\n\n`;
    for (const a of resume.awards) {
      const head = `${a.title ?? ""}${a.awarder ? ` ${DASH} ${a.awarder}` : ""}${a.date ? ` (${formatDate(a.date)})` : ""}`;
      out += `${head}\n${underline(head, "-")}\n`;
      if (a.summary) out += `${wrap(a.summary, WIDTH)}\n`;
      out += `\n`;
    }
  }

  if (resume.skills?.length) {
    const heading = `\nSKILLS`;
    out += `${heading}\n${underline(heading, "=")}\n\n`;
    for (const s of resume.skills) {
      const name = s.name ?? "Skills";
      const kw = s.keywords?.join(", ") ?? "";
      out += `${name}\n${underline(name, "-")}\n`;
      if (kw) {
        out += `${wrap(kw, WIDTH)}\n\n`;
      } else {
        out += `\n`;
      }
    }
  }

  if (resume.languages?.length) {
    const heading = `\nLANGUAGES`;
    out += `${heading}\n${underline(heading, "=")}\n\n`;
    for (const l of resume.languages) {
      const line = l.fluency
        ? `${l.language} ${DASH} ${l.fluency}`
        : l.language;
      if (line) out += `${line}\n`;
    }
    out += `\n`;
  }

  if (resume.projects?.length) {
    const heading = `\nPROJECTS`;
    out += `${heading}\n${underline(heading, "=")}\n\n`;
    for (const p of resume.projects) {
      const head = p.url ? `${p.name} ${DASH} ${p.url}` : p.name;
      out += `${head}\n${underline(head, "-")}\n`;
      if (p.description) out += `${wrap(p.description, WIDTH)}\n`;
      out += `\n`;
    }
  }

  if (resume.interests?.length) {
    const heading = `\nINTERESTS`;
    out += `${heading}\n${underline(heading, "=")}\n\n`;
    for (const i of resume.interests) {
      out += `${i.name}\n${underline(i.name, "-")}\n`;
      if (i.keywords?.length) {
        for (const k of i.keywords) {
          out += `${wrap(k, WIDTH, `  ${BULLET} `, "    ")}\n`;
        }
      }
      out += `\n`;
    }
  }

  if (resume.references?.length) {
    const heading = `\nREFERENCES`;
    out += `${heading}\n${underline(heading, "=")}\n\n`;
    for (const r of resume.references) {
      if (r.reference) out += `${r.reference}\n`;
    }
    out += `\n`;
  }

  return out.replace(/\s+$/s, "") + "\n";
}
