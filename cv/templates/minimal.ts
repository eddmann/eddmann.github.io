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

function year(date: string | undefined): string {
  if (!date) return "Present";
  const parsed = new Date(date);
  return `${parsed.getUTCFullYear()}`;
}

function timeTag(date: string | undefined): string {
  if (!date) return `<span>Present</span>`;
  const parsed = new Date(date);
  return `<time datetime="${parsed.toISOString()}">${parsed.getUTCFullYear()}</time>`;
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

function section(opts: { id: string; title: string; body: string }): string {
  return `
    <section id="${opts.id}" class="border-b border-neutral-200 pb-8 mb-8 print:border-0 print:pb-3 print:mb-4">
      <h2 class="text-2xl font-semibold mb-4 print:text-lg print:mb-2">${escapeHtml(opts.title)}</h2>
      ${opts.body}
    </section>
  `;
}

function renderHeader(basics: Basics): string {
  const avatar = basics.image
    ? `
      <div class="shrink-0">
        <img
          src="${escapeHtml(basics.image)}"
          alt="Avatar of ${escapeHtml(basics.name)}"
          width="160"
          height="160"
          class="size-32 rounded-full border border-neutral-200 object-cover print:size-20"
        />
      </div>
    `
    : "";

  return `
    <header class="border-b border-neutral-200 pb-8 mb-8 print:pb-3 print:mb-4 print:border-0">
      <div class="flex items-center justify-between gap-6 max-sm:flex-col max-sm:text-center">
        <div>
          <h1 class="text-4xl font-semibold tracking-tight print:text-2xl">${escapeHtml(basics.name)}</h1>
          ${
            basics.label
              ? `<p class="mt-1 text-lg text-neutral-500 print:text-base">${escapeHtml(basics.label)}</p>`
              : ""
          }
        </div>
        ${avatar}
      </div>
    </header>
  `;
}

function renderContact(basics: Basics): string {
  const rows: string[] = [];
  const url = basics.url ?? basics.website;
  if (url) {
    rows.push(`
      <div>
        <p class="text-sm text-neutral-500">Website</p>
        <a href="${escapeHtml(url)}" class="underline decoration-emerald-200 underline-offset-2">${escapeHtml(hostFromUrl(url))}</a>
      </div>
    `);
  }
  if (basics.email) {
    rows.push(`
      <div>
        <p class="text-sm text-neutral-500">Email</p>
        <a href="mailto:${escapeHtml(basics.email)}" class="underline decoration-emerald-200 underline-offset-2">${escapeHtml(basics.email)}</a>
      </div>
    `);
  }
  if (basics.phone) {
    rows.push(`
      <div>
        <p class="text-sm text-neutral-500">Phone</p>
        <a href="tel:${escapeHtml(basics.phone)}" class="underline decoration-emerald-200 underline-offset-2">${escapeHtml(basics.phone)}</a>
      </div>
    `);
  }
  if (!rows.length) return "";
  return `
    <div class="grid grid-cols-2 gap-x-8 gap-y-4 max-sm:grid-cols-1 mb-6">
      ${rows.join("")}
    </div>
  `;
}

function renderAbout(summary: string): string {
  return `
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-2 print:text-lg">About</h2>
      <p class="leading-relaxed">${renderInline(summary)}</p>
    </div>
  `;
}

function renderProfiles(profiles: Profile[]): string {
  const items = profiles
    .map((profile) => {
      const label = profile.username ?? profile.url ?? "";
      const link = profile.url
        ? `<a href="${escapeHtml(profile.url)}" data-print-url="${escapeHtml(displayUrl(profile.url))}" class="underline decoration-emerald-200 underline-offset-2">${escapeHtml(label)}</a>`
        : escapeHtml(label);
      return `
        <div>
          <p class="text-sm text-neutral-500">${escapeHtml(profile.network)}</p>
          <div>${link}</div>
        </div>
      `;
    })
    .join("");
  return `
    <div id="profiles" class="grid grid-cols-2 gap-x-8 gap-y-4 max-sm:grid-cols-1 border-b border-neutral-200 pb-8 mb-8 print:border-0 print:pb-3 print:mb-4">
      ${items}
    </div>
  `;
}

function renderWorkItem(w: Work): string {
  const company = w.name ?? w.company ?? "";
  const highlights = w.highlights?.length
    ? `<ul class="mt-3 list-disc pl-5 space-y-1 print:mt-2 print:space-y-0">
        ${w.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}
      </ul>`
    : "";
  const summary = w.summary
    ? `<p class="leading-relaxed">${renderInline(w.summary)}</p>`
    : "";
  return `
    <article class="break-inside-avoid mb-8 print:mb-4">
      ${company ? `<h3 class="text-xl font-semibold print:text-base">${escapeHtml(company)}</h3>` : ""}
      <div class="mt-1 mb-3 print:mb-1">
        ${w.position ? `<div class="font-semibold">${escapeHtml(w.position)}</div>` : ""}
        ${w.startDate ? `<div class="text-sm text-neutral-500">${timeTag(w.startDate)} &ndash; ${timeTag(w.endDate)}</div>` : ""}
      </div>
      ${summary}
      ${highlights}
    </article>
  `;
}

function renderWork(work: Work[]): string {
  return section({
    id: "work",
    title: "Work Experience",
    body: work.map(renderWorkItem).join(""),
  });
}

function renderVolunteer(volunteer: Volunteer[]): string {
  const body = volunteer
    .map((v) => {
      const highlights = v.highlights?.length
        ? `<ul class="mt-3 list-disc pl-5 space-y-1 print:mt-2 print:space-y-0">
            ${v.highlights.map((h) => `<li>${renderInline(h)}</li>`).join("")}
          </ul>`
        : "";
      return `
        <article class="break-inside-avoid mb-8 print:mb-4">
          ${v.organization ? `<h3 class="text-xl font-semibold print:text-base">${escapeHtml(v.organization)}</h3>` : ""}
          <div class="mt-1 mb-3 print:mb-1">
            ${v.position ? `<div class="font-semibold">${escapeHtml(v.position)}</div>` : ""}
            ${v.startDate ? `<div class="text-sm text-neutral-500">${timeTag(v.startDate)} &ndash; ${timeTag(v.endDate)}</div>` : ""}
          </div>
          ${v.summary ? `<p class="leading-relaxed">${renderInline(v.summary)}</p>` : ""}
          ${highlights}
        </article>
      `;
    })
    .join("");
  return section({ id: "volunteer", title: "Volunteer", body });
}

function renderEducation(education: Education[]): string {
  const body = education
    .map((e) => {
      const qual =
        e.studyType && e.area
          ? `${e.studyType} in ${e.area}`
          : (e.studyType ?? e.area ?? "");
      return `
        <article class="break-inside-avoid mb-6 print:mb-3">
          ${qual ? `<div class="text-lg font-semibold print:text-base">${escapeHtml(qual)}</div>` : ""}
          <div class="font-medium">${escapeHtml(e.institution)}</div>
          ${e.startDate ? `<div class="text-sm text-neutral-500">${timeTag(e.startDate)} &ndash; ${timeTag(e.endDate)}</div>` : ""}
          ${e.score ? `<div class="mt-1 text-sm">${escapeHtml(e.score)}</div>` : ""}
          ${
            e.courses?.length
              ? `<ul class="mt-2 list-disc pl-5">${e.courses.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>`
              : ""
          }
        </article>
      `;
    })
    .join("");
  return section({ id: "education", title: "Education", body });
}

function renderAwards(awards: Award[]): string {
  const body = awards
    .map(
      (a) => `
        <article class="break-inside-avoid mb-6 print:mb-3">
          ${a.title ? `<div class="text-lg font-semibold print:text-base">${escapeHtml(a.title)}</div>` : ""}
          <div class="text-sm text-neutral-500">
            ${a.awarder ? `<span>${escapeHtml(a.awarder)}</span>` : ""}
            ${a.date ? `<span> &middot; ${escapeHtml(year(a.date))}</span>` : ""}
          </div>
          ${a.summary ? `<p class="mt-2 leading-relaxed">${renderInline(a.summary)}</p>` : ""}
        </article>
      `,
    )
    .join("");
  return section({ id: "awards", title: "Awards", body });
}

function renderSkills(skills: Skill[]): string {
  const body = skills
    .map(
      (s) => `
        <div class="break-inside-avoid mb-4 print:mb-2">
          <div class="font-semibold mb-1">${escapeHtml(s.name)}</div>
          ${
            s.keywords?.length
              ? `<ul class="flex flex-wrap gap-2 list-none p-0 m-0">
                  ${s.keywords.map((k) => `<li class="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-sm print:bg-transparent print:border-0 print:px-1 print:py-0">${escapeHtml(k)}</li>`).join("")}
                </ul>`
              : ""
          }
        </div>
      `,
    )
    .join("");
  return section({ id: "skills", title: "Skills", body });
}

function renderProjects(projects: Project[]): string {
  const body = projects
    .map((p) => {
      const heading = p.url
        ? `<a href="${escapeHtml(p.url)}" data-print-url="${escapeHtml(displayUrl(p.url))}" class="underline decoration-emerald-200 underline-offset-2">${escapeHtml(p.name)}</a>`
        : escapeHtml(p.name);
      return `
        <article class="break-inside-avoid mb-6 print:mb-3">
          <div class="text-lg font-semibold print:text-base">${heading}</div>
          ${p.description ? `<p class="mt-1 leading-relaxed">${renderInline(p.description)}</p>` : ""}
        </article>
      `;
    })
    .join("");
  return section({ id: "projects", title: "Projects", body });
}

function renderInterests(interests: Interest[]): string {
  const body = interests
    .map(
      (i) => `
        <div class="break-inside-avoid mb-4 print:mb-2">
          <div class="font-semibold mb-1">${escapeHtml(i.name)}</div>
          ${
            i.keywords?.length
              ? `<ul class="list-disc pl-5 space-y-1 print:space-y-0">
                  ${i.keywords.map((k) => `<li>${renderInline(k)}</li>`).join("")}
                </ul>`
              : ""
          }
        </div>
      `,
    )
    .join("");
  return section({ id: "interests", title: "Interests", body });
}

function renderLanguages(languages: Language[]): string {
  const body = `
    <ul class="space-y-1">
      ${languages
        .map(
          (l) =>
            `<li><span class="font-medium">${escapeHtml(l.language)}</span>${l.fluency ? ` <span class="text-neutral-500">&middot; ${escapeHtml(l.fluency)}</span>` : ""}</li>`,
        )
        .join("")}
    </ul>
  `;
  return section({ id: "languages", title: "Languages", body });
}

const printStyles = `
@media print {
  @page { size: A4; margin: 12mm 10mm; }
  html { font-size: 10pt; }
  a { color: inherit; text-decoration: none; }
  a[data-print-url]::after {
    content: " (" attr(data-print-url) ")";
    font-size: 0.8em;
    color: #737373;
    word-break: break-all;
  }
}
`;

const template: Template = {
  name: "minimal",
  description: "Clean single-page CV using Tailwind CDN.",
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
  ${basics.label ? `<meta property="og:title" content="${escapeHtml(basics.label)}">` : ""}
  ${basics.summary ? `<meta property="og:description" content="${escapeHtml(basics.summary)}">` : ""}
  ${basics.image ? `<meta property="og:image" content="${escapeHtml(basics.image)}">` : ""}
  ${basics.image ? `<link rel="icon" href="${escapeHtml(basics.image)}">` : ""}
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <base target="_blank">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style type="text/tailwindcss">${printStyles}</style>
</head>
<body class="font-sans text-neutral-900 antialiased">
  <span id="tw-probe" class="p-1" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"></span>
  <main class="mx-auto max-w-3xl px-6 py-12 print:py-0 print:px-0">
    ${renderHeader(basics)}
    ${renderContact(basics)}
    ${basics.summary ? renderAbout(basics.summary) : ""}
    ${basics.profiles?.length ? renderProfiles(basics.profiles) : ""}
    ${resume.work?.length ? renderWork(resume.work) : ""}
    ${resume.volunteer?.length ? renderVolunteer(resume.volunteer) : ""}
    ${resume.education?.length ? renderEducation(resume.education) : ""}
    ${resume.awards?.length ? renderAwards(resume.awards) : ""}
    ${resume.skills?.length ? renderSkills(resume.skills) : ""}
    ${resume.projects?.length ? renderProjects(resume.projects) : ""}
    ${resume.interests?.length ? renderInterests(resume.interests) : ""}
    ${resume.languages?.length ? renderLanguages(resume.languages) : ""}
  </main>
</body>
</html>`;
  },
};

export default template;
