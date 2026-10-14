import {
  ButtonStyle,
  ChannelType,
  escapeMarkdown,
  type Interaction,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { type Scope, type Store, UserError, validate } from "./model.js";
import { form, noMentions, preview, publicCard, row } from "./ui.js";

export const genericError =
  "Action failed. Check bot permissions and connection; do not retry publication blindly. / İşlem başarısız. Bot izinlerini ve bağlantıyı kontrol edin; yayımlamayı körlemesine yinelemeyin.";
export async function handle(
  i: Interaction,
  store: Store,
  guild: string,
): Promise<void> {
  if (!i.isChatInputCommand() && !i.isButton() && !i.isModalSubmit()) return;
  if (
    i.isChatInputCommand()
      ? i.commandName !== "spoilerleaf"
      : !i.customId.startsWith("sl:")
  )
    return;
  try {
    if (
      !i.inGuild() ||
      i.guildId !== guild ||
      !i.channelId ||
      i.channel?.type !== ChannelType.GuildText
    )
      throw new UserError(
        "Use a normal text channel in the configured server. / Yapılandırılan sunucuda normal bir metin kanalı kullanın.",
      );
    const scope: Scope = {
      user: i.user.id,
      guild: i.guildId,
      channel: i.channelId,
    };
    const manager = () => {
      if (!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))
        throw new UserError(
          "Manage Server permission required. / Sunucuyu Yönet izni gerekli.",
        );
    };
    const canSend = () => {
      if (
        !i.appPermissions?.has([
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
        ])
      )
        throw new UserError(
          "Allow the bot View Channel and Send Messages here. / Bota burada Kanalı Görüntüle ve Mesaj Gönder izinlerini verin.",
        );
    };
    if (i.isChatInputCommand()) {
      manager();
      canSend();
      store.throttle(scope.user, "form");
      const id = store.ticket(scope, "form");
      await i.showModal(form(id));
      return;
    }
    const [, action, id, extra] = i.customId.split(":");
    if (!id || extra || !/^[a-f0-9-]{36}$/u.test(id))
      throw new UserError(
        "Invalid control. Start again. / Geçersiz denetim. Yeniden başlayın.",
      );
    if (i.isModalSubmit()) {
      manager();
      canSend();
      if (action !== "form")
        throw new UserError("Unknown form. / Bilinmeyen form.");
      store.consume(id, scope, "form");
      const content = validate({
        title: i.fields.getTextInputValue("title"),
        warning: i.fields.getTextInputValue("warning"),
        body: i.fields.getTextInputValue("body"),
      });
      const draft = store.ticket(scope, "preview", content);
      await i.reply({
        ...preview(content, draft),
        flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds,
      });
      return;
    }
    if (!i.isButton()) return;
    if (action === "cancel") {
      store.consume(id, scope);
      await i.update({
        content:
          "Cancelled; temporary draft removed. / Vazgeçildi; geçici taslak kaldırıldı.",
        components: [],
        allowedMentions: noMentions,
      });
      return;
    }
    if (action === "publish") {
      manager();
      canSend();
      await i.deferUpdate();
      await store.publish(id, scope, async (card) => {
        if (i.channel?.type !== ChannelType.GuildText)
          throw new Error("Channel unavailable");
        const message = await i.channel.send(publicCard(card));
        return message.id;
      });
      await i.editReply({
        content:
          "Published. Spoiler text was excluded from the public card. / Yayımlandı. Spoiler metni açık karta eklenmedi.",
        components: [],
        allowedMentions: noMentions,
      });
      return;
    }
    if (action === "confirm") {
      manager();
      await i.deferUpdate();
      const card = store.close(id, scope);
      let edited = true;
      try {
        await i.channel.messages.edit(card.message, {
          content: "SpoilerLeaf — closed / kapatıldı.",
          components: [],
          allowedMentions: noMentions,
        });
      } catch {
        edited = false;
      }
      await i.editReply({
        content: edited
          ? "Closed; bot memory cleared. Old private replies remain in Discord. / Kapatıldı; bot belleği temizlendi. Önceki özel yanıtlar Discord'da kalır."
          : "Bot memory cleared. Could not update public card; delete it manually. Old private replies remain. / Bot belleği temizlendi. Açık kart güncellenemedi; elle silin. Önceki özel yanıtlar kalır.",
        components: [],
        allowedMentions: noMentions,
      });
      return;
    }
    if (action !== "reveal" && action !== "close")
      throw new UserError("Unknown control. / Bilinmeyen denetim.");
    // Interaction message, never arbitrary channel history; bind all public actions to the original bot card.
    if (i.message.author.id !== i.client.user?.id || i.message.webhookId)
      throw new UserError(
        "Use the original bot card. / Özgün bot kartını kullanın.",
      );
    const card = store.get(id, scope, i.message.id);
    if (action === "reveal") {
      store.throttle(scope.user, "read");
      await i.reply({
        content: `SPOILER — ${escapeMarkdown(card.title)}\n${escapeMarkdown(card.body)}\n\nOnly you see this reply; you can dismiss it. / Bu yanıtı yalnızca siz görürsünüz; kapatabilirsiniz.`,
        flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds,
        allowedMentions: noMentions,
      });
      return;
    }
    manager();
    const confirmation = store.ticket(scope, "close", undefined, card.id);
    await i.reply({
      content:
        "Close this card and erase its text from bot memory? Previously revealed replies remain. / Kartı kapatıp metnini bot belleğinden kaldırmak istiyor musunuz? Önceden açılan yanıtlar kalır.",
      components: [
        row(
          [
            `sl:confirm:${confirmation}`,
            "Erase and close / Sil ve kapat",
            ButtonStyle.Danger,
          ],
          [
            `sl:cancel:${confirmation}`,
            "Keep open / Açık tut",
            ButtonStyle.Secondary,
          ],
        ),
      ],
      flags: MessageFlags.Ephemeral,
      allowedMentions: noMentions,
    });
  } catch (error) {
    const content = error instanceof UserError ? error.message : genericError;
    // Never log interaction objects, tokens, submitted text or raw external exceptions.
    if (!(error instanceof UserError))
      console.error("Discord action failed; external details suppressed.");
    try {
      if (i.deferred || i.replied)
        await i.editReply({
          content,
          components: [],
          allowedMentions: noMentions,
        });
      else
        await i.reply({
          content,
          flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds,
          allowedMentions: noMentions,
        });
    } catch {
      console.error("Could not deliver safe error guidance.");
    }
  }
}
