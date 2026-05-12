import type {
  Award,
  Basics,
  Education,
  Interest,
  Language,
  Project,
  Resume,
  Skill,
  Template,
  Volunteer,
  Work,
} from "../lib/types";
import { escapeHtml, renderInline } from "../lib/markdown";
import { formatDate, formatYear } from "../lib/dates";

function dateRange(start: string | undefined, end: string | undefined): string {
  if (!start) return "";
  const startStr = escapeHtml(formatDate(start));
  const endStr = end ? escapeHtml(formatDate(end)) : "Present";
  return `${startStr} &mdash; ${endStr}`;
}

function pillIconFor(network: string | undefined): string {
  const n = (network ?? "").toLowerCase();
  if (n.includes("github")) return "&#9733;";
  if (n.includes("linkedin")) return "&#9635;";
  if (n.includes("x") || n.includes("twitter")) return "&#10005;";
  if (n.includes("bluesky")) return "&#9729;";
  if (n.includes("podcast")) return "&#9834;";
  if (n.includes("mastodon")) return "&#9836;";
  return "&#10070;";
}

function locationString(basics: Basics): string {
  const loc = basics.location;
  if (!loc) return "";
  const parts = [loc.city, loc.region, loc.countryCode].filter(
    (p): p is string => Boolean(p),
  );
  return parts.join(", ");
}

function renderPills(basics: Basics): string {
  const pills: string[] = [];
  if (basics.email) {
    pills.push(
      `<a class="pill" href="mailto:${escapeHtml(basics.email)}">&#9993; ${escapeHtml(basics.email)}</a>`,
    );
  }
  const url = basics.url ?? basics.website;
  if (url) {
    let host = url;
    try {
      const u = new URL(url);
      host = u.host.startsWith("www.") ? u.host.slice(4) : u.host;
    } catch {
      host = url.replace(/^https?:\/\/(www\.)?/, "");
    }
    pills.push(
      `<a class="pill" href="${escapeHtml(url)}" target="_blank" rel="noopener">&#8962; ${escapeHtml(host)}</a>`,
    );
  }
  const loc = locationString(basics);
  if (loc) {
    pills.push(`<span class="pill">&#8984; ${escapeHtml(loc)}</span>`);
  }
  for (const profile of basics.profiles ?? []) {
    if (!profile.url) continue;
    const label = profile.username
      ? `${profile.network}: ${profile.username}`
      : profile.network;
    pills.push(
      `<a class="pill" href="${escapeHtml(profile.url)}" target="_blank" rel="noopener">${pillIconFor(profile.network)} ${escapeHtml(label)}</a>`,
    );
  }
  return pills.join("");
}

function buildMarqueeMessage(resume: Resume): string {
  const parts: string[] = [];
  const { basics } = resume;
  if (basics.name) parts.push(basics.name.toUpperCase());
  if (basics.label) parts.push(basics.label.toUpperCase());
  const loc = locationString(basics);
  if (loc) parts.push(loc.toUpperCase());
  if (basics.summary) {
    const short = basics.summary.split(/[.!?]/)[0]?.trim().toUpperCase();
    if (short) parts.push(short);
  }
  const earliest = resume.work?.length
    ? resume.work
        .map((w) => (w.startDate ? formatYear(w.startDate) : ""))
        .filter(Boolean)
        .sort()[0]
    : undefined;
  if (earliest) parts.push(`EST. ${earliest}`);
  parts.push("WELCOME TO MY CYBER-CV");
  return parts.join(" ");
}

function buildFooterTickerMessage(resume: Resume): string {
  const parts: string[] = ["THANKS 4 VISITING", "SIGN MY GUESTBOOK"];
  const { basics } = resume;
  if (basics.email) parts.push(basics.email.toUpperCase());
  const url = basics.url ?? basics.website;
  if (url) {
    try {
      const u = new URL(url);
      const host = u.host.startsWith("www.") ? u.host.slice(4) : u.host;
      parts.push(host.toUpperCase());
    } catch {
      /* ignore */
    }
  }
  for (const profile of basics.profiles ?? []) {
    if (!profile.username) continue;
    parts.push(
      `${profile.network.toUpperCase()}/${profile.username.toUpperCase()}`,
    );
  }
  parts.push("POWERED BY DREAMS AND CHROME");
  return parts.join(" ");
}

function renderMarquee(message: string, variant: "top" | "bottom"): string {
  const safe = escapeHtml(message);
  const segments = safe
    .split(/\s+/)
    .filter(Boolean)
    .join(' <span class="star">&#10022;</span> ');
  const inner = `<span class="star">&#10022;</span> ${segments} <span class="star">&#10022;</span>`;
  return `
    <div class="marquee marquee--${variant}" ${variant === "top" ? 'role="banner" aria-label="ticker"' : 'aria-hidden="true"'}>
      <div class="marquee__track">
        <span>${inner}</span>
        <span aria-hidden="true">${inner}</span>
      </div>
    </div>
  `;
}

