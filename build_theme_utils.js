const fs = require("fs").promises;
const { spawn } = require("child_process");
const { join } = require("path");
const { getState } = require("@saltcorn/data/db/state");

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

const copyThemeFiles = async ({ theme }) => {
  await fs.copyFile(
    join(__dirname, "public", "bootswatch", theme, "_variables.scss"),
    join(__dirname, "scss", "build", "_variables.scss")
  );
  await fs.copyFile(
    join(__dirname, "public", "bootswatch", theme, "_bootswatch.scss"),
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
  const fileName = `bootstrap.min.${new Date().valueOf()}.css`;
  await fs.copyFile(
    join(__dirname, "scss", "build", "bootstrap.min.css"),
    join(__dirname, "public", "bootswatch", ctx.theme, fileName)
  );
  return fileName;
};

const buildTheme = async (ctx) => {
  await copyThemeFiles(ctx);
  await applyCustomColors(ctx);
  const code = await buildBootstrapMin(ctx);
  if (code === 0) return await copyBootstrapMin(ctx);
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
  for (const bsColor of bsColors) {
    if (oldCtx[bsColor] !== newCtx[bsColor]) return true;
  }
};

module.exports = {
  buildTheme,
  extractColorDefaults,
  buildNeeded,
};
