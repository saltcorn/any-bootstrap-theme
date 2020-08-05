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

const blockDispatch = {
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
              ix === 0 && "mt-5",
              segment.class,
              segment.invertColor && "bg-primary"
            ]
          },
          div(
            { class: ["container"] },
            div({ class: "row" }, div({ class: "col-sm-12" }, s))
          )
        )
};

const renderBody = (title, body, alerts, in_card) =>
  renderLayout({
    blockDispatch,
    layout:
      typeof body === "string" && in_card ? { type: "card", title, contents: body } : body,
    alerts
  });

const layout = ({
  css_url = "https://stackpath.bootstrapcdn.com/bootswatch/4.5.0/united/bootstrap.min.css",
  css_integrity = "sha384-Uga2yStKRHUWCS7ORqIZhJ9LIAv4i7gZuEdoR1QAmw6H+ffhcf7yCOd0CvSoNwoz",
  in_card
}) => ({
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
    <link href="${css_url}" rel="stylesheet" integrity="${css_integrity}" crossorigin="anonymous">
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
      ${navbar(brand, menu, currentUrl)}
      ${renderBody(title, body, alerts, in_card)}
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
    ${navbarSolidOnScroll}
  </body>
</html>`
});

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "stylesheet",
        form: async context => {
          return new Form({
            fields: [
              {
                name: "css_url",
                label: "CSS stylesheet URL",
                type: "String",
                required: true
              },
              {
                name: "css_integrity",
                label: "CSS stylesheet integrity",
                type: "String",
                required: true
              },
              {
                name: "in_card",
                label: "Default content in card?",
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
