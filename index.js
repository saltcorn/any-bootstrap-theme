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
const Plugin = require("@saltcorn/data/models/plugin");
const User = require("@saltcorn/data/models/user");
const { renderForm, link } = require("@saltcorn/markup");
const {
  alert,
  headersInHead,
  headersInBody,
} = require("@saltcorn/markup/layout_utils");
const { features } = require("@saltcorn/data/db/state");
const {
  buildTheme,
  extractColorDefaults,
  buildNeeded,
  deleteOldFiles,
} = require("./build_theme_utils");
const { sleep } = require("@saltcorn/data/utils");
const { getState } = require("@saltcorn/data/db/state");

const { join } = require("path");
const { pathExists } = require("fs-extra");

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
    ["hero", "footer"].includes(segment.type) || segment.noWrapTop
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
            segment.textStyle && segment.textStyle === "h1" ? h1(s) : s
          )
        ),
});

const buildHints = (config = {}) => {
  if (config.mode === "dark")
    return {
      cardTitleClass: "m-0 fw-bold d-inline",
    };
  else
    return {
      cardTitleClass: "m-0 fw-bold d-inline",
    };
};

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
    hints: buildHints(config),
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
const buildBgColor = (config = {}) => {
  return bs5BootswatchThemes.indexOf(config?.theme || "flatly") >= 0
    ? config.mode === "light" && config.backgroundColor
      ? ` style="background-color: ${config.backgroundColor}"`
      : config.backgroundColorDark
      ? ` style="background-color: ${config.backgroundColorDark}"`
      : ""
    : config.backgroundColor
    ? ` style="background-color: ${config.backgroundColor}"`
    : "";
};
/**
 * omit '/' in a mobile deployment (needed for ios)
 * copy from sbadmin2, otherwise we would need to depend on a saltcorn version
 */
const safeSlash = () => (isNode ? "/" : "");

const wrapIt = (config, bodyAttr, headers, title, body) => {
  const integrity = get_css_integrity(config);
  return `<!doctype html>
<html lang="en" data-bs-theme="${config.mode || "light"}">
  <head>
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
  }>
  <link rel="stylesheet" href="${base_public_serve}/sidebar-3.css" />
  ${custom_css_link(config)}
  ${themes[config.theme]?.in_header || ""}
    ${headersInHead(headers)}    
    <title>${text(title)}</title>
  </head>
  <body ${bodyAttr}${buildBgColor(config)}>
    ${body}
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
  const vertNavSubItemsIterator = (subitem) =>
    subitem.type === "Separator"
      ? hr({ class: "mx-4 my-0" })
      : subitem?.subitems
      ? li(
          {
            class: ["nav-item"],
          },
          div(
            { class: "dropdown-item btn-group dropend" },
            a(
              {
                type: "button",
                class: "nav-link sublink dropdown-item dropdown-toggle",
                "data-bs-toggle": "dropdown",
                "aria-expanded": "false",
              },
              subitem.label
            ),
            ul(
              { class: "dropdown-menu" },
              subitem?.subitems.map((si1) => li(vertNavSubItemsIterator(si1)))
            )
          )
        )
      : li(
          {
            class: [
              "nav-item",
              active(currentUrl, subitem, originalUrl) && "active",
            ],
          },
          a(
            { class: "nav-link sublink", href: subitem.link },
            subitem.icon ? i({ class: `fa-fw me-1 ${subitem.icon}` }) : "",
            subitem.label
          )
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
                item.subitems.map(vertNavSubItemsIterator)
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
        onclick: "$('#wrapper').toggleClass('narrowed')",
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
  hints: buildHints(config),
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
    requestFluidLayout,
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
        body: renderBody(
          title,
          body,
          alerts,
          requestFluidLayout ? { ...config, fluid: true } : config,
          role,
          req
        ),
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

const custom_css_link = (config) => {
  if (
    features &&
    features.bootstrap5 &&
    themes[config.theme] &&
    themes[config.theme].source === "Bootswatch" &&
    config.sass_file_name &&
    config.sass_file_name.indexOf(
      config.theme === "bootstrap" ? "lux" : config.theme
    ) > 0
  )
    return `<link href="${base_public_serve}/bootswatch/${
      config.theme === "bootstrap" ? "lux" : config.theme
    }/${
      config.mode !== "dark"
        ? config.sass_file_name
        : config.sass_file_name_dark
    }" rel="stylesheet">`;
  else return "";
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

const bs5BootswatchThemes = Object.entries(themes)
  .filter(([k, v]) => !v.includeBS4css && v.source === "Bootswatch")
  .map(([k, v]) => k);

