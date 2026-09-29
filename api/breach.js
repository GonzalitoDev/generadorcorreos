// Busca si un mail aparece en filtraciones de datos conocidas, usando la API
// pública y gratuita de XposedOrNot (https://xposedornot.com).
// No guardamos el mail: solo lo pasamos al servicio y devolvemos la respuesta.
const { guard, send } = require("./_guard");
const UPSTREAM = "https://api.xposedornot.com/v1/check-email/";
const EMAIL = /^[^\s@]{1,64}@[a-z0-9.-]{1,185}\.[a-z]{2,24}$/;

module.exports = async function handler(req, res) {
  try {
    if (!guard(req, res, { bucket: "breach", max: 12 })) return;
    if (req.method && req.method !== "GET") return send(res, 405, { detail: "Método no permitido" });
    const url = new URL(req.url, "http://localhost");
    const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
    if (!EMAIL.test(email)) return send(res, 400, { detail: "Escribí un mail válido" });

    const up = await fetch(UPSTREAM + encodeURIComponent(email), { headers: { Accept: "application/json", "User-Agent": "generadorcorreos/1.0" } });
    const text = await up.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) {}
    if (up.status === 404 || (data && /not found/i.test(String(data.Error || data.error || "")))) {
      return send(res, 200, { found: false, breaches: [] });
    }
    if (up.status === 429) return send(res, 429, { detail: "El servicio de filtraciones está saturado. Probá en un minuto." });
    if (!up.ok || !data) return send(res, 502, { detail: "El servicio de filtraciones no respondió bien (" + up.status + ")" });
    const list = Array.isArray(data.breaches) ? data.breaches.flat().filter((x) => typeof x === "string") : [];
    return send(res, 200, { found: list.length > 0, breaches: list.slice(0, 500) });
  } catch (e) {
    send(res, 502, { detail: "No se pudo contactar con el servicio de filtraciones" });
  }
};
