const {
  div,
  text,
  p,
  footer,
  section,
  style,
  h1,
} = require("@saltcorn/markup/tags");
const {
  navbar,
  navbarSolidOnScroll,
} = require("@saltcorn/markup/layout_utils");
const renderLayout = require("@saltcorn/markup/layout");
const Field = require("@saltcorn/data/models/field");
const Table = require("@saltcorn/data/models/table");
const Form = require("@saltcorn/data/models/form");
const View = require("@saltcorn/data/models/view");
const Workflow = require("@saltcorn/data/models/workflow");
const { renderForm, link } = require("@saltcorn/markup");
const { alert } = require("@saltcorn/markup/layout_utils");

const blockDispatch = (config) => ({
  pageHeader: ({ title, blurb }) =>
    div(
      h1({ class: "h3 mb-0 mt-2 text-gray-800" }, title),
      blurb && p({ class: "mb-0 text-gray-800" }, blurb)
    ),
  footer: ({ contents }) =>
    div(
      { class: "container" },
      footer(
        { id: "footer" },
        div({ class: "row" }, div({ class: "col-sm-12" }, contents))
      )
    ),
  hero: ({ caption, blurb, cta, backgroundImage }) =>
    section(
      {
        class:
          "jumbotron text-center m-0 bg-info d-flex flex-column justify-content-center",
      },
      div(
        { class: "container" },
        h1({ class: "jumbotron-heading" }, caption),
        p({ class: "lead" }, blurb),
        cta
      ),
      backgroundImage &&
        style(`.jumbotron {
      background-image: url("${backgroundImage}");
      background-size: cover;
      min-height: 75vh !important;
    }`)
    ),
  noBackgroundAtTop: () => true,
  wrapTop: (segment, ix, s) =>
    ["hero", "footer"].includes(segment.type)
      ? s
      : section(
          {
            class: [
              "page-section",
              `pt-${config.toppad || 0}`,
              ix === 0 && config.fixedTop && "mt-5",
              segment.class,
              segment.invertColor && "bg-primary",
            ],
            style: `${
              segment.bgType === "Color"
                ? `background-color: ${segment.bgColor};`
                : ""
            }
            ${
              segment.bgType === "Image" &&
              segment.bgFileId &&
              +segment.bgFileId
                ? `background-image: url('/files/serve/${segment.bgFileId}');
        background-size: ${segment.imageSize || "contain"};
        background-repeat: no-repeat;`
                : ""
            }`,
          },
          div(
            { class: ["container"] },
            div(
              { class: "row" },
              div(
                {
                  class: `col-sm-12 ${
                    segment.textStyle && segment.textStyle !== "h1"
                      ? segment.textStyle
                      : ""
                  }`,
                },
                segment.textStyle && segment.textStyle === "h1" ? h1(s) : s
              )
            )
          )
        ),
});

const renderBody = (title, body, alerts, config) =>
  renderLayout({
    blockDispatch: blockDispatch(config),
    layout:
      typeof body === "string" && config.in_card
        ? { type: "card", title, contents: body }
        : body,
    alerts,
  });

const wrapIt = (config, bodyAttr, headers, title, body) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!-- Font Awesome icons (free version)-->
    <script defer src="https://use.fontawesome.com/releases/v5.13.0/js/all.js" crossorigin="anonymous"></script>
    <link href="${get_css_url(
      config
    )}" rel="stylesheet" integrity="${get_css_integrity(
  config
)}" crossorigin="anonymous">
    <link href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous">
    ${headers
      .filter((h) => h.css)
      .map((h) => `<link href="${h.css}" rel="stylesheet">`)
      .join("")}
    ${headers
      .filter((h) => h.headerTag)
      .map((h) => h.headerTag)
      .join("")}
    <title>${text(title)}</title>
  </head>
  <body ${bodyAttr}>
    ${body}
    <script src="https://code.jquery.com/jquery-3.4.1.min.js" 
            integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" 
            crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>

    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.bundle.min.js"></script>
    ${headers
      .filter((h) => h.script)
      .map((h) => `<script src="${h.script}"></script>`)
      .join("")}
    ${config.colorscheme === "navbar-light" ? navbarSolidOnScroll : ""}
  </body>
