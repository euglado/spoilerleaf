import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { config } from "../dist/config.js";

test("config rejects missing and malformed values", () => {
  for (const env of [
    {},
    {
      DISCORD_TOKEN: "x".repeat(40),
      DISCORD_APPLICATION_ID: "bad",
      DISCORD_GUILD_ID: "123456789012345678",
    },
    {
      DISCORD_TOKEN: "line\nbreak",
      DISCORD_APPLICATION_ID: "123456789012345678",
      DISCORD_GUILD_ID: "123456789012345678",
    },
  ])
    assert.throws(() => config(env));
});
test("config trims valid values without logging them", () => {
  const token = "x".repeat(40);
  assert.equal(
    config({
      DISCORD_TOKEN: ` ${token} `,
      DISCORD_APPLICATION_ID: "123456789012345678",
      DISCORD_GUILD_ID: "123456789012345678",
    }).token,
    token,
  );
});
for (const file of ["dist/main.js", "dist/register.js", "scripts/setup.mjs"]) {
  test(`${file} safely exits unconfigured without writing .env`, () => {
    const parent = path.resolve(os.tmpdir());
    const dir = mkdtempSync(path.join(parent, "spoilerleaf-test-"));
    try {
      const script = fileURLToPath(new URL(`../${file}`, import.meta.url));
      const run = spawnSync(process.execPath, [script], {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...process.env,
          DISCORD_TOKEN: "",
          DISCORD_APPLICATION_ID: "",
          DISCORD_GUILD_ID: "",
        },
        timeout: 10000,
      });
      assert.equal(run.status, 1, run.stdout + run.stderr);
      assert.equal(existsSync(path.join(dir, ".env")), false);
      assert(!run.stderr.includes("stack"));
    } finally {
      assert.equal(path.dirname(path.resolve(dir)), parent);
      assert(path.basename(dir).startsWith("spoilerleaf-test-"));
      rmSync(dir, { recursive: true });
    }
  });
}
