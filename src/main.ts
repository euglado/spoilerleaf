import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { config } from "./config.js";
import { handle } from "./handler.js";
import { Store } from "./model.js";

try {
  const settings = config();
  const store = new Store();
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: { parse: [], repliedUser: false },
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
    }),
  });
  client.once(Events.ClientReady, () =>
    console.log("SpoilerLeaf connected / bağlandı. Use /spoilerleaf."),
  );
  client.on(Events.InteractionCreate, (i) => {
    void handle(i, store, settings.guild);
  });
  client.on(Events.Error, () =>
    console.error(
      "Discord connection error; details suppressed. / Discord bağlantı hatası.",
    ),
  );
  const timer = setInterval(() => store.sweep(), 30000);
  timer.unref();
  const stop = () => {
    clearInterval(timer);
    client.destroy();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  await client.login(settings.token);
} catch {
  console.error(
    "Startup failed. Run npm run setup; check token and network. / Başlatılamadı. npm run setup çalıştırın; tokenı ve ağı kontrol edin.",
  );
  process.exitCode = 1;
}
