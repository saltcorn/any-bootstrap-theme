const { getState } = require("@saltcorn/data/db/state");
const { join } = require("path");
const fs = require("fs").promises;
const { buildTheme, extractColorDefaults } = require("../build_theme_utils");
const {
  afterAll,
  beforeAll,
  describe,
  it,
  expect,
} = require("@saltcorn/db-common/test_expect");

afterAll(require("@saltcorn/data/db").close);
beforeAll(async () => {
  // works when the cli command is called like this:
  //   saltcorn dev:plugin-test -d [PATH_TO_LOCAL_PLUGIN]/any-bootstrap-theme
  await getState().refresh(true);
});

const THEME = "flatly";
const outDir = join(__dirname, "..", "public", "bootswatch", THEME);

// extractColorDefaults() strips the leading "#" (it's added back client-side
// by the color picker before a real form submission reaches buildTheme())
const withHash = (colors) =>
  Object.fromEntries(
    Object.entries(colors).map(([k, v]) => [
      k,
      typeof v === "string" && !v.startsWith("#") ? `#${v}` : v,
    ])
  );

// a real submission always includes a <color>Dark field per color (filled
// in via the form's color picker) - extractColorDefaults() only gives us
// light values, so fall back to them for dark mode too
const withDarkFallback = (colors) => {
  const result = { ...colors };
  for (const c of [
    "primary",
    "secondary",
    "success",
    "info",
    "warning",
    "danger",
  ])
    if (result[`${c}Dark`] === undefined) result[`${c}Dark`] = result[c];
  return result;
};

describe("buildTheme (sass JS API, no subprocess)", () => {
  it("compiles a real theme to compressed CSS", async () => {
    const defaults = await extractColorDefaults();
    const ctx = {
      ...withDarkFallback(withHash(defaults[THEME])),
      theme: THEME,
      sass_file_name: "bootstrap.min.test.css",
      sass_file_name_dark: "bootstrap.min.test.dark.css",
    };
    await buildTheme(ctx);
    try {
      const lightCss = await fs.readFile(
        join(outDir, ctx.sass_file_name),
        "utf8"
      );
      const darkCss = await fs.readFile(
        join(outDir, ctx.sass_file_name_dark),
        "utf8"
      );
      // a real bootstrap build is tens of KB even compressed - anything
      // tiny means the compile silently produced near-empty output
      expect(lightCss.length).toBeGreaterThan(10000);
      expect(darkCss.length).toBeGreaterThan(10000);
      expect(lightCss).toContain(".btn");
      // --style=compressed strips inter-rule newlines
      expect(lightCss).not.toMatch(/\n\s*\n/);
    } finally {
      await fs.rm(join(outDir, ctx.sass_file_name), { force: true });
      await fs.rm(join(outDir, ctx.sass_file_name_dark), { force: true });
    }
  });

  it("rejects with a useful error on invalid SCSS instead of hanging or failing silently", async () => {
    const defaults = await extractColorDefaults();
    const ctx = {
      ...withDarkFallback(withHash(defaults[THEME])),
      primary: "not a valid color;", // breaks the generated _variables.scss
      theme: THEME,
      sass_file_name: "bootstrap.min.badtest.css",
      sass_file_name_dark: "bootstrap.min.badtest.dark.css",
    };
    await expect(buildTheme(ctx)).rejects.toThrow();
    // buildTheme's finally block must still clean up its lock file on failure
    await expect(
      fs.access(join(outDir, `lock_${ctx.sass_file_name}`))
    ).rejects.toThrow();
  });
});
