const {
  div,
  text,
  p,
  footer,
  section,
  a,
  style,
  h1,
  ul,
  img,
  li,
  form,
  input,
  nav,
  button,
  i,
  hr,
} = require("@saltcorn/markup/tags");
const {
  navbar,
  navbarSolidOnScroll,
  mobileBottomNavBar,
} = require("@saltcorn/markup/layout_utils");
const renderLayout = require("@saltcorn/markup/layout");
const db = require("@saltcorn/data/db");
const Field = require("@saltcorn/data/models/field");
const Table = require("@saltcorn/data/models/table");
const Form = require("@saltcorn/data/models/form");
const View = require("@saltcorn/data/models/view");
const File = require("@saltcorn/data/models/file");
const Workflow = require("@saltcorn/data/models/workflow");
const { renderForm, link } = require("@saltcorn/markup");
const {
  alert,
  headersInHead,
  headersInBody,
} = require("@saltcorn/markup/layout_utils");
const { features } = require("@saltcorn/data/db/state");
const isNode = typeof window === "undefined";

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
              ix === 0 && `pt-${config.toppad || 0}`,
              ix === 0 && config.fixedTop && isNode && "mt-5",
              ix === 0 && config.fixedTop && !isNode && "mt-6",
              segment.class,
              segment.invertColor && "bg-primary",
            ],
            style: `${
              segment.bgType === "Color"
                ? `background-color: ${segment.bgColor};`
                : ""
            }`,
          },
          div(
            { class: [config.fluid ? "container-fluid" : "container"] },
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

const renderBody = (title, body, alerts, config, role, req) =>
  renderLayout({
    blockDispatch: blockDispatch(config),
    role,
    req,
    layout:
      typeof body === "string" && config.in_card
        ? { type: "card", title, contents: body }
        : body,
    alerts,
  });
const includeBS4css = (config) => {
  if (!config || !config.theme) return false;
  if (config.theme === "Other") return false;
  if (config.theme === "File") return false;
  if (themes[config.theme]) return !!themes[config.theme].includeBS4css;
};
const includeBS5css = (config) => {
  if (!config || !config.theme) return false;
  if (config.theme === "Other") return false;
  if (config.theme === "File") return config.include_std_bs5;
  if (themes[config.theme]) return !!themes[config.theme].includeBS5css;
};
/**
 * omit '/' in a mobile deployment (needed for ios)
 * copy from sbadmin2, otherwise we would need to depend on a saltcorn version
 */
const safeSlash = () => (isNode ? "/" : "");

const wrapIt = (config, bodyAttr, headers, title, body) => {
  const integrity = get_css_integrity(config);
  return `<!doctype html>
<html lang="en">
  <head>
    ${!isNode ? `<base href="http://localhost">` : ""}
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    ${
      includeBS4css(config)
        ? `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css" integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossorigin="anonymous">`
        : ""
    }
    ${
      includeBS5css(config)
        ? `<link rel="stylesheet" href="${base_public_serve}/bootstrap.min.css">`
        : ""
    }
    <link href="${get_css_url(config)}" rel="stylesheet"${
    integrity ? ` integrity="${integrity}" crossorigin="anonymous"` : ""
  }>${themes[config.theme]?.in_header || ""}
    ${headersInHead(headers)}    
    <title>${text(title)}</title>
  </head>
  <body ${bodyAttr}${
    config.backgroundColor
      ? ` style="background-color: ${config.backgroundColor}"`
      : ""
  }>
    ${body}
    <link rel="stylesheet" href="${base_public_serve}/sidebar-3.css" />
    ${
      features && features.deep_public_plugin_serve
        ? `<link rel="stylesheet" href="${base_public_serve}/fontawesome/fontawesome.min.css" />`
        : '<script defer src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/js/all.min.js" integrity="sha512-F5QTlBqZlvuBEs9LQPqc1iZv2UMxcVXezbHzomzS6Df4MZMClge/8+gXrKw2fl5ysdk4rWjR0vKS7NNkfymaBQ==" crossorigin="anonymous"></script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/fontawesome.min.css" integrity="sha512-kJ30H6g4NGhWopgdseRb8wTsyllFUYIx3hiUwmGAkgA9B/JbzUBDQVr2VVlWGde6sdBVOG7oU8AL35ORDuMm8g==" crossorigin="anonymous" />'
    }
    <script src="${safeSlash()}static_assets/${
    db.connectObj.version_tag
  }/jquery-3.6.0.min.js"></script>
    ${
      features && features.bootstrap5
        ? `<script src="${base_public_serve}/bootstrap.bundle.min.js"></script>`
        : `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js" integrity="sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV" crossorigin="anonymous"></script>`
    }    ${headersInBody(headers)}
    ${config.colorscheme === "navbar-light" ? navbarSolidOnScroll : ""}
  </body>
