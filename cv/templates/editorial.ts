import type {
  Award,
  Basics,
  Education,
  Interest,
  Language,
  Profile,
  Project,
  Resume,
  Skill,
  Template,
  Volunteer,
  Work,
} from "../lib/types";
import { escapeHtml, renderInline } from "../lib/markdown";
import { formatDate } from "../lib/dates";

function timeTag(date: string | undefined): string {
  if (!date) return `<span>Present</span>`;
  return `<time datetime="${escapeHtml(date)}">${escapeHtml(formatDate(date))}</time>`;
}

function hostFromUrl(url: string): string {
  try {
    const host = new URL(url).host;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return url;
  }
}

function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.host.startsWith("www.")
      ? parsed.host.slice(4)
      : parsed.host;
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${host}${path}${parsed.search}${parsed.hash}`;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "");
  }
}

function contactInline(basics: Basics): string {
  const parts: string[] = [];
  if (basics.location?.city) parts.push(escapeHtml(basics.location.city));
  if (basics.email) {
    parts.push(
      `<a href="mailto:${escapeHtml(basics.email)}">${escapeHtml(basics.email)}</a>`,
    );
  }
  const url = basics.url ?? basics.website;
  if (url) {
    parts.push(
      `<a href="${escapeHtml(url)}">${escapeHtml(hostFromUrl(url))}</a>`,
    );
  }
  for (const p of basics.profiles ?? []) {
    if (!p.url) continue;
    parts.push(
      `<a href="${escapeHtml(p.url)}">${escapeHtml(displayUrl(p.url))}</a>`,
    );
  }
  if (!parts.length) return "";
  return `<p class="contact-bar">${parts.join(` <span class="sep">·</span> `)}</p>`;
}

function renderHero(basics: Basics): string {
  const avatar = basics.image
    ? `<div class="hero-avatar"><img src="${escapeHtml(basics.image)}" alt="Avatar of ${escapeHtml(basics.name)}"></div>`
    : "";
  return `
    <header class="hero">
      ${avatar}
      <h1 class="name">${escapeHtml(basics.name)}</h1>
      ${basics.label ? `<p class="role">${escapeHtml(basics.label)}</p>` : ""}
      ${basics.summary ? `<p class="lede">${renderInline(basics.summary)}</p>` : ""}
      ${contactInline(basics)}
    </header>
  `;
}

function sectionHead(title: string): string {
  return `<h2 class="section-head">${escapeHtml(title)}</h2>`;
}

function entryHead(position: string, dates: string): string {
  return `
    <div class="entry-head">
      ${position ? `<h3 class="position">${escapeHtml(position)}</h3>` : ""}
      ${dates ? `<span class="dates">${dates}</span>` : ""}
    </div>
  `;
}

function renderWorkItem(w: Work): string {
  const company = w.name ?? w.company ?? "";
  const dates = w.startDate
    ? `${timeTag(w.startDate)} <span class="endash">&ndash;</span> ${timeTag(w.endDate)}`
    : "";
  const bullets = w.highlights?.length
    ? `<ul class="bullets">${w.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}</ul>`
    : "";
  return `
    <article class="entry">
      ${entryHead(w.position ?? "", dates)}
      ${company ? `<p class="company">${escapeHtml(company)}</p>` : ""}
      ${w.summary ? `<p class="summary">${renderInline(w.summary)}</p>` : ""}
      ${bullets}
    </article>
  `;
}

function renderWork(work: Work[]): string {
  return `<section>${sectionHead("Work Experience")}${work.map(renderWorkItem).join("")}</section>`;
}

function renderEducation(education: Education[]): string {
  const body = education
    .map((e) => {
      const qual =
        e.studyType && e.area
          ? `${e.studyType} in ${e.area}`
          : (e.studyType ?? e.area ?? "");
      const dates = e.startDate
        ? `${timeTag(e.startDate)} <span class="endash">&ndash;</span> ${timeTag(e.endDate)}`
        : "";
      return `
        <article class="entry">
          ${entryHead(qual, dates)}
          ${e.institution ? `<p class="company">${escapeHtml(e.institution)}</p>` : ""}
          ${e.score ? `<p class="summary">${escapeHtml(e.score)}</p>` : ""}
        </article>
      `;
    })
    .join("");
  return `<section>${sectionHead("Education")}${body}</section>`;
}

function renderSkills(skills: Skill[]): string {
  const rows = skills
    .map((s) => {
      const kws = s.keywords?.length
        ? s.keywords
            .map((k) => escapeHtml(k))
            .join(' <span class="sep">·</span> ')
        : "";
      return `<p class="skill-row"><span class="skill-label">${escapeHtml(s.name)}</span>${kws}</p>`;
    })
    .join("");
  return `<section>${sectionHead("Skills")}${rows}</section>`;
}

function renderProjects(projects: Project[]): string {
  const body = projects
    .map((p) => {
      const head = p.url
        ? `<a href="${escapeHtml(p.url)}" data-print-url="${escapeHtml(displayUrl(p.url))}" class="project-link">${escapeHtml(p.name)}</a>`
        : escapeHtml(p.name);
      return `
        <article class="entry-compact">
          <span class="project-name">${head}</span>${p.description ? ` <span class="project-desc">${renderInline(p.description)}</span>` : ""}
        </article>
      `;
    })
    .join("");
  return `<section>${sectionHead("Projects")}${body}</section>`;
}

function renderVolunteer(volunteer: Volunteer[]): string {
  const body = volunteer
    .map((v) => {
      const company = v.organization ?? "";
      const dates = v.startDate
        ? `${timeTag(v.startDate)} <span class="endash">&ndash;</span> ${timeTag(v.endDate)}`
        : "";
      const bullets = v.highlights?.length
        ? `<ul class="bullets">${v.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}</ul>`
        : "";
      return `
        <article class="entry">
          ${entryHead(v.position ?? "", dates)}
          ${company ? `<p class="company">${escapeHtml(company)}</p>` : ""}
          ${v.summary ? `<p class="summary">${renderInline(v.summary)}</p>` : ""}
          ${bullets}
        </article>
      `;
    })
    .join("");
  return `<section>${sectionHead("Volunteer")}${body}</section>`;
}

function renderAwards(awards: Award[]): string {
  const body = awards
    .map((a) => {
      const dates = a.date ? escapeHtml(formatDate(a.date)) : "";
      return `
        <article class="entry">
          ${entryHead(a.title ?? "", dates)}
          ${a.awarder ? `<p class="company">${escapeHtml(a.awarder)}</p>` : ""}
          ${a.summary ? `<p class="summary">${renderInline(a.summary)}</p>` : ""}
        </article>
      `;
    })
    .join("");
  return `<section>${sectionHead("Awards")}${body}</section>`;
}

function renderInterests(interests: Interest[]): string {
  const rows = interests
    .map((i) => {
      const kws = i.keywords?.length
        ? i.keywords
            .map((k) => renderInline(k))
            .join(' <span class="sep">·</span> ')
        : "";
      return `<p class="skill-row"><span class="skill-label">${escapeHtml(i.name)}</span>${kws}</p>`;
    })
    .join("");
  return `<section>${sectionHead("Interests")}${rows}</section>`;
}

function renderLanguages(languages: Language[]): string {
  const list = languages
    .map((l) =>
      l.fluency
        ? `${escapeHtml(l.language)} <span class="muted">(${escapeHtml(l.fluency)})</span>`
        : escapeHtml(l.language),
    )
    .join(' <span class="sep">·</span> ');
  return `<section>${sectionHead("Languages")}<p class="skill-row">${list}</p></section>`;
}

const styles = `
:root {
  --ink: #1a1a1a;
  --muted: #6b6b6b;
  --faint: #a3a3a3;
  --rule: #d4d4d4;
  --accent: #2d4a3a;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: var(--ink);
  font-family: "Newsreader", Georgia, "Times New Roman", serif;
  font-size: 9.5pt;
  line-height: 1.4;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  -webkit-font-smoothing: antialiased;
}

