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
import { formatDate, formatYear } from "../lib/dates";

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

function splitName(name: string): { first: string; rest: string } {
  const trimmed = name.trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { first: trimmed, rest: "" };
  return { first: trimmed.slice(0, idx), rest: trimmed.slice(idx + 1) };
}

function locationLine(basics: Basics): string {
  const loc = basics.location;
  if (!loc) return "";
  const parts: string[] = [];
  if (loc.city) parts.push(loc.city);
  if (loc.region) parts.push(loc.region);
  if (loc.countryCode) parts.push(loc.countryCode);
  return parts.join(", ");
}

function networkAbbrev(network: string): string {
  const upper = network.toUpperCase();
  const map: Record<string, string> = {
    GITHUB: "GH",
    LINKEDIN: "LI",
    TWITTER: "X",
    X: "X",
    BLUESKY: "BSKY",
    PODCAST: "POD",
    MASTODON: "MAS",
    INSTAGRAM: "IG",
    FACEBOOK: "FB",
    YOUTUBE: "YT",
    WEBSITE: "WEB",
  };
  return map[upper] ?? upper.slice(0, 4);
}

function profileLabel(p: Profile): string {
  if (p.username) return `@${p.username}`;
  if (p.url) return displayUrl(p.url);
  return p.network;
}

function dateRange(start?: string, end?: string): string {
  if (!start) return "";
  const a = formatDate(start).toUpperCase();
  const b = end ? formatDate(end).toUpperCase() : "PRESENT";
  return `${a} — ${b}`;
}

function yearRange(start?: string, end?: string): string {
  if (!start) return "";
  const a = formatYear(start);
  const b = end ? formatYear(end) : "Present";
  return `${a} — ${b}`;
}

function renderContactCard(basics: Basics): string {
  const items: string[] = [];
  const loc = locationLine(basics);
  if (loc) {
    items.push(`<li><strong>LOC</strong>${escapeHtml(loc)}</li>`);
  }
  if (basics.email) {
    items.push(
      `<li><strong>MAIL</strong><a href="mailto:${escapeHtml(basics.email)}">${escapeHtml(basics.email)}</a></li>`,
    );
  }
  const url = basics.url ?? basics.website;
  if (url) {
    items.push(
      `<li><strong>WEB</strong><a href="${escapeHtml(url)}">${escapeHtml(hostFromUrl(url))}</a></li>`,
    );
  }
  if (basics.phone) {
    items.push(
      `<li><strong>TEL</strong><a href="tel:${escapeHtml(basics.phone)}">${escapeHtml(basics.phone)}</a></li>`,
    );
  }
  for (const p of basics.profiles ?? []) {
    if (!p.url && !p.username) continue;
    const tag = escapeHtml(networkAbbrev(p.network));
    const label = escapeHtml(profileLabel(p));
    const inner = p.url ? `<a href="${escapeHtml(p.url)}">${label}</a>` : label;
    items.push(`<li><strong>${tag}</strong>${inner}</li>`);
  }
  if (!items.length) return "";
  return `
    <aside class="contact-card">
      <h4>WRITE / CALL / SHOUT</h4>
      <ul>${items.join("")}</ul>
    </aside>
  `;
}

function renderSummaryBlock(basics: Basics): string {
  const summary = basics.summary
    ? `<div class="summary-text distress-lite">${basics.summary
        .split(/\n\s*\n|(?<=\.)\s+(?=[A-Z])/)
        .filter((s) => s.trim().length > 0)
        .map((p) => `<p>${renderInline(p.trim())}</p>`)
        .join("")}</div>`
    : "";
  const contact = renderContactCard(basics);
  if (!summary && !contact) return "";
  return `
    <div class="summary-block">
      ${summary}
      ${contact}
    </div>
  `;
}

function renderMasthead(basics: Basics, resume: Resume): string {
  const { first, rest } = splitName(basics.name);
  const label = basics.label ?? "";
  // Build the sub-label "WORD/WORD/WORD" out of the label words.
  const labelWords = label.split(/\s+/).filter(Boolean);
  const subLabel = labelWords.length
    ? labelWords
        .map(
          (w, i) =>
            `${escapeHtml(w)}${i < labelWords.length - 1 ? '<span class="alt">/</span>' : ""}`,
        )
        .join("")
    : "";

  // Filed-on date — derived from the most-recent work startDate, or fallback to "TODAY".
  const recent = resume.work?.[0];
  const filedLabel = recent?.startDate
    ? formatDate(recent.startDate).toUpperCase()
    : "";

  // Volume number — count of work entries (loose, decorative).
  const vol = resume.work?.length ?? 0;
  const volRoman = toRoman(vol);

  const cityRegion = [basics.location?.city, basics.location?.countryCode]
    .filter(Boolean)
    .join(" / ");

  // Years-of-experience-style stamp number: span from earliest work startDate to today.
  const earliest = (resume.work ?? [])
    .map((w) => w.startDate)
    .filter((d): d is string => !!d)
    .sort()[0];
  let yearsLabel = "";
  if (earliest) {
    const startYear = Number(formatYear(earliest));
    if (!Number.isNaN(startYear)) {
      const now = new Date().getFullYear();
      const diff = Math.max(1, now - startYear);
      yearsLabel = `${diff}+ YRS`;
    }
  }

  return `
    <header class="masthead">
      <span class="tape" style="top:-14px;left:60px;transform:rotate(-6deg)"></span>
      <span class="tape tape-black" style="top:-14px;right:80px;width:90px;transform:rotate(8deg)"></span>
      <span class="staple" style="top:6px;left:18px;transform:rotate(-12deg)"></span>
      <span class="staple" style="top:6px;right:30px;transform:rotate(8deg)"></span>

      <svg class="stamp distress-lite" style="top:20px;right:24px;transform:rotate(-14deg)" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <path id="ring" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="92" fill="none" stroke="#b8311b" stroke-width="4"/>
        <circle cx="100" cy="100" r="80" fill="none" stroke="#b8311b" stroke-width="2"/>
        <text font-family="Bebas Neue, Impact, sans-serif" font-size="20" fill="#b8311b" letter-spacing="4">
          <textPath href="#ring" startOffset="2%">★ FILED${filedLabel ? ` · ${escapeHtml(filedLabel)}` : ""} ★ APPROVED FOR DISTRIBUTION ★</textPath>
        </text>
        ${yearsLabel ? `<text x="100" y="95" text-anchor="middle" font-family="Archivo Black" font-size="28" fill="#b8311b" letter-spacing="2">${escapeHtml(yearsLabel)}</text>` : ""}
        <text x="100" y="120" text-anchor="middle" font-family="Permanent Marker, cursive" font-size="16" fill="#b8311b">in the trenches</text>
      </svg>

      <div class="zine-meta">
        <span class="issue">ZINE · ISSUE №001</span>
        <span>VOL.${volRoman ? ` ${escapeHtml(volRoman)} ` : " "}${cityRegion ? `— ${escapeHtml(cityRegion.toUpperCase())}` : ""}</span>
        <span class="price">PRICE: ONE STAPLE</span>
      </div>

      <h1 class="scream-name">
        <span class="w1">${escapeHtml(first.toUpperCase())}</span>${rest ? `<span class="w2">${escapeHtml(rest.toUpperCase())}</span>` : ""}
      </h1>

      ${
        subLabel
          ? `
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:6px">
        <span class="sub-label">${subLabel}</span>
        <span class="f-marker" style="font-size:26px;transform:rotate(-3deg);display:inline-block">— and other crimes against the call-stack.</span>
        <span class="redact f-anton" style="font-size:26px">REDACTED ON LEGAL ADVICE</span>
      </div>`
          : ""
      }

      ${renderSummaryBlock(basics)}
    </header>
  `;
}

