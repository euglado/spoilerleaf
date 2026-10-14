import {
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { config } from "./config.js";

try {
  const settings = config();
  const command = new SlashCommandBuilder()
    .setName("spoilerleaf")
    .setDescription(
      "Preview a consent-first spoiler card / Spoiler kartını önizle",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
  // Upsert only this command; never replace another application's whole command set.
  await new REST({ version: "10" })
    .setToken(settings.token)
    .post(
      Routes.applicationGuildCommands(settings.application, settings.guild),
      { body: command.toJSON() },
    );
  console.log(
    "/spoilerleaf registered in your server. / Komut sunucunuza kaydedildi.",
  );
} catch {
  console.error(
    "Registration failed. Run setup; check IDs, token, installation and network. / Komut kaydı başarısız. Kurulumu, kimlikleri, tokenı, kurulumu ve ağı kontrol edin.",
  );
  process.exitCode = 1;
}