</html>`;
};

const active = (currentUrl, item, originalUrl) =>
  (item.link &&
    (currentUrl.startsWith(item.link) ||
      (originalUrl && originalUrl.startsWith(item.link)))) ||
  (item.altlinks &&
    item.altlinks.some(
      (l) =>
        currentUrl.startsWith(l) || (originalUrl && originalUrl.startsWith(l))
    )) ||
  (item.subitems &&
    item.subitems.some(
      (si) =>
        si.link &&
        (currentUrl.startsWith(si.link) ||
          (originalUrl && originalUrl.startsWith(si.link)) ||
          (si.altlinks && si.altlinks.some((l) => currentUrl.startsWith(l))))
    ));

const verticalMenu = ({ menu, currentUrl, originalUrl, brand }) => {
  const brandLogo = a(
    { class: "navbar-brand mt-1 ms-3 mb-2", href: "/" },
    brand.logo &&
      img({
        src: brand.logo,
        width: "30",
        height: "30",
        class: "me-2 d-inline-block align-top",
        alt: "Logo",
        loading: "lazy",
      }),
    brand.name
  );
  let items = [];
  menu.forEach((m, ix) => {
    if (m.items && m.items.length > 0) {
      m.items.forEach((item, ix1) => {
        if (item.location === "Mobile Bottom") return;
        if (item.subitems) {
          items.push(
            li(
              {
                class: [
                  "nav-item",
                  active(currentUrl, item, originalUrl) && "active",
                ],
              },
              a(
                {
                  href: `#menuCollapse${ix}_${ix1}`,
                  "aria-expanded": false,
                  class: "dropdown-toggle nav-link",
                  ...(features && features.bootstrap5
                    ? { "data-bs-toggle": "collapse" }
                    : { "data-toggle": "collapse" }),
                },
                item.icon ? i({ class: `fa-fw me-1 ${item.icon}` }) : "",
                item.label
              ),
              ul(
                {
                  class: [
                    active(currentUrl, item, originalUrl)
                      ? "collapse.show"
                      : "collapse",
                    "list-unstyled",
                  ],
                  id: `menuCollapse${ix}_${ix1}`,
                },
                item.subitems.map((subitem) =>
                  subitem.type === "Separator"
                    ? hr({ class: "mx-4 my-0" })
                    : li(
                        {
                          class: [
                            "nav-item",
                            active(currentUrl, subitem, originalUrl) &&
                              "active",
                          ],
                        },
                        a(
                          { class: "nav-link sublink", href: subitem.link },
                          subitem.icon
                            ? i({ class: `fa-fw me-1 ${subitem.icon}` })
                            : "",
                          subitem.label
                        )
                      )
                )
              )
            )
          );
        } else if (item.link)
          items.push(
            li(
              {
                class: [
                  "nav-item",
                  active(currentUrl, item, originalUrl) && "active",
                ],
              },
              a(
                { class: "nav-link", href: item.link },
                item.icon ? i({ class: `fa-fw me-1 ${item.icon}` }) : "",
                item.label
              )
            )
          );
        else if (item.type === "Separator")
          items.push(hr({ class: "mx-4 my-0" }));
        else if (item.type === "Search")
          items.push(
            li(
              form(
                {
                  action: "/search",
                  class: "menusearch",
                  method: "get",
                },
                div(
                  { class: "input-group search-bar" },

                  input({
                    type: "search",
                    class: "form-control search-bar ps-2 hasbl",
                    placeholder: item.label,
                    id: "inputq",
                    name: "q",
                    "aria-label": "Search",
                    "aria-describedby": "button-search-submit",
                  }),

                  button(
                    {
                      class: "btn btn-outline-secondary search-bar",
                      type: "submit",
                    },
                    i({ class: "fas fa-search" })
                  )
                )
              )
            )
          );
      });
    }
  });
  const toggler =
    hr({ class: "mx-4 my-0" }) +
    div(
      { class: "text-center" },
      button({
        class: "rounded-circle border-0",
        id: "sidebarToggle",
        "data-sidebar-toggler": true,
        onclick: "$('#sidebar').toggleClass('narrowed')",
      })
    );
  return (
    brandLogo +
    ul({ class: "navbar-nav list-unstyled components" }, items) +
    toggler
  );
};

const authBrand = (config, { name, logo }) =>
  logo
    ? `<img class="mb-4" src="${logo}" alt="Logo" width="72" height="72">`
    : "";
