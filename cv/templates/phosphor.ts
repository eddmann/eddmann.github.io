import type {
  Award,
  Basics,
  Education,
  Interest,
  Language,
  Profile,
  Project,
  Reference,
  Resume,
  Skill,
  Template,
  Volunteer,
  Work,
} from "../lib/types";
import { escapeHtml, renderInline } from "../lib/markdown";
import { formatDate } from "../lib/dates";

function dateRange(start?: string, end?: string): string {
  if (!start) return "";
  const s = escapeHtml(formatDate(start));
  const e = end ? escapeHtml(formatDate(end)) : "present";
  return `${s} ── ${e}`;
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

function profileDisplay(p: Profile): string {
  if (p.username) return `@${p.username}`;
  if (p.url) return displayUrl(p.url);
  return p.network ?? "";
}

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function bootBanner(basics: Basics): string {
  const user = basics.email
    ? escapeHtml(basics.email.split("@")[0] ?? "guest")
    : "guest";
  return `
    <div class="boot">
      <div class="line d0">PHOSPHOR-CRT BIOS v3.86 &middot; (C) 1986 EDDCORP &middot; 640K OK</div>
      <div class="line d1">[<span class="ok">&nbsp;OK&nbsp;</span>] Mounting /dev/career on /mnt/cv ...... done</div>
      <div class="line d2">[<span class="ok">&nbsp;OK&nbsp;</span>] Loading user profile <b>${user}</b> ............ done</div>
      <div class="line d3">[<span class="ok">&nbsp;OK&nbsp;</span>] Establishing link @ 9600 baud ............ connected</div>
      <div class="line d4">login: <b>guest</b> &nbsp; password: <b>********</b> &nbsp; &raquo; access granted</div>
    </div>
  `;
}

function renderHero(basics: Basics): string {
  const taglineParts: string[] = [];
  if (basics.label) taglineParts.push(escapeHtml(basics.label));
  if (basics.location?.city) {
    const loc = [basics.location.city, basics.location.countryCode]
      .filter(Boolean)
      .join(", ");
    taglineParts.push(escapeHtml(loc));
  }
  const tagline = taglineParts.join(" &middot; ");

  const metaItems: string[] = [];
  if (basics.email) {
    metaItems.push(
      `<span>&#x2709; <a href="mailto:${escapeHtml(basics.email)}">${escapeHtml(basics.email)}</a></span>`,
    );
  }
  const url = basics.url ?? basics.website;
  if (url) {
    metaItems.push(
      `<span>&#x21AA; <a href="${escapeHtml(url)}">${escapeHtml(hostFromUrl(url))}</a></span>`,
    );
  }
  for (const p of basics.profiles ?? []) {
    if (!p.url && !p.username) continue;
    const label = escapeHtml((p.network ?? "").toLowerCase());
    const display = escapeHtml(profileDisplay(p));
    const linked = p.url
      ? `<a href="${escapeHtml(p.url)}">${display}</a>`
      : display;
    metaItems.push(`<span>${label}: ${linked}</span>`);
  }

  return `
    <pre class="ascii line d5" aria-label="${escapeHtml(basics.name)}">
 ┌──────────────────────────────────────────────────────────────────┐
 │  &gt;_  ${escapeHtml(basics.name.toUpperCase().padEnd(56))}│
 └──────────────────────────────────────────────────────────────────┘
</pre>

    <div class="tagline line d6 cursor">&gt; ${tagline}</div>

    ${metaItems.length ? `<div class="meta-row line d7">${metaItems.join("")}</div>` : ""}
  `;
}

function frameTop(cmd: string, label: string): string {
  const inner = `┌─[ <b>${cmd}</b> ${label} ]`;
  const dashes = "─".repeat(Math.max(4, 112 - cmd.length - label.length - 6));
  return `<div class="frame-top line">${inner}${dashes}</div>`;
}

function frameBot(): string {
  return `<div class="frame-bot line">└${"─".repeat(112)}</div>`;
}

function sectionHead(title: string, tag: string, path: string): string {
  return `
    <div class="section-head line">
      <span>// ${escapeHtml(title)}</span>
      <span class="tag">[${escapeHtml(tag)}]</span>
      <span class="path">&gt;&gt; ${escapeHtml(path)}</span>
    </div>
  `;
}

function renderSummary(basics: Basics): string {
  if (!basics.summary) return "";
  const user = basics.email ? (basics.email.split("@")[0] ?? "user") : "user";
  return `
    <section class="box">
      ${frameTop("cat", `/home/${escapeHtml(user)}/.profile`)}
      ${sectionHead("SUMMARY", "BIO", `/home/${user}/.profile`)}
      <div class="frame-body line">
        <p class="summary">${renderInline(basics.summary)}</p>
      </div>
      ${frameBot()}
    </section>
  `;
}

function renderWorkItem(w: Work): string {
  const company = w.name ?? w.company ?? "";
  const companyHtml = company
    ? w.url
      ? `<a href="${escapeHtml(w.url)}">${escapeHtml(company)}</a>`
      : escapeHtml(company)
    : "";
  const dates = dateRange(w.startDate, w.endDate);
  const isCurrent = !!w.startDate && !w.endDate;
  const yearSlug = w.startDate ? w.startDate.slice(0, 4) : "";
  const companySlug = slugify(company);
  const path = `/var/career/${yearSlug}${companySlug ? "/" + companySlug : ""}`;
  const bullets = w.highlights?.length
    ? `<ul class="tree">${w.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}</ul>`
    : "";
  return `
    <article class="entry line">
      <div class="entry-head">
        <div class="entry-title">&gt;&gt; <span class="at">${escapeHtml(w.position ?? "")}</span>${company ? ` @ ${companyHtml}` : ""}</div>
        ${dates ? `<div class="entry-dates">${dates}</div>` : ""}
      </div>
      <div class="entry-sub">&#x2937; ${escapeHtml(path)}${isCurrent ? ` &middot; <span class="kbd">CURRENT</span>` : ""}</div>
      ${w.summary ? `<p class="summary">${renderInline(w.summary)}</p>` : ""}
      ${bullets}
    </article>
  `;
}

function renderWork(work: Work[]): string {
  return `
    <section class="box">
      ${frameTop("ls -la", "/var/career/")}
      ${sectionHead("EXPERIENCE", "WORK", "/var/career/")}
      ${work.map(renderWorkItem).join("")}
      ${frameBot()}
    </section>
  `;
}

function renderEducation(education: Education[]): string {
  const body = education
    .map((e) => {
      const qual =
        e.studyType && e.area
          ? `<span class="at">${escapeHtml(e.studyType)}</span> ${escapeHtml(e.area)}`
          : escapeHtml(e.studyType ?? e.area ?? "");
      const dates = dateRange(e.startDate, e.endDate);
      const instHtml = e.url
        ? `<a href="${escapeHtml(e.url)}">${escapeHtml(e.institution)}</a>`
        : escapeHtml(e.institution);
      const meta: string[] = [];
      if (e.institution) meta.push(instHtml);
      if (e.score) meta.push(`<span class="kbd">${escapeHtml(e.score)}</span>`);
      return `
        <article class="entry line">
          <div class="entry-head">
            <div class="entry-title">&gt;&gt; ${qual}</div>
            ${dates ? `<div class="entry-dates">${dates}</div>` : ""}
          </div>
          ${meta.length ? `<div class="entry-sub">&#x2937; ${meta.join(" &middot; ")}</div>` : ""}
          ${e.courses?.length ? `<ul class="tree">${e.courses.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>` : ""}
        </article>
      `;
    })
    .join("");
  return `
    <section class="box">
      ${frameTop("cat", "/etc/edu/transcripts.log")}
      ${sectionHead("EDUCATION", "EDU", "/etc/edu/")}
      ${body}
      ${frameBot()}
    </section>
  `;
}

function renderSkills(skills: Skill[]): string {
  const cards = skills
    .map((s, idx) => {
      const isLast = idx === skills.length - 1;
      const prefix = isLast ? "└─" : "├─";
      const kws = s.keywords?.length
        ? `<div class="chips">${s.keywords.map((k) => `<span class="chip">${escapeHtml(k)}</span>`).join("")}</div>`
        : "";
      return `
        <div class="skill-card">
          <h4>${prefix} ${escapeHtml(s.name.toLowerCase())}</h4>
          ${kws}
        </div>
      `;
    })
    .join("");
  return `
    <section class="box">
      ${frameTop("man", "skills(1)")}
      ${sectionHead("SKILL MATRIX", "SKILL", "/usr/local/share/skills/")}
      <div class="grid-skills line">${cards}</div>
      ${frameBot()}
    </section>
  `;
}

function renderProjects(projects: Project[]): string {
  const cards = projects
    .map((p) => {
      const url = p.url
        ? `<a class="purl" href="${escapeHtml(p.url)}">${escapeHtml(displayUrl(p.url))}</a>`
        : "";
      return `
        <div class="proj">
          <div class="ptitle">&gt;_ ${escapeHtml(p.name)}</div>
          ${url}
          ${p.description ? `<div class="pdesc">${renderInline(p.description)}</div>` : ""}
          ${p.highlights?.length ? `<ul class="tree">${p.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}</ul>` : ""}
        </div>
      `;
    })
    .join("");
  return `
    <section class="box">
      ${frameTop("git", "log --oneline ~/projects")}
      ${sectionHead("PROJECTS", "PROJ", "~/projects/")}
      <div class="projects line">${cards}</div>
      ${frameBot()}
    </section>
  `;
}

function renderVolunteer(volunteer: Volunteer[]): string {
  const body = volunteer
    .map((v) => {
      const org = v.organization ?? "";
      const orgHtml = org
        ? v.url
          ? `<a href="${escapeHtml(v.url)}">${escapeHtml(org)}</a>`
          : escapeHtml(org)
        : "";
      const dates = dateRange(v.startDate, v.endDate);
      const bullets = v.highlights?.length
        ? `<ul class="tree">${v.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}</ul>`
        : "";
      return `
        <article class="entry line">
          <div class="entry-head">
            <div class="entry-title">&gt;&gt; <span class="at">${escapeHtml(v.position ?? "")}</span>${org ? ` @ ${orgHtml}` : ""}</div>
            ${dates ? `<div class="entry-dates">${dates}</div>` : ""}
          </div>
          ${v.summary ? `<p class="summary">${renderInline(v.summary)}</p>` : ""}
          ${bullets}
        </article>
      `;
    })
    .join("");
  return `
    <section class="box">
      ${frameTop("cat", "/var/volunteer/")}
      ${sectionHead("VOLUNTEER", "VOL", "/var/volunteer/")}
      ${body}
      ${frameBot()}
    </section>
  `;
}

function renderAwards(awards: Award[]): string {
  const body = awards
    .map((a) => {
      const date = a.date ? escapeHtml(formatDate(a.date)) : "";
      return `
        <article class="entry line">
          <div class="entry-head">
            <div class="entry-title">&gt;&gt; ${escapeHtml(a.title ?? "")}</div>
            ${date ? `<div class="entry-dates">${date}</div>` : ""}
          </div>
          ${a.awarder ? `<div class="entry-sub">&#x2937; ${escapeHtml(a.awarder)}</div>` : ""}
          ${a.summary ? `<p class="summary">${renderInline(a.summary)}</p>` : ""}
        </article>
      `;
    })
    .join("");
  return `
    <section class="box">
      ${frameTop("cat", "/var/awards/")}
      ${sectionHead("AWARDS", "AWARD", "/var/awards/")}
      ${body}
      ${frameBot()}
    </section>
  `;
}

function renderInterests(interests: Interest[]): string {
  const body = interests
    .map((i) => {
      const bullets = i.keywords?.length
        ? `<ul class="tree">${i.keywords.map((k) => `<li>${renderInline(k)}</li>`).join("")}</ul>`
        : "";
      return `
        <article class="entry">
          <div class="entry-head">
            <div class="entry-title">&gt;&gt; ${escapeHtml(i.name)}</div>
            <div class="entry-dates">off-hours/*</div>
          </div>
          ${bullets}
        </article>
      `;
    })
    .join("");
  return `
    <section class="box">
      ${frameTop("tail", "-f ~/.interests")}
      ${sectionHead("INTERESTS", "OFF-HOURS", "~/.interests")}
      <div class="frame-body line">${body}</div>
      ${frameBot()}
    </section>
  `;
}

function renderLanguages(languages: Language[]): string {
  const lines = languages
    .map(
      (l) =>
        `<div class="lang-line"><span>├── <b>${escapeHtml(l.language)}</b></span><span>fluency: <b>${escapeHtml(l.fluency ?? "—")}</b></span></div>`,
    )
    .join("");
  return `
    <section class="box">
      ${frameTop("locale", "-a")}
      ${sectionHead("LANGUAGES", "LANG", "/etc/locale.conf")}
      <div class="frame-body line">${lines}</div>
      ${frameBot()}
    </section>
  `;
}

function renderReferences(refs: Reference[], basics: Basics): string {
  const hasItems = refs && refs.length > 0;
  const body = hasItems
    ? refs
        .map(
          (r) =>
            `<p class="summary">${r.name ? `<b>${escapeHtml(r.name)}</b> — ` : ""}${r.reference ? renderInline(r.reference) : ""}</p>`,
        )
        .join("")
    : `<p class="summary">$ <b>grep</b> -r &quot;available&quot; /etc/references<br/>
        <span style="color:var(--phosphor-dim)">/etc/references: Available on request${basics.email ? ` &mdash; contact <a href="mailto:${escapeHtml(basics.email)}">${escapeHtml(basics.email)}</a>` : ""}</span>
      </p>`;
  return `
    <section class="box">
      ${frameTop("cat", "/etc/references")}
      ${sectionHead("REFERENCES", "REFS", "/etc/references")}
      <div class="frame-body line">${body}</div>
      ${frameBot()}
    </section>
  `;
}

function renderStatusBar(basics: Basics): string {
  const user = basics.email
    ? escapeHtml(basics.email.split("@")[0] ?? "user")
    : "user";
  const locParts: string[] = [];
  if (basics.location?.city) locParts.push(basics.location.city);
  if (basics.location?.countryCode) locParts.push(basics.location.countryCode);
  const loc = locParts.length ? escapeHtml(locParts.join(", ")) : "offline";
  return `
    <div class="statusbar">
      <span><b>READY</b> <span class="pulse"></span></span>
      <span>${user}@cv:~$</span>
      <span>CONNECTED 9600 baud</span>
      <span>ENC: utf-8</span>
      <span>TERM: xterm-256color</span>
      <span class="spacer"></span>
      <span>LOC: ${loc}</span>
      <span>PAGE 1/1</span>
      <span>F1 help</span>
    </div>
  `;
}

const styles = `
:root {
  --phosphor: #41ff00;
  --phosphor-dim: #2bb000;
  --phosphor-dark: #0e3a00;
  --bg: #050805;
  --bg-deep: #000300;
  --warn: #ffb000;
  --danger: #ff3030;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg-deep);
  color: var(--phosphor);
  font-family: "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
  overflow-x: hidden;
}

/* CRT body — barrel curve + vignette */
.crt {
  position: relative;
  min-height: 100vh;
  max-width: 100ch;
  margin: 0 auto;
  padding: 48px clamp(16px, 4vw, 56px) 96px;
  background:
    radial-gradient(ellipse at center, rgba(65,255,0,0.04) 0%, rgba(0,0,0,0) 60%),
    radial-gradient(ellipse at center, var(--bg) 0%, var(--bg-deep) 85%);
  transform: perspective(1200px) rotateX(0.2deg);
  transform-origin: center top;
}

/* scanlines */
.crt::before {
  content: "";
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0px,
    rgba(0,0,0,0) 2px,
    rgba(0,0,0,0.28) 3px,
    rgba(0,0,0,0.28) 4px
  );
  pointer-events: none;
  z-index: 50;
  mix-blend-mode: multiply;
}

/* vignette + faint flicker */
.crt::after {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%);
  pointer-events: none;
  z-index: 49;
  animation: flicker 7s infinite steps(40, end);
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  47% { opacity: 1; }
  48% { opacity: 0.88; }
  49% { opacity: 1; }
  72% { opacity: 1; }
  73% { opacity: 0.94; }
  74% { opacity: 1; }
}

/* glow */
body, .crt {
  text-shadow:
    0 0 1px currentColor,
    0 0 6px rgba(65,255,0,0.45),
    0 0 14px rgba(65,255,0,0.18);
}

a {
  color: var(--phosphor);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--phosphor-dim);
}
a:hover { background: var(--phosphor); color: var(--bg-deep); text-shadow: none; }

/* Type-on animation, line-by-line */
.line {
  overflow: hidden;
  white-space: pre-wrap;
  opacity: 0;
  animation: typeon 0.45s steps(60, end) forwards;
}
@keyframes typeon {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Cascade animation delays via nth-of-type */
.line:nth-of-type(1)  { animation-delay: 0.00s; }
.line:nth-of-type(2)  { animation-delay: 0.06s; }
.line:nth-of-type(3)  { animation-delay: 0.12s; }
.line:nth-of-type(4)  { animation-delay: 0.18s; }
.line:nth-of-type(5)  { animation-delay: 0.24s; }
.line:nth-of-type(6)  { animation-delay: 0.30s; }
.line:nth-of-type(7)  { animation-delay: 0.36s; }
.line:nth-of-type(8)  { animation-delay: 0.42s; }
.line:nth-of-type(9)  { animation-delay: 0.48s; }
.line:nth-of-type(10) { animation-delay: 0.54s; }
.line:nth-of-type(n+11) { animation-delay: 0.60s; }

/* blinking block cursor */
.cursor::after {
  content: "\\2588";
  display: inline-block;
  margin-left: 6px;
  animation: blink 1.05s steps(1, end) infinite;
  color: var(--phosphor);
}
@keyframes blink {
  0%, 49%   { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* HERO */
.boot {
  font-family: "JetBrains Mono", monospace;
  color: var(--phosphor-dim);
  font-size: 12px;
  margin-bottom: 14px;
}
.boot b { color: var(--phosphor); font-weight: 700; }
.boot .ok { color: var(--phosphor); }
.boot .warn { color: var(--warn); }

pre.ascii {
  font-family: "VT323", monospace;
  color: var(--phosphor);
  font-size: clamp(14px, 1.8vw, 22px);
  line-height: 1.0;
  margin: 18px 0 6px;
  text-shadow:
    0 0 2px currentColor,
    0 0 8px rgba(65,255,0,0.7),
    0 0 28px rgba(65,255,0,0.35);
  white-space: pre;
  overflow-x: auto;
  letter-spacing: 0;
}

.tagline {
  font-family: "VT323", monospace;
  font-size: 28px;
  line-height: 1;
  color: var(--phosphor);
  margin: 4px 0 2px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 22px;
  color: var(--phosphor-dim);
  margin-top: 10px;
  font-size: 13px;
}
.meta-row b { color: var(--phosphor); font-weight: 500; }

/* Section frame */
section.box {
  margin: 36px 0 8px;
  position: relative;
}
.frame-top, .frame-bot {
  color: var(--phosphor-dim);
  white-space: pre;
  font-size: 13px;
  overflow: hidden;
  text-overflow: clip;
}
.frame-top { letter-spacing: 0; }
.frame-top b { color: var(--phosphor); font-weight: 700; }

.section-head {
  font-family: "VT323", monospace;
  font-size: 30px;
  color: var(--phosphor);
  line-height: 1;
  margin: 6px 0 8px;
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
.section-head .tag {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: var(--bg-deep);
  background: var(--phosphor);
  padding: 2px 8px;
  text-shadow: none;
  letter-spacing: 0.06em;
}
.section-head .path {
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
  color: var(--phosphor-dim);
}

.frame-body {
  border-left: 1px solid var(--phosphor-dark);
  padding: 4px 0 4px 14px;
  margin-left: 4px;
}

/* Work entry */
.entry {
  margin: 14px 0 22px;
  padding: 12px 14px 12px 14px;
  border: 1px solid var(--phosphor-dark);
  position: relative;
  background:
    linear-gradient(180deg, rgba(65,255,0,0.025), rgba(65,255,0,0) 60%);
}
.entry::before {
  content: "┌";
  position: absolute;
  left: -1px;
  top: -1px;
  color: var(--phosphor);
  background: var(--bg-deep);
  padding: 0 3px;
  transform: translate(-50%, -55%);
  font-size: 16px;
}
.entry-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px 16px;
  justify-content: space-between;
}
.entry-title {
  font-family: "VT323", monospace;
  font-size: 24px;
  color: var(--phosphor);
  line-height: 1;
}
.entry-title .at { color: var(--phosphor-dim); }
.entry-dates {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: var(--phosphor-dim);
  border: 1px solid var(--phosphor-dark);
  padding: 2px 8px;
  white-space: nowrap;
}
.entry-sub {
  font-size: 12px;
  color: var(--phosphor-dim);
  margin: 6px 0 10px;
  letter-spacing: 0.02em;
}
.entry-sub a { color: var(--phosphor); }

.summary {
  margin: 8px 0 10px;
  color: var(--phosphor);
  opacity: 0.92;
}

ul.tree {
  list-style: none;
  padding: 0;
  margin: 4px 0 2px;
}
ul.tree li {
  position: relative;
  padding-left: 24px;
  margin: 4px 0;
  font-size: 13.5px;
}
ul.tree li::before {
  content: "├──";
  position: absolute;
  left: 0;
  top: 0;
  color: var(--phosphor-dim);
  font-family: "JetBrains Mono", monospace;
}
ul.tree li:last-child::before { content: "└──"; }

/* skills */
.grid-skills {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  margin: 12px 0 6px;
}
.skill-card {
  border: 1px solid var(--phosphor-dark);
  padding: 10px 12px;
  background:
    linear-gradient(180deg, rgba(65,255,0,0.04), rgba(65,255,0,0) 70%);
}
.skill-card h4 {
  margin: 0 0 8px;
  font-family: "VT323", monospace;
  font-size: 22px;
  color: var(--phosphor);
  line-height: 1;
  letter-spacing: 0.02em;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
}
.chip {
  font-size: 11.5px;
  color: var(--phosphor);
  border: 1px solid var(--phosphor-dim);
  padding: 1px 7px;
  line-height: 1.6;
  background: rgba(65,255,0,0.03);
}

/* projects */
.projects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
  margin-top: 10px;
}
.proj {
  border: 1px solid var(--phosphor-dark);
  padding: 10px 12px;
  position: relative;
}
.proj .ptitle {
  font-family: "VT323", monospace;
  font-size: 22px;
  color: var(--phosphor);
  margin: 0 0 2px;
  line-height: 1.05;
}
.proj .purl {
  display: block;
  font-size: 11px;
  color: var(--phosphor-dim);
  margin-bottom: 6px;
  word-break: break-all;
}
.proj .pdesc {
  font-size: 13px;
  color: var(--phosphor);
  opacity: 0.92;
}

/* interests / languages / refs */
.lang-line {
  display: flex; justify-content: space-between;
  border-bottom: 1px dashed var(--phosphor-dark);
  padding: 4px 0;
}
.lang-line b { color: var(--phosphor); }

.marquee {
  font-family: "VT323", monospace;
  color: var(--phosphor-dim);
  font-size: 18px;
  margin: 28px 0 0;
  white-space: pre;
  overflow: hidden;
}

/* status bar */
.statusbar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: var(--phosphor);
  color: var(--bg-deep);
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  padding: 4px 12px;
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
  z-index: 60;
  text-shadow: none;
  letter-spacing: 0.04em;
}
.statusbar b { font-weight: 700; }
.statusbar .pulse::after {
  content: "\\2588";
  display: inline-block;
  margin-left: 4px;
  animation: blinkInverse 1s steps(1, end) infinite;
}
@keyframes blinkInverse {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.15; }
}
.statusbar .spacer { flex: 1; }

hr.dash {
  border: 0;
  border-top: 1px dashed var(--phosphor-dark);
  margin: 18px 0;
}

.kbd {
  font-family: "JetBrains Mono", monospace;
  border: 1px solid var(--phosphor-dim);
  padding: 0 5px;
  font-size: 11px;
  color: var(--phosphor);
}

::selection { background: var(--phosphor); color: var(--bg-deep); text-shadow: none; }

/* ====== PRINT ====== */
@media print {
  @page { size: A4; margin: 14mm; }
  html, body {
    background: #fff !important;
    color: #000 !important;
    font-size: 10.5pt;
    text-shadow: none !important;
  }
  .crt {
    background: #fff !important;
    transform: none;
    padding: 0;
  }
  .crt::before, .crt::after { display: none !important; }
  .statusbar { display: none !important; }
  a { color: #000 !important; text-decoration: underline; }
  pre.ascii, .tagline, .section-head, .entry-title, .skill-card h4, .proj .ptitle, .marquee {
    color: #000 !important;
    text-shadow: none !important;
  }
  .section-head .tag { background: #000 !important; color: #fff !important; }
  .entry, .skill-card, .proj { border-color: #000 !important; background: #fff !important; }
  .entry-dates, .chip { border-color: #000 !important; color: #000 !important; background: #fff !important; }
  .frame-top, .frame-bot, .entry-sub, .meta-row, .proj .purl, .lang-line, .boot {
    color: #000 !important;
  }
  .frame-body { border-left-color: #000 !important; }
  .cursor::after { display: none !important; }
  .line { animation: none !important; opacity: 1 !important; }
  .entry { page-break-inside: avoid; }
  .skill-card, .proj { page-break-inside: avoid; }
}
`;

const template: Template = {
  name: "phosphor",
  description:
    "Phosphor CRT terminal CV — JetBrains Mono and VT323 on deep black with scanlines, vignette, and green-phosphor glow.",
  render(resume: Resume): string {
    const lang = resume.meta?.language ?? "en";
    const { basics } = resume;

    return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(basics.email?.split("@")[0] ?? "user")}@cv:~$ ./resume --full</title>
  ${basics.summary ? `<meta name="description" content="${escapeHtml(basics.summary)}">` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <base target="_blank">
  <style>${styles}</style>
</head>
<body>
<div class="crt">
  ${bootBanner(basics)}
  ${renderHero(basics)}
  ${renderSummary(basics)}
  ${resume.work?.length ? renderWork(resume.work) : ""}
  ${resume.education?.length ? renderEducation(resume.education) : ""}
  ${resume.skills?.length ? renderSkills(resume.skills) : ""}
  ${resume.projects?.length ? renderProjects(resume.projects) : ""}
  ${resume.volunteer?.length ? renderVolunteer(resume.volunteer) : ""}
  ${resume.awards?.length ? renderAwards(resume.awards) : ""}
  ${resume.interests?.length ? renderInterests(resume.interests) : ""}
  ${resume.languages?.length ? renderLanguages(resume.languages) : ""}
  ${renderReferences(resume.references ?? [], basics)}

  <pre class="marquee line">
&gt;&gt;&gt;  EOF  &lt;&lt;&lt;   buffer flushed   &middot;   thank you for connecting   &middot;   logout in 3...2...1...
</pre>
</div>

${renderStatusBar(basics)}
</body>
</html>`;
  },
};

export default template;