function toRoman(n: number): string {
  if (!n || n < 1) return "";
  const map: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let v = n;
  for (const [num, sym] of map) {
    while (v >= num) {
      out += sym;
      v -= num;
    }
  }
  return out;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function sectionTitle(num: number, words: string[], scribble?: string): string {
  // Cycle through the four word styles a/b/c/d in a chaotic order to keep
  // the ransom-note feel across sections.
  const styles = ["a", "b", "c", "d"];
  const wordHtml = words
    .map((w, i) => {
      const cls = styles[i % styles.length];
      return `<span class="word ${cls}">${escapeHtml(w)}</span>`;
    })
    .join("");
  return `
    <div class="sec-title">
      <span class="num">${escapeHtml(pad2(num))}</span>
      ${wordHtml}
      ${scribble ? `<span class="scribble">${escapeHtml(scribble)}</span>` : ""}
    </div>
  `;
}

function workCardClasses(idx: number): {
  size: string;
  tilt: string;
  inked: boolean;
} {
  // Vary sizes and tilts deterministically so the masonry-zine feel is
  // preserved regardless of how many jobs the resume contains.
  const sizes = [
    "size-lg",
    "size-md",
    "size-md",
    "size-md",
    "size-md",
    "size-sm",
    "size-lg",
  ];
  const tilts = [
    "flipped",
    "flopped",
    "flipped",
    "flopped",
    "flipped",
    "flopped",
    "flipped",
  ];
  return {
    size: sizes[idx % sizes.length] ?? "size-md",
    tilt: tilts[idx % tilts.length] ?? "",
    inked: idx % 3 === 1,
  };
}

function companyClass(idx: number): string {
  const opts = ["alt", "", "alt", "", "marker", "", "alt"];
  return opts[idx % opts.length] ?? "";
}

function renderWorkItem(w: Work, idx: number): string {
  const { size, tilt, inked } = workCardClasses(idx);
  const company = w.name ?? w.company ?? "";
  const companyCls = companyClass(idx);
  const companyInner = w.url
    ? `<a href="${escapeHtml(w.url)}">${escapeHtml(company.toUpperCase())}</a>`
    : escapeHtml(company.toUpperCase());

  // First entry, if it has no endDate, gets the "CURRENT GIG" ribbon.
  const isCurrent = idx === 0 && !w.endDate;

  // Decorative tape on roughly every-other card.
  const tape =
    idx % 2 === 0
      ? `<span class="tape" style="top:-12px;${idx % 4 === 0 ? "left:40px;transform:rotate(-5deg)" : "right:30px;transform:rotate(5deg)"}"></span>`
      : "";
  const staple =
    idx % 2 === 1
      ? `<span class="staple" style="top:-3px;${idx % 3 === 0 ? "left:40%" : idx % 4 === 1 ? "left:18px" : "right:10px"}"></span>`
      : "";

  const bullets = w.highlights?.length
    ? `<ul class="bullets">${w.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}</ul>`
    : "";

  return `
    <article class="work-item ${size}">
      ${tape}
      ${staple}
      <div class="work-card ${tilt}${inked ? " inked" : ""}">
        <div class="work-head">
          <span class="role-tag">${escapeHtml((w.position ?? "").toUpperCase())}</span>
          ${company ? `<span class="company ${companyCls}">${companyInner}</span>` : ""}
          ${isCurrent ? `<span class="ribbon">CURRENT GIG</span>` : ""}
          ${w.startDate ? `<span class="dates">${escapeHtml(dateRange(w.startDate, w.endDate))}</span>` : ""}
        </div>
        ${w.summary ? `<p class="work-summary">${renderInline(w.summary)}</p>` : ""}
        ${bullets}
      </div>
    </article>
  `;
}

function renderWork(work: Work[], num: number): string {
  const items = work.map((w, i) => renderWorkItem(w, i)).join("");
  return `
    <section>
      ${sectionTitle(num, ["WORK", "/HIST", "ORY"], "— receipts kept, references on request.")}
      <div class="work-grid">${items}</div>
    </section>
  `;
}

function renderEducation(education: Education[], num: number): string {
  const cards = education
    .map((e, idx) => {
      const qual =
        e.studyType && e.area
          ? `${e.studyType} · awarded${e.score ? ` with ${e.score}` : ""}`
          : (e.studyType ?? e.area ?? "");
      const grade = e.score
        ? escapeHtml(e.score)
            .replace(/\bClass\b/i, "<br>Class")
            .replace(/\bHonours\b/i, "")
            .trim()
        : "";
      const years = yearRange(e.startDate, e.endDate);
      const institution = e.url
        ? `<a href="${escapeHtml(e.url)}">${escapeHtml(e.institution)}</a>`
        : escapeHtml(e.institution);
      return `
        <div class="edu-card">
          ${idx === 0 ? `<span class="staple" style="top:6px;left:14px;transform:rotate(-10deg)"></span><span class="staple" style="top:6px;right:14px;transform:rotate(11deg)"></span>` : ""}
          <div>
            <h3>${institution}</h3>
            ${e.area ? `<p class="area">${e.studyType ? `${escapeHtml(deriveStudyAbbrev(e.studyType))} · ` : ""}${escapeHtml(e.area)}</p>` : ""}
            ${qual ? `<p class="study">${escapeHtml(qual)}</p>` : ""}
          </div>
          ${
            grade || years
              ? `<div class="grade">
            ${grade || "—"}
            ${years ? `<span class="yrs">${escapeHtml(years)}</span>` : ""}
          </div>`
              : ""
          }
        </div>
      `;
    })
    .join("");
  return `
    <section>
      ${sectionTitle(num, ["SCHOOL", "days", "/REC"], "paid for in pints and PHP.")}
      ${cards}
    </section>
  `;
}

function deriveStudyAbbrev(studyType: string): string {
  const s = studyType.trim();
  if (/bachelor of science/i.test(s)) return "BSc";
  if (/master of science/i.test(s)) return "MSc";
  if (/bachelor of arts/i.test(s)) return "BA";
  if (/master of arts/i.test(s)) return "MA";
  if (/doctor of philosophy|^phd$/i.test(s)) return "PhD";
  if (/bachelor of engineering/i.test(s)) return "BEng";
  if (/master of engineering/i.test(s)) return "MEng";
  return s;
}

function renderSkills(skills: Skill[], num: number): string {
  const blocks = skills
    .map((s) => {
      const items = (s.keywords ?? [])
        .map((k) => `<li>${escapeHtml(k)}</li>`)
        .join("");
      return `
        <div class="skill-block">
          <h3>${escapeHtml(s.name)}</h3>
          ${items ? `<ul>${items}</ul>` : ""}
        </div>
      `;
    })
    .join("");
  return `
    <section>
      ${sectionTitle(num, ["THE", "TOOL", "BELT", "(partial.)"])}
      <div class="skills-grid">${blocks}</div>
    </section>
  `;
}

function renderProjects(projects: Project[], num: number): string {
  const cards = projects
    .map((p) => {
      const url = p.url
        ? `<a class="url" href="${escapeHtml(p.url)}">${escapeHtml(displayUrl(p.url))}</a>`
        : "";
      return `
        <article class="project">
          <h3>${escapeHtml(p.name)}</h3>
          ${url}
          ${p.description ? `<p>${renderInline(p.description)}</p>` : ""}
        </article>
      `;
    })
    .join("");
  return `
    <section>
      ${sectionTitle(num, ["SIDE", "QUESTS", "&", "experiments"])}
      <div class="projects-grid">${cards}</div>
    </section>
  `;
}

function renderVolunteer(volunteer: Volunteer[], num: number): string {
  const cards = volunteer
    .map((v, idx) => {
      const tilt = idx % 2 === 0 ? "flipped" : "flopped";
      const inked = idx % 3 === 1;
      const bullets = v.highlights?.length
        ? `<ul class="bullets">${v.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}</ul>`
        : "";
      return `
        <article class="work-item size-md">
          <div class="work-card ${tilt}${inked ? " inked" : ""}">
            <div class="work-head">
              <span class="role-tag">${escapeHtml((v.position ?? "VOLUNTEER").toUpperCase())}</span>
              ${v.organization ? `<span class="company alt">${escapeHtml(v.organization.toUpperCase())}</span>` : ""}
              ${v.startDate ? `<span class="dates">${escapeHtml(dateRange(v.startDate, v.endDate))}</span>` : ""}
            </div>
            ${v.summary ? `<p class="work-summary">${renderInline(v.summary)}</p>` : ""}
            ${bullets}
          </div>
        </article>
      `;
    })
    .join("");
  return `
    <section>
      ${sectionTitle(num, ["GIVING", "BACK", "/VOL"])}
      <div class="work-grid">${cards}</div>
    </section>
  `;
}

function renderAwards(awards: Award[], num: number): string {
  const cards = awards
    .map((a) => {
      const dates = a.date ? formatDate(a.date).toUpperCase() : "";
      return `
        <article class="project">
          <h3>${escapeHtml(a.title ?? "")}</h3>
          ${a.awarder ? `<a class="url">${escapeHtml(a.awarder)}${dates ? ` · ${escapeHtml(dates)}` : ""}</a>` : dates ? `<a class="url">${escapeHtml(dates)}</a>` : ""}
          ${a.summary ? `<p>${renderInline(a.summary)}</p>` : ""}
        </article>
      `;
    })
    .join("");
  return `
    <section>
      ${sectionTitle(num, ["GOLD", "STARS", "&", "honours"])}
      <div class="projects-grid">${cards}</div>
    </section>
  `;
}

function renderInterests(interests: Interest[], num: number): string {
  const cards = interests
    .map((i, idx) => {
      const items = (i.keywords ?? [])
        .map((k) => `<li>${renderInline(k)}</li>`)
        .join("");
      const tape =
        idx === 1
          ? `<span class="tape" style="top:-12px;right:30px;transform:rotate(6deg);width:80px"></span>`
          : "";
      const staple =
        idx === 0
          ? `<span class="staple" style="top:-3px;left:18px"></span>`
          : "";
      return `
        <article class="interest">
          ${staple}
          ${tape}
          <h3>${escapeHtml(i.name)}</h3>
          ${items ? `<ul>${items}</ul>` : ""}
        </article>
      `;
    })
    .join("");
  return `
    <section>
      ${sectionTitle(num, ["OFF", "DUTY", "/REC"], "when not staring at a terminal.")}
      <div class="interests-grid">${cards}</div>
    </section>
  `;
}

function renderColophon(
  languages: Language[] | undefined,
  basics: Basics,
  num: number,
): string {
  const hasLang = !!languages?.length;
  const langList = hasLang
    ? `<ul>${(languages ?? [])
        .map(
          (l) =>
            `<li><span>${escapeHtml(l.language)}</span>${l.fluency ? `<span class="fluency">${escapeHtml(l.fluency)}</span>` : ""}</li>`,
        )
        .join("")}</ul>`
    : "";

  const langCard = hasLang
    ? `
      <aside class="lang-card">
        <h3>SPEAK</h3>
        ${langList}
        <p class="f-elite" style="font-size:11px;letter-spacing:.06em;margin-top:8px;text-transform:uppercase;color:var(--bone)">— and broken French at petrol stations.</p>
      </aside>
    `
    : "";

  const contactLink = basics.email
    ? `<a href="mailto:${escapeHtml(basics.email)}">${escapeHtml(basics.email)}</a>`
    : "the post box";
  const cityLine = basics.location?.city
    ? `Built in ${escapeHtml(basics.location.city)}`
    : "Built by hand";

  const colophonClass = hasLang ? "colophon" : "colophon colophon-wide";

  return `
    <section>
      ${sectionTitle(num, ["LAST", "PAGE", "/colophon"])}
      <div class="footer-grid${hasLang ? "" : " footer-grid-solo"}">
        ${langCard}
        <aside class="${colophonClass}">
          <span class="tape" style="top:-12px;left:60px;transform:rotate(-3deg)"></span>
          <span class="tape tape-black" style="top:-12px;right:50px;transform:rotate(5deg);width:80px"></span>
          <h3>FINE <span class="crooked">PRINT</span> &amp; REFERENCES</h3>
          <p>This zine was assembled at the kitchen table from real data, real years, and far too much coffee. References, ratings, and the rest available <span class="f-marker orange">on request</span> — drop a line, leave a voicemail, send a pigeon.</p>
          <p style="margin-top:8px"><span class="invert f-bebas">CONTENT</span> All copy pulled from <span class="f-courier">cv.json</span>. <span class="invert f-bebas">LAYOUT</span> Hand-cut HTML + CSS, SVG turbulence, halftones, ransom-note fonts. <span class="invert f-bebas">PRINT</span> Optimised for a wheezy office photocopier.</p>
          <p class="refs">★ References: available on request — ${contactLink} ★ ${cityLine} ★</p>
        </aside>
      </div>
    </section>
  `;
}

const styles = `
:root{
  --bone:#ededea;
  --ink:#0a0a0a;
  --orange:#ff5410;
  --hivis:#fff200;
  --stamp:#b8311b;
  --paper-shadow: rgba(10,10,10,.08);
}

*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bone);color:var(--ink);}

body{
  font-family:'Courier Prime', 'DM Mono', monospace;
  font-size:13px;
  line-height:1.35;
  padding: 24px 18px 80px;
  overflow-x:hidden;
  background:
    radial-gradient(circle at 12% 20%, rgba(10,10,10,.05) 0 1px, transparent 2px),
    radial-gradient(circle at 78% 60%, rgba(10,10,10,.04) 0 1px, transparent 2px),
    radial-gradient(circle at 45% 85%, rgba(10,10,10,.05) 0 1px, transparent 2px),
    radial-gradient(circle at 90% 12%, rgba(10,10,10,.06) 0 1px, transparent 2px),
    repeating-linear-gradient(90deg, var(--bone) 0 4px, #e6e6e2 4px 5px),
    var(--bone);
}

a{color:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px}
a:hover{background:var(--hivis);color:var(--ink)}

.f-anton{font-family:'Anton', Impact, sans-serif;letter-spacing:.02em}
.f-bebas{font-family:'Bebas Neue', Impact, sans-serif;letter-spacing:.03em}
.f-oswald{font-family:'Oswald', sans-serif;}
.f-rozha{font-family:'Rozha One', serif;}
.f-marker{font-family:'Permanent Marker', cursive;}
.f-caveat{font-family:'Caveat', cursive;}
.f-elite{font-family:'Special Elite', serif;}
.f-archivo{font-family:'Archivo Black', sans-serif;}
.f-courier{font-family:'Courier Prime', monospace;}

.upper{text-transform:uppercase}
.shadow-hard{text-shadow: 3px 3px 0 var(--bone), 5px 5px 0 var(--ink);}

.invert{background:var(--ink);color:var(--bone);padding:0 .15em;display:inline-block}
.highlight{background:var(--hivis);color:var(--ink);padding:0 .2em}
.orange{color:var(--orange)}
.ink{color:var(--ink)}
.stamp-red{color:var(--stamp)}

.distress{filter:url(#xerox)}
.distress-lite{filter:url(#xerox-lite)}

.halftone{
  background-image: radial-gradient(circle, var(--ink) 1px, transparent 1.5px);
  background-size: 6px 6px;
}
.halftone-orange{
  background-color:var(--orange);
  background-image: radial-gradient(circle, rgba(10,10,10,.5) 1px, transparent 1.5px);
  background-size: 5px 5px;
}
.halftone-yellow{
  background-color:var(--hivis);
  background-image: radial-gradient(circle, rgba(10,10,10,.55) 1px, transparent 1.5px);
  background-size: 5px 5px;
}

.page{ max-width:1240px; margin:0 auto; position:relative; }

.panel{
  background:var(--bone);
  border:5px solid var(--ink);
  padding:18px 18px 22px;
  position:relative;
  box-shadow: 6px 6px 0 var(--ink);
}
.panel.thicc{border-width:8px}
.panel.inverse{background:var(--ink);color:var(--bone)}
.panel.inverse a{color:var(--hivis)}

.tape{
  position:absolute;
  width:120px;height:28px;
  background: rgba(255,242,0,.78);
  border-left:1px dashed rgba(10,10,10,.4);
  border-right:1px dashed rgba(10,10,10,.4);
  box-shadow: 0 2px 0 rgba(10,10,10,.15);
  z-index:5;
  mix-blend-mode:multiply;
}
.tape::before, .tape::after{
  content:"";position:absolute;top:0;bottom:0;width:6px;
  background:repeating-linear-gradient(90deg,transparent 0 2px, rgba(10,10,10,.25) 2px 3px);
}
.tape::before{left:0}.tape::after{right:0}
.tape-black{ background: rgba(10,10,10,.92); }

.staple{
  position:absolute;width:24px;height:6px;background:#666;border:1px solid #222;
  box-shadow: 1px 2px 0 rgba(10,10,10,.4);
  z-index:6;
}
.staple::before,.staple::after{
  content:"";position:absolute;top:0;width:4px;height:6px;background:#888;border:1px solid #222;
}
.staple::before{left:-1px}.staple::after{right:-1px}

.redact{
  display:inline-block;
  background:var(--ink);
  color:transparent;
  user-select:none;
  padding: 0 .2em;
  text-shadow:none;
}
.redact::selection{background:var(--ink);color:var(--ink)}

/* MASTHEAD */
.masthead{
  position:relative;
  border:8px solid var(--ink);
  background:var(--bone);
  padding:14px 22px 24px;
  margin-bottom:22px;
  box-shadow: 10px 10px 0 var(--ink);
  overflow:hidden;
}
.masthead::before{
  content:"";
  position:absolute;
  right:-10px;top:-10px;
  width:240px;height:240px;
  background-image: radial-gradient(circle, var(--ink) 1.4px, transparent 1.8px);
  background-size: 8px 8px;
  opacity:.18;
  transform:rotate(15deg);
}

.zine-meta{
  display:flex;justify-content:space-between;align-items:flex-end;
  font-family:'Special Elite', monospace;
  font-size:11px;
  letter-spacing:.1em;
  text-transform:uppercase;
  border-bottom:3px solid var(--ink);
  padding-bottom:6px;
  margin-bottom:8px;
  gap:8px;
  flex-wrap:wrap;
}
.zine-meta .price{ background:var(--ink);color:var(--bone);padding:2px 8px;font-weight:700; }
.zine-meta .issue{font-family:'Archivo Black';font-size:14px}

.scream-name{
  font-size: clamp(64px, 12vw, 172px);
  line-height:.82;
  font-weight:900;
  letter-spacing:-.02em;
  margin:8px 0 0;
}
.scream-name .w1{font-family:'Anton';transform:rotate(-2deg);display:inline-block}
.scream-name .w2{font-family:'Rozha One';color:var(--orange);transform:rotate(3deg) translateY(6px);display:inline-block;margin-left:.05em}

.sub-label{
  font-family:'Bebas Neue';
  font-size: clamp(28px, 4vw, 56px);
  letter-spacing:.04em;
  margin-top:8px;
  background:var(--ink);color:var(--bone);
  display:inline-block;padding:4px 14px 6px;
  transform:rotate(-1deg);
}
.sub-label .alt{font-family:'Permanent Marker';color:var(--hivis);font-size:.85em;padding:0 .15em}

.summary-block{
  display:grid;
  grid-template-columns: 2fr 1fr;
  gap:18px;
  margin-top:20px;
}
.summary-text{
  font-family:'Courier Prime', monospace;
  font-size:13.5px;
  line-height:1.45;
  column-count:2;
  column-gap:18px;
  column-rule:1px dashed var(--ink);
  text-align:left;
}
.summary-text p{break-inside:avoid;margin-bottom:8px}
.summary-text p:first-of-type::first-letter{
  font-family:'Rozha One';
  font-size:2.4em;
  float:left;
  line-height:.9;
  padding:4px 6px 0 0;
  background:var(--ink);color:var(--bone);
  margin-right:6px;
}

.contact-card{
  border:4px solid var(--ink);
  padding:10px 12px;
  background:var(--hivis);
  background-image: radial-gradient(circle, rgba(10,10,10,.5) 1px, transparent 1.5px);
  background-size: 5px 5px;
  transform:rotate(2deg);
  position:relative;
  box-shadow: 4px 4px 0 var(--ink);
}
.contact-card h4{
  font-family:'Archivo Black';
  font-size:14px;
  text-transform:uppercase;
  background:var(--ink);color:var(--hivis);
  padding:2px 6px;
  display:inline-block;
  margin-bottom:8px;
  transform:rotate(-2deg);
}
.contact-card ul{list-style:none}
.contact-card li{
  font-family:'Courier Prime';
  font-size:12.5px;
  padding:2px 0;
  border-bottom:1px dashed rgba(10,10,10,.5);
  word-break:break-all;
}
.contact-card li:last-child{border-bottom:0}
.contact-card li strong{font-family:'Bebas Neue';letter-spacing:.06em;margin-right:6px}

.stamp{ position:absolute; width:150px;height:150px; pointer-events:none; z-index:9; }

/* SECTION TITLES */
.sec-title{
  display:flex;flex-wrap:wrap;align-items:flex-end;
  line-height:.82;
  margin: 36px 0 14px;
  position:relative;
  gap:0;
}
.sec-title .num{
  font-family:'Archivo Black';
  font-size:54px;
  background:var(--ink);color:var(--bone);
  padding:2px 10px;
  transform:rotate(-3deg);
  margin-right:10px;
  margin-bottom:6px;
}
.sec-title .word{
  font-size: clamp(56px, 9vw, 128px);
  display:inline-block;
  padding:0 .08em;
}
.sec-title .word.a{font-family:'Anton';transform:rotate(-1deg)}
.sec-title .word.b{font-family:'Rozha One';color:var(--orange);transform:rotate(2deg) translateY(-6px)}
.sec-title .word.c{font-family:'Bebas Neue';background:var(--ink);color:var(--bone);transform:skewX(-8deg);padding:0 .15em}
.sec-title .word.d{font-family:'Permanent Marker';color:var(--stamp);transform:rotate(-4deg);font-size:.7em}
.sec-title .scribble{
  font-family:'Caveat';
  font-size:34px;
  font-weight:700;
  margin-left:14px;
  margin-bottom:14px;
  transform:rotate(-2deg);
  color:var(--ink);
}

/* WORK */
.work-grid{
  display:grid;
  grid-template-columns: repeat(12, 1fr);
  gap:18px;
  margin-bottom:24px;
}
.work-item{ grid-column: span 12; position:relative; }
.work-item.size-lg{grid-column: span 8}
.work-item.size-md{grid-column: span 6}
.work-item.size-sm{grid-column: span 4}

.work-card{
  border:5px solid var(--ink);
  background:var(--bone);
  padding:14px 16px 18px;
  position:relative;
  box-shadow:5px 5px 0 var(--ink);
  transition: transform .15s ease;
}
.work-card:hover{transform: translate(-2px,-2px) rotate(-.4deg)}
.work-card.flipped{transform:rotate(-1.4deg)}
.work-card.flipped:hover{transform:rotate(-2deg) translate(-2px,-2px)}
.work-card.flopped{transform:rotate(1.2deg)}
.work-card.flopped:hover{transform:rotate(1.6deg) translate(-2px,-2px)}

.work-card.inked{background:var(--ink);color:var(--bone)}
.work-card.inked a{color:var(--hivis)}
.work-card.inked .role-tag{background:var(--hivis);color:var(--ink)}
.work-card.inked .dates{color:var(--hivis)}

.work-head{
  display:flex;flex-wrap:wrap;align-items:flex-end;gap:6px;
  border-bottom:3px solid currentColor;
  padding-bottom:6px;margin-bottom:8px;
}
.role-tag{
  font-family:'Bebas Neue';
  background:var(--ink);color:var(--bone);
  padding:2px 8px;
  font-size:20px;
  letter-spacing:.04em;
  transform:rotate(-1deg);
  display:inline-block;
}
.company{
  font-family:'Anton';
  font-size: clamp(26px, 3vw, 44px);
  line-height:.9;
  text-transform:uppercase;
}
.company a{ text-decoration:none; }
.company.alt{font-family:'Rozha One';color:var(--orange)}
.company.marker{font-family:'Permanent Marker';font-size: clamp(22px, 2.5vw, 34px)}
.dates{
  font-family:'Special Elite';
  font-size:12px;
  letter-spacing:.08em;
  margin-left:auto;
  text-transform:uppercase;
  white-space:nowrap;
}
.work-summary{
  font-family:'Courier Prime';
  font-size:13px;
  line-height:1.45;
  margin-bottom:8px;
}
.bullets{
  list-style:none;
  padding-left:0;
  font-family:'Courier Prime';
  font-size:12.5px;
  line-height:1.4;
}
.bullets li{ position:relative; padding-left:22px; margin-bottom:6px; }
.bullets li::before{
  content:"\\25BA";
  position:absolute;left:0;top:1px;
  font-family:'Archivo Black';
  color:var(--orange);
}
.work-card.inked .bullets li::before{color:var(--hivis)}

.ribbon{
  display:inline-block;
  background:var(--stamp);color:var(--bone);
  font-family:'Bebas Neue';
  letter-spacing:.08em;
  padding:2px 8px;
  transform:rotate(-2deg);
  font-size:14px;
  margin-left:6px;
}

/* SKILLS */
.skills-grid{
  display:grid;
  grid-template-columns: repeat(12, 1fr);
  gap:14px;
  margin-bottom:24px;
}
.skill-block{
  grid-column: span 4;
  border:4px solid var(--ink);
  padding:10px 12px 12px;
  background:var(--bone);
  position:relative;
  box-shadow:4px 4px 0 var(--ink);
}
.skill-block:nth-child(3n+1){transform:rotate(-1deg)}
.skill-block:nth-child(3n+2){transform:rotate(.8deg)}
.skill-block:nth-child(3n){transform:rotate(-.5deg)}
.skill-block:nth-child(5n){background:var(--ink);color:var(--bone)}
.skill-block:nth-child(7n){background:var(--hivis);background-image:radial-gradient(circle, rgba(10,10,10,.4) 1px, transparent 1.5px);background-size:6px 6px}

.skill-block h3{
  font-family:'Anton';
  font-size:26px;
  text-transform:uppercase;
  line-height:.95;
  margin-bottom:6px;
  letter-spacing:.02em;
}
.skill-block:nth-child(2n) h3{font-family:'Rozha One'}
.skill-block:nth-child(3n) h3{font-family:'Bebas Neue';font-size:30px}
.skill-block ul{list-style:none;display:flex;flex-wrap:wrap;gap:5px}
.skill-block li{
  font-family:'Courier Prime';
  font-size:11.5px;
  background:var(--ink);color:var(--bone);
  padding:2px 6px;
  border:1px solid var(--ink);
  white-space:nowrap;
}
.skill-block:nth-child(5n) li{background:var(--bone);color:var(--ink);border-color:var(--bone)}
.skill-block:nth-child(7n) li{background:var(--ink);color:var(--hivis)}
.skill-block:nth-child(3n+1) li:nth-child(3n){background:var(--orange);color:var(--ink)}

/* PROJECTS */
.projects-grid{
  display:grid;
  grid-template-columns: repeat(12, 1fr);
  gap:16px;
  margin-bottom:24px;
}
.project{
  grid-column: span 6;
  border:5px solid var(--ink);
  padding:14px 14px 16px;
  background:var(--bone);
  position:relative;
  box-shadow:5px 5px 0 var(--ink);
}
.project:nth-child(3n){grid-column: span 4;transform:rotate(-1deg)}
.project:nth-child(4n){grid-column: span 8;transform:rotate(.5deg)}
.project:nth-child(5n){grid-column: span 6}
.project:nth-child(7n){background:var(--ink);color:var(--bone)}
.project:nth-child(7n) a{color:var(--hivis)}

.project h3{
  font-family:'Archivo Black';
  font-size:26px;
  text-transform:uppercase;
  line-height:.95;
  margin-bottom:4px;
}
.project:nth-child(2n) h3{font-family:'Rozha One';color:var(--orange)}
.project:nth-child(3n) h3{font-family:'Permanent Marker';font-size:24px}
.project:nth-child(5n) h3{font-family:'Anton';font-size:30px}
.project .url{
  font-family:'Special Elite';
  font-size:11px;
  letter-spacing:.04em;
  word-break:break-all;
  border-bottom:1px dashed currentColor;
  padding-bottom:4px;margin-bottom:8px;
  display:block;
}
.project p{font-family:'Courier Prime';font-size:12.5px;line-height:1.4}

/* EDUCATION */
.edu-card{
  border:6px solid var(--ink);
  padding:14px 18px;
  background:var(--hivis);
  background-image:radial-gradient(circle, rgba(10,10,10,.45) 1px, transparent 1.5px);
  background-size:6px 6px;
  position:relative;
  box-shadow:6px 6px 0 var(--ink);
  transform:rotate(-1deg);
  margin-bottom:24px;
  display:grid;
  grid-template-columns: 1fr auto;
  gap:14px;
  align-items:center;
}
.edu-card h3{
  font-family:'Anton';
  font-size:42px;
  line-height:.95;
  text-transform:uppercase;
}
.edu-card h3 a{ text-decoration:none; }
.edu-card .area{ font-family:'Rozha One'; font-size:22px; color:var(--stamp); }
.edu-card .study{ font-family:'Courier Prime'; font-size:13px; }
.edu-card .grade{
  font-family:'Permanent Marker';
  font-size:34px;
  line-height:.95;
  background:var(--ink);
  color:var(--hivis);
  padding:8px 14px;
  transform:rotate(3deg);
  text-align:center;
  border:3px solid var(--ink);
  box-shadow:4px 4px 0 var(--stamp);
}
.edu-card .grade .yrs{display:block;font-family:'Special Elite';font-size:11px;color:var(--bone);letter-spacing:.08em;margin-top:4px}

/* INTERESTS */
.interests-grid{
  display:grid;
  grid-template-columns: repeat(12,1fr);
  gap:16px;
  margin-bottom:24px;
}
.interest{
  grid-column: span 4;
  border:5px solid var(--ink);
  background:var(--bone);
  padding:12px 14px 16px;
  position:relative;
  box-shadow:5px 5px 0 var(--ink);
}
.interest:nth-child(2){transform:rotate(1.5deg)}
.interest:nth-child(3){transform:rotate(-1.5deg)}
.interest h3{
  font-family:'Rozha One';
  font-size:34px;
  text-transform:uppercase;
  line-height:.95;
  border-bottom:3px solid var(--ink);
  padding-bottom:4px;margin-bottom:8px;
}
.interest:nth-child(2) h3{font-family:'Anton';color:var(--orange)}
.interest:nth-child(3) h3{font-family:'Permanent Marker';color:var(--stamp)}
.interest ul{list-style:none}
.interest li{
  font-family:'Courier Prime';
  font-size:12.5px;
  line-height:1.4;
  padding:6px 0 6px 18px;
  border-bottom:1px dashed rgba(10,10,10,.5);
  position:relative;
}
.interest li:last-child{border-bottom:0}
.interest li::before{
  content:"\\2736";
  position:absolute;left:0;top:5px;
  color:var(--orange);
  font-size:14px;
}

/* FOOTER */
.footer-grid{
  display:grid;
  grid-template-columns: repeat(12,1fr);
  gap:18px;
  margin-bottom:24px;
}
.lang-card{
  grid-column: span 4;
  border:5px solid var(--ink);
  background:var(--ink);
  color:var(--bone);
  padding:14px 16px;
  box-shadow:5px 5px 0 var(--stamp);
  transform:rotate(-1deg);
}
.lang-card h3{font-family:'Bebas Neue';font-size:38px;color:var(--hivis);letter-spacing:.04em;line-height:1}
.lang-card ul{list-style:none;margin-top:6px}
.lang-card li{font-family:'Courier Prime';font-size:13px;padding:4px 0;border-bottom:1px dashed rgba(237,237,234,.4);display:flex;justify-content:space-between}
.lang-card li:last-child{border-bottom:0}
.lang-card li .fluency{font-family:'Permanent Marker';color:var(--hivis)}

.colophon{
  grid-column: span 8;
  border:5px solid var(--ink);
  background:var(--bone);
  padding:14px 16px;
  box-shadow:5px 5px 0 var(--ink);
  position:relative;
}
.colophon-wide{ grid-column: span 12; }
.footer-grid-solo{ grid-template-columns: 1fr; }
.colophon h3{font-family:'Archivo Black';font-size:30px;text-transform:uppercase;margin-bottom:8px;line-height:.95}
.colophon h3 .crooked{display:inline-block;transform:rotate(-3deg);background:var(--orange);padding:0 6px}
.colophon p{font-family:'Courier Prime';font-size:12px;line-height:1.5}
.colophon .refs{font-family:'Special Elite';font-size:11px;letter-spacing:.06em;margin-top:8px;text-transform:uppercase;border-top:2px solid var(--ink);padding-top:6px}

.tearstrip{
  margin-top:30px;
  border-top:3px dashed var(--ink);
  padding-top:10px;
  text-align:center;
  font-family:'Special Elite';
  font-size:11px;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:var(--ink);
}

@keyframes shudder{
  0%{transform:translate(0,0)}
  20%{transform:translate(-1px,1px) rotate(-.3deg)}
  40%{transform:translate(2px,-1px) rotate(.4deg)}
  60%{transform:translate(-1px,-2px) rotate(-.2deg)}
  80%{transform:translate(1px,1px) rotate(.3deg)}
  100%{transform:translate(0,0)}
}
.sec-title:hover .word,
.scream-name:hover .w1,
.scream-name:hover .w2{animation:shudder .4s linear}

.panel:hover,.work-card:hover,.project:hover{box-shadow: 8px 8px 0 var(--ink), -2px -2px 0 var(--orange)}

@media (max-width: 900px){
  .work-item.size-lg,.work-item.size-md,.work-item.size-sm,
  .project,.project:nth-child(3n),.project:nth-child(4n),.project:nth-child(5n),
  .skill-block,.interest,.lang-card,.colophon{grid-column: span 12}
  .summary-block{grid-template-columns:1fr}
  .summary-text{column-count:1}
}

@media print{
  body{background:#fff;padding:0;font-size:11px}
  .panel,.work-card,.skill-block,.project,.interest,.lang-card,.colophon,.edu-card,.masthead,.contact-card{box-shadow:none !important}
  .tape,.staple{filter:grayscale(1)}
  .orange,.stamp-red,.scream-name .w2,.company.alt{color:#000 !important}
  .halftone,.halftone-orange,.halftone-yellow,.edu-card,.contact-card{background:#ddd !important;color:#000 !important}
  .skill-block:nth-child(7n){background:#eee !important;color:#000 !important}
  .skill-block:nth-child(5n){background:#000 !important;color:#fff !important}
  .work-card.inked,.project:nth-child(7n),.lang-card{background:#000 !important;color:#fff !important}
  a{text-decoration:underline}
  .work-card,.skill-block,.project,.interest{break-inside:avoid;page-break-inside:avoid}
}
`;

const svgDefs = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="xerox" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" />
      <feDisplacementMap in="SourceGraphic" scale="1.4"/>
    </filter>
    <filter id="xerox-lite" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" seed="9" />
      <feDisplacementMap in="SourceGraphic" scale="0.6"/>
    </filter>
    <pattern id="halftone-pat" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.4" fill="#0a0a0a"/>
    </pattern>
  </defs>
</svg>
`;

const template: Template = {
  name: "zine",
  description:
    "DIY photocopied punk-zine CV — ransom-note typography, halftones, marker scrawl, and hi-vis tape.",
  render(resume: Resume): string {
    const lang = resume.meta?.language ?? "en";
    const { basics } = resume;

    // Number sections in order so the "01/02/03..." stamps stay sequential
    // even when optional sections are absent.
    let n = 0;
    const nextNum = () => ++n;

    const workSection = resume.work?.length
      ? renderWork(resume.work, nextNum())
      : "";
    const eduSection = resume.education?.length
      ? renderEducation(resume.education, nextNum())
      : "";
    const skillsSection = resume.skills?.length
      ? renderSkills(resume.skills, nextNum())
      : "";
    const projectsSection = resume.projects?.length
      ? renderProjects(resume.projects, nextNum())
      : "";
    const volunteerSection = resume.volunteer?.length
      ? renderVolunteer(resume.volunteer, nextNum())
      : "";
    const awardsSection = resume.awards?.length
      ? renderAwards(resume.awards, nextNum())
      : "";
    const interestsSection = resume.interests?.length
      ? renderInterests(resume.interests, nextNum())
      : "";
    const colophonSection = renderColophon(resume.languages, basics, nextNum());

    return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(basics.name)} - ZINE</title>
  ${basics.summary ? `<meta name="description" content="${escapeHtml(basics.summary)}">` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Oswald:wght@400;600;700&family=Rozha+One&family=Permanent+Marker&family=Caveat:wght@400;700&family=Special+Elite&family=Courier+Prime:wght@400;700&family=Archivo+Black&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <base target="_blank">
  <style>${styles}</style>
</head>
<body>
  ${svgDefs}
  <div class="page">
    ${renderMasthead(basics, resume)}
    ${workSection}
    ${eduSection}
    ${skillsSection}
    ${projectsSection}
    ${volunteerSection}
    ${awardsSection}
    ${interestsSection}
    ${colophonSection}
    <div class="tearstrip">
      ✂︎ — — — — — — — — — — — — TEAR HERE AND PASS IT ON — — — — — — — — — — — — ✂︎
    </div>
  </div>
</body>
</html>`;
  },
};

export default template;
