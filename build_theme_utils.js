const fs = require("fs").promises;
const { spawn } = require("child_process");
const { join } = require("path");
const { getState } = require("@saltcorn/data/db/state");
const db = require("@saltcorn/data/db");

const bsColors = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "danger",
  "light",
  "dark",
];

const darkLightVars = [
  "cardBackgroundColor",
  "cardBackgroundColorDark",
  "cardHeaderBg",
  "cardHeaderBgAlpha",
  "cardHeaderBgDark",
  "cardHeaderBgAlphaDark",
  "cardFooterBg",
  "cardFooterBgAlpha",
  "cardFooterBgDark",
  "cardFooterBgAlphaDark",
  "cardHeaderText",
  "cardHeaderTextDark",
  "cardFooterText",
  "cardFooterTextDark",
  "linkColor",
  "linkColorDark",
];

const copyThemeFiles = async ({ theme }) => {
  const themeDir = theme === "bootstrap" ? "lux" : theme;
  await fs.copyFile(
    join(__dirname, "public", "bootswatch", themeDir, "_variables.scss"),
    join(__dirname, "scss", "build", "_variables.scss")
  );
  await fs.copyFile(
    join(__dirname, "public", "bootswatch", themeDir, "_bootswatch.scss"),
    join(__dirname, "scss", "build", "_bootswatch.scss")
  );
};

const applyCustomColors = async (ctx, isDark) => {
  let content = await fs.readFile(
    join(__dirname, "scss", "build", "_variables.scss"),
    "utf8"
  );
  for (const bsColor of bsColors) {
    const regExp = new RegExp(`^\\$${bsColor}:.*;`, "gm");
    const colorVal =
      isDark && !["light", "dark"].includes(bsColor)
        ? ctx[`${bsColor}Dark`]
        : ctx[bsColor];
    content = content.replace(regExp, `$${bsColor}: ${colorVal} !default;`);
  }
  await fs.writeFile(
    join(__dirname, "scss", "build", "_variables.scss"),
    content
  );
};

const calcAlphaFromDecimal = (decimal) => {
  const alpha = Math.round(decimal * 255);
  return alpha.toString(16).padStart(2, "0");
};

const writeDarkLightFile = async (ctx) => {
  const content = `
@include color-mode(dark) {
  .card-body {
    background-color: ${ctx.cardBackgroundColorDark || "#212529"};
  }

  .card-header, .card-header *, .modal-title, .modal-title * {
    color: ${ctx.cardHeaderTextDark || ctx.primaryDark || "#2c3e50"} !important;
  }

  .card-header {
    background-color: ${
      ctx.cardHeaderBgDark || "#212529"
    }${calcAlphaFromDecimal(ctx.cardHeaderBgAlphaDark || 0.03)};
  }

  .card-footer, .card-footer *:not(.btn, .btn *, a, a *, .btn-link, .btn-link *) {
    color: ${ctx.cardFooterTextDark || ctx.primaryDark || "#2c3e50"} !important;
  }

  .card-footer {
    background-color: ${
      ctx.cardFooterBgDark || "#212529"
    }${calcAlphaFromDecimal(ctx.cardFooterBgAlphaDark || 0.03)};
  }

  h1, h2, h3, h4, h5, h6, 
  :is(h1, h2, h3, h4, h5, h6) * {
    color: ${ctx.primaryDark || "#2c3e50"};
  }

  a:not(.btn, .btn *, .nav, .nav *:not(.breadcrumb *, .plugin-section *), nav, nav *:not(.breadcrumb *, .plugin-section *)),
  .btn-link:not(.nav, .nav *, nav, nav *) {
    color: ${ctx.linkColorDark || ctx.primaryDark || "#2c3e50"} !important;
  }
}

@include color-mode(light) {
  .card-body {
    background-color: ${ctx.cardBackgroundColor || "#FFFFFF"};
  }

  .card-header, .card-header *, .modal-title, .modal-title * {
    color: ${ctx.cardHeaderText || ctx.primary || "#2c3e50"} !important;
  }

  .card-header {
    background-color: ${ctx.cardHeaderBg || "#FFFFFF"}${calcAlphaFromDecimal(
    ctx.cardHeaderBgAlpha || 0.03
  )};
  }

  .card-footer, .card-footer *:not(.btn, .btn *, a, a * .btn-link, .btn-link *) {
    color: ${ctx.cardFooterText || ctx.primary || "#2c3e50"} !important;
  }

  .card-footer {
    background-color: ${ctx.cardFooterBg || "#FFFFFF"}${calcAlphaFromDecimal(
    ctx.cardFooterBgAlpha || 0.03
  )};
  }

  h1, h2, h3, h4, h5, h6, 
  :is(h1, h2, h3, h4, h5, h6) * {
    color: ${ctx.primary || "#2c3e50"};
  }

  a:not(.btn, .btn *, .nav, .nav *:not(.breadcrumb *, .plugin-section *), nav, nav *:not(.breadcrumb *, .plugin-section *)),
  .btn-link:not(.nav, .nav *, nav, nav *) {
    color: ${ctx.linkColor || ctx.primary || "#2c3e50"} !important;
  }
}`;
  await fs.writeFile(
    join(__dirname, "scss", "build", "my_dark_light_vars.scss"),
    content
  );
};

