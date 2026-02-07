const BOARD_KEY = "board-state";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

function emptyResponse(status = 204) {
  return new Response(null, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

export async function onRequestOptions() {
  return emptyResponse(204);
}

export async function onRequestGet({ env }) {
  if (!env.BOARD_KV) return jsonResponse({ error: "KV not configured" }, 500);
  const raw = await env.BOARD_KV.get(BOARD_KEY);
  if (!raw) return emptyResponse(204);
  try {
    const state = JSON.parse(raw);
    return jsonResponse({ state, updatedAt: new Date().toISOString() });
  } catch (error) {
    return jsonResponse({ error: "Invalid stored state" }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.BOARD_KV) return jsonResponse({ error: "KV not configured" }, 500);
  const adminKey = request.headers.get("x-admin-key");
  if (!adminKey || adminKey !== env.ADMIN_KEY) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const payload = await request.json();
  if (!payload || !payload.state) {
    return jsonResponse({ error: "Missing state" }, 400);
  }
  await env.BOARD_KV.put(BOARD_KEY, JSON.stringify(payload.state));
  return jsonResponse({ ok: true });
}
