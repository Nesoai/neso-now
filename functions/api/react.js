/* Ratings for now.nesohq.com (update 14.4, a principal, 22 Nov 2026). Written by neso_live/digest.py; edit there.
   Needs a KV namespace bound to the Pages project as REACTIONS (Settings > Bindings), as on contractors.nesohq.com.
   Keys: v:<kind>:<id> -> {t, k, up, meh, down, first}; w:<hash> -> this visitor's vote on that item, kept 30 days.
   The hash is SHA-256 of the visitor's address and the item, so no address is stored. Totals only; no names. */
const KINDS = ["nws", "quake", "nhc", "agency", "fema", "tv", "question", "figure", "show"];
const R = ["up", "meh", "down"];
const H = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const out = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });
const KEY = /^([a-z]{2,10}):([0-9a-f]{12})$/;

async function hash(t) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet({ request, env }) {
  if (!env.REACTIONS) return out({ ok: false, error: "storage_not_set_up" }, 503);
  if (new URL(request.url).searchParams.get("ping")) return out({ ok: true });
  const items = [];
  let cursor;
  do {
    const page = await env.REACTIONS.list({ prefix: "v:", cursor, limit: 1000 });
    for (const k of page.keys) {
      const c = (await env.REACTIONS.get(k.name, "json")) || {};
      items.push({ key: k.name.slice(2), kind: c.k || "", title: c.t || "", up: c.up || 0, meh: c.meh || 0, down: c.down || 0, first: c.first || "" });
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor && items.length < 3000);
  return out({ ok: true, at: new Date().toISOString(), items });
}

export async function onRequestPost({ request, env }) {
  if (!env.REACTIONS) return out({ ok: false, error: "storage_not_set_up" }, 503);
  let b = {};
  try { b = await request.json(); } catch (e) { b = {}; }
  const id = String(b.v || ""), r = String(b.r || "");
  const m = KEY.exec(id);
  if (!m || !KINDS.includes(m[1]) || !R.includes(r)) return out({ ok: false, error: "bad_request" }, 400);
  const who = "w:" + (await hash((request.headers.get("CF-Connecting-IP") || "") + "|" + id + "|neso-now"));
  const prev = await env.REACTIONS.get(who);
  if (prev === r) return out({ ok: true, same: true });
  const key = "v:" + id;
  const c = (await env.REACTIONS.get(key, "json")) || { k: m[1], t: String(b.t || "").replace(/[<>]/g, "").slice(0, 140), first: new Date().toISOString().slice(0, 10) };
  c[r] = (c[r] || 0) + 1;
  if (prev && R.includes(prev) && (c[prev] || 0) > 0) c[prev] -= 1;
  await env.REACTIONS.put(key, JSON.stringify(c));
  await env.REACTIONS.put(who, r, { expirationTtl: 60 * 60 * 24 * 30 });
  return out({ ok: true });
}
