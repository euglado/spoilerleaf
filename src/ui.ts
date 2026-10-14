import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  escapeMarkdown,
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { Card, Content } from "./model.js";

export const noMentions = {
  parse: [] as ("users" | "roles" | "everyone")[],
  repliedUser: false,
};
export function row(...buttons: [string, string, ButtonStyle][]) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    buttons.map(([id, label, style]) =>
      new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style),
    ),
  );
}
export function form(id: string) {
  return new ModalBuilder()
    .setCustomId(`sl:form:${id}`)
    .setTitle("SpoilerLeaf")
    .addLabelComponents(
      ...(
        [
          [
            "title",
            "Public title / Herkese açık başlık",
            60,
            TextInputStyle.Short,
          ],
          [
            "warning",
            "Public warning / Herkese açık uyarı",
            120,
            TextInputStyle.Short,
          ],
          [
            "body",
            "Private reveal / Özel gösterilecek metin",
            600,
            TextInputStyle.Paragraph,
          ],
        ] as const
      ).map(([key, label, max, style]) =>
        new LabelBuilder()
          .setLabel(label)
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId(key)
              .setStyle(style)
              .setMaxLength(max)
              .setMinLength(1)
              .setRequired(true),
          ),
      ),
    );
}
export function publicCard(card: Card) {
  return {
    content: `SpoilerLeaf\n${escapeMarkdown(card.title)}\nWarning / Uyarı: ${escapeMarkdown(card.warning)}\n\nReveal sends this card's text privately. Only click if you want the spoiler.\nGöster, bu kartın metnini özel yanıtla açar. Yalnızca spoilerı görmek istiyorsanız tıklayın.\nExpires / Sona erer: <t:${Math.floor(card.until / 1000)}:R>`,
    components: [
      row(
        [
          `sl:reveal:${card.id}`,
          "Reveal spoiler / Spoilerı göster",
          ButtonStyle.Primary,
        ],
        [
          `sl:close:${card.id}`,
          "Close / Kapat (manager)",
          ButtonStyle.Secondary,
        ],
      ),
    ],
    allowedMentions: noMentions,
    flags: 4 as const,
  };
}
export function preview(content: Content, id: string) {
  return {
    content: `PRIVATE PREVIEW / ÖZEL ÖNİZLEME\nPublic title / Açık başlık: ${escapeMarkdown(content.title)}\nPublic warning / Açık uyarı: ${escapeMarkdown(content.warning)}\n\nPRIVATE REVEAL TEXT / ÖZEL AÇILACAK METİN:\n${escapeMarkdown(content.body)}\n\nPublish only after human review. Anyone with channel access can choose Reveal for two hours.\nİnsan incelemesinden sonra yayımlayın. Kanalı gören herkes iki saat boyunca Göster'i seçebilir.`,
    components: [
      row(
        [`sl:publish:${id}`, "Publish / Yayımla", ButtonStyle.Success],
        [`sl:cancel:${id}`, "Cancel / Vazgeç", ButtonStyle.Secondary],
      ),
    ],
    allowedMentions: noMentions,
  };
}
