// Proxy hacia la API de mail.tm para que el navegador solo hable con este mismo dominio
// (mail.tm no envía cabeceras CORS para otros orígenes).
const { guard, send, rateLimited } = require("./_guard");
const UPSTREAM = "https://api.mail.tm";
const MAX_BODY = 4 * 1024;
const ALLOWED = /^\/(domains|accounts|token|messages|me)(\/[A-Za-z0-9_-]+)?$/;

function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") return Promise.resolve(req.body);
    if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString("utf8"));
    return Promise.resolve(JSON.stringify(req.body));
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > MAX_BODY) { resolve(data); req.destroy(); } });
    req.on("end", () => resolve(data));
    req.on("error", () => resolve(""));
  });
}

module.exports = async function handler(req, res) {
  try {
    if (!guard(req, res, { bucket: "mail", max: 90 })) return;
    const url = new URL(req.url, "http://localhost");
    const path = url.searchParams.get("path") || "";
    let target;
    try { target = new URL(path, UPSTREAM); } catch (e) { target = null; }
    if (!target || target.origin !== UPSTREAM || !ALLOWED.test(target.pathname)) {
      return send(res, 400, { detail: "Ruta no permitida" });
    }
    const method = (req.method || "GET").toUpperCase();
    if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) {
      return send(res, 405, { detail: "Método no permitido" });
    }

    const headers = { "User-Agent": "generadorcorreos/1.0 (+https://generadorcorreos.vercel.app)" };
    if (req.headers.authorization) headers.Authorization = req.headers.authorization;
    // Crear buzones tiene un límite más bajo que leer la bandeja.
    if (method === "POST" && target.pathname === "/accounts" && rateLimited(req, "mail-create", 10)) {
      return send(res, 429, { detail: "Creaste muchos buzones seguidos. Esperá un minuto." });
    }
    let body;
    if (method === "POST" || method === "PATCH") {
      headers["Content-Type"] = method === "PATCH" ? "application/merge-patch+json" : "application/json";
      body = (await readBody(req)) || "{}";
      if (body.length > MAX_BODY) return send(res, 413, { detail: "Pedido demasiado grande" });
      try { JSON.parse(body); } catch (e) { return send(res, 400, { detail: "Pedido inválido" }); }
    }

    // Probamos primero JSON plano y, si el servicio falla, el formato JSON-LD por defecto de mail.tm.
    let up, text = "";
    for (const accept of ["application/json", "application/ld+json"]) {
      up = await fetch(target.toString(), { method, headers: { ...headers, Accept: accept }, body });
      text = await up.text();
      if (up.status < 500) break;
    }

    res.statusCode = up.status;
    res.setHeader("Cache-Control", "no-store");
    if (up.status === 204 || !text) {
      if (up.status >= 400) return send(res, up.status, { detail: "El servicio de correo respondió " + up.status });
      return res.end();
    }
    const ct = up.headers.get("content-type") || "";
    if (!/json/.test(ct)) {
      return send(res, up.status >= 400 ? up.status : 502, { detail: "Respuesta inesperada del servicio de correo (" + up.status + ")", sample: text.slice(0, 200) });
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(text);
  } catch (e) {
    send(res, 502, { detail: "No se pudo contactar con el servicio de correo", error: String(e && e.message || e) });
  }
};
