// Proxy hacia la API de mail.tm para que el navegador solo hable con este mismo dominio
// (mail.tm no envía cabeceras CORS para otros orígenes).
const UPSTREAM = "https://api.mail.tm";
const ALLOWED = /^\/(domains|accounts|token|messages|me)(\/[A-Za-z0-9_-]+)?$/;

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") return Promise.resolve(req.body);
    if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString("utf8"));
    return Promise.resolve(JSON.stringify(req.body));
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => { data += c; });
    req.on("end", () => resolve(data));
    req.on("error", () => resolve(""));
  });
}

module.exports = async function handler(req, res) {
  try {
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
    let body;
    if (method === "POST" || method === "PATCH") {
      headers["Content-Type"] = method === "PATCH" ? "application/merge-patch+json" : "application/json";
      body = (await readBody(req)) || "{}";
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
