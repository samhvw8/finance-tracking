// Cloudflare Worker: serves the built SPA (./dist via ASSETS) and a small
// SheetDB-compatible JSON API backed by the Google Sheets API.
//
// The service-account key never reaches the browser — it lives only as the
// GOOGLE_SERVICE_ACCOUNT Worker secret. Every /api/* call must carry the
// shared password as `Authorization: Bearer <password>`.

import { readRows, appendRows } from "./sheets.mjs";

// Constant-time string comparison to avoid timing leaks on the password.
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function bearer(request) {
  const h = request.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.*)$/i);
  return m ? m[1] : "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Public image serving from R2 (no password — Google's servers fetch these
    // for =IMAGE(); keys are unguessable UUIDs).
    if (url.pathname.startsWith("/img/")) {
      const key = decodeURIComponent(url.pathname.slice("/img/".length));
      const obj = await env.IMAGES.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("etag", obj.httpEtag);
      headers.set("X-Robots-Tag", "noindex"); // keep receipts out of search indexes
      return new Response(obj.body, { headers });
    }

    if (url.pathname.startsWith("/api/")) {
      // Throttle by client IP so the password can't be brute-forced.
      if (env.API_LIMITER) {
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const { success } = await env.API_LIMITER.limit({ key: ip });
        if (!success) {
          return json({ error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }, 429);
        }
      }

      // Password gate — protects both reads and writes.
      if (!safeEqual(bearer(request), env.APP_PASSWORD || "")) {
        return json({ error: "Sai mật khẩu" }, 401);
      }

      // Verify the password (used by the settings screen).
      if (url.pathname === "/api/login") {
        return json({ ok: true });
      }

      // Read/append rows. GET ?sheet=&limit= ; POST { data, sheet }.
      if (url.pathname === "/api/rows") {
        if (request.method === "GET") {
          const sheet = url.searchParams.get("sheet");
          const limit = parseInt(url.searchParams.get("limit") || "0", 10);
          if (!sheet) return json({ error: "Missing sheet" }, 400);
          try {
            return json(await readRows(env, sheet, limit));
          } catch (err) {
            return json({ error: String(err.message || err) }, 502);
          }
        }

        if (request.method === "POST") {
          let body;
          try {
            body = await request.json();
          } catch {
            return json({ error: "Invalid JSON" }, 400);
          }
          const { data, sheet } = body || {};
          if (!sheet || !Array.isArray(data)) {
            return json({ error: "Missing data/sheet" }, 400);
          }
          try {
            return json(await appendRows(env, sheet, data));
          } catch (err) {
            return json({ error: String(err.message || err) }, 502);
          }
        }

        return json({ error: "Method not allowed" }, 405);
      }

      // Upload a captured image (data URL) to R2 -> returns a public /img URL.
      if (url.pathname === "/api/upload-image" && request.method === "POST") {
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        const m = String(body.dataUrl || "").match(
          /^data:(image\/[\w.+-]+);base64,(.+)$/
        );
        if (!m) return json({ error: "Invalid image data" }, 400);
        const contentType = m[1];
        const ext = (contentType.split("/")[1] || "jpg").replace("jpeg", "jpg");
        const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        const today = new Date().toISOString().slice(0, 10);
        const key = `receipts/${today}/${crypto.randomUUID()}.${ext}`;
        try {
          await env.IMAGES.put(key, bytes, {
            httpMetadata: { contentType },
          });
        } catch (err) {
          return json({ error: String(err.message || err) }, 502);
        }
        return json({ url: `${url.origin}/img/${key}`, key });
      }

      return json({ error: "Not found" }, 404);
    }

    // Everything else: the built SPA (with SPA fallback to index.html).
    return env.ASSETS.fetch(request);
  },
};
