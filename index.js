const {
  div,
  text,
  h1,
  p,
  footer,
  section,
  style
} = require("@saltcorn/markup/tags");
const {
  navbar,
  navbarSolidOnScroll
} = require("@saltcorn/markup/layout_utils");
const renderLayout = require("@saltcorn/markup/layout");
const Field = require("@saltcorn/data/models/field");
const Table = require("@saltcorn/data/models/table");
const Form = require("@saltcorn/data/models/form");
const View = require("@saltcorn/data/models/view");
const Workflow = require("@saltcorn/data/models/workflow");

const blockDispatch = config => ({
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
          "jumbotron text-center m-0 bg-info d-flex flex-column justify-content-center"
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
  wrapTop: (segment, ix, s) =>
    ["hero", "footer"].includes(segment.type)
      ? s
      : section(
          {
            class: [
              "page-section",
              ix === 0 && (config.fixedTop ? "mt-5 pt-2" : "mt-1"),
              segment.class,
              segment.invertColor && "bg-primary"
            ]
          },
          div(
            { class: ["container"] },
            div({ class: "row" }, div({ class: "col-sm-12" }, s))
          )
        )
});

const renderBody = (title, body, alerts, config) =>
  renderLayout({
    blockDispatch: blockDispatch(config),
    layout:
      typeof body === "string" && config.in_card
        ? { type: "card", title, contents: body }
        : body,
    alerts
  });

const layout = config => ({
  wrap: ({
    title,
    menu,
    brand,
    alerts,
    currentUrl,
    body,
    headers
  }) => `<!doctype html>
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
      .filter(h => h.css)
      .map(h => `<link href="${h.css}" rel="stylesheet">`)
      .join("")}
    ${headers
      .filter(h => h.headerTag)
      .map(h => h.headerTag)
      .join("")}
    <title>${text(title)}</title>
  </head>
  <body id="page-top">
    <div id="wrapper">
      ${navbar(brand, menu, currentUrl, config)}
      ${renderBody(title, body, alerts, config)}
    </div>
    <!-- Optional JavaScript -->
    <!-- jQuery first, then Popper.js, then Bootstrap JS -->
    <script src="https://code.jquery.com/jquery-3.4.1.min.js" 
            integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" 
            crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>

    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.bundle.min.js"></script>
    ${headers
      .filter(h => h.script)
      .map(h => `<script src="${h.script}"></script>`)
      .join("")}
    ${config.colorscheme === "navbar-light" ? navbarSolidOnScroll : ""}
  </body>
</html>`
});
// before body
const get_css_url = config => {
  const def =
    "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/united/bootstrap.min.css";
  if (!config || !config.theme) return def;
  if (config.theme === "Other") return config.css_url || def;
  if (themes[config.theme]) return themes[config.theme].css_url;
  else return def;
};

const get_css_integrity = config => {
  const def =
    "sha384-Uga2yStKRHUWCS7ORqIZhJ9LIAv4i7gZuEdoR1QAmw6H+ffhcf7yCOd0CvSoNwoz";
  if (!config || !config.theme) return def;
  if (config.theme === "Other") return config.css_integrity || def;
  if (themes[config.theme]) return themes[config.theme].css_integrity;
  else return def;
};

