// Proxy hacia la API de mail.tm para que el navegador solo hable con este mismo dominio
// (evita bloqueos de CORS, extensiones y redes que filtran dominios de correo temporal).
const UPSTREAM = "https://api.mail.tm";
const ALLOWED = /^\/(domains|accounts|token|messages|me)(\/[A-Za-z0-9_-]+)?$/;

module.exports = async function handler(req, res) {
  let target;
  try { target = new URL(String(req.query.path || ""), UPSTREAM); } catch (e) { target = null; }
  if (!target || target.origin !== UPSTREAM || !ALLOWED.test(target.pathname)) {
    res.status(400).json({ detail: "Ruta no permitida" });
    return;
  }
  const method = req.method || "GET";
  if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) {
    res.status(405).json({ detail: "Método no permitido" });
    return;
  }
  const headers = { Accept: "application/json" };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  let body;
  if (method === "POST" || method === "PATCH") {
    headers["Content-Type"] = method === "PATCH" ? "application/merge-patch+json" : "application/json";
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  }
  try {
    const up = await fetch(target.toString(), { method, headers, body });
    const text = await up.text();
    res.setHeader("Cache-Control", "no-store");
    res.status(up.status);
    if (up.status === 204 || !text) { res.end(); return; }
    res.setHeader("Content-Type", up.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (e) {
    res.status(502).json({ detail: "No se pudo contactar con el servicio de correo" });
  }
};
