export function config(env: NodeJS.ProcessEnv = process.env) {
  const token = env.DISCORD_TOKEN?.trim();
  const application = env.DISCORD_APPLICATION_ID?.trim();
  const guild = env.DISCORD_GUILD_ID?.trim();
  if (
    !token ||
    token.length < 30 ||
    /\s/u.test(token) ||
    !application ||
    !guild ||
    !/^\d{17,20}$/u.test(application) ||
    !/^\d{17,20}$/u.test(guild)
  ) {
    throw new Error(
      "Run setup first: npm run setup. / Önce kurulumu çalıştırın: npm run setup.",
    );
  }
  return { token, application, guild };
}