main {
  max-width: 720px;
  margin: 0 auto;
  padding: 24mm 18mm;
}

a {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-decoration-thickness: 0.5pt;
  text-underline-offset: 2pt;
}

/* Hero */
.hero { margin-bottom: 4mm; position: relative; }
.hero-avatar {
  position: absolute;
  top: 0;
  right: 0;
}
.hero-avatar img {
  width: 13mm;
  height: 13mm;
  border-radius: 50%;
  object-fit: cover;
  border: 0.5pt solid var(--rule);
  display: block;
}
.name {
  font-family: "Geist", "Inter Tight", system-ui, -apple-system, sans-serif;
  font-weight: 600;
  font-size: 24pt;
  line-height: 1.04;
  letter-spacing: -0.015em;
  margin: 0;
}
.role {
  font-family: "Newsreader", Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: 10.5pt;
  color: var(--muted);
  margin: 1pt 0 2mm 0;
}
.lede {
  font-family: "Newsreader", Georgia, serif;
  font-weight: 400;
  font-size: 10pt;
  line-height: 1.4;
  margin: 0 0 2mm 0;
  max-width: 60em;
  color: var(--ink);
}

.contact-bar {
  font-family: "Geist", "Inter Tight", system-ui, sans-serif;
  font-size: 8.5pt;
  color: var(--muted);
  letter-spacing: 0.02em;
  margin: 0;
  line-height: 1.55;
}
.contact-bar a { color: var(--accent); text-decoration: none; }
.contact-bar a:hover { text-decoration: underline; }
.sep { color: var(--faint); padding: 0 0.25em; }