const buildBootstrapMin = async () => {
  getState().log(5, "Building bootstrap.min.css");
  const child = spawn("npm", ["run", "build_theme"], {
    cwd: __dirname,
  });
  return new Promise((resolve, reject) => {
    child.stdout.on("data", (data) => {
      getState().log(5, data.toString());
    });
    child.stderr?.on("data", (data) => {
      getState().log(2, data.toString());
    });
    child.on("exit", function (code, signal) {
      getState().log(5, `child process exited with code ${code}`);
      resolve(code);
    });
    child.on("error", (msg) => {
      getState().log(2, `child process failed: ${msg.code}`);
      reject(msg.code);
    });
  });
};

const copyBootstrapMin = async (ctx, isDark) => {
  const themeDir = ctx.theme === "bootstrap" ? "lux" : ctx.theme;
  await fs.copyFile(
    join(__dirname, "scss", "build", "bootstrap.min.css"),
    join(
      __dirname,
      "public",
      "bootswatch",
      themeDir,
      !isDark ? ctx.sass_file_name : ctx.sass_file_name_dark
    )
  );
};

const buildTheme = async (ctx) => {
  const builder = async (isDark) => {
    await copyThemeFiles(ctx);
    await applyCustomColors(ctx, isDark);
    await writeDarkLightFile(ctx);
    const code = await buildBootstrapMin();
    if (code === 0) await copyBootstrapMin(ctx, isDark);
    else throw new Error(`Failed to build theme, please check your logs`);
  };
  const lockFile = join(
    __dirname,
    "public",
    "bootswatch",
    ctx.theme === "bootstrap" ? "lux" : ctx.theme,
    `lock_${ctx.sass_file_name}`
  );
  try {
    await fs.access(lockFile);
    getState().log(5, `Lock file exists for ${ctx.sass_file_name}`);
    return;
  } catch (e) {
    await fs.writeFile(lockFile, "");
  }
  try {
    await builder(false);
    await builder(true);
  } finally {
    await fs.rm(lockFile);
  }
};

const extractColorDefaults = async () => {
  const dirs = await fs.readdir(join(__dirname, "public", "bootswatch"));
  const result = {};
  for (const dir of dirs) {
    const content = await fs.readFile(
      join(__dirname, "public", "bootswatch", dir, "bootstrap.css"),
      "utf8"
    );
    const colors = {};
    for (const bsColor of bsColors) {
      const match = content.match(new RegExp(`--bs-${bsColor}: #(.*);`, "m"));
      if (match) {
        colors[bsColor] = match[1];
      }
    }
    const lightAndDarkBg = Array.from(
      content.matchAll(new RegExp("--bs-body-bg: #(.*);", "gm"))
    );
    if (lightAndDarkBg.length === 2) {
      colors.lightBg = lightAndDarkBg[0][1];
      colors.darkBg = lightAndDarkBg[1][1];
    }
    // bs-link-color
    const linkLightAndDark = Array.from(
      content.matchAll(new RegExp("--bs-link-color: #(.*);", "gm"))
    );
    if (linkLightAndDark.length === 2) {
      colors.linkColor = linkLightAndDark[0][1];
      colors.linkColorDark = linkLightAndDark[1][1];
    }
    // header footer bg
    const headerFooterBg = Array.from(
      content.matchAll(new RegExp("--bs-body-bg: #(.*);", "gm"))
    );
    if (headerFooterBg.length === 2) {
      colors.cardHeaderBg = headerFooterBg[0][1];
      colors.cardHeaderBgDark = headerFooterBg[1][1];
      colors.cardFooterBg = headerFooterBg[0][1];
      colors.cardFooterBgDark = headerFooterBg[1][1];
    }
    result[dir] = colors;
  }
  return result;
};

const buildNeeded = (oldCtx, newCtx) => {
  for (const bsColor of [...bsColors, ...darkLightVars]) {
    if (
      oldCtx[bsColor] !== newCtx[bsColor] ||
      oldCtx[`${bsColor}Dark`] !== newCtx[`${bsColor}Dark`]
    )
      return true;
  }
};

const deleteOldFiles = async ({ sass_file_name, sass_file_name_dark }) => {
  const dirs = await fs.readdir(join(__dirname, "public", "bootswatch"));
  const tenantSchema = db.getTenantSchema();
  for (const dir of dirs) {
    const files = await fs.readdir(
      join(__dirname, "public", "bootswatch", dir)
    );
    const fileDelPrefix = `bootstrap.min.${tenantSchema}`;
    for (const file of files) {
      if (
        file.startsWith(fileDelPrefix) &&
        ![sass_file_name, sass_file_name_dark, "bootstrap.min.css"].includes(
          file
        )
      )
        await fs.unlink(join(__dirname, "public", "bootswatch", dir, file));
    }
  }
};
module.exports = {
  buildTheme,
  extractColorDefaults,
  buildNeeded,
  deleteOldFiles,
};
