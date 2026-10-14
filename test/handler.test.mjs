import assert from "node:assert/strict";
import test from "node:test";
import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { genericError, handle } from "../dist/handler.js";
import { Store } from "../dist/model.js";

const guild = "123456789012345678";
const secret = "PRIVATE PLOT ENDING";
function fixture() {
  let now = 1000000;
  const store = new Store(() => now);
  const sent = [];
  const edited = [];
  const channel = {
    type: ChannelType.GuildText,
    send: async (payload) => {
      sent.push(payload);
      return { id: "original" };
    },
    messages: {
      edit: async (id, payload) => {
        edited.push({ id, payload });
      },
    },
  };
  function interaction(kind, options = {}) {
    const calls = [];
    const i = {
      commandName: "spoilerleaf",
      customId: "",
      guildId: guild,
      channelId: "channel",
      channel,
      user: { id: "owner" },
      client: { user: { id: "bot" } },
      memberPermissions: new PermissionsBitField(
        PermissionFlagsBits.ManageGuild,
      ),
      appPermissions: new PermissionsBitField([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
      ]),
      message: { id: "original", author: { id: "bot" }, webhookId: null },
      inGuild: () => true,
      isChatInputCommand: () => kind === "command",
      isModalSubmit: () => kind === "modal",
      isButton: () => kind === "button",
      fields: {
        getTextInputValue: (key) =>
          ({ title: "Chapter 5", warning: "Ending spoilers", body: secret })[
            key
          ],
      },
      replied: false,
      deferred: false,
      showModal: async (payload) => {
        calls.push({ method: "modal", payload });
        i.replied = true;
      },
      reply: async (payload) => {
        calls.push({ method: "reply", payload });
        i.replied = true;
      },
      update: async (payload) => {
        calls.push({ method: "update", payload });
        i.replied = true;
      },
      deferUpdate: async () => {
        calls.push({ method: "defer" });
        i.deferred = true;
      },
      editReply: async (payload) => {
        calls.push({ method: "edit", payload });
      },
      ...options,
    };
    return { i, calls, run: () => handle(i, store, guild) };
  }
  const control = (call, index = 0) =>
    call.payload.components[0].toJSON().components[index].custom_id;
  async function draft() {
    const command = interaction("command");
    await command.run();
    const modal = interaction("modal", {
      customId: command.calls[0].payload.toJSON().custom_id,
    });
    await modal.run();
    return {
      modal,
      publish: control(modal.calls[0]),
      cancel: control(modal.calls[0], 1),
    };
  }
  async function published() {
    const item = await draft();
    const publish = interaction("button", { customId: item.publish });
    await publish.run();
    return {
      ...item,
      publish,
      reveal: sent[0].components[0].toJSON().components[0].custom_id,
      close: sent[0].components[0].toJSON().components[1].custom_id,
    };
  }
  return {
    store,
    interaction,
    control,
    draft,
    published,
    sent,
    edited,
    channel,
    advance: (ms) => {
      now += ms;
    },
  };
}
function privateReply(call) {
  assert(call.payload.flags & MessageFlags.Ephemeral);
  assert.deepEqual(call.payload.allowedMentions.parse, []);
}