/* Section heading */
section { margin-bottom: 4mm; }
.col-main > section:last-child,
.col-side > section:last-child { margin-bottom: 0; }
.section-head {
  font-family: "Geist", "Inter Tight", system-ui, sans-serif;
  font-size: 8.5pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink);
  border-bottom: 0.5pt solid var(--accent);
  padding-bottom: 2.5pt;
  margin: 0 0 3mm 0;
  break-after: avoid;
}

/* Two-column layout: work on left, skills/projects/education on right */
.layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  column-gap: 10mm;
  align-items: start;
}
.col-main, .col-side { min-width: 0; }

.col-side section { margin-bottom: 3mm; }
.col-side .section-head { margin-bottom: 2mm; }
.col-side .entry-head {
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}
.col-side .position { font-size: 10pt; }
.col-side .dates { font-size: 8pt; margin-top: 0.3mm; }
.col-side .company { font-size: 8pt; }
.col-side .summary { font-size: 9pt; margin-top: 0.8mm; line-height: 1.35; }

/* Skills in side column: italic serif label + keywords, tight rows */
.col-side .skill-row {
  margin-bottom: 1.6mm;
  font-size: 9pt;
  line-height: 1.4;
}
.col-side .skill-label {
  font-family: "Newsreader", Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: 9.5pt;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ink);
  margin-right: 0.35em;
}
.col-side .skill-label::after {
  content: " ·";
  color: var(--faint);
  font-style: normal;
  margin-left: 0.15em;
}

.col-side .entry-compact {
  margin-bottom: 1.8mm;
}
.col-side .entry-compact .project-name {
  display: block;
  font-size: 9.5pt;
}
.col-side .entry-compact .project-desc {
  display: block;
  margin-top: 0.3mm;
  font-size: 9pt;
  line-height: 1.35;
}

/* Print URLs are useful in main column but waste space in narrow side */
.col-side a[data-print-url]::after {
  content: "";
}

@media (max-width: 640px) {
  .layout { grid-template-columns: 1fr; row-gap: 4mm; }
}

