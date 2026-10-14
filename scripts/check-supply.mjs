import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const licenses = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-3-Clause",
  "BSD-2-Clause",
  "ISC",
  "0BSD",
  "MIT OR Apache-2.0",
]);
let dependencies = 0;
for (const [name, entry] of Object.entries(lock.packages)) {
  if (!name) continue;
  assert(licenses.has(entry.license), `Review dependency license: ${name}`);
  assert(
    entry.resolved?.startsWith("https://registry.npmjs.org/"),
    `Unexpected registry: ${name}`,
  );
  assert(
    /^sha512-[A-Za-z0-9+/]+=*$/u.test(entry.integrity),
    `Missing SHA-512 integrity: ${name}`,
  );
  assert(
    !entry.hasInstallScript,
    `Unexpected dependency install script: ${name}`,
  );
  dependencies++;
}
const root = process.cwd();
let files = 0;
function scan(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist"].includes(item.name)) continue;
    assert(!item.isSymbolicLink(), "Unexpected source symlink");
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      scan(full);
      continue;
    }
    if (item.name.startsWith(".env") && item.name !== ".env.example")
      throw new Error(
        "Private environment file exists in source tree; run supply checks in a clean checkout.",
      );
    const text = readFileSync(full, "utf8");
    assert(
      !/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u.test(text),
      `Private key pattern in ${item.name}`,
    );
    assert(
      !/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/u.test(
        text,
      ),
      `GitHub credential pattern in ${item.name}`,
    );
    assert(
      !/\b[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}\b/u.test(
        text,
      ),
      `Discord credential pattern in ${item.name}`,
    );
    assert(
      !/DISCORD_TOKEN[ \t]*=[ \t]*["']?[A-Za-z0-9._-]{30,}/u.test(text),
      `Literal token assignment in ${item.name}`,
    );
    files++;
  }
}
scan(root);
console.log(
  `Supply checks passed: ${dependencies} license/registry/SHA-512/no-install-script records; ${files} source secret-pattern scans. Pattern checks are not a guarantee of no secrets.`,
);
