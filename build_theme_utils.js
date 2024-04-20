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
  "cardHeaderText",
  "cardHeaderTextDark",
  "cardFooterText",
  "cardFooterTextDark",
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

const applyCustomColors = async (ctx) => {
  let content = await fs.readFile(
    join(__dirname, "scss", "build", "_variables.scss"),
    "utf8"
  );
  for (const bsColor of bsColors) {
    const regExp = new RegExp(`^\\$${bsColor}:.*;`, "gm");
    content = content.replace(regExp, `$${bsColor}: ${ctx[bsColor]} !default;`);
  }
  await fs.writeFile(
    join(__dirname, "scss", "build", "_variables.scss"),
    content
  );
};

const writeDarkLightFile = async (ctx) => {
  const content = `
@include color-mode(dark) {
  .card {
    background-color: ${ctx.cardBackgroundColorDark || "#212529"};
  }

  .card-header {
    color: ${ctx.cardHeaderTextDark || ctx.primary || "#2c3e50"};
  }

  .card-footer {
    color: ${ctx.cardFooterTextDark || ctx.primary || "#2c3e50"};
  }
}

@include color-mode(light) {
  .card {
    background-color: ${ctx.cardBackgroundColor || "#FFFFFF"};
  }

  .card-header {
    color: ${ctx.cardHeaderText || ctx.primary || "#2c3e50"};
  }

  .card-footer {
    color: ${ctx.cardFooterText || ctx.primary || "#2c3e50"};
  }
}`;
  await fs.writeFile(
    join(__dirname, "scss", "build", "my_dark_light_vars.scss"),
    content
  );
};

const buildBootstrapMin = async (ctx) => {
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

const copyBootstrapMin = async (ctx) => {
  const themeDir = ctx.theme === "bootstrap" ? "lux" : ctx.theme;
  await fs.copyFile(
    join(__dirname, "scss", "build", "bootstrap.min.css"),
    join(__dirname, "public", "bootswatch", themeDir, ctx.sass_file_name)
  );
};

const buildTheme = async (ctx) => {
  await copyThemeFiles(ctx);
  await applyCustomColors(ctx);
  await writeDarkLightFile(ctx);
  const code = await buildBootstrapMin(ctx);
  if (code === 0) await copyBootstrapMin(ctx);
  else throw new Error(`Failed to build theme, please check your logs`);
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
    result[dir] = colors;
  }
  return result;
};

const buildNeeded = (oldCtx, newCtx) => {
  for (const bsColor of [...bsColors, ...darkLightVars]) {
    if (oldCtx[bsColor] !== newCtx[bsColor]) return true;
  }
};

const deleteOldFiles = async ({ sass_file_name }) => {
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
        ![sass_file_name, "bootstrap.min.css"].includes(file)
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
