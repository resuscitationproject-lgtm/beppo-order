const fs = require("fs");
const path = require("path");

const root = __dirname;
const problems = [];

for (const file of fs.readdirSync(root).filter(name => name.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const reference = match[1];
    if (/^(https?:|tel:|javascript:|mailto:)/.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    if (clean && !fs.existsSync(path.resolve(root, clean))) problems.push(`${file}: missing ${reference}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
if (!manifest.name || !manifest.icons?.length || !manifest.shortcuts?.length) problems.push("manifest.json: required keys are missing");
for (const icon of manifest.icons || []) if (!fs.existsSync(path.resolve(root, icon.src))) problems.push(`manifest.json: missing ${icon.src}`);

const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
for (const match of serviceWorker.matchAll(/"(\.\/[^"?]+)"/g)) {
  if (!fs.existsSync(path.resolve(root, match[1]))) problems.push(`service-worker.js: missing ${match[1]}`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("All local HTML, manifest and service-worker references resolve.");
