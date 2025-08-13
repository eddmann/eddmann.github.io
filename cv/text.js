'use strict';

const fs = require('fs');
const path = require('path');

const WIDTH = 80;
const BULLET = '-';
const EN_DASH = '-';
const EM_DASH = '-';

function wrap(text, width = WIDTH, firstIndent = '', nextIndent = '') {
  if (!text) return '';
  const paras = String(text).split(/\n+/);
  const out = [];
  for (const p of paras) {
    const words = p.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push('');
      continue;
    }
    let line = firstIndent;
    let lineLen = line.length;
    let first = true;
    for (const w of words) {
      const needsSpace = line && !line.endsWith(' ');
      const nextLen = lineLen + (needsSpace ? 1 : 0) + w.length;
      if (nextLen <= width) {
        line += (needsSpace ? ' ' : '') + w;
        lineLen = nextLen;
      } else {
        out.push(line);
        line = nextIndent + w;
        lineLen = line.length;
        first = false;
      }
    }
    if (line.trim().length) out.push(line);
  }
  return out.join('\n');
}

function underline(text, ch) {
  return (ch || '=').repeat([...String(text)].length);
}

function renderText(resume) {
  const { basics } = resume;
  let out = '';

  // Header
  const title = `${basics.name} ${EM_DASH} ${basics.label}`;
  out += `${title}\n${underline(title, '=')}\n\n`;
  out += `Email: ${basics.email} | Website: ${
    basics.url || basics.website || ''
  }\n\n`;

  // Summary
  if (basics.summary) out += `${wrap(basics.summary, WIDTH)}\n\n`;

  // Profiles
  if (Array.isArray(basics.profiles) && basics.profiles.length) {
    const heading = `\nPROFILES`;
    out += `${heading}\n${underline(heading, '=')}\n\n`;
    for (const p of basics.profiles) {
      const network = p.network || '';
      const username = p.username || '';
      const url = p.url || '';
      const left = username ? `${network}: ${username}` : network;
      out += `- ${left} ${EM_DASH} ${url}\n`;
    }
    out += `\n`;
  }

  // Work
  if (Array.isArray(resume.work) && resume.work.length) {
    const heading = `\nWORK EXPERIENCE`;
    out += `${heading}\n${underline(heading, '=')}\n\n`;
    for (const w of resume.work) {
      const company = w.name || w.company || '';
      const position = w.position || '';
      const start = w.startDate || '';
      const end = w.endDate || 'Present';
      const line = `${position} at ${company} ${
        start ? `(${start}${EN_DASH}${end})` : ''
      }`.trim();
      out += `${line}\n${underline(line, '-')}\n\n`;
      if (w.summary) out += `${wrap(w.summary, WIDTH)}\n\n`;
      if (Array.isArray(w.highlights)) {
        for (const h of w.highlights) {
          out += `${wrap(String(h), WIDTH, `  ${BULLET} `, '    ')}\n`;
        }
        if (w.highlights.length) out += `\n`;
      }
    }
  }

  // Education
  if (Array.isArray(resume.education) && resume.education.length) {
    const heading = `\nEDUCATION`;
    out += `\n${heading}\n${underline(heading, '=')}\n\n`;
    for (const e of resume.education) {
      const qual =
        e.studyType && e.area
          ? `${e.studyType} in ${e.area}`
          : e.studyType || e.area || '';
      const line = `${qual}, ${e.institution} (${e.startDate}${EN_DASH}${
        e.endDate || 'Present'
      })`;
      out += `${line}\n${underline(line, '-')}\n`;
      if (e.score) out += `Score: ${e.score}\n`;
      out += `\n`;
    }
  }

  // Awards
  if (Array.isArray(resume.awards) && resume.awards.length) {
    const heading = `\nAWARDS`;
    out += `${heading}\n${underline(heading, '=')}\n\n`;
    for (const a of resume.awards) {
      const head = `${a.title || ''}${
        a.awarder ? ` ${EM_DASH} ${a.awarder}` : ''
      }${a.date ? ` (${a.date})` : ''}`;
      out += `${head}\n${underline(head, '-')}\n`;
      if (a.url) out += `Website: ${a.url}\n`;
      if (a.summary) out += `${wrap(a.summary, WIDTH)}\n`;
      out += `\n`;
    }
  }

  // Skills
  if (Array.isArray(resume.skills) && resume.skills.length) {
    const heading = `\nSKILLS`;
    out += `${heading}\n${underline(heading, '=')}\n\n`;
    for (const s of resume.skills) {
      const name = s.name || 'Skills';
      const kw = Array.isArray(s.keywords) ? s.keywords.join(', ') : '';
      out += `${name}\n${underline(name, '-')}\n`;
      if (kw) {
        out += `${wrap(kw, WIDTH)}\n\n`;
      } else {
        out += `\n`;
      }
    }
  }

  // Languages
  if (Array.isArray(resume.languages) && resume.languages.length) {
    const heading = `\nLANGUAGES`;
    out += `${heading}\n${underline(heading, '=')}\n\n`;
    for (const l of resume.languages) {
      const line =
        l && l.language
          ? l.fluency
            ? `${l.language} ${EM_DASH} ${l.fluency}`
            : `${l.language}`
          : '';
      if (line) out += `${line}\n`;
    }
    out += `\n`;
  }

  // Projects
  if (Array.isArray(resume.projects) && resume.projects.length) {
    const heading = `\nPROJECTS`;
    out += `${heading}\n${underline(heading, '=')}\n\n`;
    for (const p of resume.projects) {
      const head = p.url ? `${p.name} ${EM_DASH} ${p.url}` : p.name;
      out += `${head}\n${underline(head, '-')}\n`;
      if (p.description) out += `${wrap(p.description, WIDTH)}\n`;
      out += `\n`;
    }
  }

  // Interests
  if (Array.isArray(resume.interests) && resume.interests.length) {
    const heading = `\nINTERESTS`;
    out += `${heading}\n${underline(heading, '=')}\n\n`;
    for (const i of resume.interests) {
      out += `${i.name}\n${underline(i.name, '-')}\n`;
      if (Array.isArray(i.keywords)) {
        for (const k of i.keywords) {
          out += `${wrap(k, WIDTH, `  ${BULLET} `, '    ')}\n`;
        }
      }
      out += `\n`;
    }
  }

  // References
  if (Array.isArray(resume.references) && resume.references.length) {
    const heading = `\nREFERENCES`;
    out += `${heading}\n${underline(heading, '=')}\n\n`;
    for (const r of resume.references) {
      if (r.reference) out += `${r.reference}\n`;
    }
    out += `\n`;
  }

  return out.replace(/\s+$/s, '') + '\n';
}

function main() {
  const [, , inputArg, outputArg] = process.argv;
  const resumePath = path.resolve(__dirname, inputArg || 'cv.json');
  const outputPath = path.resolve(__dirname, outputArg || 'cv.txt');
  const resume = JSON.parse(fs.readFileSync(resumePath, 'utf-8'));
  const text = renderText(resume);
  fs.writeFileSync(outputPath, text, 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
}

if (require.main === module) {
  main();
}