/* Entries */
.entry {
  margin-bottom: 2.4mm;
  break-inside: avoid;
}
.entry:last-child { margin-bottom: 0; }
.entry-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1em;
  margin: 0;
}
.position {
  font-family: "Newsreader", Georgia, serif;
  font-weight: 600;
  font-size: 10.5pt;
  margin: 0;
  line-height: 1.2;
  color: var(--ink);
}
.dates {
  font-family: "Geist", "Inter Tight", system-ui, sans-serif;
  font-size: 8.5pt;
  color: var(--muted);
  white-space: nowrap;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}
.dates .endash { padding: 0 0.15em; }
.company {
  font-family: "Geist", "Inter Tight", system-ui, sans-serif;
  font-size: 8.5pt;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin: 0.5mm 0 0 0;
}
.summary {
  margin: 0.8mm 0 0 0;
  line-height: 1.4;
  color: var(--ink);
}
.bullets {
  margin: 0.8mm 0 0 0;
  padding-left: 1.05em;
  list-style: disc;
}
.bullets li {
  margin: 0.1mm 0;
  line-height: 1.35;
  padding-left: 0.2em;
}
.bullets li::marker { color: var(--faint); }

/* Projects (compact run-on) */
.entry-compact {
  margin-bottom: 1.5mm;
  break-inside: avoid;
  display: block;
}
.project-name {
  font-family: "Newsreader", Georgia, serif;
  font-weight: 600;
  font-size: 10pt;
  color: var(--ink);
}
.project-link {
  color: var(--ink);
  text-decoration: none;
}
.project-desc {
  color: var(--ink);
  font-size: 10pt;
}

/* Skills row */
.skill-row {
  margin: 0 0 1.4mm 0;
  font-family: "Newsreader", Georgia, serif;
  font-size: 9.75pt;
  line-height: 1.5;
}
.skill-row:last-child { margin-bottom: 0; }
.skill-label {
  font-family: "Geist", "Inter Tight", system-ui, sans-serif;
  font-size: 8pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--muted);
  margin-right: 0.6em;
}

.muted { color: var(--muted); }

@media print {
  @page { size: A4; margin: 8mm 12mm; }
  html, body { background: #fff; }
  main { max-width: none; margin: 0; padding: 0; }
  a { color: var(--ink); text-decoration: none; }
  .contact-bar a, .project-link, .lede a { color: var(--ink); }
  a[data-print-url]::after {
    content: " (" attr(data-print-url) ")";
    font-size: 0.78em;
    color: var(--muted);
    word-break: break-all;
    font-family: "Geist", "Inter Tight", system-ui, sans-serif;
    letter-spacing: 0.01em;
  }
}
`;

const template: Template = {
  name: "editorial",
  description:
    "Editorial two-column print CV — Newsreader serif body, Geist sans labels, forest accent.",
  render(resume: Resume): string {
    const lang = resume.meta?.language ?? "en";
    const { basics } = resume;

    return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(basics.name)} - CV</title>
  ${basics.summary ? `<meta name="description" content="${escapeHtml(basics.summary)}">` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
  <base target="_blank">
  <style>${styles}</style>
</head>
<body>
  <main>
    ${renderHero(basics)}
    <div class="layout">
      <div class="col-main">
        ${resume.work?.length ? renderWork(resume.work) : ""}
        ${resume.volunteer?.length ? renderVolunteer(resume.volunteer) : ""}
        ${resume.awards?.length ? renderAwards(resume.awards) : ""}
      </div>
      <div class="col-side">
        ${resume.skills?.length ? renderSkills(resume.skills) : ""}
        ${resume.projects?.length ? renderProjects(resume.projects) : ""}
        ${resume.education?.length ? renderEducation(resume.education) : ""}
        ${resume.interests?.length ? renderInterests(resume.interests) : ""}
        ${resume.languages?.length ? renderLanguages(resume.languages) : ""}
      </div>
    </div>
  </main>
</body>
</html>`;
  },
};

export default template;