function renderHero(resume: Resume): string {
  const { basics } = resume;
  const nameUpper = (basics.name ?? "").toUpperCase();
  return `
    <section class="hero" aria-label="hero">
      <div class="badge" aria-hidden="true"></div>
      <div class="hero__title-wrap">
        <h1 class="name" data-text="${escapeHtml(nameUpper)}">${escapeHtml(nameUpper)}</h1>
        ${basics.label ? `<p class="label">&#10022; ${escapeHtml(basics.label)} &#10022;</p>` : ""}
        <div class="hero__meta">${renderPills(basics)}</div>
      </div>
    </section>
  `;
}

function winBar(title: string): string {
  return `
    <div class="win__bar">
      <span class="win__bar-title"><span class="glyph">&#10022;</span> ${escapeHtml(title)}</span>
      <span class="win__buttons"><span>&#9472;</span><span>&#9633;</span><span>&#10005;</span></span>
    </div>
  `;
}

function renderSummary(basics: Basics): string {
  if (!basics.summary) return "";
  return `
    <section class="win span-12">
      ${winBar("README.TXT — about.exe")}
      <div class="win__body">
        <p class="summary-text">${renderInline(basics.summary)}</p>
      </div>
    </section>
  `;
}

function renderWorkItem(w: Work): string {
  const company = w.name ?? w.company ?? "";
  const companyHtml = company
    ? w.url
      ? `<a href="${escapeHtml(w.url)}" target="_blank" rel="noopener" class="company-link"><span class="company">${escapeHtml(company)}</span></a>`
      : `<span class="company">${escapeHtml(company)}</span>`
    : "";
  const dates = dateRange(w.startDate, w.endDate);
  const bullets = w.highlights?.length
    ? `<ul class="job__list">${w.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}</ul>`
    : "";
  return `
    <article class="job">
      <div class="job__head">
        <h3 class="job__role">${escapeHtml(w.position ?? "")}${company ? ` <span class="at">@</span> ${companyHtml}` : ""}</h3>
        ${dates ? `<span class="job__dates">${dates}</span>` : ""}
      </div>
      ${w.summary ? `<p class="job__summary">${renderInline(w.summary)}</p>` : ""}
      ${bullets}
    </article>
  `;
}

function renderWork(work: Work[]): string {
  return `
    <section class="win span-8">
      ${winBar("CAREER_LOG.SYS — work_history")}
      <div class="win__body">
        ${work.map(renderWorkItem).join("")}
      </div>
    </section>
  `;
}

function renderSkills(skills: Skill[]): string {
  const groups = skills
    .map((s) => {
      const chips = (s.keywords ?? [])
        .map((k) => `<span class="chip">${escapeHtml(k)}</span>`)
        .join("");
      return `
        <div class="skill-group">
          <div class="skill-group__name">&#10023; ${escapeHtml(s.name)}</div>
          ${chips ? `<div class="chip-row">${chips}</div>` : ""}
        </div>
      `;
    })
    .join("");
  return `
    <section class="win span-4">
      ${winBar("SKILLZ.DLL")}
      <div class="win__body">${groups}</div>
    </section>
  `;
}

function renderProjects(projects: Project[]): string {
  const items = projects
    .map((p) => {
      const heading = p.url
        ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.name)}</a>`
        : escapeHtml(p.name);
      return `
        <div class="project">
          <h4 class="project__name">${heading}</h4>
          ${p.description ? `<p class="project__desc">${renderInline(p.description)}</p>` : ""}
        </div>
      `;
    })
    .join("");
  return `
    <section class="win span-7">
      ${winBar("SIDE_PROJECTS.EXE")}
      <div class="win__body">${items}</div>
    </section>
  `;
}

function renderInterests(interests: Interest[]): string {
  const items = interests
    .map((i) => {
      const list = i.keywords?.length
        ? `<ul>${i.keywords.map((k) => `<li>${renderInline(k)}</li>`).join("")}</ul>`
        : "";
      return `
        <div class="interest">
          <h4 class="interest__name">${escapeHtml(i.name)}</h4>
          ${list}
        </div>
      `;
    })
    .join("");
  return `
    <section class="win span-5">
      ${winBar("HOBBYZ.INI")}
      <div class="win__body">${items}</div>
    </section>
  `;
}

