// Protecciones comunes de los proxys de correo.
// Vercel no publica como ruta los archivos de /api que empiezan con "_".

// Límite por IP en memoria: frena abusos simples. Cada instancia de la función
// lleva su propia cuenta, así que es un freno "de mejor esfuerzo", no un muro.
const hits = new Map();
const WINDOW_MS = 60 * 1000;

function clientIp(req) {
  return String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "anon").split(",")[0].trim();
}

function rateLimited(req, bucket, max) {
  const now = Date.now();
  const key = bucket + "|" + clientIp(req);
  const entry = hits.get(key);
  if (!entry || now - entry.start > WINDOW_MS) { hits.set(key, { start: now, n: 1 }); }
  else if (++entry.n > max) return true;
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k);
  return false;
}

// Solo aceptamos pedidos hechos desde esta misma página: así nadie puede usar
// nuestro servidor como intermediario gratis desde otro sitio web.
function sameOrigin(req) {
  const site = req.headers["sec-fetch-site"];
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = req.headers.origin;
  if (origin) {
    try { if (new URL(origin).host !== req.headers.host) return false; } catch (e) { return false; }
  }
  return true;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(obj));
}

// Devuelve true si el pedido puede seguir; si no, ya respondió con el error.
function guard(req, res, { bucket, max }) {
  if (!sameOrigin(req)) { send(res, 403, { detail: "Pedido de otro sitio rechazado" }); return false; }
  if (rateLimited(req, bucket, max)) {
    res.setHeader("Retry-After", "60");
    send(res, 429, { detail: "Demasiados pedidos seguidos. Esperá un minuto y probá de nuevo." });
    return false;
  }
  return true;
}

module.exports = { guard, send, rateLimited };