const menuWrap = ({
  brand,
  menu,
  config,
  currentUrl,
  originalUrl,
  body,
  req,
}) => {
  const colschm = (config.colorscheme || "").split(" ");
  const navbarCol = colschm[0];
  const bg = colschm[1];
  const txt = (colschm[0] || "").includes("dark") ? "text-light" : "";

  const mobileNav = mobileBottomNavBar
    ? mobileBottomNavBar(currentUrl, menu, bg, txt)
    : "";
  const role = !req ? 1 : req.isAuthenticated() ? req.user.role_id : 10;
  if ((config.menu_style === "No Menu" && role > 1) || (!menu && !brand))
    return div({ id: "wrapper" }, div({ id: "page-inner-content" }, body));
  else if (config.menu_style === "Side Navbar" && isNode) {
    return (
      navbar(brand, menu, currentUrl, { class: "d-md-none", ...config }) +
      div(
        { id: "wrapper", class: "d-flex with-sidebar" },

        nav(
          {
            class: [
              "d-none d-md-flex flex-column align-center d-print-none",
              navbarCol,
              bg,
              txt,
            ],
            id: "sidebar",
          },

          verticalMenu({ brand, menu, currentUrl, originalUrl })
        ),
        div(
          { id: "content-wrapper", class: "d-flex flex-column" },
          div({ id: "content" }, div({ id: "page-inner-content" }, body))
        )
      ) +
      mobileNav
    );
  } else
    return (
      div(
        { id: "wrapper" },
        navbar(brand, menu, currentUrl, config),
        div({ id: "page-inner-content" }, body)
      ) + mobileNav
    );
};
const layout = (config) => ({
  renderBody: ({ title, body, alerts, role, req }) =>
    renderBody(title, body, alerts, config, role, req),
  wrap: ({
    title,
    menu,
    brand,
    alerts,
    currentUrl,
    originalUrl,
    body,
    headers,
    role,
    req,
    bodyClass,
  }) =>
    wrapIt(
      config,
      `id="page-top" class="${bodyClass || ""}"`,
      headers,
      title,
      menuWrap({
        brand,
        menu,
        config,
        currentUrl,
        originalUrl,
        body: renderBody(title, body, alerts, config, role, req),
        req,
      })
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
    bodyClass,
  }) =>
    wrapIt(
      config,
      `class="text-center ${bodyClass || ""}"`,
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
  min-height: 100%;
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
  const meth_links = (authLinks.methods || [])
    .map(({ url, icon, label }) =>
      a(
        { href: url, class: "btn btn-secondary btn-user btn-block" },
        icon || "",
        `&nbsp;Login with ${label}`
      )
    )
    .join("");

  return (
    meth_links + links.map((l) => div({ class: "text-center" }, l)).join("")
  );
};

const formModify = (form) => {
  form.formStyle = "vert";
  form.submitButtonClass = "btn-primary btn-user btn-block";
  return form;
};

const themes = require("./themes.json");

const base_public_serve = `${safeSlash()}plugins/public/any-bootstrap-theme${
  features?.version_plugin_serve_path
    ? "@" + require("./package.json").version
    : ""
}`;

const get_css_url = (config) => {
  const def = `${safeSlash()}plugins/public/any-bootstrap-theme/bootswatch/flatly/bootstrap.min.css`;
  if (!config || !config.theme) return def;
  if (config.theme === "File") return `/files/serve/${config.css_file}`;
  if (config.theme === "Other") return config.css_url || def;
  if (
    features &&
    features.bootstrap5 &&
    themes[config.theme] &&
    themes[config.theme].source === "Bootswatch"
  )
    return `${base_public_serve}/bootswatch/${config.theme}/bootstrap.min.css`;
  if (themes[config.theme]?.local_css_file)
    return `${base_public_serve}/${themes[config.theme]?.local_css_file}`;
  if (themes[config.theme]) return themes[config.theme].css_url;
  else return def;
};

const get_css_integrity = (config) => {
  const def = themes.flatly.get_css_integrity;
  if (!config || !config.theme) return def;
  if (config.theme === "File") return null;
  if (themes[config.theme]?.local_css_file) return null;
  if (config.theme === "Other") return config.css_integrity || def;
  if (
    features &&
    features.bootstrap5 &&
    themes[config.theme] &&
    themes[config.theme].source === "Bootswatch"
  )
    return null;
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
          const cssfiles = await File.find({
            mime_super: "text",
            mime_sub: "css",
          });
          return new Form({
            saveAndContinueOption: true,
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
                    { name: "File", label: "Uploaded file" },
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
                name: "css_file",
                label: "CSS stylesheet file",
                type: "String",
                showIf: { ".theme": "File" },
                attributes: {
                  options: cssfiles.map((fl) => ({
                    label: fl.filename,
                    name: fl.path_to_serve,
                  })),
                },
              },
              {
                name: "include_std_bs5",
                label: "Needs standard BS5 CSS",
                type: "Bool",
                showIf: { ".theme": "File" },
              },
              {
                name: "in_card",
                label: "Default content in card?",
                type: "Bool",
                required: true,
              },
              {
                name: "menu_style",
                label: "Menu style",
                type: "String",
                required: true,
                //fieldview: "radio_group",
                attributes: {
                  inline: true,
                  options: ["Top Navbar", "Side Navbar", "No Menu"],
                },
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
              {
                name: "backgroundColor",
                label: "Background Color",
                type: "Color",
                default: "#ffffff",
              },
              {
                name: "fluid",
                label: "Fluid full-width container",
                type: "Bool",
              },
            ],
          });
        },
      },
    ],
  });

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "any-bootstrap-theme",
  layout,
  fonts: (config) => themes[config.theme]?.fonts || {},
  configuration_workflow,
};
