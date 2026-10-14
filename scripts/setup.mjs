import { existsSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

async function hiddenToken() {
  process.stdout.write("Bot token (hidden / gizli): ");
  const input = process.stdin;
  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  let value = "";
  return new Promise((resolve, reject) => {
    const finish = (error) => {
      input.off("data", receive);
      input.setRawMode(wasRaw);
      input.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const receive = (chunk) => {
      for (const char of chunk.toString()) {
        if (char === "\u0003" || char === "\u0004") {
          finish(new Error("Cancelled"));
          return;
        }
        if (char === "\r" || char === "\n") {
          finish();
          return;
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (/[A-Za-z0-9._-]/u.test(char)) value += char;
        else {
          finish(new Error("Invalid token character"));
          return;
        }
        if (value.length > 256) {
          finish(new Error("Token too long"));
          return;
        }
      }
    };
    input.on("data", receive);
  });
}

try {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error(
      "Use an interactive terminal. / Etkileşimli terminal kullanın.",
    );
  if (existsSync(".env"))
    throw new Error(
      ".env exists; it was not overwritten. Rename it locally to reconfigure. / .env mevcut; üzerine yazılmadı. Yeniden kurmak için yerelde yeniden adlandırın.",
    );
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let application;
  let guild;
  try {
    application = (
      await prompt.question("Application ID / Uygulama kimliği: ")
    ).trim();
    guild = (await prompt.question("Server ID / Sunucu kimliği: ")).trim();
  } finally {
    prompt.close();
  }
  if (!/^\d{17,20}$/u.test(application) || !/^\d{17,20}$/u.test(guild))
    throw new Error(
      "IDs must be 17–20 digits. / Kimlikler 17–20 rakam olmalı.",
    );
  const token = await hiddenToken();
  if (token.length < 30)
    throw new Error("Invalid token length. / Geçersiz token uzunluğu.");
  writeFileSync(
    ".env",
    `DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${application}\nDISCORD_GUILD_ID=${guild}\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Saved .env locally. Keep it secret. / .env yerelde kaydedildi. Gizli tutun.",
  );
} catch (error) {
  // All errors originate locally; filesystem errors are generalized to avoid unexpected data.
  console.error(
    error instanceof Error && !("code" in error)
      ? error.message
      : "Setup failed; .env was not overwritten. / Kurulum başarısız; .env üzerine yazılmadı.",
  );
  process.exitCode = 1;
}
