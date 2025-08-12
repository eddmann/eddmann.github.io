const fs = require('fs');
const Handlebars = require('handlebars');
const { marked } = require('marked');
const { minify } = require('html-minifier');

const renderer = {
  heading(text) {
    return text;
  },
  html(html) {
    return html;
  },
  hr() {
    return '';
  },
  list(body) {
    return body;
  },
  listitem(text) {
    return text;
  },
  br() {
    return '';
  },
  paragraph(text) {
    return text;
  },
};

marked.use({ renderer });

const minifyOptions = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  decodeEntities: true,
  minifyCSS: true,
  removeComments: true,
  removeRedundantAttributes: true,
  sortAttributes: true,
  sortClassName: true,
};

Handlebars.registerHelper('date', body => {
  if (!body) {
    return 'Present';
  }

  const date = new Date(body);
  const datetime = date.toISOString();
  const year = date.getUTCFullYear();

  return `<time datetime="${datetime}">${year}</time>`;
});

Handlebars.registerHelper('markdown', body => {
  return marked.parse(body);
});

Handlebars.registerHelper('link', body => {
  const parsed = new URL(body);
  const host = parsed.host.startsWith('www.')
    ? parsed.host.substring(4)
    : parsed.host;
  return `<a href="${body}">${host}</a>`;
});

function render(resume) {
  const css = fs.readFileSync(__dirname + '/style.css', 'utf-8');
  const template = fs.readFileSync(__dirname + '/cv.handlebars', 'utf-8');
  const { profiles } = resume.basics;

  if (Array.isArray(profiles)) {
    const xTwitter = profiles.find(profile => {
      const name = profile.network.toLowerCase();
      return name === 'x' || name === 'twitter';
    });

    if (xTwitter) {
      let { username, url } = xTwitter;

      if (!username && url) {
        const match = url.match(/https?:\/\/.+?\/(\w{1,15})/);

        if (match.length == 2) {
          username = match[1];
        }
      }

      if (username && !username.startsWith('@')) {
        username = `@${username}`;
      }

      resume.custom = {
        xTwitterHandle: username,
      };
    }
  }

  const html = Handlebars.compile(template)({
    css,
    resume,
  });

  return minify(html, minifyOptions);
}

module.exports = {
  render,
  pdfRenderOptions: {
    mediaType: 'print',
  },
};
