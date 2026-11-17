const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(s?css)$/.test(e.name) ? [p] : [];
  });

// Loading fonts from Google leaks visitor IPs (GDPR), see saltcorn/saltcorn#4477.
// Comments are allowed to mention the source URL; actual references are not.
const GOOGLE_REF =
  /(url\(\s*["']?|@import\s+["']|\$web-font-path:\s*["'])https?:\/\/fonts\.(googleapis|gstatic)\.com/;

describe("bundled themes", () => {
  const files = [
    ...walk(path.join(ROOT, "public")),
    ...walk(path.join(ROOT, "scss")),
  ];

  it("do not reference Google Fonts", () => {
    const offenders = files.filter((f) =>
      GOOGLE_REF.test(fs.readFileSync(f, "utf8"))
    );
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it("only import local font css files that exist", () => {
    const missing = [];
    for (const f of files) {
      const content = fs.readFileSync(f, "utf8");
      for (const m of content.matchAll(/[./]+fonts\/([\w-]+\.css)/g)) {
        if (!fs.existsSync(path.join(ROOT, "public", "fonts", m[1])))
          missing.push(`${path.relative(ROOT, f)} -> ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("vendored font css only points at files that exist", () => {
    const fontsDir = path.join(ROOT, "public", "fonts");
    const missing = [];
    for (const f of fs.readdirSync(fontsDir).filter((f) => f.endsWith(".css"))) {
      const content = fs.readFileSync(path.join(fontsDir, f), "utf8");
      for (const m of content.matchAll(/url\(([^)]+)\)/g)) {
        if (!fs.existsSync(path.join(fontsDir, m[1])))
          missing.push(`${f} -> ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