test("manager receives Label form then private preview", async () => {
  const f = fixture();
  const d = await f.draft();
  privateReply(d.modal.calls[0]);
  assert(d.modal.calls[0].payload.content.includes(secret));
  assert.equal(f.sent.length, 0);
});
test("explicit publication omits spoiler and private reveal returns it only to clicker", async () => {
  const f = fixture();
  const p = await f.published();
  assert(!JSON.stringify(f.sent).includes(secret));
  assert.equal(p.publish.calls[0].method, "defer");
  const read = f.interaction("button", {
    customId: p.reveal,
    user: { id: "reader" },
    memberPermissions: new PermissionsBitField(),
  });
  await read.run();
  privateReply(read.calls[0]);
  assert(read.calls[0].payload.content.includes(secret));
  assert.equal(f.sent.length, 1);
});
test("cancel erases draft and leaves channel untouched", async () => {
  const f = fixture();
  const d = await f.draft();
  const cancel = f.interaction("button", { customId: d.cancel });
  await cancel.run();
  assert.equal(cancel.calls[0].method, "update");
  const publish = f.interaction("button", { customId: d.publish });
  await publish.run();
  assert.equal(f.sent.length, 0);
  assert(publish.calls.at(-1).payload.content.includes("expired"));
});
for (const scenario of ["dm", "wrong guild", "thread", "no channel"]) {
  test(`command rejects ${scenario}`, async () => {
    const f = fixture();
    const options =
      scenario === "dm"
        ? { inGuild: () => false }
        : scenario === "wrong guild"
          ? { guildId: "other" }
          : scenario === "thread"
            ? { channel: { type: ChannelType.PublicThread } }
            : { channelId: null };
    const x = f.interaction("command", options);
    await x.run();
    privateReply(x.calls[0]);
    assert.equal(x.calls[0].method, "reply");
    assert.equal(f.sent.length, 0);
  });
}
test("non-manager cannot create a card", async () => {
  const f = fixture();
  const x = f.interaction("command", {
    memberPermissions: new PermissionsBitField(),
  });
  await x.run();
  assert(x.calls[0].payload.content.includes("Manage Server"));
});
test("bot Send Messages permission is required", async () => {
  const f = fixture();
  const x = f.interaction("command", {
    appPermissions: new PermissionsBitField(PermissionFlagsBits.ViewChannel),
  });
  await x.run();
  assert(x.calls[0].payload.content.includes("Send Messages"));
});
test("permission removed after preview blocks publication", async () => {
  const f = fixture();
  const d = await f.draft();
  const x = f.interaction("button", {
    customId: d.publish,
    memberPermissions: new PermissionsBitField(),
  });
  await x.run();
  privateReply(x.calls[0]);
  assert.equal(f.sent.length, 0);
});
test("another user cannot publish copied preview control", async () => {
  const f = fixture();
  const d = await f.draft();
  const x = f.interaction("button", {
    customId: d.publish,
    user: { id: "thief" },
  });
  await x.run();
  assert.equal(f.sent.length, 0);
  assert(x.calls.at(-1).payload.content.includes("belongs elsewhere"));
});
test("invalid or replayed modal cannot create a preview", async () => {
  const f = fixture();
  const d = await f.draft();
  const replay = f.interaction("modal", { customId: d.modal.i.customId });
  await replay.run();
  assert(!replay.calls[0].payload.content.includes(secret));
  assert.equal(replay.calls[0].payload.components, undefined);
});
for (const scenario of ["message", "author", "webhook", "channel"]) {
  test(`copied reveal rejects changed ${scenario}`, async () => {
    const f = fixture();
    const p = await f.published();
    const message = { id: "original", author: { id: "bot" }, webhookId: null };
    if (scenario === "message") message.id = "copy";
    if (scenario === "author") message.author.id = "other";
    if (scenario === "webhook") message.webhookId = "webhook";
    const x = f.interaction("button", {
      customId: p.reveal,
      message,
      ...(scenario === "channel" ? { channelId: "copy" } : {}),
    });
    await x.run();
    privateReply(x.calls[0]);
    assert(!x.calls[0].payload.content.includes(secret));
  });
}
test("expired card responds privately without content", async () => {
  const f = fixture();
  const p = await f.published();
  f.advance(7200000);
  const x = f.interaction("button", { customId: p.reveal });
  await x.run();
  privateReply(x.calls[0]);
  assert(x.calls[0].payload.content.includes("expired"));
  assert(!x.calls[0].payload.content.includes(secret));
});
test("non-manager cannot close a card", async () => {
  const f = fixture();
  const p = await f.published();
  const x = f.interaction("button", {
    customId: p.close,
    memberPermissions: new PermissionsBitField(),
  });
  await x.run();
  assert(x.calls[0].payload.content.includes("Manage Server"));
  assert.equal(f.edited.length, 0);
});
test("closing requires private confirmation; permission is checked again", async () => {
  const f = fixture();
  const p = await f.published();
  const ask = f.interaction("button", { customId: p.close });
  await ask.run();
  privateReply(ask.calls[0]);
  assert.equal(f.edited.length, 0);
  const deny = f.interaction("button", {
    customId: f.control(ask.calls[0]),
    memberPermissions: new PermissionsBitField(),
  });
  await deny.run();
  assert.equal(f.edited.length, 0);
  const confirm = f.interaction("button", {
    customId: f.control(ask.calls[0]),
  });
  await confirm.run();
  assert.equal(f.edited[0].id, "original");
  assert.deepEqual(f.edited[0].payload.components, []);
  const read = f.interaction("button", { customId: p.reveal });
  await read.run();
  assert(!read.calls[0].payload.content.includes(secret));
});
test("failed public edit still erases text and explains manual cleanup", async () => {
  const f = fixture();
  const p = await f.published();
  const ask = f.interaction("button", { customId: p.close });
  await ask.run();
  f.channel.messages.edit = async () => {
    throw new Error("private external payload");
  };
  const confirm = f.interaction("button", {
    customId: f.control(ask.calls[0]),
  });
  await confirm.run();
  assert(confirm.calls.at(-1).payload.content.includes("delete it manually"));
  const read = f.interaction("button", { customId: p.reveal });
  await read.run();
  assert(!read.calls[0].payload.content.includes(secret));
});
test("network publication errors never expose submitted text or raw exceptions", async () => {
  const f = fixture();
  const d = await f.draft();
  f.channel.send = async () => {
    throw new Error(`external ${secret}`);
  };
  const x = f.interaction("button", { customId: d.publish });
  await x.run();
  assert.equal(x.calls.at(-1).payload.content, genericError);
  assert(!JSON.stringify(x.calls).includes(secret));
});
test("unrelated interactions are ignored", async () => {
  const f = fixture();
  for (const x of [
    f.interaction("command", { commandName: "other" }),
    f.interaction("button", { customId: "other:control" }),
    f.interaction("unknown"),
  ]) {
    await x.run();
    assert.equal(x.calls.length, 0);
  }
});
test("malformed control fails safely", async () => {
  const f = fixture();
  const x = f.interaction("button", { customId: "sl:reveal:bad:extra" });
  await x.run();
  privateReply(x.calls[0]);
  assert(x.calls[0].payload.content.includes("Invalid control"));
});