function renderEducation(education: Education[]): string {
  const items = education
    .map((e) => {
      const institution = e.url
        ? `<a href="${escapeHtml(e.url)}" target="_blank" rel="noopener">${escapeHtml(e.institution)}</a>`
        : escapeHtml(e.institution);
      const qual =
        e.studyType && e.area
          ? `${e.studyType} &middot; ${e.area}`
          : (e.studyType ?? e.area ?? "");
      const dates = dateRange(e.startDate, e.endDate);
      return `
        <article class="edu">
          <h3 class="edu__institution">${institution}</h3>
          ${qual ? `<p class="edu__line">${escapeHtml(qual)}</p>` : ""}
          ${dates ? `<p class="edu__line">${dates}</p>` : ""}
          ${e.score ? `<p class="edu__line"><span class="edu__score">&#9733; ${escapeHtml(e.score)} &#9733;</span></p>` : ""}
        </article>
      `;
    })
    .join("");
  return `
    <section class="win span-6">
      ${winBar("EDU.LOG")}
      <div class="win__body">${items}</div>
    </section>
  `;
}

function renderLanguages(languages: Language[]): string {
  const rows = languages
    .map(
      (l) => `
        <div class="lang-row">
          <span class="lang-name">&#10023; ${escapeHtml(l.language)}</span>
          ${l.fluency ? `<span class="lang-fluency">${escapeHtml(l.fluency)}</span>` : ""}
        </div>
      `,
    )
    .join("");
  return `
    <section class="win span-6">
      ${winBar("LANG_PACK.DAT")}
      <div class="win__body">${rows}</div>
    </section>
  `;
}

function renderVolunteer(volunteer: Volunteer[]): string {
  const items = volunteer
    .map((v) => {
      const org = v.organization ?? "";
      const orgHtml = org
        ? v.url
          ? `<a href="${escapeHtml(v.url)}" target="_blank" rel="noopener" class="company-link"><span class="company">${escapeHtml(org)}</span></a>`
          : `<span class="company">${escapeHtml(org)}</span>`
        : "";
      const dates = dateRange(v.startDate, v.endDate);
      const bullets = v.highlights?.length
        ? `<ul class="job__list">${v.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}</ul>`
        : "";
      return `
        <article class="job">
          <div class="job__head">
            <h3 class="job__role">${escapeHtml(v.position ?? "")}${org ? ` <span class="at">@</span> ${orgHtml}` : ""}</h3>
            ${dates ? `<span class="job__dates">${dates}</span>` : ""}
          </div>
          ${v.summary ? `<p class="job__summary">${renderInline(v.summary)}</p>` : ""}
          ${bullets}
        </article>
      `;
    })
    .join("");
  return `
    <section class="win span-6">
      ${winBar("VOLUNTEER.BAT")}
      <div class="win__body">${items}</div>
    </section>
  `;
}

function renderAwards(awards: Award[]): string {
  const items = awards
    .map((a) => {
      const dates = a.date ? escapeHtml(formatDate(a.date)) : "";
      return `
        <article class="job">
          <div class="job__head">
            <h3 class="job__role">${escapeHtml(a.title ?? "")}${a.awarder ? ` <span class="at">@</span> <span class="company">${escapeHtml(a.awarder)}</span>` : ""}</h3>
            ${dates ? `<span class="job__dates">${dates}</span>` : ""}
          </div>
          ${a.summary ? `<p class="job__summary">${renderInline(a.summary)}</p>` : ""}
        </article>
      `;
    })
    .join("");
  return `
    <section class="win span-6">
      ${winBar("AWARDS.TROPHY")}
      <div class="win__body">${items}</div>
    </section>
  `;
}

function renderFooter(resume: Resume): string {
  const year = new Date().getFullYear();
  const earliest = resume.work?.length
    ? resume.work
        .map((w) => (w.startDate ? formatYear(w.startDate) : ""))
        .filter(Boolean)
        .sort()[0]
    : undefined;
  const forged = earliest ?? "1999";
  const name = resume.basics.name ? escapeHtml(resume.basics.name) : "";
  return `
    <div class="footer">
      <p>
        <span class="blink">&#9619;</span>
        U R VISITOR
        <span class="visitor-counter">00000001</span>
        OF ${name ? `${name.toUpperCase()}.EXE` : "CV.EXE"} &mdash; BEST VIEWED IN <b>NETSCAPE NAVIGATOR 4.0+</b>
        <span class="blink">&#9619;</span>
      </p>
      <p>&#10022; Forged in ${escapeHtml(forged)} &middot; Compiled in ${year}${name ? ` &middot; &copy; ${name}` : ""} &#10022;</p>
    </div>
  `;
}

const styles = `
:root {
  --hot-pink: #ff00aa;
  --hot-pink-2: #ff4fa3;
  --cyan: #00f0ff;
  --lime: #9eff00;
  --purple: #6a00ff;
  --purple-deep: #2a0050;
  --chrome-1: #f4f4f4;
  --chrome-2: #b6b6c8;
  --chrome-3: #6e6e88;
  --win-grey: #c0c0c0;
  --win-grey-dark: #808080;
  --win-grey-darker: #404040;
  --win-blue: #000080;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

html, body, * {
  cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><defs><filter id='g'><feGaussianBlur stdDeviation='0.6'/></filter></defs><g filter='url(%23g)'><path d='M14 2 L16 12 L26 14 L16 16 L14 26 L12 16 L2 14 L12 12 Z' fill='%23ff00aa' stroke='%2300f0ff' stroke-width='1'/></g><circle cx='14' cy='14' r='1.6' fill='%23ffffff'/></svg>") 14 14, auto;
}

a {
  cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M14 2 L16 12 L26 14 L16 16 L14 26 L12 16 L2 14 L12 12 Z' fill='%2300f0ff' stroke='%23ff00aa' stroke-width='1.2'/><circle cx='14' cy='14' r='1.8' fill='%23ffffff'/></svg>") 14 14, pointer;
}

body {
  font-family: 'VT323', 'DotGothic16', monospace;
  font-size: 18px;
  color: #1a002a;
  background: #0a0020;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

body::before {
  content: '';
  position: fixed;
  inset: -20%;
  z-index: -3;
  background:
    conic-gradient(from 0deg at 30% 30%, #ff00aa, #00f0ff, #9eff00, #6a00ff, #ff00aa),
    conic-gradient(from 180deg at 70% 70%, #00f0ff, #ff4fa3, #6a00ff, #00f0ff);
  background-blend-mode: screen;
  filter: blur(80px) saturate(160%);
  opacity: 0.85;
  animation: meshShift 22s linear infinite;
}

body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 32%, transparent 38%, rgba(10,0,32,0.85) 75%),
    linear-gradient(180deg, transparent 0%, transparent 55%, rgba(10,0,32,0.6) 60%, transparent 62%),
    repeating-linear-gradient(90deg, transparent 0, transparent 38px, rgba(0, 240, 255, 0.35) 38px, rgba(0, 240, 255, 0.35) 40px),
    repeating-linear-gradient(0deg, transparent 0, transparent 38px, rgba(255, 0, 170, 0.28) 38px, rgba(255, 0, 170, 0.28) 40px);
  background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
  background-position: 0 0, 0 0, 0 65%, 0 65%;
  mask-image: linear-gradient(180deg, transparent 55%, #000 65%, #000 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 55%, #000 65%, #000 100%);
  transform: perspective(700px) rotateX(60deg);
  transform-origin: 50% 85%;
  animation: gridSlide 3s linear infinite;
}

@keyframes meshShift {
  0%   { filter: blur(80px) saturate(160%) hue-rotate(0deg); transform: rotate(0deg) scale(1.05); }
  50%  { filter: blur(80px) saturate(180%) hue-rotate(180deg); transform: rotate(2deg) scale(1.1); }
  100% { filter: blur(80px) saturate(160%) hue-rotate(360deg); transform: rotate(0deg) scale(1.05); }
}

@keyframes gridSlide {
  0%   { background-position: 0 0, 0 0, 0 60%, 0 60%; }
  100% { background-position: 0 0, 0 0, 0 calc(60% + 40px), 0 calc(60% + 40px); }
}

.starfield {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'><g fill='white'><circle cx='40' cy='60' r='1.2'/><circle cx='120' cy='180' r='0.8'/><circle cx='260' cy='100' r='1.5'/><circle cx='420' cy='260' r='1'/><circle cx='580' cy='80' r='1.3'/><circle cx='700' cy='200' r='0.9'/><circle cx='90' cy='360' r='1.1'/><circle cx='220' cy='440' r='0.7'/><circle cx='360' cy='540' r='1.4'/><circle cx='540' cy='420' r='1'/><circle cx='670' cy='580' r='1.2'/><circle cx='770' cy='400' r='0.9'/><circle cx='160' cy='680' r='1.1'/><circle cx='340' cy='760' r='0.7'/><circle cx='500' cy='700' r='1.3'/><circle cx='640' cy='740' r='1'/></g><g fill='%23ff4fa3'><path d='M60 220 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/><path d='M480 140 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/><path d='M300 320 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/><path d='M620 360 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/><path d='M180 560 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/><path d='M460 620 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/></g><g fill='%2300f0ff'><path d='M200 240 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/><path d='M380 80 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/><path d='M720 280 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/><path d='M80 480 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/><path d='M580 540 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z'/></g></svg>");
  background-repeat: repeat;
  animation: twinkle 4s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

.marquee {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #000080 0%, #ff00aa 50%, #6a00ff 100%);
  border-top: 3px ridge var(--chrome-1);
  border-bottom: 3px ridge var(--chrome-1);
  font-family: 'Bungee', 'Black Ops One', sans-serif;
  font-size: 22px;
  letter-spacing: 0.12em;
  padding: 10px 0;
  box-shadow: 0 0 30px rgba(255, 0, 170, 0.7), inset 0 0 30px rgba(0, 240, 255, 0.4);
  text-shadow: 2px 2px 0 #6a00ff, -2px -2px 0 #00f0ff, 0 0 12px #ff00aa;
  color: #fff;
  z-index: 5;
}
.marquee--top { position: sticky; top: 0; }
.marquee--bottom { margin-top: 60px; }

.marquee__track {
  display: inline-flex;
  white-space: nowrap;
  animation: ticker 30s linear infinite;
}
.marquee--bottom .marquee__track { animation-direction: reverse; animation-duration: 35s; }
.marquee__track span { padding: 0 26px; display: inline-block; }
.marquee__track .star { color: #9eff00; }

@keyframes ticker {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 30px 24px 60px;
  position: relative;
}

.hero {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 28px;
  align-items: center;
  margin: 30px 0 50px;
  position: relative;
}

.badge {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  position: relative;
  margin: 0 auto;
  background: conic-gradient(from 0deg, #ff00aa, #00f0ff, #9eff00, #ff4fa3, #6a00ff, #00f0ff, #ff00aa);
  box-shadow:
    0 0 0 6px #000,
    0 0 0 9px #c0c0c0,
    0 0 0 12px #000,
    0 0 60px rgba(255, 0, 170, 0.8),
    0 0 120px rgba(0, 240, 255, 0.4);
  animation: spin 18s linear infinite, hueShift 8s linear infinite;
  transform: rotate(-6deg);
}
.badge::before {
  content: '';
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff, #c0c0c0 40%, #6e6e88 100%);
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
}
.badge::after {
  content: '\\2605';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: #ff00aa;
  text-shadow: 0 0 12px #fff, 2px 2px 0 #00f0ff;
  animation: spin 18s linear infinite reverse;
}

@keyframes spin {
  from { transform: rotate(-6deg); }
  to { transform: rotate(354deg); }
}
@keyframes hueShift {
  0%, 100% { filter: hue-rotate(0deg) saturate(140%); }
  50% { filter: hue-rotate(60deg) saturate(170%); }
}

.hero__title-wrap { position: relative; }

.name {
  font-family: 'Bungee', 'Black Ops One', sans-serif;
  font-size: clamp(54px, 9vw, 120px);
  line-height: 0.92;
  margin: 0;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  background: linear-gradient(180deg, #ffffff 0%, #ffffff 30%, #ff4fa3 45%, #ff00aa 50%, #6a00ff 60%, #00f0ff 75%, #ffffff 95%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter:
    drop-shadow(3px 3px 0 #000)
    drop-shadow(0 0 18px rgba(255, 0, 170, 0.7))
    drop-shadow(0 0 30px rgba(0, 240, 255, 0.5));
  position: relative;
}
.name[data-text]::before,
.name[data-text]::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  background: inherit;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0;
  pointer-events: none;
  mix-blend-mode: screen;
}
.name:hover::before {
  opacity: 0.9;
  transform: translate(-6px, 2px);
  filter: drop-shadow(0 0 6px #ff00aa);
  animation: glitchA 0.6s steps(2) infinite;
}
.name:hover::after {
  opacity: 0.9;
  transform: translate(6px, -2px);
  filter: drop-shadow(0 0 6px #00f0ff);
  animation: glitchB 0.6s steps(2) infinite;
}
@keyframes glitchA {
  0%   { clip-path: inset(0 0 80% 0); }
  25%  { clip-path: inset(45% 0 35% 0); }
  50%  { clip-path: inset(70% 0 10% 0); }
  75%  { clip-path: inset(20% 0 60% 0); }
  100% { clip-path: inset(0 0 80% 0); }
}
@keyframes glitchB {
  0%   { clip-path: inset(80% 0 0 0); }
  25%  { clip-path: inset(10% 0 70% 0); }
  50%  { clip-path: inset(35% 0 45% 0); }
  75%  { clip-path: inset(60% 0 20% 0); }
  100% { clip-path: inset(80% 0 0 0); }
}

.label {
  font-family: 'Black Ops One', 'Bungee', sans-serif;
  color: #9eff00;
  font-size: clamp(22px, 2.6vw, 34px);
  margin: 14px 0 0;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  text-shadow: 2px 2px 0 #6a00ff, -1px -1px 0 #ff00aa, 0 0 12px rgba(158, 255, 0, 0.7);
}

.hero__meta {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  font-family: 'VT323', monospace;
  font-size: 18px;
  padding: 3px 12px;
  background: linear-gradient(180deg, #fff 0%, #c0c0c0 50%, #6e6e88 100%);
  border: 2px outset #fff;
  color: #1a002a;
  text-decoration: none;
  text-shadow: 1px 1px 0 #fff;
  box-shadow: 2px 2px 0 #000;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pill:hover {
  background: linear-gradient(180deg, #ff00aa 0%, #00f0ff 100%);
  color: #fff;
}

.panels {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 32px 26px;
  align-items: start;
}

.win {
  grid-column: span 12;
  background: var(--win-grey);
  border-top: 3px solid #fff;
  border-left: 3px solid #fff;
  border-right: 3px solid var(--win-grey-darker);
  border-bottom: 3px solid var(--win-grey-darker);
  box-shadow:
    inset -1px -1px 0 var(--win-grey-dark),
    inset 1px 1px 0 #dfdfdf,
    6px 6px 0 rgba(0, 0, 0, 0.6),
    10px 10px 0 rgba(255, 0, 170, 0.55),
    14px 14px 0 rgba(0, 240, 255, 0.45);
  padding: 6px;
  position: relative;
  opacity: 0;
  transform: translateY(40px) rotate(-1deg);
  animation: slideIn 0.9s cubic-bezier(.22,1.4,.36,1) forwards;
}
.win:nth-of-type(1)  { animation-delay: 0.1s; transform: translateY(40px) rotate(-1.4deg); }
.win:nth-of-type(2)  { animation-delay: 0.2s; transform: translateY(40px) rotate(0.8deg);  }
.win:nth-of-type(3)  { animation-delay: 0.3s; transform: translateY(40px) rotate(-0.6deg); }
.win:nth-of-type(4)  { animation-delay: 0.4s; transform: translateY(40px) rotate(1.1deg);  }
.win:nth-of-type(5)  { animation-delay: 0.5s; transform: translateY(40px) rotate(-1.2deg); }
.win:nth-of-type(6)  { animation-delay: 0.6s; transform: translateY(40px) rotate(0.7deg);  }
.win:nth-of-type(7)  { animation-delay: 0.7s; transform: translateY(40px) rotate(-0.9deg); }
.win:nth-of-type(8)  { animation-delay: 0.8s; transform: translateY(40px) rotate(1.3deg);  }

@keyframes slideIn {
  to { opacity: 1; transform: translateY(0) rotate(var(--rot, 0deg)); }
}
.win:nth-of-type(1)  { --rot: -1.4deg; }
.win:nth-of-type(2)  { --rot: 0.8deg;  }
.win:nth-of-type(3)  { --rot: -0.6deg; }
.win:nth-of-type(4)  { --rot: 1.1deg;  }
.win:nth-of-type(5)  { --rot: -1.2deg; }
.win:nth-of-type(6)  { --rot: 0.7deg;  }
.win:nth-of-type(7)  { --rot: -0.9deg; }
.win:nth-of-type(8)  { --rot: 1.3deg;  }

.win__bar {
  background: linear-gradient(90deg, #000080 0%, #6a00ff 50%, #ff00aa 100%);
  color: #fff;
  font-family: 'Bungee', 'Black Ops One', sans-serif;
  font-size: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-shadow: 1px 1px 0 #000;
  border: 1px solid #000;
}
.win__bar-title { display: flex; align-items: center; gap: 8px; }
.win__bar-title .glyph { color: #9eff00; }

.win__buttons { display: inline-flex; gap: 4px; }
.win__buttons span {
  width: 22px;
  height: 20px;
  background: var(--win-grey);
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-right: 2px solid var(--win-grey-darker);
  border-bottom: 2px solid var(--win-grey-darker);
  color: #000;
  font-family: 'VT323', monospace;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-shadow: none;
}

.win__body {
  background: #fff;
  background-image: repeating-linear-gradient(0deg, #ffffff 0, #ffffff 26px, #fdf2fa 26px, #fdf2fa 27px);
  border-top: 2px solid var(--win-grey-darker);
  border-left: 2px solid var(--win-grey-darker);
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  padding: 18px 22px;
  color: #1a002a;
  font-size: 18px;
  line-height: 1.45;
}
.win__body a {
  color: #ff00aa;
  text-decoration: none;
  border-bottom: 1px dashed #6a00ff;
  font-weight: bold;
}
.win__body a:hover {
  color: #6a00ff;
  background: linear-gradient(90deg, #9eff00, #00f0ff);
  border-bottom-color: transparent;
}

.win.span-12 { grid-column: span 12; }
.win.span-8  { grid-column: span 8; }
.win.span-7  { grid-column: span 7; }
.win.span-6  { grid-column: span 6; }
.win.span-5  { grid-column: span 5; }
.win.span-4  { grid-column: span 4; }
@media (max-width: 900px) {
  .win.span-8, .win.span-7, .win.span-6, .win.span-5, .win.span-4 { grid-column: span 12; }
  .hero { grid-template-columns: 1fr; }
  .badge { width: 200px; height: 200px; }
}

.summary-text {
  font-family: 'VT323', monospace;
  font-size: 22px;
  line-height: 1.4;
  color: #2a0050;
  margin: 0;
}
.summary-text::first-letter {
  font-family: 'Bungee', 'Black Ops One', sans-serif;
  font-size: 56px;
  float: left;
  line-height: 0.85;
  padding: 4px 10px 0 0;
  background: linear-gradient(180deg, #ff00aa, #6a00ff 60%, #00f0ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(2px 2px 0 #000);
}

.job {
  padding: 14px 0;
  border-bottom: 2px dashed #ff00aa;
}
.job:last-child { border-bottom: none; }
.job__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.job__role {
  font-family: 'Black Ops One', 'Bungee', sans-serif;
  font-size: 22px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #1a002a;
  margin: 0;
}
.job__role .at { color: #ff00aa; }
.job__role .company {
  background: linear-gradient(90deg, #ff00aa, #6a00ff, #00f0ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(1px 1px 0 #000);
}
.job__role .company-link {
  text-decoration: none;
  border-bottom: none;
}
.job__dates {
  font-family: 'VT323', monospace;
  font-size: 18px;
  color: #6a00ff;
  background: linear-gradient(180deg, #fff, #c0c0c0);
  border: 2px outset #fff;
  padding: 1px 10px;
  white-space: nowrap;
}
.job__summary {
  margin: 8px 0 8px;
  font-size: 19px;
  color: #2a0050;
}
.job__list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
}
.job__list li {
  position: relative;
  padding: 4px 0 4px 28px;
  font-size: 18px;
}
.job__list li::before {
  content: '\\2726';
  position: absolute;
  left: 0;
  top: 4px;
  color: #ff00aa;
  text-shadow: 1px 1px 0 #00f0ff;
  font-size: 18px;
}

.skill-group { margin-bottom: 14px; }
.skill-group:last-child { margin-bottom: 0; }
.skill-group__name {
  font-family: 'Black Ops One', sans-serif;
  text-transform: uppercase;
  font-size: 16px;
  letter-spacing: 0.1em;
  color: #fff;
  background: linear-gradient(90deg, #ff00aa, #6a00ff);
  padding: 3px 10px;
  display: inline-block;
  margin-bottom: 6px;
  border: 2px outset #fff;
  box-shadow: 2px 2px 0 #000;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  font-family: 'VT323', monospace;
  font-size: 17px;
  padding: 2px 10px;
  background: linear-gradient(180deg, #fff, #c0c0c0);
  border: 2px outset #fff;
  color: #1a002a;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
.chip:nth-child(3n)   { background: linear-gradient(180deg, #ffd6f0, #ff4fa3); color: #fff; text-shadow: 1px 1px 0 #6a00ff; }
.chip:nth-child(3n+1) { background: linear-gradient(180deg, #d6f9ff, #00f0ff); color: #1a002a; }
.chip:nth-child(3n+2) { background: linear-gradient(180deg, #ecffd6, #9eff00); color: #1a002a; }

.project {
  margin-bottom: 14px;
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(255,0,170,0.07), rgba(0,240,255,0.07));
  border: 2px dashed #6a00ff;
  position: relative;
}
.project:last-child { margin-bottom: 0; }
.project::before {
  content: '\\2727';
  position: absolute;
  left: -10px;
  top: -10px;
  background: #fff;
  color: #ff00aa;
  font-size: 20px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 2px solid #6a00ff;
  border-radius: 50%;
}
.project__name {
  font-family: 'Black Ops One', sans-serif;
  text-transform: uppercase;
  font-size: 18px;
  letter-spacing: 0.04em;
  margin: 0 0 4px;
}
.project__name a {
  color: #6a00ff;
  border-bottom: 2px solid #ff00aa;
  text-decoration: none;
}
.project__desc {
  margin: 0;
  font-size: 17px;
  color: #2a0050;
}

.interest { margin-bottom: 12px; }
.interest:last-child { margin-bottom: 0; }
.interest__name {
  font-family: 'Bungee', sans-serif;
  font-size: 18px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #00f0ff, #ff00aa);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(1px 1px 0 #000);
  margin: 0 0 4px;
}
.interest ul { list-style: none; margin: 0; padding: 0; }
.interest li {
  position: relative;
  padding: 3px 0 3px 24px;
  font-size: 17px;
}
.interest li::before {
  content: '\\2727';
  position: absolute;
  left: 0;
  top: 3px;
  color: #9eff00;
  text-shadow: 1px 1px 0 #6a00ff;
}

.edu { margin-bottom: 14px; }
.edu:last-child { margin-bottom: 0; }
.edu__institution {
  font-family: 'Black Ops One', sans-serif;
  text-transform: uppercase;
  font-size: 20px;
  margin: 0;
}
.edu__institution a {
  color: #6a00ff;
  border-bottom: 2px dashed #ff00aa;
  text-decoration: none;
}
.edu__line {
  font-family: 'VT323', monospace;
  font-size: 19px;
  margin: 4px 0;
}
.edu__score {
  display: inline-block;
  padding: 2px 10px;
  background: linear-gradient(90deg, #9eff00, #00f0ff);
  color: #1a002a;
  font-weight: bold;
  border: 2px outset #fff;
  box-shadow: 2px 2px 0 #000;
}

.lang-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dotted #ff00aa;
}
.lang-row:last-child { border: none; }
.lang-name {
  font-family: 'Black Ops One', sans-serif;
  text-transform: uppercase;
  font-size: 18px;
}
.lang-fluency {
  font-family: 'VT323', monospace;
  font-size: 17px;
  color: #fff;
  background: linear-gradient(90deg, #ff00aa, #6a00ff);
  padding: 1px 12px;
  border: 2px outset #fff;
}

.glyph { color: #9eff00; }

.footer {
  text-align: center;
  font-family: 'VT323', monospace;
  font-size: 18px;
  color: #fff;
  margin-top: 30px;
  text-shadow: 1px 1px 0 #6a00ff, 0 0 8px #ff00aa;
}
.visitor-counter {
  display: inline-block;
  background: #000;
  color: #9eff00;
  font-family: 'VT323', monospace;
  padding: 2px 10px;
  border: 3px inset #c0c0c0;
  margin: 0 6px;
  letter-spacing: 0.2em;
}

.blink { animation: blink 1s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0; } }

@media print {
  body::before, body::after, .starfield, .marquee { display: none; }
  .win { box-shadow: none; transform: none; opacity: 1; }
}
`;

const template: Template = {
  name: "y2k",
  description:
    "Y2K cyber-dream CV — VT323/Bungee, conic mesh background, scrolling grid horizon, Windows-98 panels, and animated star sparkles.",
  render(resume: Resume): string {
    const lang = resume.meta?.language ?? "en";
    const { basics } = resume;
    const title = `${basics.name ? `★ ${basics.name.toUpperCase()} ★` : "CV"}${basics.label ? ` ${basics.label.toUpperCase()} ★` : ""} Y2K CYBER-DREAM`;

    const topTicker = renderMarquee(buildMarqueeMessage(resume), "top");
    const bottomTicker = renderMarquee(
      buildFooterTickerMessage(resume),
      "bottom",
    );

    return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  ${basics.summary ? `<meta name="description" content="${escapeHtml(basics.summary)}">` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Black+Ops+One&family=Anton&family=VT323&family=DotGothic16&display=swap" rel="stylesheet">
  <style>${styles}</style>
</head>
<body>
  <div class="starfield" aria-hidden="true"></div>
  ${topTicker}
  <div class="page">
    ${renderHero(resume)}
    <div class="panels">
      ${renderSummary(basics)}
      ${resume.work?.length ? renderWork(resume.work) : ""}
      ${resume.skills?.length ? renderSkills(resume.skills) : ""}
      ${resume.projects?.length ? renderProjects(resume.projects) : ""}
      ${resume.interests?.length ? renderInterests(resume.interests) : ""}
      ${resume.education?.length ? renderEducation(resume.education) : ""}
      ${resume.languages?.length ? renderLanguages(resume.languages) : ""}
      ${resume.volunteer?.length ? renderVolunteer(resume.volunteer) : ""}
      ${resume.awards?.length ? renderAwards(resume.awards) : ""}
    </div>
    ${renderFooter(resume)}
  </div>
  ${bottomTicker}
</body>
</html>`;
  },
};

export default template;