const themes = {
  cerulean: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/cerulean/bootstrap.min.css",
    css_integrity:
      "sha384-b+jboW/YIpW2ZZYyYdXczKK6igHlnkPNfN9kYAbqYV7rNQ9PKTXlS2D6j1QZIATW"
  },
  cosmo: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/cosmo/bootstrap.min.css",
    css_integrity:
      "sha384-9/chHLTCcBULgxOFoUyZXSgEF0uFXs+NrQqzcy/DXqcR+Sk8C1l4EgmUXAEzTb92"
  },
  cyborg: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/cyborg/bootstrap.min.css",
    css_integrity:
      "sha384-GKugkVcT8wqoh3M8z1lqHbU+g6j498/ZT/zuXbepz7Dc09/otQZxTimkEMTkRWHP"
  },
  darkly: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/darkly/bootstrap.min.css",
    css_integrity:
      "sha384-Bo21yfmmZuXwcN/9vKrA5jPUMhr7znVBBeLxT9MA4r2BchhusfJ6+n8TLGUcRAtL"
  },
  flatly: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/flatly/bootstrap.min.css",
    css_integrity:
      "sha384-mhpbKVUOPCSocLzx2ElRISIORFRwr1ZbO9bAlowgM5kO7hnpRBe+brVj8NNPUiFs"
  },
  journal: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/journal/bootstrap.min.css",
    css_integrity:
      "sha384-vjBZc/DqIqR687k5rf6bUQ6IVSOxQUi9TcwtvULstA7+YGi//g3oT2qkh8W1Drx9"
  },
  litera: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/litera/bootstrap.min.css",
    css_integrity:
      "sha384-Gr51humlTz50RfCwdBYgT+XvbSZqkm8Loa5nWlNrvUqCinoe6C6WUZKHS2WIRx5o"
  },
  lumen: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/lumen/bootstrap.min.css",
    css_integrity:
      "sha384-VMuWne6iwiifi8iEWNZMw8sDatgb6ntBpBIr67q0rZAyOQwfu/VKpnFntQrjxB5W"
  },
  bootstrap: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/lux/bootstrap.min.css",
    css_integrity:
      "sha384-smnSwzHqW1zKbeuSMsAM/fMQpkk7HY11LuHiwT8snL/W2QBoZtVCT4H5x1CEcJCs"
  },
  materia: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/materia/bootstrap.min.css",
    css_integrity:
      "sha384-uKLgCN8wZ+yo4RygxUNFhjywpL/l065dVTzvLuxys7LAIMmhZoLWb/1yP6+mF925"
  },
  minty: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/minty/bootstrap.min.css",
    css_integrity:
      "sha384-HqaYdAE26lgFCJsUF9TBdbZf7ygr9yPHtxtg37JshqVQi6CCAo6Qvwmgc5xclIiV"
  },
  pulse: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/pulse/bootstrap.min.css",
    css_integrity:
      "sha384-t87SWLASAVDfD3SOypT7WDQZv9X6r0mq1lMEc6m1/+tAVfCXosegm1BvaIiQm3zB"
  },
  sandstone: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/sandstone/bootstrap.min.css",
    css_integrity:
      "sha384-ztQCCdmKhYHBDMV3AyR4QGZ2/z6veowJBbsmvDJW/sTuMpB9lpoubJuD0ODGSbjh"
  },
  simplex: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/simplex/bootstrap.min.css",
    css_integrity:
      "sha384-6ge4b1Lr1zrvyGvm5pdAkc3NMa97XYhFPBWsZsT6O3eOU+hqURR1bQEMm11Grf3a"
  },
  sketchy: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/sketchy/bootstrap.min.css",
    css_integrity:
      "sha384-NkI/Nlr1DZ5rUXWWdnuZb97FQRgCCcwC66DC+HUCY0oVx6BgBHUfPcwL1vwp93JZ"
  },
  slate: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/slate/bootstrap.min.css",
    css_integrity:
      "sha384-idNH3UIOiZbCf8jxqu4iExnH34y5UovfW/Mg8T5WfNvoJolDvknoNqR69V2OexgF"
  },
  solar: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/solar/bootstrap.min.css",
    css_integrity:
      "sha384-iDw+DjLp94cdk+ODAgTY4IZ6d9aaRpG9KHr168TPxrfQ9wv/DTVC+cWyojoxjHBT"
  },
  spacelab: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/spacelab/bootstrap.min.css",
    css_integrity:
      "sha384-sIQOcNYer0kt7oTyFe/YrGzKMFP/qxsJbXTxq0/uiZQgpwXwEu41sVz2M61lWbai"
  },
  superhero: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/superhero/bootstrap.min.css",
    css_integrity:
      "sha384-rvwYMW9Z/bbxZfgxHQEKx6D91KwffWAG+XnsoYNCGWi/qL1P9dIVYm1HBiHFqQEt"
  },
  united: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/united/bootstrap.min.css",
    css_integrity:
      "sha384-Uga2yStKRHUWCS7ORqIZhJ9LIAv4i7gZuEdoR1QAmw6H+ffhcf7yCOd0CvSoNwoz"
  },
  yeti: {
    css_url:
      "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/yeti/bootstrap.min.css",
    css_integrity:
      "sha384-chJtTd1EMa6hQI40eyJWF6829eEk4oIe7b3nNtUni7VxA3uHc/uIM/8ppyjrggfV"
  }
};

const themeSelectOptions = Object.keys(themes).map(k => ({
  label: k[0].toUpperCase() + k.slice(1),
  name: k
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
                attributes: {
                  options: [
                    ...themeSelectOptions,
                    { name: "Other", label: "Other - from URL" }
                  ]
                }
              },
              {
                name: "css_url",
                label: "CSS stylesheet URL",
                type: "String",
                showIf: { ".theme": "Other" }
              },
              {
                name: "css_integrity",
                label: "CSS stylesheet integrity",
                type: "String",
                showIf: { ".theme": "Other" }
              },
              {
                name: "in_card",
                label: "Default content in card?",
                type: "Bool",
                required: true
              },
              {
                name: "colorscheme",
                label: "Navbar color scheme",
                type: "String",
                required: true,
                attributes: {
                  options: [
                    { name: "navbar-dark bg-dark", label: "Dark" },
                    { name: "navbar-dark bg-primary", label: "Dark Primary" },
                    {
                      name: "navbar-dark bg-secondary",
                      label: "Dark Secondary"
                    },
                    { name: "navbar-light bg-light", label: "Light" },
                    { name: "navbar-light", label: "Transparent Light" }
                  ]
                }
              },
              {
                name: "fixedTop",
                label: "Navbar Fixed Top",
                type: "Bool",
                required: true
              }
            ]
          });
        }
      }
    ]
  });

module.exports = {
  sc_plugin_api_version: 1,
  layout,
  configuration_workflow
};
