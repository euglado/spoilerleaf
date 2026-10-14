import assert from "node:assert/strict";
import test from "node:test";
import { Store, UserError, validate } from "../dist/model.js";
import { form, preview, publicCard } from "../dist/ui.js";

const scope = { user: "reader", guild: "server", channel: "channel" };
const text = {
  title: "Book chapter 5",
  warning: "Ending revealed",
  body: "SECRET BODY ONLY",
};
function fixture() {
  let now = 1000000;
  const store = new Store(() => now);
  return {
    store,
    advance: (ms) => {
      now += ms;
    },
    draft: () => store.ticket(scope, "preview", text),
  };
}

test("validation trims text without changing internal lines", () => {
  assert.deepEqual(validate({ title: " A ", warning: " B ", body: " C\nD " }), {
    title: "A",
    warning: "B",
    body: "C\nD",
  });
});
for (const [field, size] of [
  ["title", 60],
  ["warning", 120],
  ["body", 600],
]) {
  test(`${field} rejects empty input`, () =>
    assert.throws(() => validate({ ...text, [field]: "  " }), UserError));
  test(`${field} rejects overlong input`, () =>
    assert.throws(
      () => validate({ ...text, [field]: "x".repeat(size + 1) }),
      UserError,
    ));
  test(`${field} accepts boundary length`, () =>
    assert.equal(
      validate({ ...text, [field]: "x".repeat(size) })[field].length,
      size,
    ));
}
for (const bad of ["\u0000", "\u001b", "\u202e", "\u2066"]) {
  test(`control U+${bad.codePointAt(0).toString(16)} rejected`, () =>
    assert.throws(() => validate({ ...text, body: `a${bad}b` }), UserError));
}
test("public headings reject line breaks", () => {
  for (const field of ["title", "warning"])
    assert.throws(() => validate({ ...text, [field]: "a\nb" }), UserError);
});
test("public card contains no body or reader identity", () => {
  const payload = publicCard({
    ...text,
    id: "random",
    message: "m",
    guild: "g",
    channel: "c",
    until: 1000000,
  });
  const serialized = JSON.stringify(payload);
  assert(!serialized.includes(text.body));
  assert(!serialized.includes("reader"));
  assert.deepEqual(payload.allowedMentions.parse, []);
  assert.equal(payload.flags, 4);
});
test("worst-case escaped text fits Discord limits", () => {
  const content = validate({
    title: "*".repeat(60),
    warning: "*".repeat(120),
    body: "*".repeat(600),
  });
  assert(preview(content, "random").content.length <= 2000);
  assert(
    publicCard({ ...content, id: "random", until: 1000000 }).content.length <=
      2000,
  );
});
test("form uses current Label wrappers and bounded inputs", () => {
  const payload = form("nonce").toJSON();
  assert.equal(payload.components.length, 3);
  for (const component of payload.components) {
    assert.equal(component.type, 18);
    assert.equal(component.component.type, 4);
    assert(component.component.max_length <= 600);
    assert.equal(component.component.required, true);
  }
});
test("tickets are random and single use", () => {
  const { store, draft } = fixture();
  const a = draft();
  const b = draft();
  assert.notEqual(a, b);
  assert.equal(store.consume(a, scope, "preview").content.body, text.body);
  assert.throws(() => store.consume(a, scope), UserError);
});
for (const field of ["user", "guild", "channel"]) {
  test(`ticket cannot cross ${field}`, () => {
    const { store, draft } = fixture();
    const id = draft();
    assert.throws(
      () => store.consume(id, { ...scope, [field]: "wrong" }),
      UserError,
    );
    assert(store.consume(id, scope));
  });
}
test("wrong ticket phase does not consume preview", () => {
  const { store, draft } = fixture();
  const id = draft();
  assert.throws(() => store.consume(id, scope, "close"), UserError);
  assert(store.consume(id, scope, "preview"));
});
test("tickets expire at exact ten-minute boundary", () => {
  const { store, draft, advance } = fixture();
  const id = draft();
  advance(600000);
  assert.throws(() => store.consume(id, scope), UserError);
});
test("ticket memory is bounded and freed by expiry", () => {
  const { draft, advance } = fixture();
  for (let n = 0; n < 50; n++) draft();
  assert.throws(draft, UserError);
  advance(600000);
  assert(draft());
});
test("publication binds returned message and two-hour expiry", async () => {
  const { store, draft, advance } = fixture();
  const card = await store.publish(draft(), scope, async () => "message");
  assert.equal(store.get(card.id, scope, "message").body, text.body);
  assert.throws(() => store.get(card.id, scope, "copy"), UserError);
  assert.throws(
    () => store.get(card.id, { ...scope, channel: "copy" }, "message"),
    UserError,
  );
  assert.throws(
    () => store.get(card.id, { ...scope, guild: "copy" }, "message"),
    UserError,
  );
  assert.equal(
    store.get(card.id, { ...scope, user: "other" }, "message").body,
    text.body,
  );
  advance(7200000);
  assert.throws(() => store.get(card.id, scope, "message"), UserError);
});
test("same preview cannot send twice concurrently", async () => {
  const { store, draft } = fixture();
  const id = draft();
  let release;
  let calls = 0;
  const first = store.publish(id, scope, () => {
    calls++;
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  await assert.rejects(
    store.publish(id, scope, async () => "duplicate"),
    UserError,
  );
  release("first");
  await first;
  assert.equal(calls, 1);
});
test("different previews cannot race active publication", async () => {
  const { store, draft } = fixture();
  let release;
  const first = store.publish(
    draft(),
    scope,
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  await assert.rejects(
    store.publish(draft(), scope, async () => "duplicate"),
    UserError,
  );
  release("first");
  await first;
});
test("failed send consumes preview and preserves publication cooldown", async () => {
  const { store, draft, advance } = fixture();
  const id = draft();
  await assert.rejects(
    store.publish(id, scope, async () => {
      throw new Error("network");
    }),
  );
  await assert.rejects(
    store.publish(id, scope, async () => "no"),
    UserError,
  );
  await assert.rejects(
    store.publish(draft(), scope, async () => "no"),
    UserError,
  );
  advance(60000);
  assert(await store.publish(draft(), scope, async () => "yes"));
});
test("ten-card capacity cannot be exceeded; closing frees a slot", async () => {
  const { store, draft, advance } = fixture();
  let first;
  for (let n = 0; n < 10; n++) {
    const card = await store.publish(draft(), scope, async () => `m${n}`);
    first ??= card;
    advance(60000);
  }
  await assert.rejects(
    store.publish(draft(), scope, async () => "overflow"),
    UserError,
  );
  store.close(store.ticket(scope, "close", undefined, first.id), scope);
  assert(await store.publish(draft(), scope, async () => "new"));
});
test("confirmed closure removes card and all outstanding closure tickets", async () => {
  const { store, draft } = fixture();
  const card = await store.publish(draft(), scope, async () => "m");
  const first = store.ticket(scope, "close", undefined, card.id);
  const second = store.ticket(scope, "close", undefined, card.id);
  store.close(first, scope);
  assert.throws(() => store.get(card.id, scope, "m"), UserError);
  assert.throws(() => store.close(second, scope), UserError);
});
test("restart never reconstructs hidden text from public card", async () => {
  const { store, draft } = fixture();
  const card = await store.publish(draft(), scope, async () => "m");
  assert.throws(() => new Store().get(card.id, scope, "m"), UserError);
});
test("reader and form throttles have separate short lifetimes", () => {
  const { store, advance } = fixture();
  store.throttle("a", "read");
  store.throttle("a", "form");
  assert.throws(() => store.throttle("a", "read"), UserError);
  advance(2000);
  store.throttle("a", "read");
  assert.throws(() => store.throttle("a", "form"), UserError);
  advance(8000);
  store.throttle("a", "form");
});
test("rate-limit memory has a hard cap and expiry cleanup", () => {
  const { store, advance } = fixture();
  for (let n = 0; n < 2000; n++) store.throttle(`user${n}`, "read");
  assert.throws(() => store.throttle("overflow", "read"), UserError);
  advance(2000);
  store.throttle("overflow", "read");
});