</html>`;

const authBrand = (config, { name, logo }) =>
  logo
    ? `<img class="mb-4" src="${logo}" alt="Logo" width="72" height="72">`
    : "";

const layout = (config) => ({
  wrap: ({ title, menu, brand, alerts, currentUrl, body, headers }) =>
    wrapIt(
      config,
      'id="page-top"',
      headers,
      title,
      `
    <div id="wrapper">
      ${navbar(brand, menu, currentUrl, config)}
      ${renderBody(title, body, alerts, config)}
    </div>
    `
    ),
  authWrap: ({
    title,
    alerts, //TODO
    form,
    afterForm,
    headers,
    brand,
    csrfToken,
    authLinks,
  }) =>
    wrapIt(
      config,
      'class="text-center"',
      headers,
      title,
      `
  <div class="form-signin">
    ${alerts.map((a) => alert(a.type, a.msg)).join("")}
    ${authBrand(config, brand)}
    <h3>
      ${title}
    </h3>
    ${renderForm(formModify(form), csrfToken)}
    ${renderAuthLinks(authLinks)}
    ${afterForm}
    <style>
    html,
body {
  height: 100%;
}

body {
  display: -ms-flexbox;
  display: -webkit-box;
  display: flex;
  -ms-flex-align: center;
  -ms-flex-pack: center;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  padding-top: 40px;
  padding-bottom: 40px;
  background-color: #f5f5f5;
}

.form-signin {
  width: 100%;
  max-width: 330px;
  padding: 15px;
  margin: 0 auto;
}
.form-signin .checkbox {
  font-weight: 400;
}
.form-signin .form-control {
  position: relative;
  box-sizing: border-box;
  height: auto;
  padding: 10px;
  font-size: 16px;
}
.form-signin .form-control:focus {
  z-index: 2;
}
.form-signin input[type="email"] {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.form-signin input[type="password"] {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
    </style>
  </div>
  `
    ),
});
const renderAuthLinks = (authLinks) => {
  var links = [];
  if (authLinks.login)
    links.push(link(authLinks.login, "Already have an account? Login!"));
  if (authLinks.forgot) links.push(link(authLinks.forgot, "Forgot password?"));
  if (authLinks.signup)
    links.push(link(authLinks.signup, "Create an account!"));
  if (links.length === 0) return "";
  else return links.map((l) => div({ class: "text-center" }, l)).join("");
};

const formModify = (form) => {
  form.formStyle = "vert";
  form.submitButtonClass = "btn-primary btn-user btn-block";
  return form;
};

const themes = require("./themes.json");

const get_css_url = (config) => {
  const def = themes.flatly.css_url;
  if (!config || !config.theme) return def;
  if (config.theme === "Other") return config.css_url || def;
  if (themes[config.theme]) return themes[config.theme].css_url;
  else return def;
};

const get_css_integrity = (config) => {
  const def = themes.flatly.get_css_integrity;
  if (!config || !config.theme) return def;
  if (config.theme === "Other") return config.css_integrity || def;
  if (themes[config.theme]) return themes[config.theme].css_integrity;
  else return def;
};

const themeSelectOptions = Object.entries(themes).map(([k, v]) => ({
  label: `${k[0].toUpperCase()}${k.slice(1)} from ${v.source}`,
  name: k,
}));

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "stylesheet",
        form: async () => {
          return new Form({
            fields: [
              {
                name: "theme",
                label: "Theme",
                type: "String",
                class: "theme",
                required: true,
                default: "flatly",
                attributes: {
                  options: [
                    ...themeSelectOptions,
                    { name: "Other", label: "Other - specify URL" },
                  ],
                },
              },
              {
                name: "css_url",
                label: "CSS stylesheet URL",
                type: "String",
                showIf: { ".theme": "Other" },
              },
              {
                name: "css_integrity",
                label: "CSS stylesheet integrity",
                type: "String",
                showIf: { ".theme": "Other" },
              },
              {
                name: "in_card",
                label: "Default content in card?",
                type: "Bool",
                required: true,
              },
              {
                name: "colorscheme",
                label: "Navbar color scheme",
                type: "String",
                required: true,
                default: "navbar-light",
                attributes: {
                  options: [
                    { name: "navbar-dark bg-dark", label: "Dark" },
                    { name: "navbar-dark bg-primary", label: "Dark Primary" },
                    {
                      name: "navbar-dark bg-secondary",
                      label: "Dark Secondary",
                    },
                    { name: "navbar-light bg-light", label: "Light" },
                    { name: "navbar-light bg-white", label: "White" },
                    { name: "navbar-light", label: "Transparent Light" },
                  ],
                },
              },
              {
                name: "fixedTop",
                label: "Navbar Fixed Top",
                type: "Bool",
                required: true,
              },
              {
                name: "toppad",
                label: "Top padding",
                sublabel: "0-5 depending on Navbar height and configuration",
                type: "Integer",
                required: true,
                default: 2,
                attributes: {
                  max: 5,
                  min: 0,
                },
              },
            ],
          });
        },
      },
    ],
  });

module.exports = {
  sc_plugin_api_version: 1,
  layout,
  configuration_workflow,
};
