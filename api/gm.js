// Proxy hacia la API de Guerrilla Mail (respaldo cuando mail.tm no responde).
const UPSTREAM = "https://api.guerrillamail.com/ajax.php";
const FUNCS = new Set(["get_email_address", "set_email_user", "check_email", "get_email_list", "fetch_email", "forget_me", "del_email"]);
const PARAMS = new Set(["f", "sid_token", "email_user", "seq", "offset", "email_id", "email_addr", "lang"]);

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const f = url.searchParams.get("f") || "";
    if (!FUNCS.has(f)) return send(res, 400, { detail: "Función no permitida" });
    const qs = new URLSearchParams();
    for (const [k, v] of url.searchParams) if (PARAMS.has(k)) qs.set(k, v.slice(0, 200));
    const ip = String(req.headers["x-forwarded-for"] || "127.0.0.1").split(",")[0].trim();
    qs.set("ip", ip);
    qs.set("agent", String(req.headers["user-agent"] || "generadorcorreos").slice(0, 120));
    const up = await fetch(UPSTREAM + "?" + qs.toString(), { headers: { Accept: "application/json", "User-Agent": "generadorcorreos/1.0" } });
    const text = await up.text();
    if (up.status >= 400) return send(res, up.status, { detail: "Guerrilla Mail respondió " + up.status });
    try { JSON.parse(text); } catch (e) { return send(res, 502, { detail: "Respuesta inesperada de Guerrilla Mail", sample: text.slice(0, 200) }); }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(text);
  } catch (e) {
    send(res, 502, { detail: "No se pudo contactar con Guerrilla Mail", error: String(e && e.message || e) });
  }
};
