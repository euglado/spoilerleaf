import { randomUUID } from "node:crypto";

export class UserError extends Error {}
export type Scope = { user: string; guild: string; channel: string };
export type Content = { title: string; warning: string; body: string };
type Ticket = Scope & {
  until: number;
  kind: "form" | "preview" | "close";
  content?: Content;
  card?: string;
};
export type Card = Content & {
  id: string;
  guild: string;
  channel: string;
  message: string;
  until: number;
};

export function validate(input: Content): Content {
  const result = {
    title: input.title.trim(),
    warning: input.warning.trim(),
    body: input.body.trim(),
  };
  for (const [value, max] of [
    [result.title, 60],
    [result.warning, 120],
    [result.body, 600],
  ] as const) {
    if (
      !value ||
      value.length > max ||
      [...value].some((char) => {
        const n = char.codePointAt(0) ?? 0;
        return (
          n < 9 ||
          (n >= 11 && n < 32) ||
          n === 127 ||
          (n >= 0x202a && n <= 0x202e) ||
          (n >= 0x2066 && n <= 0x2069)
        );
      })
    ) {
      throw new UserError(
        "Check text lengths and remove control characters. / Metin uzunluğunu kontrol edin, kontrol karakterlerini kaldırın.",
      );
    }
  }
  if (/[\r\n]/u.test(result.title + result.warning))
    throw new UserError(
      "Title and warning must each be one line. / Başlık ve uyarı tek satır olmalı.",
    );
  return result;
}

export class Store {
  private tickets = new Map<string, Ticket>();
  private cards = new Map<string, Card>();
  private limits = new Map<string, number>();
  private publishing = false;
  private lastPublish = Number.NEGATIVE_INFINITY;
  constructor(private now: () => number = Date.now) {}

  sweep(): void {
    const now = this.now();
    for (const [id, item] of this.tickets)
      if (item.until <= now) this.tickets.delete(id);
    for (const [id, item] of this.cards)
      if (item.until <= now) this.cards.delete(id);
    for (const [id, until] of this.limits)
      if (until <= now) this.limits.delete(id);
  }

  throttle(user: string, kind: "form" | "read"): void {
    this.sweep();
    const key = `${kind}:${user}`;
    if (this.limits.has(key))
      throw new UserError("Please wait a moment. / Lütfen biraz bekleyin.");
    if (this.limits.size >= 2000)
      throw new UserError("Bot busy; try later. / Bot meşgul; sonra deneyin.");
    this.limits.set(key, this.now() + (kind === "form" ? 10000 : 2000));
  }

  ticket(
    scope: Scope,
    kind: Ticket["kind"],
    content?: Content,
    card?: string,
  ): string {
    this.sweep();
    if (this.tickets.size >= 50)
      throw new UserError(
        "Too many previews; try later. / Çok fazla önizleme; sonra deneyin.",
      );
    const id = randomUUID();
    this.tickets.set(id, {
      ...scope,
      kind,
      until: this.now() + 600000,
      ...(content ? { content } : {}),
      ...(card ? { card } : {}),
    });
    return id;
  }

  consume(id: string, scope: Scope, kind?: Ticket["kind"]): Ticket {
    this.sweep();
    const item = this.tickets.get(id);
    if (
      !item ||
      item.user !== scope.user ||
      item.guild !== scope.guild ||
      item.channel !== scope.channel ||
      (kind && item.kind !== kind)
    )
      throw new UserError(
        "This preview expired or belongs elsewhere. Start again. / Önizleme süresi doldu veya size ait değil. Yeniden başlayın.",
      );
    this.tickets.delete(id);
    return item;
  }

  get(id: string, scope: Scope, message: string): Card {
    this.sweep();
    const item = this.cards.get(id);
    if (
      !item ||
      item.guild !== scope.guild ||
      item.channel !== scope.channel ||
      item.message !== message
    )
      throw new UserError(
        "Card closed, expired or unavailable after restart. / Kart kapalı, süresi dolmuş veya yeniden başlatma sonrası kullanılamıyor.",
      );
    return item;
  }

  async publish(
    id: string,
    scope: Scope,
    send: (card: Card) => Promise<string>,
  ): Promise<Card> {
    const ticket = this.consume(id, scope, "preview");
    if (!ticket.content) throw new Error("Missing preview content");
    if (
      this.publishing ||
      this.cards.size >= 10 ||
      this.now() - this.lastPublish < 60000
    )
      throw new UserError(
        "Wait one minute; at most ten active cards. Preview consumed; start again. / Bir dakika bekleyin; en fazla on etkin kart. Yeniden önizleyin.",
      );
    this.publishing = true;
    // Reserve cooldown before network work: even an ambiguous API failure must not trigger a duplicate retry.
    this.lastPublish = this.now();
    const card: Card = {
      ...ticket.content,
      id: randomUUID(),
      guild: scope.guild,
      channel: scope.channel,
      message: "",
      until: this.now() + 7200000,
    };
    try {
      card.message = await send(card);
      this.cards.set(card.id, card);
      return card;
    } finally {
      this.publishing = false;
    }
  }

  close(id: string, scope: Scope): Card {
    const ticket = this.consume(id, scope, "close");
    const card = ticket.card ? this.cards.get(ticket.card) : undefined;
    if (!card || card.guild !== scope.guild || card.channel !== scope.channel)
      throw new UserError(
        "Card already unavailable. / Kart artık kullanılamıyor.",
      );
    this.cards.delete(card.id);
    for (const [key, item] of this.tickets)
      if (item.card === card.id) this.tickets.delete(key);
    return card;
  }
}
