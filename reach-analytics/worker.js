const DEFAULT_ORIGINS = [
  "https://www.lefanlai.com",
  "https://lefanlai.com",
  "http://localhost:5173",
];

function allowedOrigins(env) {
  return new Set(
    (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(","))
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = allowedOrigins(env);
  return {
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : DEFAULT_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request, env, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function countryName(code) {
  if (!code) return "Unknown country";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function referrerHost(value) {
  if (!value) return "Direct";
  try {
    return new URL(value).hostname.replace(/^www\./, "") || "Direct";
  } catch {
    return "Direct";
  }
}

function safeText(value, maximum = 96) {
  return String(value || "").trim().slice(0, maximum);
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function collectVisit(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigins(env).has(origin)) return json(request, env, { error: "Origin not allowed" }, 403);

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 4096) return json(request, env, { error: "Payload too large" }, 413);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(request, env, { error: "Invalid JSON" }, 400);
  }

  const sessionId = safeText(payload.sessionId, 80);
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(sessionId)) {
    return json(request, env, { error: "Invalid session" }, 400);
  }

  const allowedPaths = new Set(["index", "news", "work", "reach", "about", "contact"]);
  const path = allowedPaths.has(payload.path) ? payload.path : "index";
  const device = ["desktop", "tablet", "mobile"].includes(payload.device) ? payload.device : "unknown";
  const cf = request.cf || {};
  const countryCode = safeText(cf.country, 2).toUpperCase();
  const visitedAt = Math.floor(Date.now() / 1000);
  const visitBucket = Math.floor(visitedAt / 3600);

  await env.DB.prepare(
    `INSERT OR IGNORE INTO visits (
      visited_at, visit_bucket, session_id, path, referrer_host, device,
      country_code, country, region, city, latitude, longitude
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      visitedAt,
      visitBucket,
      sessionId,
      path,
      referrerHost(payload.referrer),
      device,
      countryCode,
      countryName(countryCode),
      safeText(cf.region, 80),
      safeText(cf.city, 80),
      numeric(cf.latitude),
      numeric(cf.longitude),
    )
    .run();

  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

function rangeSeconds(range) {
  return range === "24h" ? 86400 : range === "7d" ? 604800 : 2592000;
}

async function summary(request, env) {
  const range = new URL(request.url).searchParams.get("range") || "30d";
  const now = Math.floor(Date.now() / 1000);
  const rangeStart = now - rangeSeconds(range);
  const dayStart = now - 86400;
  const weekStart = now - 604800;

  const results = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS value FROM visits"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM visits WHERE visited_at >= ?").bind(dayStart),
    env.DB.prepare("SELECT COUNT(*) AS value FROM visits WHERE visited_at >= ?").bind(weekStart),
    env.DB.prepare("SELECT COUNT(DISTINCT country_code) AS value FROM visits WHERE country_code <> ''"),
    env.DB.prepare(
      `SELECT city, country, country_code AS countryCode,
        ROUND(AVG(latitude), 4) AS latitude,
        ROUND(AVG(longitude), 4) AS longitude,
        COUNT(*) AS visits
      FROM visits
      WHERE visited_at >= ? AND city <> '' AND latitude IS NOT NULL AND longitude IS NOT NULL
      GROUP BY city, country, country_code
      ORDER BY visits DESC
      LIMIT 24`,
    ).bind(rangeStart),
    env.DB.prepare(
      `SELECT city, country, path, visited_at AS visitedAt
      FROM visits
      ORDER BY visited_at DESC
      LIMIT 8`,
    ),
  ]);

  const value = (index) => Number(results[index]?.results?.[0]?.value || 0);
  const locations = results[4]?.results || [];
  const recent = (results[5]?.results || []).map((visit) => ({
    ...visit,
    visitedAt: new Date(Number(visit.visitedAt) * 1000).toISOString(),
    path: visit.path === "work" ? "Publications" : visit.path === "index" ? "Overview" : `${visit.path.charAt(0).toUpperCase()}${visit.path.slice(1)}`,
  }));

  return json(request, env, {
    summary: {
      total: value(0),
      day: value(1),
      week: value(2),
      countries: value(3),
    },
    locations,
    recent,
    generatedAt: new Date().toISOString(),
  });
}

export default {
  async fetch(request, env) {
    if (!env.DB) return json(request, env, { error: "D1 binding DB is missing" }, 503);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (request.method === "POST" && url.pathname === "/collect") return collectVisit(request, env);
    if (request.method === "GET" && url.pathname === "/summary") return summary(request, env);
    if (request.method === "GET" && url.pathname === "/health") return json(request, env, { ok: true });
    return json(request, env, { error: "Not found" }, 404);
  },
};