const configuration_workflow = () =>
  new Workflow({
    onDone: async (context) => {
      return {
        context,
        cleanup: async () => {
          if (context.sass_file_name) await deleteOldFiles(context);
        },
      };
    },
    onStepSuccess: async (step, ctx) => {
      try {
        if (bs5BootswatchThemes.indexOf(ctx.theme) >= 0) await buildTheme(ctx);
      } catch (error) {
        const msg = error.message || "Failed to build theme";
        getState().log(2, `onStepSuccess failed: ${msg}`);
      }
    },
    onStepSave: async (step, ctx, formVals) => {
      if (
        bs5BootswatchThemes.indexOf(formVals.theme) >= 0 &&
        buildNeeded(ctx, formVals)
      ) {
        try {
          await buildTheme(formVals);
        } catch (error) {
          const msg = error.message || "Failed to build theme";
          getState().log(2, `onStepSave failed: ${msg}`);
          return {
            savingErrors: msg,
          };
        }
      }
    },
    steps: [
      {
        name: "stylesheet",
        form: async (ctx) => {
          const cssfiles = await File.find({
            mime_super: "text",
            mime_sub: "css",
          });
          const themeColors = await extractColorDefaults();
          const form = new Form({
            additionalHeaders: [
              {
                headerTag: `<script>
var currentTheme = "${
                  (ctx.theme === "bootstrap" ? "lux" : ctx.theme) || "flatly"
                }";
var tenantSchema = "${db.getTenantSchema()}";
var themeColors = ${JSON.stringify(themeColors)}</script>`,
              },
              {
                script: `${safeSlash()}plugins/public/any-bootstrap-theme/theme_helpers.js`,
              },
              {
                headerTag: `<style>
                #inputcardFooterBg, #inputcardFooterBgDark, #inputcardHeaderBg, #inputcardHeaderBgDark {
                  opacity: 0.3 !important;
                }
                /* hide arrows, or we need a debounce only on the float inputs */
                :is(#inputcardHeaderBgAlpha, #inputcardHeaderBgAlphaDark, #inputcardFooterBgAlpha, #inputcardFooterBgAlphaDark)::-webkit-outer-spin-button,
                :is(#inputcardHeaderBgAlpha, #inputcardHeaderBgAlphaDark, #inputcardFooterBgAlpha, #inputcardFooterBgAlphaDark)::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                :is(#inputcardHeaderBgAlpha, #inputcardHeaderBgAlphaDark, #inputcardFooterBgAlpha, #inputcardFooterBgAlphaDark) {
                    -moz-appearance: textfield;
                }
                </style>`,
              },
            ],
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
                  onChange: "themeHelpers.changeTheme(this)",
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
                    {
                      name: "navbar-dark bg-primary",
                      label: "Dark Primary",
                    },
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
                name: "fluid",
                label: "Fluid full-width container",
                type: "Bool",
              },
              {
                name: "mode",
                label: "Mode",
                type: "String",
                showIf: { theme: bs5BootswatchThemes },
                required: true,
                default: "light",
                attributes: {
                  options: [
                    { name: "light", label: "Light" },
                    { name: "dark", label: "Dark" },
                  ],
                },
              },
              {
                name: "backgroundColor",
                label: "Background Color </br>(Light mode)",
                type: "Color",
                default: "#ffffff",
              },
              {
                name: "backgroundColorDark",
                label: "Dark",
                sublabel: "background color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#212529",
              },
              {
                name: "cardBackgroundColor",
                label: "Card Background </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#ffffff",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardBackgroundColorDark",
                label: "Dark",
                sublabel: "card background in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#212529",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardHeaderText",
                label: "Card Header text </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardHeaderTextDark",
                label: "Dark",
                sublabel: "Card Header text in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardHeaderBg",
                label: "Card Header background color </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardHeaderBgDark",
                label: "Dark",
                sublabel: "Card Header background color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardHeaderBgAlpha",
                label: "Card Header background alpha </br>(Light mode)",
                type: "Float",
                default: 0.03,
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                  decimal_places: 2,
                  min: 0,
                  max: 1,
                },
              },
              {
                name: "cardHeaderBgAlphaDark",
                label: "Dark",
                type: "Float",
                default: 0.03,
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                  decimal_places: 2,
                  min: 0,
                  max: 1,
                },
              },

              {
                name: "cardFooterText",
                label: "Card Footer text </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardFooterTextDark",
                label: "Dark",
                sublabel: "Card Footer text in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardFooterBg",
                label: "Card Footer background color </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardFooterBgDark",
                label: "Dark",
                sublabel: "Card Footer background color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "cardFooterBgAlpha",
                label: "Card Footer background alpha </br>(Light mode)",
                type: "Float",
                default: 0.03,
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                  decimal_places: 2,
                  min: 0,
                  max: 1,
                },
              },
              {
                name: "cardFooterBgAlphaDark",
                label: "Dark",
                type: "Float",
                default: 0.03,
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                  decimal_places: 2,
                  min: 0,
                  max: 1,
                },
              },
              {
                name: "linkColor",
                label: "Link color </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#007bff",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "linkColorDark",
                label: "Dark",
                sublabel: "Link color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#007bff",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "primary",
                label: "Primary color </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "primaryDark",
                label: "Dark",
                sublabel: "Primary color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#2c3e50",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "secondary",
                label: "Secondary </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#95a5a6",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "secondaryDark",
                label: "Dark",
                sublabel: "Secondary color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#95a5a6",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "success",
                label: "Success </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#18bc9c",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "successDark",
                label: "Dark",
                sublabel: "Success color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#18bc9c",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "info",
                label: "Info </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#3498db",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "infoDark",
                label: "Dark",
                sublabel: "Info color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#3498db",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "warning",
                label: "Warning </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#f39c12",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "warningDark",
                label: "Dark",
                sublabel: "Warning color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#f39c12",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "danger",
                label: "Danger </br>(Light mode)",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#e74c3c",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "dangerDark",
                label: "Dark",
                sublabel: "Danger color in Dark mode",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#e74c3c",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "light",
                label: "Light",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#ecf0f1",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "dark",
                label: "Dark",
                type: "Color",
                showIf: { theme: bs5BootswatchThemes },
                default: "#7b8a8b",
                attributes: {
                  onChange: "themeHelpers.bsColorChanged(this)",
                },
              },
              {
                name: "sass_file_name",
                input_type: "hidden",
              },
              {
                name: "sass_file_name_dark",
                input_type: "hidden",
              },
            ],
          });
          const now = new Date().valueOf();
          form.values.sass_file_name =
            ctx.sass_file_name ||
            `bootstrap.min.${db.getTenantSchema()}.${
              ctx.theme || "flatly"
            }.${now}.css`;
          form.values.sass_file_name_dark =
            ctx.sass_file_name_dark ||
            `bootstrap.min.${db.getTenantSchema()}.${
              ctx.theme || "flatly"
            }.${now}.dark.css`;
          return form;
        },
      },
    ],
  });

const userConfigForm = async (ctx) => {
  if (bs5BootswatchThemes.indexOf(ctx?.theme || "flatly") >= 0)
    return new Form({
      fields: [
        {
          name: "mode",
          label: "Mode",
          type: "String",
          required: true,
          default: ctx.mode || "light",
          attributes: {
            options: [
              { name: "light", label: "Light" },
              { name: "dark", label: "Dark" },
            ],
          },
        },
      ],
    });
  else return null;
};

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "any-bootstrap-theme",
  user_config_form: userConfigForm,
  layout,
  fonts: (config) => themes[config.theme]?.fonts || {},
  configuration_workflow,
  exposed_configs: ["mode"],
  onLoad: async (configuration) => {
    if (!configuration) return;
    try {
      if (
        bs5BootswatchThemes.indexOf(configuration.theme) >= 0 &&
        !(await pathExists(
          join(
            __dirname,
            "public",
            "bootswatch",
            configuration.theme === "bootstrap" ? "lux" : configuration.theme,
            configuration.sass_file_name
          )
        ))
      )
        await buildTheme(configuration);
    } catch (error) {
      const msg = error.message || "Failed to build theme";
      getState().log(2, `any-bootstrap-theme onLoad failed: ${msg}`);
      if (getState().logLevel > 5) console.error(error);
    }
  },
  actions: () => ({
    toggle_dark_mode: {
      description: "Switch between dark and light mode",
      configFields: [],
      run: async ({ user, req }) => {
        let plugin = await Plugin.findOne({ name: "any-bootstrap-theme" });
        if (!plugin) {
          plugin = await Plugin.findOne({
            name: "@saltcorn/any-bootstrap-theme",
          });
        }
        const dbUser = await User.findOne({ id: user.id });
        const attrs = dbUser._attributes || {};
        const userLayout = attrs.layout || {
          config: {},
        };
        userLayout.plugin = plugin.name;
        const currentMode = userLayout.config.mode
          ? userLayout.config.mode
          : plugin.configuration?.mode
          ? plugin.configuration.mode
          : "light";
        userLayout.config.mode = currentMode === "dark" ? "light" : "dark";
        userLayout.config.is_user_config = true;
        attrs.layout = userLayout;
        await dbUser.update({ _attributes: attrs });
        getState().processSend({
          refresh_plugin_cfg: plugin.name,
          tenant: db.getTenantSchema(),
        });
        getState().userLayouts[user.email] = layout({
          ...(plugin.configuration ? plugin.configuration : {}),
          ...userLayout.config,
        });
        await sleep(500); // Allow other workers to reload this plugin
        return { reload_page: true };
      },
    },
  }),
  ready_for_mobile: true,
};
