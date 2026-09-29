// Generador de Correos · código de la página (efectos + correo + herramientas)
"use strict";

/* ---------- Efectos: plasma de fondo y confeti ---------- */
(function () {
  const calmOS = matchMedia("(prefers-reduced-motion: reduce)").matches;
  try { if (localStorage.getItem("gc-calm") === "1") document.body.classList.add("calm"); } catch (e) {}
  const isCalm = () => calmOS || document.body.classList.contains("calm");
  const cv = document.getElementById("plasma"), ctx = cv.getContext("2d");
  const W = 96, H = 64; cv.width = W; cv.height = H;
  const img = ctx.createImageData(W, H);
  const pal = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 256 * Math.PI * 2;
    pal.push([ (Math.sin(t) * .5 + .5) * 255, (Math.sin(t + 2.1) * .5 + .5) * 120, (Math.sin(t + 4.2) * .5 + .5) * 255 ]);
  }
  let T = 0, last = 0;
  function frame(ms) {
    T += Math.min(.1, Math.max(0, (ms - last) / 1000)) * (document.body.classList.contains("party") ? 5 : 1); last = ms;
    const t = T;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = Math.sin(x / 9 + t) + Math.sin((y / 7 + t * .7)) + Math.sin((x + y) / 13 + t * .5) + Math.sin(Math.hypot(x - W / 2, y - H / 2) / 6 - t * 1.3);
      const c = pal[((v + 4) * 32 + t * 30) & 255], k = (y * W + x) * 4;
      img.data[k] = c[0] * .55; img.data[k + 1] = c[1] * .35; img.data[k + 2] = c[2] * .6; img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if (!isCalm() && !document.hidden) requestAnimationFrame(frame);
  }
  frame(0);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !isCalm()) requestAnimationFrame(frame); });
  window.restartPlasma = () => { if (!isCalm()) requestAnimationFrame(frame); };
  cv.style.imageRendering = "auto"; cv.style.filter = "blur(18px) saturate(1.4)"; cv.style.transform = "scale(1.1)";

  const cf = document.getElementById("confetti"), c2 = cf.getContext("2d");
  let bits = [], running = false;
  const colors = ["#ff2bd6", "#ff8a00", "#c6ff00", "#00f0ff", "#8b5cff", "#fff6fe"];
  function size() { cf.width = innerWidth * devicePixelRatio; cf.height = innerHeight * devicePixelRatio; }
  addEventListener("resize", size); size();
  window.boom = function (el) {
    if (isCalm()) return;
    const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
    const x = (r.left + r.width / 2) * devicePixelRatio, y = (r.top + r.height / 2) * devicePixelRatio;
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2, s = (3 + Math.random() * 9) * devicePixelRatio;
      bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6 * devicePixelRatio, r: Math.random() * 6, vr: Math.random() * .4 - .2,
        w: (5 + Math.random() * 7) * devicePixelRatio, h: (3 + Math.random() * 4) * devicePixelRatio, c: colors[i % colors.length], life: 90 + Math.random() * 40 });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  };
  function tick() {
    c2.clearRect(0, 0, cf.width, cf.height);
    bits = bits.filter((b) => b.life-- > 0);
    for (const b of bits) {
      b.vy += .35 * devicePixelRatio; b.vx *= .985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      c2.save(); c2.translate(b.x, b.y); c2.rotate(b.r); c2.globalAlpha = Math.min(1, b.life / 30);
      c2.fillStyle = b.c; c2.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); c2.restore();
    }
    if (bits.length) requestAnimationFrame(tick); else { running = false; c2.clearRect(0, 0, cf.width, cf.height); }
  }

  /* ---------- Sonidos (sintetizados, sin archivos) ---------- */
  let ac = null, soundOn = true;
  try { soundOn = localStorage.getItem("gc-sound") !== "0"; } catch (e) {}
  function tone(freqs, dur, type, slide) {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + i * dur * .8;
        o.type = type || "square"; o.frequency.setValueAtTime(f, t0);
        if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t0 + dur);
        g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.08, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
        o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + .02);
      });
    } catch (e) {}
  }
  const sfx = {
    mail: () => tone([523, 659, 784, 1047], .12, "square"),
    pop: () => tone([880], .08, "triangle", 1.8),
    boing: () => tone([180], .35, "sine", 3.2),
    dice: () => tone([300, 420, 360, 520], .05, "square"),
    party: () => tone([130, 196, 261, 392, 523], .09, "sawtooth"),
  };

  /* ---------- Carta, la mascota ---------- */
  const buddy = document.getElementById("buddy"), bubble = document.getElementById("bubble");
  let bubbleT = null;
  function say(text, ms) {
    bubble.textContent = text; bubble.hidden = false;
    bubble.classList.remove("show"); void bubble.offsetWidth; bubble.classList.add("show");
    clearTimeout(bubbleT); bubbleT = setTimeout(() => { bubble.hidden = true; }, ms || 3200);
  }
  function jump(happy) {
    buddy.classList.remove("jump"); void buddy.offsetWidth; buddy.classList.add("jump");
    if (happy) { buddy.classList.add("happy"); setTimeout(() => buddy.classList.remove("happy"), 1600); }
  }
  buddy.addEventListener("animationend", () => buddy.classList.remove("jump"));
  const CHAMUYO = [
    "¡Hola! Soy Carta. Vivo acá y como spam.",
    "Si me tocás de nuevo, te cobro el envío.",
    "Dato: este mail se autodestruye si borrás el navegador.",
    "Dale, registrate en algo. Te espero con el código.",
    "Estoy nervioso, nunca me llega nada lindo.",
    "¿Probaste el modo fiesta? Es medio ilegal.",
    "El modo viaje no lo recomienda ningún médico.",
    "Tocá en cualquier lado de la página. Dale, animate.",
    "¿Discord no acepta el mail? Bajá a la parte de «sitios exigentes».",
    "Abajo hay un generador de contraseñas. Usá una distinta en cada lado.",
    "¿Necesitás un nick? Probá el estilo «Falopa». Es mi favorito.",
    "Escribí «falopa» en cualquier lado de la página. No te digo más.",
    "Mi primo es un telegrama. Está viejito.",
    "Cero spam en tu mail posta. De nada.",
  ];
  let pokes = 0;
  buddy.addEventListener("click", () => {
    pokes++; jump(true); sfx.boing(); window.boom(buddy);
    say(pokes > 6 && pokes % 7 === 0 ? "¡BASTA! Me mareaste 😵" : CHAMUYO[Math.floor(Math.random() * CHAMUYO.length)]);
  });
  // Los ojos siguen al cursor
  const pupils = [...buddy.querySelectorAll(".pupil")];
  addEventListener("pointermove", (e) => {
    const r = buddy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .7;
    const a = Math.atan2(e.clientY - cy, e.clientX - cx), d = Math.min(4, Math.hypot(e.clientX - cx, e.clientY - cy) / 40);
    pupils.forEach((p) => p.setAttribute("transform", "translate(" + (Math.cos(a) * d).toFixed(1) + " " + (Math.sin(a) * d).toFixed(1) + ")"));
  }, { passive: true });

  /* ---------- Estela de chispas ---------- */
  let lastSpark = 0;
  const sparkColors = ["#ff2bd6", "#c6ff00", "#00f0ff", "#ff8a00", "#8b5cff"];
  addEventListener("pointermove", (e) => {
    if (isCalm()) return;
    const now = performance.now(); if (now - lastSpark < 28) return; lastSpark = now;
    const s = document.createElement("span"); s.className = "spark";
    s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
    s.style.background = sparkColors[Math.floor(Math.random() * sparkColors.length)];
    s.style.boxShadow = "0 0 8px " + s.style.background;
    document.body.appendChild(s); setTimeout(() => s.remove(), 800);
  }, { passive: true });

  /* ---------- Modo fiesta y sonido ---------- */
  const partyBtn = document.getElementById("party"), soundBtn = document.getElementById("sound");
  function setParty(on) {
    document.body.classList.toggle("party", on); partyBtn.setAttribute("aria-pressed", on);
    partyBtn.textContent = on ? "Fiesta: ON" : "Modo fiesta";
    if (on && !isCalm()) { sfx.party(); window.boom(); setTimeout(() => window.boom(), 250); say("¡UNTZ UNTZ UNTZ! 🪩"); jump(true); }
  }
  partyBtn.addEventListener("click", () => { if (document.body.classList.contains("calm")) calmBtn.click(); setParty(!document.body.classList.contains("party")); });
  function paintSound() { soundBtn.setAttribute("aria-pressed", soundOn); soundBtn.textContent = soundOn ? "Sonido: sí" : "Sonido: no"; }
  soundBtn.addEventListener("click", () => { soundOn = !soundOn; paintSound(); try { localStorage.setItem("gc-sound", soundOn ? "1" : "0"); } catch (e) {} sfx.pop(); });
  paintSound();

  /* ---------- Título que baila ---------- */
  const h1 = document.querySelector("h1");
  h1.addEventListener("click", () => { h1.classList.remove("wobble"); void h1.offsetWidth; h1.classList.add("wobble"); window.boom(h1); sfx.pop(); });
  h1.addEventListener("animationend", (e) => { if (e.animationName === "wobble") h1.classList.remove("wobble"); });

  /* ---------- Easter egg: escribir «falopa» ---------- */
  let typed = "";
  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, select, textarea")) return;
    typed = (typed + (e.key || "").toLowerCase()).slice(-6);
    if (typed === "falopa") { setParty(true); if (!document.body.classList.contains("trip")) tripBtn.click(); rain(40); for (let i = 0; i < 5; i++) setTimeout(() => window.boom(), i * 180); say("🤯 Desbloqueaste el modo FALOPA TOTAL", 4000); typed = ""; }
  });

  /* ---------- Dado de nombres locos ---------- */
  const COSAS = ["milanesa", "carpincho", "pinguino", "alfajor", "empanada", "mapache", "dinosaurio", "fideo", "choripan", "ovni", "tortuga", "llama", "mate", "gato", "pato", "zapallo", "chancleta", "tostada"];
  const ONDA = ["turbo", "cosmico", "galactico", "ninja", "fachero", "electrico", "dorado", "supersonico", "picante", "mistico", "salvaje", "cuantico", "fosforito", "rebelde"];
  const dice = document.getElementById("dice"), userIn = document.getElementById("user");
  dice.addEventListener("click", () => {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    userIn.value = pick(COSAS) + pick(ONDA) + Math.floor(10 + Math.random() * 90);
    dice.classList.remove("roll"); void dice.offsetWidth; dice.classList.add("roll");
    sfx.dice(); say("¿Te gusta «" + userIn.value + "»? Tocá «Crear otro».", 2800);
  });

  /* ---------- Frases mientras esperás ---------- */
  const ESPERA = ["Consultando con los aliens…", "Sobornando al cartero…", "Calentando el horno de mails…", "Revisando debajo del felpudo…",
    "Hackeando la matrix (mentira)…", "Esperando que tu crush te escriba…", "Haciendo girar el radar a mano…", "Contando palomas mensajeras…"];
  const waitLine = document.getElementById("wait-line");
  let wi = 0;
  setInterval(() => { if (!document.getElementById("empty").hidden) { wi = (wi + 1) % ESPERA.length; waitLine.textContent = ESPERA[wi]; } }, 3000);

  window.fx = {
    say, jump,
    mail(n) { jump(true); sfx.mail(); window.boom(); say(n > 1 ? "¡Te llegaron " + n + " mails! 📬" : "¡Te llegó un mail! 📬 Tocalo para abrirlo."); },
    copied() { sfx.pop(); say("¡Copiado! Pegalo donde te quieras registrar."); },
    created() { sfx.mail(); jump(true); say("Mail nuevito, recién salido del horno 🔥"); },
    code(c) { sfx.mail(); window.boom(document.getElementById("r-code")); say("¡Código " + c + "! Copialo y pegalo en la página."); },
  };
  /* ---------- Título letra por letra ---------- */
  (function splitTitle() {
    const full = h1.childNodes[0] && h1.childNodes[0].nodeType === 3 ? h1.childNodes[0].textContent : "";
    if (!full) return;
    h1.setAttribute("aria-label", full.trim() + "@");
    let i = 0;
    const frag = document.createDocumentFragment();
    full.split(/( )/).forEach((word) => {
      if (word === " ") { frag.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
      for (const ch of word) { const l = document.createElement("span"); l.className = "l"; l.style.setProperty("--i", i++); l.textContent = ch; w.appendChild(l); }
      frag.appendChild(w);
    });
    h1.replaceChild(frag, h1.childNodes[0]);
  })();

  /* ---------- Emojis flotando ---------- */
  const EMOJIS = ["🍄", "🌈", "👽", "🪩", "🦄", "💌", "✨", "🌀", "🔮", "🍭", "🛸", "🌵", "🐙", "🧉", "⭐", "🎈"];
  const floaters = document.getElementById("floaters");
  if (!calmOS) EMOJIS.forEach((e, k) => {
    const sp = document.createElement("span"); sp.textContent = e;
    sp.style.left = (k * 6.3 + Math.random() * 4) % 98 + "%";
    sp.style.setProperty("--s", 22 + Math.random() * 30 + "px");
    sp.style.setProperty("--d", 14 + Math.random() * 16 + "s");
    sp.style.setProperty("--dl", -Math.random() * 30 + "s");
    floaters.appendChild(sp);
  });

  /* ---------- Stickers al tocar cualquier lado ---------- */
  const STICK = ["🍄", "🌈", "✨", "🦄", "🪩", "💥", "🌀", "👽", "🔥", "💖", "🤪", "⚡"];
  addEventListener("pointerdown", (e) => {
    if (isCalm() || e.target.closest("button, a, input, select, textarea, iframe, .msg, .address, .buddy")) return;
    const st = document.createElement("span"); st.className = "sticker";
    st.textContent = STICK[Math.floor(Math.random() * STICK.length)];
    st.style.left = e.clientX + "px"; st.style.top = e.clientY + "px";
    document.body.appendChild(st); setTimeout(() => st.remove(), 1150);
    tone([400 + Math.random() * 600], .06, "triangle", 1.5);
  });

  /* ---------- Lluvia de emojis ---------- */
  function rain(n) {
    if (isCalm()) return;
    for (let k = 0; k < (n || 26); k++) {
      const r = document.createElement("span"); r.className = "rain";
      r.textContent = ["💌", "📬", "✉️", "🌈", "✨", "🍄"][k % 6];
      r.style.left = Math.random() * 100 + "vw"; r.style.setProperty("--d", 1.6 + Math.random() * 1.8 + "s");
      r.style.animationDelay = Math.random() * .8 + "s";
      document.body.appendChild(r); setTimeout(() => r.remove(), 4500);
    }
  }

  /* ---------- Modo viaje ---------- */
  const tripBtn = document.getElementById("trip");
  tripBtn.addEventListener("click", () => {
    if (document.body.classList.contains("calm")) calmBtn.click();
    const on = !document.body.classList.contains("trip");
    document.body.classList.toggle("trip", on); tripBtn.setAttribute("aria-pressed", on);
    tripBtn.textContent = on ? "Viaje: ON" : "Modo viaje";
    if (on) { tone([220, 277, 330, 415, 554], .18, "sine", .5); say("Uuuh… todo se derrite 🌀🍄", 3000); rain(18); }
  });

  const mailFx = window.fx.mail;
  window.fx.mail = (n) => { mailFx(n); rain(); };
  window.fx.rain = rain;

  /* ---------- Temas y trajes de Carta ---------- */
  const SKIN_MSG = { falopa: "¡Volvimos al original! 🌈", vaporwave: "A E S T H E T I C 🌴", matrix: "Despertá, Neo… 🟩", argentina: "¡Vamos Argentinaaa! 🇦🇷☀️", sobrio: "Modo oficina activado 👔" };
  function setSkin(skin, quiet) {
    if (!SKIN_MSG[skin]) skin = "falopa";
    if (skin === "falopa") document.documentElement.removeAttribute("data-skin"); else document.documentElement.setAttribute("data-skin", skin);
    document.querySelectorAll("#skins .toy").forEach((b) => b.setAttribute("aria-pressed", b.dataset.skin === skin));
    try { localStorage.setItem("gc-skin", skin); } catch (e) {}
    if (!quiet) { say(SKIN_MSG[skin]); jump(true); }
  }
  document.querySelectorAll("#skins .toy").forEach((b) => b.addEventListener("click", () => setSkin(b.dataset.skin)));
  const OUTFIT_MSG = { nada: "Así, al natural 😌", lentes: "Soy re facha con lentes 😎", corona: "Rey de los mails 👑", gorra: "Modo trapero 🧢", navidad: "¡Jo jo jo! 🎅", vincha: "Energía arcoíris 🌈", mate: "¿Un amargo? 🧉" };
  function setOutfit(o, quiet) {
    if (!OUTFIT_MSG[o]) o = "nada";
    buddy.dataset.outfit = o;
    document.querySelectorAll("#outfits .toy").forEach((b) => b.setAttribute("aria-pressed", b.dataset.outfit === o));
    try { localStorage.setItem("gc-outfit", o); } catch (e) {}
    if (!quiet) { say(OUTFIT_MSG[o]); jump(true); sfx.pop(); }
  }
  document.querySelectorAll("#outfits .toy").forEach((b) => b.addEventListener("click", () => setOutfit(b.dataset.outfit)));
  (function restoreLook() {
    let skin = "falopa", outfit = null;
    try { skin = localStorage.getItem("gc-skin") || "falopa"; outfit = localStorage.getItem("gc-outfit"); } catch (e) {}
    if (!outfit) { const d = new Date(); outfit = d.getMonth() === 11 ? "navidad" : "nada"; }  // en diciembre, Carta se pone el gorro
    setSkin(skin, true); setOutfit(outfit, true);
  })();

  /* ---------- Modo tranqui ---------- */
  const calmBtn = document.getElementById("calm");
  function paintCalm() { const on = document.body.classList.contains("calm"); calmBtn.setAttribute("aria-pressed", on); calmBtn.textContent = on ? "Tranqui: ON" : "Modo tranqui"; }
  calmBtn.addEventListener("click", () => {
    const on = !document.body.classList.contains("calm");
    if (on) { setParty(false); document.body.classList.remove("trip"); tripBtn.setAttribute("aria-pressed", false); tripBtn.textContent = "Modo viaje"; }
    document.body.classList.toggle("calm", on);
    try { localStorage.setItem("gc-calm", on ? "1" : "0"); } catch (e) {}
    paintCalm(); window.restartPlasma();
    say(on ? "Ok, bajamos un cambio. Todo quieto 🧘" : "¡Volvió la falopa! 🌈");
  });
  paintCalm();

  setTimeout(() => say("¡Hola! Soy Carta 💌 Ya te armé un mail. Tocame si te aburrís."), 1400);
})();

(function () {
  const $ = (id) => document.getElementById(id);
  // En Vercel usamos los proxys del mismo dominio; si no existen (otro hosting o archivo local), vamos directo.
  let useProxy = /^https?:$/.test(location.protocol);
  const KEY = "gc-mailbox";
  let acct = null;          // { p: "mt" | "gm", address, created, ... }
  let prov = null;          // proveedor activo
  let timer = null;
  let seen = new Set();
  let primed = false;       // evita festejar mensajes viejos al cargar

  /* ---------- Helpers ---------- */
  const rand = (n) => { const a = "abcdefghijklmnopqrstuvwxyz0123456789"; let s = ""; const b = crypto.getRandomValues(new Uint8Array(n)); for (const x of b) s += a[x % a.length]; return s; };
  const WORDS = ["sol","luna","rio","nube","faro","cometa","brisa","zorro","lince","roble","coral","pixel","cielo","halcon","marea","tango","canela","trigo"];
  const randomUser = () => WORDS[Math.floor(Math.random() * WORDS.length)] + WORDS[Math.floor(Math.random() * WORDS.length)] + rand(3);
  const cleanUser = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9._-]/g, "").replace(/^[._-]+|[._-]+$/g, "");
  const decode = (s) => { const t = document.createElement("textarea"); t.innerHTML = s || ""; return t.value; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(acct)); } catch (e) {} };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const clear = () => { try { localStorage.removeItem(KEY); } catch (e) {} };
  const fmtTime = (d) => { d = new Date(d); const today = new Date().toDateString() === d.toDateString();
    return today ? d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("es", { day: "numeric", month: "short" }); };
  const httpError = (msg, status) => Object.assign(new Error(msg), { status });

  async function getJSON(url, init) {
    const res = await fetch(url, init);
    if (res.status === 204) return null;
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw httpError((data && (data.detail || data.message || data["hydra:description"] || data.error)) || ("Error " + res.status), res.status);
    return data;
  }

  /* ---------- Proveedor 1: mail.tm ---------- */
  const MT = {
    id: "mt", name: "mail.tm",
    call(path, opts = {}, a) {
      const method = opts.method || "GET";
      const headers = { Accept: "application/json" };
      if (opts.body) headers["Content-Type"] = method === "PATCH" && !useProxy ? "application/merge-patch+json" : "application/json";
      if (a && a.token) headers.Authorization = "Bearer " + a.token;
      const url = useProxy ? "/api/mail?path=" + encodeURIComponent(path) : "https://api.mail.tm" + path;
      return getJSON(url, { method, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    },
    async domains() {
      const d = await this.call("/domains?page=1");
      const list = (Array.isArray(d) ? d : (d && d["hydra:member"]) || []).filter((x) => x.isActive !== false && x.isPrivate !== true).map((x) => x.domain);
      if (!list.length) throw httpError("mail.tm no tiene dominios disponibles", 503);
      return list;
    },
    async create(user, domain) {
      const password = rand(14);
      let name = user || randomUser();
      for (let i = 0; i < 3; i++) {
        const address = name + "@" + domain;
        try {
          const created = await this.call("/accounts", { method: "POST", body: { address, password } });
          const tok = await this.call("/token", { method: "POST", body: { address, password } });
          return { p: "mt", id: created.id || tok.id, address, password, token: tok.token, created: Date.now() };
        } catch (e) {
          if (e.status === 422 && !user) { name = randomUser(); continue; }
          if (e.status === 422) throw httpError("Esa dirección ya está ocupada. Probá con otro nombre.", 422);
          throw e;
        }
      }
      throw httpError("No se pudo crear la dirección. Probá de nuevo.", 500);
    },
    async restore(a) {
      const tok = await this.call("/token", { method: "POST", body: { address: a.address, password: a.password } });
      a.token = tok.token; a.id = tok.id || a.id;
    },
    async list(a) {
      let d;
      try { d = await this.call("/messages?page=1", {}, a); }
      catch (e) { if (e.status !== 401) throw e; await this.restore(a); save(); d = await this.call("/messages?page=1", {}, a); }
      return (Array.isArray(d) ? d : (d && d["hydra:member"]) || []).map((m) => ({
        id: m.id, from: (m.from && (m.from.name || m.from.address)) || "", subject: m.subject, intro: m.intro, seen: !!m.seen, date: m.createdAt,
      }));
    },
    async read(a, id) {
      const m = await this.call("/messages/" + encodeURIComponent(id), {}, a);
      this.call("/messages/" + encodeURIComponent(id), { method: "PATCH", body: { seen: true } }, a).catch(() => {});
      return {
        subject: m.subject, date: m.createdAt, text: m.text || "",
        html: Array.isArray(m.html) ? m.html.join("") : (m.html || ""),
        from: (m.from && (m.from.name ? m.from.name + " <" + m.from.address + ">" : m.from.address)) || "",
      };
    },
    remove(a) { return this.call("/accounts/" + encodeURIComponent(a.id), { method: "DELETE" }, a); },
  };

  /* ---------- Proveedor 2: Guerrilla Mail ---------- */
  const GM = {
    id: "gm", name: "Guerrilla Mail",
    call(params) {
      const qs = new URLSearchParams({ lang: "es", ...params }).toString();
      return getJSON(useProxy ? "/api/gm?" + qs : "https://api.guerrillamail.com/ajax.php?" + qs, { headers: { Accept: "application/json" } });
    },
    async domains() { return ["sharklasers.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "grr.la", "guerrillamailblock.com", "pokemail.net", "spam4.me"]; },
    async create(user, domain) {
      const r = await this.call({ f: "get_email_address" });
      if (!r || !r.sid_token) throw httpError("Guerrilla Mail no respondió bien", 502);
      let sid = r.sid_token, name = (r.email_addr || "").split("@")[0];
      if (user) {
        const r2 = await this.call({ f: "set_email_user", email_user: user, sid_token: sid });
        sid = r2.sid_token || sid; name = (r2.email_addr || "").split("@")[0] || user;
      }
      return { p: "gm", sid, user: name, address: name + "@" + domain, created: Date.now() };
    },
    async restore(a) {
      const r = await this.call({ f: "set_email_user", email_user: a.user, sid_token: a.sid });
      a.sid = r.sid_token || a.sid;
    },
    async list(a) {
      const r = await this.call({ f: "get_email_list", offset: 0, seq: 0, sid_token: a.sid });
      if (r.sid_token && r.sid_token !== a.sid) { a.sid = r.sid_token; save(); }
      const want = a.user;
      if (r.email && want && r.email.split("@")[0] !== want) { await this.restore(a); save(); }
      return (r.list || [])
        .filter((m) => !(String(m.mail_id) === "1" && /guerrillamail\.com$/.test(m.mail_from)))
        .map((m) => ({
          id: String(m.mail_id), from: decode(m.mail_from), subject: decode(m.mail_subject), intro: decode(m.mail_excerpt),
          seen: String(m.mail_read) === "1", date: +m.mail_timestamp ? +m.mail_timestamp * 1000 : Date.now(),
        }));
    },
    async read(a, id) {
      const r = await this.call({ f: "fetch_email", email_id: id, sid_token: a.sid });
      const body = r.mail_body || "";
      const isHtml = /<[a-z][\s\S]*>/i.test(body);
      return { subject: decode(r.mail_subject), from: decode(r.mail_from), date: +r.mail_timestamp ? +r.mail_timestamp * 1000 : Date.now(), html: isHtml ? body : "", text: isHtml ? "" : body };
    },
    remove(a) { return this.call({ f: "forget_me", email_addr: a.address, sid_token: a.sid }); },
  };
  const PROVIDERS = { mt: MT, gm: GM };

  /* ---------- Interfaz ---------- */
  function status(text, isErr) {
    $("status").classList.toggle("err", !!isErr);
    $("status").querySelector(".dot").classList.toggle("live", !isErr && !!acct);
    $("status-text").textContent = text;
  }
  function busy(on) { ["create", "delete", "refresh"].forEach((id) => { $(id).disabled = on; }); }

  function showAccount() {
    $("address").textContent = acct ? acct.address : "Sin dirección";
    $("meta").hidden = !acct;
    if (acct) {
      $("pass-wrap").hidden = !acct.password;
      $("pass").textContent = acct.password || "";
      $("created").textContent = "Creada: " + new Date(acct.created).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
      $("provider").textContent = "Servicio: " + PROVIDERS[acct.p].name;
    }
    drawQR(acct ? acct.address : "");
  }

  async function useProvider(p) {
    const list = await p.domains();
    prov = p;
    $("domain").innerHTML = "";
    list.forEach((d) => { const o = document.createElement("option"); o.value = d; o.textContent = "@" + d; $("domain").appendChild(o); });
    return list;
  }

  // Busca un proveedor que funcione: primero mail.tm, si falla Guerrilla Mail.
  async function pickProvider(prefer) {
    const order = prefer === "gm" ? [GM, MT] : [MT, GM];
    let lastErr;
    for (const p of order) {
      try { await useProvider(p); if (p === GM) { const r = await GM.call({ f: "get_email_address" }); if (!r || !r.sid_token) throw httpError("Guerrilla Mail no respondió bien", 502); } return p; }
      catch (e) {
        lastErr = e;
        if (useProxy && (e.status === 404 || e.status === 405)) { useProxy = false; try { await useProvider(p); return p; } catch (e2) { lastErr = e2; } }
      }
    }
    throw lastErr || new Error("Ningún servicio de correo respondió");
  }

  /* ---------- QR de la dirección ---------- */
  function drawQR(text) {
    const box = $("qr");
    if (!text) { box.innerHTML = '<span class="qr-empty">Sin dirección todavía</span>'; return; }
    if (typeof qrcode !== "function") { setTimeout(() => drawQR(acct ? acct.address : ""), 300); return; }
    try {
      const q = qrcode(0, "M"); q.addData(text); q.make();
      box.innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
      box.setAttribute("aria-label", "Código QR de " + text);
    } catch (e) { box.innerHTML = '<span class="qr-empty">No se pudo crear el QR</span>'; }
  }

  /* ---------- Historial de buzones ---------- */
  const HKEY = "gc-boxes";
  let history = [];
  try { history = JSON.parse(localStorage.getItem(HKEY) || "[]").filter((a) => a && a.address && PROVIDERS[a.p]); } catch (e) {}
  const saveH = () => { try { localStorage.setItem(HKEY, JSON.stringify(history)); } catch (e) {} };
  function forget(address) { history = history.filter((x) => x.address !== address); saveH(); renderBoxes(); }
  function remember(a) { if (!a) return; history = [a, ...history.filter((x) => x.address !== a.address)].slice(0, 20); saveH(); renderBoxes(); }
  function renderBoxes() {
    const list = history.filter((x) => !acct || x.address !== acct.address);
    $("boxes-block").hidden = list.length === 0;
    $("boxes").innerHTML = "";
    list.forEach((a) => {
      const li = document.createElement("li");
      li.innerHTML = '<span class="a"></span><span class="p"></span><button class="btn small" type="button">Usar</button><button class="x" type="button" aria-label="Olvidar este buzón">×</button>';
      li.querySelector(".a").textContent = a.address;
      li.querySelector(".p").textContent = PROVIDERS[a.p].name;
      li.querySelector(".btn").addEventListener("click", () => switchTo(a));
      li.querySelector(".x").addEventListener("click", () => forget(a.address));
      $("boxes").appendChild(li);
    });
  }
  async function switchTo(a) {
    busy(true); stopPolling(); status("Volviendo a " + a.address + "…");
    const prev = acct;
    try {
      const p = PROVIDERS[a.p];
      await useProvider(p);
      await p.restore(a);
      if (prev) remember(prev);
      acct = a; save(); forget(a.address);
      seen = new Set(); primed = false;
      showAccount(); renderInbox([]); $("back").click(); startPolling();
      if (window.fx) window.fx.say("De vuelta en " + a.address + " 🔁");
    } catch (e) {
      status("Ese buzón ya no existe (" + e.message + "). Lo saqué de la lista.", true);
      forget(a.address);
      if (prev) { acct = prev; prov = PROVIDERS[prev.p]; await useProvider(prov).catch(() => {}); startPolling(); }
    } finally { busy(false); }
  }

  async function createAccount(user) {
    const prevAcct = acct;
    const domain = $("domain").value;
    try {
      acct = await prov.create(user, domain);
    } catch (e) {
      if (e.status === 422) throw e;
      // Si el proveedor actual falla, probamos con el otro antes de rendirnos.
      const other = prov === MT ? GM : MT;
      const list = await useProvider(other);
      acct = await other.create(user, list[0]);
    }
    save(); seen = new Set(); primed = false;
    if (prevAcct) remember(prevAcct);
    renderBoxes();
  }

  /* ---------- Bandeja ---------- */
  async function fetchInbox(manual) {
    if (!acct) return;
    try {
      renderInbox(await prov.list(acct));
      status("Bandeja activa vía " + prov.name + " · " + new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e) {
      if (acct.p === "mt" && (e.status === 401 || e.status === 404)) { status("Este buzón ya no existe. Creá una dirección nueva.", true); stopPolling(); return; }
      status(manual ? "No se pudo actualizar: " + e.message : "Sin conexión con el servicio. Reintentando…", true);
    }
  }

  function renderInbox(list) {
    const ul = $("msgs");
    ul.innerHTML = "";
    $("empty").hidden = list.length > 0;
    ul.hidden = list.length === 0;
    const fresh = list.filter((m) => !seen.has(m.id));
    list.forEach((m) => {
      seen.add(m.id);
      const li = document.createElement("li");
      const b = document.createElement("div");
      b.className = "msg" + (m.seen ? "" : " unread");
      b.tabIndex = 0; b.setAttribute("role", "button");
      b.innerHTML = '<span class="from"></span><span class="time"></span><span class="subj"></span><span class="intro"></span>';
      b.querySelector(".from").textContent = m.from || "Remitente desconocido";
      b.querySelector(".time").textContent = fmtTime(m.date);
      b.querySelector(".subj").textContent = m.subject || "(sin asunto)";
      b.querySelector(".intro").textContent = m.intro || "";
      const open = () => openMessage(m.id);
      b.addEventListener("click", open);
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      li.appendChild(b); ul.appendChild(li);
    });
    if (fresh.length && primed && window.fx) window.fx.mail(fresh.length);
    if (fresh.length && primed && document.hidden && notifyOn && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(fresh.length > 1 ? "Te llegaron " + fresh.length + " mails 📬" : "Te llegó un mail 📬", { body: (fresh[0].from ? fresh[0].from + ": " : "") + (fresh[0].subject || "") }); } catch (e) {}
    }
    primed = true;
    if (fresh.length && document.hidden) document.title = "(" + fresh.length + ") Generador de Correos";
  }

  function startPolling() { stopPolling(); fetchInbox(); timer = setInterval(fetchInbox, 5000); }
  function stopPolling() { if (timer) clearInterval(timer); timer = null; }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) document.title = "Generador de Correos"; });

  /* ---------- Lector ---------- */
  function findCode(text) {
    const m = (text || "").match(/(?:c[oó]digo|code|verification|verificaci[oó]n|OTP|PIN)[^0-9A-Z]{0,40}\b([0-9]{4,8}|[A-Z0-9]{6,8})\b/i) || (text || "").match(/\b(\d{6})\b/);
    return m ? m[1] : "";
  }
  function findLinks(text, html) {
    const set = new Set();
    const re = /https?:\/\/[^\s"'<>)\]]+/g;
    [text || "", html || ""].forEach((s) => (s.match(re) || []).forEach((u) => set.add(u.replace(/&amp;/g, "&").replace(/[.,;]+$/, ""))));
    return [...set].filter((u) => /verif|confirm|activ|valid|token|signup|register|login|auth|click/i.test(u)).slice(0, 4);
  }

  /* ---------- Mails guardados (no expiran: quedan en este navegador) ---------- */
  const store = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open("gc", 1);
      r.onupgradeneeded = () => { const st = r.result.createObjectStore("mails", { keyPath: "key" }); st.createIndex("savedAt", "savedAt"); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction("mails", mode); const out = fn(t.objectStore("mails")); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); };
    return {
      put: (m) => tx("readwrite", (st) => st.put(m)),
      all: () => tx("readonly", (st) => st.getAll()),
      del: (key) => tx("readwrite", (st) => st.delete(key)),
      clear: () => tx("readwrite", (st) => st.clear()),
    };
  })();
  const MAX_SAVED = 200;
  let savedList = [];
  async function refreshSaved() {
    try { savedList = (await store.all()).sort((a, b) => b.savedAt - a.savedAt); } catch (e) { savedList = []; }
    if (savedList.length > MAX_SAVED) { for (const old of savedList.slice(MAX_SAVED)) await store.del(old.key).catch(() => {}); savedList = savedList.slice(0, MAX_SAVED); }
    const ul = $("saved"); ul.innerHTML = "";
    $("saved-count").textContent = savedList.length ? savedList.length + (savedList.length === 1 ? " mail guardado" : " mails guardados") : "";
    $("saved-empty").hidden = savedList.length > 0; $("saved-clear").hidden = savedList.length === 0;
    savedList.forEach((m) => {
      const li = document.createElement("li");
      const b = document.createElement("div");
      b.className = "msg"; b.tabIndex = 0; b.setAttribute("role", "button");
      b.innerHTML = '<span class="from"></span><span class="time"></span><span class="subj"></span><span class="intro"></span>';
      b.querySelector(".from").textContent = m.from || "Remitente desconocido";
      b.querySelector(".time").textContent = fmtTime(m.date);
      b.querySelector(".subj").textContent = m.subject || "(sin asunto)";
      b.querySelector(".intro").textContent = "Para " + m.address;
      const open = () => showMessage(m, true);
      b.addEventListener("click", open);
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      const x = document.createElement("button");
      x.className = "x"; x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Borrar este mail guardado");
      x.addEventListener("click", async () => { await store.del(m.key).catch(() => {}); refreshSaved(); });
      li.className = "saved-item"; li.appendChild(b); li.appendChild(x); ul.appendChild(li);
    });
  }
  let clearArmed = false;
  $("saved-clear").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    if (!clearArmed) { clearArmed = true; btn.textContent = "¿Seguro? Tocá de nuevo"; setTimeout(() => { clearArmed = false; btn.textContent = "Borrar guardados"; }, 4000); return; }
    clearArmed = false; btn.textContent = "Borrar guardados";
    await store.clear().catch(() => {}); refreshSaved();
  });

  function showMessage(m, fromSaved) {
    $("r-saved").hidden = !fromSaved;
    $("r-subj").textContent = m.subject || "(sin asunto)";
    $("r-from").textContent = "De: " + (m.from || "desconocido") + " · " + new Date(m.date).toLocaleString("es");
    const code = findCode(m.text || m.html.replace(/<[^>]+>/g, " "));
    $("r-code").textContent = code; $("r-code-row").hidden = !code;
    if (code && window.fx) setTimeout(() => window.fx.code(code), 150);
    $("r-links").innerHTML = "";
    findLinks(m.text, m.html).forEach((u) => { const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "Abrir enlace: " + u.replace(/^https?:\/\//, ""); $("r-links").appendChild(a); });
    if (m.html) {
      $("r-html").srcdoc = '<base target="_blank"><meta name="referrer" content="no-referrer"><style>body{font-family:system-ui,sans-serif;color:#16213a;margin:12px}img{max-width:100%;height:auto}</style>' + m.html;
      $("r-html").hidden = false; $("r-text").hidden = true;
    } else {
      $("r-text").textContent = m.text || "(mensaje vacío)";
      $("r-text").hidden = false; $("r-html").hidden = true;
    }
    $("inbox-block").hidden = true; $("saved-block").hidden = true; $("reader").hidden = false;
    $("reader").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function openMessage(id) {
    status("Abriendo mensaje…");
    try {
      const m = await prov.read(acct, id);
      showMessage(m, false);
      // Lo guardamos para que no se pierda aunque el servicio lo borre.
      store.put({ key: acct.address + "|" + id, address: acct.address, id, subject: m.subject || "", from: m.from || "", date: m.date, html: (m.html || "").slice(0, 400000), text: (m.text || "").slice(0, 100000), savedAt: Date.now() })
        .then(refreshSaved).catch(() => {});
      fetchInbox();
    } catch (e) { status("No se pudo abrir el mensaje: " + e.message, true); }
  }
  $("back").addEventListener("click", () => { $("reader").hidden = true; $("inbox-block").hidden = false; $("saved-block").hidden = false; $("r-html").srcdoc = ""; });
  refreshSaved();

  /* ---------- Acciones ---------- */
  $("copy").addEventListener("click", (e) => {
    if (!acct) return;
    const btn = e.currentTarget;
    const ok = () => { btn.textContent = "¡Copiado!"; btn.classList.add("done"); if (window.boom) window.boom(btn); if (window.fx) window.fx.copied(); setTimeout(() => { btn.textContent = "Copiar"; btn.classList.remove("done"); }, 1400); };
    const fb = () => { const r = document.createRange(); r.selectNodeContents($("address")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Pulsá Ctrl+C"; };
    try { navigator.clipboard.writeText(acct.address).then(ok, fb); } catch (err) { fb(); }
  });

  $("new-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = $("user").value.trim();
    const user = raw ? cleanUser(raw) : "";
    if (raw && user.length < 3) { status("El nombre necesita al menos 3 letras o números.", true); return; }
    busy(true); stopPolling(); status("Cocinando tu mail…");
    try {
      if (!prov) await pickProvider();
      await createAccount(user);
      $("user").value = ""; showAccount(); if (window.boom) window.boom($("address")); if (window.fx) window.fx.created(); renderInbox([]); $("back").click(); startPolling();
    } catch (err) { status(err.message, true); if (acct) startPolling(); }
    finally { busy(false); }
  });

  let confirmDelete = false;
  $("delete").addEventListener("click", async (e) => {
    if (!acct) return;
    const btn = e.currentTarget;
    if (!confirmDelete) { confirmDelete = true; btn.textContent = "¿Seguro? Tocá de nuevo"; setTimeout(() => { confirmDelete = false; btn.textContent = "Borrar buzón"; }, 4000); return; }
    confirmDelete = false; btn.textContent = "Borrar buzón";
    busy(true); stopPolling(); status("Borrando buzón…");
    try { await PROVIDERS[acct.p].remove(acct); } catch (err) {}
    forget(acct.address); acct = null; clear(); showAccount(); renderInbox([]); $("back").click();
    status("Buzón borrado. Cocinando uno nuevo…");
    try { await createAccount(""); showAccount(); startPolling(); } catch (err) { status(err.message, true); }
    busy(false);
  });

  $("refresh").addEventListener("click", () => fetchInbox(true));

  /* ---------- Notificaciones ---------- */
  let notifyOn = false;
  try { notifyOn = localStorage.getItem("gc-notify") === "1" && "Notification" in window && Notification.permission === "granted"; } catch (e) {}
  function paintNotify() { $("notify").setAttribute("aria-pressed", notifyOn); $("notify").textContent = notifyOn ? "Avisos: ON" : "Avisarme"; }
  $("notify").addEventListener("click", async () => {
    if (!("Notification" in window)) { status("Tu navegador no permite avisos. Dejá la pestaña abierta: el título muestra los mails nuevos.", true); return; }
    if (notifyOn) { notifyOn = false; }
    else {
      const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (perm !== "granted") { status("Bloqueaste los avisos. Activálos desde el candado de la barra de direcciones.", true); return; }
      notifyOn = true;
      if (window.fx) window.fx.say("Listo, te aviso aunque estés en otra pestaña 🔔");
    }
    try { localStorage.setItem("gc-notify", notifyOn ? "1" : "0"); } catch (e) {}
    paintNotify();
  });
  paintNotify();

  /* ---------- Copiar el código ---------- */
  $("r-code").addEventListener("click", (e) => {
    const btn = e.currentTarget, code = btn.textContent;
    const ok = () => { if (window.boom) window.boom(btn); if (window.fx) window.fx.say("Código " + code + " copiado. ¡A pegarlo!"); };
    const fb = () => { const r = document.createRange(); r.selectNodeContents(btn); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); };
    try { navigator.clipboard.writeText(code).then(ok, fb); } catch (err) { fb(); }
  });

  /* ---------- Contraseñas ---------- */
  function secureInt(n) { const b = new Uint32Array(1); const lim = Math.floor(0x100000000 / n) * n; do { crypto.getRandomValues(b); } while (b[0] >= lim); return b[0] % n; }
  function makePassword() {
    const easy = $("pw-easy").checked;
    const strip = (set) => easy ? set.replace(/[lI1O0o]/g, "") : set;
    const sets = [strip("abcdefghijklmnopqrstuvwxyz")];
    if ($("pw-up").checked) sets.push(strip("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
    if ($("pw-num").checked) sets.push(strip("0123456789"));
    if ($("pw-sym").checked) sets.push("!@#$%&*?-_=+.:;");
    const len = +$("pw-len").value, all = sets.join("");
    const chars = sets.map((set) => set[secureInt(set.length)]);        // al menos uno de cada tipo
    while (chars.length < len) chars.push(all[secureInt(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) { const j = secureInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    const pw = chars.join("");
    $("pw").textContent = pw; $("pw-len-v").textContent = len;
    const bits = Math.round(len * Math.log2(all.length));
    const [label, color, pct] = bits < 45 ? ["Débil", "var(--err)", 25] : bits < 70 ? ["Aceptable", "var(--orange)", 55] : bits < 100 ? ["Fuerte", "var(--acid)", 80] : ["Blindada 🛡️", "var(--cyan)", 100];
    $("pw-meter").style.width = pct + "%"; $("pw-meter").style.background = color;
    $("pw-strength").textContent = label + " · " + bits + " bits de entropía";
  }
  $("pw-form").addEventListener("submit", (e) => { e.preventDefault(); makePassword(); if (window.fx) window.fx.say("Contraseña nueva, recién salida del horno 🔐"); });
  ["pw-len", "pw-up", "pw-num", "pw-sym", "pw-easy"].forEach((id) => $(id).addEventListener("input", makePassword));
  $("pw-copy").addEventListener("click", (e) => {
    const btn = e.currentTarget, pw = $("pw").textContent;
    const ok = () => { btn.textContent = "¡Copiada!"; btn.classList.add("done"); if (window.boom) window.boom(btn); if (window.fx) window.fx.say("Copiada. Guardala en un lugar seguro 🤫"); setTimeout(() => { btn.textContent = "Copiar"; btn.classList.remove("done"); }, 1400); };
    const fb = () => { const r = document.createRange(); r.selectNodeContents($("pw")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); btn.textContent = "Pulsá Ctrl+C"; };
    try { navigator.clipboard.writeText(pw).then(ok, fb); } catch (err) { fb(); }
  });
  makePassword();

  /* ---------- Nicks ---------- */
  const NICK = {
    gamer: { a: ["shadow", "toxic", "turbo", "neon", "ghost", "cyber", "savage", "frost", "blaze", "hyper", "void", "rogue", "nova", "ultra"], b: ["wolf", "sniper", "ninja", "reaper", "dragon", "viper", "titan", "hunter", "phantom", "raptor", "knight", "storm"] },
    falopa: { a: ["milanesa", "carpincho", "alfajor", "choripan", "mate", "fernet", "empanada", "chancleta", "tostada", "zapallo", "mapache", "ornitorrinco"], b: ["cosmico", "turbo", "galactico", "fachero", "picante", "mistico", "supremo", "cuantico", "sideral", "fosforito", "rebelde", "salvaje"] },
    tierno: { a: ["mochi", "pompom", "kiwi", "bunny", "peachy", "cloud", "honey", "boba", "panda", "cookie", "sunny", "berry"], b: ["star", "bean", "paws", "muffin", "bubble", "blossom", "sprout", "drop", "puff", "pie", "heart", "cake"] },
    dark: { a: ["noct", "raven", "grim", "hex", "ash", "obsidian", "crypt", "abyss", "dusk", "lunar", "wraith", "void"], b: ["soul", "whisper", "thorn", "shade", "requiem", "echo", "mist", "fang", "omen", "rune", "veil", "moth"] },
  };
  let nickStyle = "gamer";
  function makeNick() {
    const set = NICK[nickStyle], pick = (arr) => arr[secureInt(arr.length)];
    const a = pick(set.a), b = pick(set.b), n = String(secureInt(1000));
    const forms = [a + b, a + "_" + b, a + "." + b, a + b + n, a + "_" + b + "_" + n.slice(-2), "x" + a + b + "x", a + n, b + "." + a];
    return pick(forms).slice(0, 32);
  }
  function renderNicks() {
    const ul = $("nicks"); ul.innerHTML = "";
    const set = new Set(); while (set.size < 6) set.add(makeNick());
    set.forEach((nick) => {
      const li = document.createElement("li");
      li.innerHTML = '<span class="n"></span><button class="btn small" type="button">Copiar</button>';
      li.querySelector(".n").textContent = nick;
      const btn = li.querySelector("button");
      btn.addEventListener("click", () => {
        const ok = () => { btn.textContent = "¡Copiado!"; btn.classList.add("done"); if (window.boom) window.boom(btn); if (window.fx) window.fx.say("«" + nick + "» te queda re bien 😎"); setTimeout(() => { btn.textContent = "Copiar"; btn.classList.remove("done"); }, 1400); };
        const fb = () => { const r = document.createRange(); r.selectNodeContents(li.querySelector(".n")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); btn.textContent = "Pulsá Ctrl+C"; };
        try { navigator.clipboard.writeText(nick).then(ok, fb); } catch (err) { fb(); }
      });
      ul.appendChild(li);
    });
  }
  document.querySelectorAll(".nick-styles .toy").forEach((b) => b.addEventListener("click", () => {
    nickStyle = b.dataset.style;
    document.querySelectorAll(".nick-styles .toy").forEach((x) => x.setAttribute("aria-pressed", x === b));
    renderNicks();
  }));
  $("nick-more").addEventListener("click", () => { renderNicks(); if (window.boom) window.boom($("nicks")); });
  renderNicks();

  /* ---------- App instalable ---------- */
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
  let installEvt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; $("install").hidden = false; });
  $("install").addEventListener("click", async () => {
    if (!installEvt) return;
    installEvt.prompt();
    const r = await installEvt.userChoice.catch(() => null);
    if (r && r.outcome === "accepted" && window.fx) window.fx.say("¡Instalada! Ahora me tenés en la pantalla de inicio 📲");
    installEvt = null; $("install").hidden = true;
  });

  /* ---------- Borrar todos los datos ---------- */
  let wipeArmed = false;
  $("wipe").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    if (!wipeArmed) {
      wipeArmed = true; btn.textContent = "¿Seguro? Tocá de nuevo para borrar todo";
      setTimeout(() => { wipeArmed = false; btn.textContent = "Borrar todos mis datos de este navegador"; }, 5000);
      return;
    }
    stopPolling();
    if (acct) { try { await PROVIDERS[acct.p].remove(acct); } catch (err) {} }
    try { Object.keys(localStorage).filter((k) => k.startsWith("gc-")).forEach((k) => localStorage.removeItem(k)); } catch (err) {}
    try { await store.clear(); indexedDB.deleteDatabase("gc"); } catch (err) {}
    try { if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); } } catch (err) {}
    $("wipe-msg").textContent = "Listo, borramos todo. Recargando…";
    setTimeout(() => location.reload(), 900);
  });

  /* ---------- Utilidades compartidas ---------- */
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function copyText(text, btn, label, selectEl) {
    const orig = btn.textContent;
    const ok = () => { btn.textContent = label || "¡Copiado!"; btn.classList.add("done"); if (window.boom) window.boom(btn); setTimeout(() => { btn.textContent = orig; btn.classList.remove("done"); }, 1400); };
    const fb = () => { if (selectEl) { const r = document.createRange(); r.selectNodeContents(selectEl); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } btn.textContent = "Pulsá Ctrl+C"; setTimeout(() => { btn.textContent = orig; }, 2200); };
    try { navigator.clipboard.writeText(text).then(ok, fb); } catch (err) { fb(); }
  }
  function verdict(box, kind, title, html) {
    box.innerHTML = '<div class="verdict ' + kind + '"><strong></strong><div class="v-body"></div></div>';
    box.querySelector("strong").textContent = title;
    box.querySelector(".v-body").innerHTML = html;
  }

  /* ---------- ¿Tu mail se filtró? ---------- */
  $("breach-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("breach-mail").value.trim().toLowerCase(), out = $("breach-out"), btn = $("breach-go");
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) { verdict(out, "bad", "Mail inválido", "Escribí tu mail completo, por ejemplo tunombre@gmail.com."); return; }
    btn.disabled = true; btn.textContent = "Revisando…"; out.innerHTML = "";
    try {
      const r = await getJSON("/api/breach?email=" + encodeURIComponent(email));
      if (!r.found) {
        verdict(out, "good", "¡Buenas noticias! 🎉", "No encontramos <b>" + esc(email) + "</b> en las filtraciones conocidas. Igual, usá contraseñas distintas en cada sitio.");
        if (window.boom) window.boom(out);
      } else {
        verdict(out, "bad", "Apareció en " + r.breaches.length + (r.breaches.length === 1 ? " filtración" : " filtraciones"),
          "<p>Tu mail estuvo en hackeos a estos sitios. <b>Cambiá la contraseña</b> de los que uses y activá la verificación en dos pasos.</p>" +
          '<div class="breach-tags">' + r.breaches.map((b) => "<span>" + esc(b) + "</span>").join("") + "</div>");
        if (window.fx) window.fx.say("Uh… cambiá esas contraseñas y activá la verificación en dos pasos 🔐", 4500);
      }
    } catch (err) {
      verdict(out, "bad", "No se pudo revisar", esc(err.message) + ". Probá de nuevo en un rato.");
    } finally { btn.disabled = false; btn.textContent = "Revisar mail"; }
  });

  /* ---------- ¿Tu contraseña se filtró? (k-anonimato) ---------- */
  $("pwcheck-eye").addEventListener("click", (e) => {
    const show = $("pwcheck").type === "password";
    $("pwcheck").type = show ? "text" : "password"; e.currentTarget.textContent = show ? "Ocultar" : "Ver"; e.currentTarget.setAttribute("aria-pressed", show);
  });
  async function sha1Hex(text) {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  $("pwcheck-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = $("pwcheck").value, out = $("pwcheck-out"), btn = $("pwcheck-go");
    if (!pw) return;
    btn.disabled = true; btn.textContent = "Revisando…"; out.innerHTML = "";
    try {
      const hash = await sha1Hex(pw), prefix = hash.slice(0, 5), suffix = hash.slice(5);
      const res = await fetch("https://api.pwnedpasswords.com/range/" + prefix, { headers: { "Add-Padding": "true" }, referrerPolicy: "no-referrer", credentials: "omit" });
      if (!res.ok) throw new Error("El servicio respondió " + res.status);
      const line = (await res.text()).split("\n").find((l) => l.slice(0, 35).toUpperCase() === suffix);
      const count = line ? parseInt(line.split(":")[1], 10) : 0;
      if (count > 0) {
        verdict(out, "bad", "Filtrada " + count.toLocaleString("es") + (count === 1 ? " vez" : " veces") + " 😱",
          "Esta contraseña está en listas de contraseñas hackeadas. <b>No la uses más</b>: cambiala en todos los sitios donde la tengas. Podés crear una segura en <a href=\"#tools\">Herramientas</a>.");
      } else {
        verdict(out, "good", "No aparece en filtraciones ✅", "Buena señal. Aun así, usá una contraseña distinta en cada sitio.");
        if (window.boom) window.boom(out);
      }
    } catch (err) {
      verdict(out, "bad", "No se pudo revisar", esc(err.message) + ". Probá de nuevo en un rato.");
    } finally { btn.disabled = false; btn.textContent = "Revisar contraseña"; $("pwcheck").value = ""; }
  });

  /* ---------- Firma de mail ---------- */
  const SIG_STYLES = {
    clasica: { accent: "#1f3a5f", font: "Georgia, 'Times New Roman', serif", name: "#111111", sub: "#555555", bar: "#1f3a5f" },
    moderna: { accent: "#6d28d9", font: "Arial, Helvetica, sans-serif", name: "#111111", sub: "#666666", bar: "#6d28d9" },
    falopa: { accent: "#e11d8a", font: "'Trebuchet MS', Arial, sans-serif", name: "#e11d8a", sub: "#6d28d9", bar: "#00b8c4" },
  };
  function cleanHandle(v) { return String(v || "").trim().replace(/^@/, "").replace(/^https?:\/\/[^/]+\//i, "").replace(/[^A-Za-z0-9._-]/g, ""); }
  function cleanWeb(v) {
    v = String(v || "").trim(); if (!v) return null;
    try { const u = new URL(/^https?:\/\//i.test(v) ? v : "https://" + v); if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return null; return u; } catch (e) { return null; }
  }
  function buildSignature() {
    const st = SIG_STYLES[$("sig-style").value] || SIG_STYLES.moderna;
    const name = $("sig-name").value.trim(), role = $("sig-role").value.trim(), company = $("sig-company").value.trim(), phone = $("sig-phone").value.trim();
    const web = cleanWeb($("sig-web").value);
    const links = [];
    if (web) links.push({ label: web.hostname.replace(/^www\./, ""), href: web.href });
    const ig = cleanHandle($("sig-ig").value), li = cleanHandle($("sig-in").value), gh = cleanHandle($("sig-gh").value);
    if (ig) links.push({ label: "Instagram", href: "https://instagram.com/" + ig });
    if (li) links.push({ label: "LinkedIn", href: "https://www.linkedin.com/in/" + li });
    if (gh) links.push({ label: "GitHub", href: "https://github.com/" + gh });
    const roleLine = [role, company].filter(Boolean).join(" · ");
    const html =
      '<table cellpadding="0" cellspacing="0" border="0" style="font-family:' + st.font + ';font-size:14px;line-height:1.4;color:#222222;">' +
      '<tr><td style="border-left:4px solid ' + st.bar + ';padding:2px 0 2px 12px;">' +
      '<div style="font-size:17px;font-weight:bold;color:' + st.name + ';">' + esc(name || "Tu nombre") + (st === SIG_STYLES.falopa ? " ✨" : "") + "</div>" +
      (roleLine ? '<div style="color:' + st.sub + ';">' + esc(roleLine) + "</div>" : "") +
      (phone ? '<div style="color:' + st.sub + ';">' + esc(phone) + "</div>" : "") +
      (links.length ? '<div style="margin-top:6px;">' + links.map((l) => '<a href="' + esc(l.href) + '" style="color:' + st.accent + ';text-decoration:none;font-weight:bold;">' + esc(l.label) + "</a>").join(' <span style="color:#bbbbbb;">|</span> ') + "</div>" : "") +
      "</td></tr></table>";
    const text = ["-- ", name || "Tu nombre", roleLine, phone, ...links.map((l) => l.label + ": " + l.href)].filter(Boolean).join("\n");
    $("sig-preview").innerHTML = html;
    return { html, text };
  }
  ["sig-name", "sig-role", "sig-company", "sig-phone", "sig-web", "sig-ig", "sig-in", "sig-gh", "sig-style"].forEach((id) => $(id).addEventListener("input", buildSignature));
  $("sig-form").addEventListener("submit", (e) => e.preventDefault());
  $("sig-copy").addEventListener("click", async (e) => {
    const { html, text } = buildSignature(), btn = e.currentTarget;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]);
      btn.textContent = "¡Firma copiada!"; btn.classList.add("done"); if (window.boom) window.boom(btn);
      $("sig-msg").textContent = "Listo. Pegala en Gmail: Configuración → Ver toda la configuración → Firma.";
      setTimeout(() => { btn.textContent = "Copiar firma"; btn.classList.remove("done"); }, 1600);
    } catch (err) {
      const r = document.createRange(); r.selectNodeContents($("sig-preview")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      $("sig-msg").textContent = "Tu navegador no dejó copiar con formato. Ya seleccionamos la firma: pulsá Ctrl+C (o Cmd+C).";
    }
  });
  $("sig-copy-txt").addEventListener("click", (e) => copyText(buildSignature().text, e.currentTarget, "¡Copiada!"));
  buildSignature();

  /* ---------- Plantillas de mails ---------- */
  const TEMPLATES = {
    baja: (d) => ({
      subject: "Pedido de baja de la lista de correos" + d.refS,
      body: `Hola, equipo de ${d.company}:\n\nLes pido que den de baja mi dirección de correo de todas sus listas de envío (newsletters, promociones y novedades), con efecto inmediato.${d.refL}\n${d.detailP}\nPor favor, confírmenme por este medio cuando esté hecho.\n\nGracias,\n${d.name}`,
    }),
    reembolso: (d) => ({
      subject: "Solicitud de reembolso" + d.refS,
      body: `Hola, equipo de ${d.company}:\n\nLes escribo para solicitar el reembolso de mi compra.${d.refL}\n${d.detailP || "\nEl producto o servicio no cumplió con lo esperado.\n"}\nLes pido que me indiquen los pasos a seguir y el plazo estimado para recibir el dinero por el mismo medio de pago que usé.\n\nQuedo atento/a a su respuesta.\n\nSaludos,\n${d.name}`,
    }),
    reclamo: (d) => ({
      subject: "Reclamo formal" + d.refS,
      body: `Hola, equipo de ${d.company}:\n\nQuiero dejar asentado un reclamo formal.${d.refL}\n${d.detailP || "\n[Contá brevemente qué pasó y cuándo.]\n"}\nLes pido una solución concreta y un número de reclamo para hacer el seguimiento. Si no recibo respuesta en un plazo razonable, voy a recurrir a los organismos de defensa del consumidor.\n\nSaludos,\n${d.name}`,
    }),
    cancelar: (d) => ({
      subject: "Cancelación de suscripción" + d.refS,
      body: `Hola, equipo de ${d.company}:\n\nLes pido que cancelen mi suscripción y que no se realicen nuevos cobros a partir de hoy.${d.refL}\n${d.detailP}\nPor favor, envíenme la confirmación de la baja por escrito.\n\nGracias,\n${d.name}`,
    }),
    datos: (d) => ({
      subject: "Solicitud de eliminación de datos personales" + d.refS,
      body: `Hola, equipo de ${d.company}:\n\nEn ejercicio de mi derecho de supresión, reconocido por la normativa de protección de datos personales (por ejemplo, la Ley 25.326 en Argentina o el RGPD en la Unión Europea), les pido que eliminen todos los datos personales que tengan sobre mí.${d.refL}\n${d.detailP}\nTambién les pido que me confirmen por escrito cuando la eliminación esté completa y si compartieron mis datos con terceros.\n\nSaludos,\n${d.name}`,
    }),
    noLlego: (d) => ({
      subject: "Pedido no recibido" + d.refS,
      body: `Hola, equipo de ${d.company}:\n\nTodavía no recibí mi pedido y ya pasó la fecha estimada de entrega.${d.refL}\n${d.detailP}\nLes pido que me informen en qué estado está el envío y, si se perdió, que me lo reenvíen o me devuelvan el dinero.\n\nGracias,\n${d.name}`,
    }),
  };
  let tplCurrent = { subject: "", body: "" };
  function buildTemplate() {
    const ref = $("tpl-ref").value.trim(), detail = $("tpl-detail").value.trim();
    const d = {
      name: $("tpl-name").value.trim() || "[Tu nombre]",
      company: $("tpl-company").value.trim() || "[Empresa]",
      refS: ref ? " – " + ref : "",
      refL: ref ? "\n\nNúmero de pedido o cuenta: " + ref + "." : "",
      detailP: detail ? "\n" + detail + "\n" : "",
    };
    tplCurrent = TEMPLATES[$("tpl-kind").value](d);
    $("tpl-subj").textContent = tplCurrent.subject;
    $("tpl-body").textContent = tplCurrent.body;
    $("tpl-mailto").href = "mailto:?subject=" + encodeURIComponent(tplCurrent.subject) + "&body=" + encodeURIComponent(tplCurrent.body);
  }
  ["tpl-kind", "tpl-name", "tpl-company", "tpl-ref", "tpl-detail"].forEach((id) => $(id).addEventListener("input", buildTemplate));
  $("tpl-form").addEventListener("submit", (e) => e.preventDefault());
  $("tpl-copy").addEventListener("click", (e) => copyText(tplCurrent.body, e.currentTarget, "¡Mail copiado!", $("tpl-body")));
  $("tpl-copy-subj").addEventListener("click", (e) => copyText(tplCurrent.subject, e.currentTarget, "¡Copiado!", $("tpl-subj")));
  buildTemplate();

  /* ---------- Atajos de teclado ---------- */
  addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest("input, select, textarea"))) return;
    const k = (e.key || "").toLowerCase();
    if (k === "c") $("copy").click();
    else if (k === "n") $("new-form").requestSubmit();
    else if (k === "r") fetchInbox(true);
    else if (k === "?" && window.fx) window.fx.say("Atajos: C copia tu mail · N crea otro · R actualiza la bandeja. Y escribí «falopa» 😉", 5000);
  });

  /* ---------- Alias de tu mail (para Discord y sitios exigentes) ---------- */
  const PLUS_OK = /^(gmail\.com|googlemail\.com|outlook\.[a-z.]+|hotmail\.[a-z.]+|live\.[a-z.]+|msn\.com|icloud\.com|me\.com|mac\.com|proton\.me|protonmail\.com|pm\.me|fastmail\.com)$/;
  const TAGS = ["discord", "juegos", "compras", "redes", "newsletters", "pruebas"];
  function buildAliases() {
    const raw = $("alias-mail").value.trim().toLowerCase();
    const msg = $("alias-msg"), list = $("alias-list");
    list.innerHTML = ""; msg.hidden = true; msg.classList.remove("warn");
    if (!raw) return;
    const m = raw.match(/^([^@\s+]+)(?:\+[^@\s]*)?@([a-z0-9.-]+\.[a-z]{2,})$/);
    if (!m) { msg.textContent = "Escribí tu mail completo, por ejemplo tunombre@gmail.com."; msg.classList.add("warn"); msg.hidden = false; return; }
    const [, user, domain] = m;
    if (!PLUS_OK.test(domain)) {
      msg.textContent = "Ojo: no sabemos si " + domain + " acepta alias con «+». Mandate un mail de prueba antes de usarlo.";
      msg.classList.add("warn"); msg.hidden = false;
    }
    const own = cleanUser($("alias-tag").value).replace(/[.]/g, "");
    const tags = own ? [own, ...TAGS.filter((t) => t !== own)] : TAGS;
    tags.forEach((tag, i) => {
      const addr = user + "+" + tag + "@" + domain;
      const li = document.createElement("li");
      li.innerHTML = '<span class="a"><span class="u"></span><span class="plus"></span><span class="d"></span></span><span class="for"></span><button class="btn small" type="button">Copiar</button>';
      li.querySelector(".u").textContent = user;
      li.querySelector(".plus").textContent = "+" + tag;
      li.querySelector(".d").textContent = "@" + domain;
      li.querySelector(".for").textContent = i === 0 && own ? "tu etiqueta" : tag === "discord" ? "ideal Discord" : "";
      const btn = li.querySelector("button");
      btn.addEventListener("click", () => {
        const ok = () => { btn.textContent = "¡Copiado!"; btn.classList.add("done"); if (window.boom) window.boom(btn); if (window.fx) window.fx.say("Alias copiado. Los mails te llegan a tu bandeja de siempre 📬"); setTimeout(() => { btn.textContent = "Copiar"; btn.classList.remove("done"); }, 1400); };
        const fb = () => { const r = document.createRange(); r.selectNodeContents(li.querySelector(".a")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); btn.textContent = "Pulsá Ctrl+C"; };
        try { navigator.clipboard.writeText(addr).then(ok, fb); } catch (err) { fb(); }
      });
      list.appendChild(li);
    });
    if (raw !== "tunombre@gmail.com") { try { localStorage.setItem("gc-alias-mail", raw); } catch (e) {} }
  }
  $("alias-form").addEventListener("submit", (e) => { e.preventDefault(); buildAliases(); if (window.boom) window.boom($("alias-list")); });
  $("alias-mail").addEventListener("input", buildAliases);
  $("alias-tag").addEventListener("input", buildAliases);
  try { const saved = localStorage.getItem("gc-alias-mail"); $("alias-mail").value = saved || "tunombre@gmail.com"; } catch (e) { $("alias-mail").value = "tunombre@gmail.com"; }
  buildAliases();

  /* ---------- Inicio ---------- */
  (async function init() {
    busy(true);
    try {
      const stored = load();
      const valid = stored && stored.address && PROVIDERS[stored.p || "mt"];
      if (valid) { stored.p = stored.p || "mt"; acct = stored; showAccount(); status("Recuperando tu buzón…"); }
      await pickProvider(valid ? stored.p : undefined);
      if (acct) {
        try {
          if (prov.id !== acct.p) throw new Error("otro proveedor");
          await prov.restore(acct); save();
          const dom = acct.address.split("@")[1];
          if ([...$("domain").options].some((o) => o.value === dom)) $("domain").value = dom;
        } catch (e) { acct = null; clear(); }
      }
      if (!acct) { status("Cocinando tu mail…"); await createAccount(""); }
      showAccount(); renderBoxes(); startPolling();
    } catch (e) {
      $("address").textContent = "No disponible";
      const blocked = /failed to fetch|networkerror|load failed/i.test(e.message);
      status(blocked
        ? "El navegador bloqueó la conexión con el servicio de correo. Abrí la página publicada en una pestaña normal y desactivá el bloqueador de anuncios para este sitio."
        : "Los servicios de correo no responden (" + e.message + "). Probá recargar en un rato.", true);
    } finally { busy(false); }
  })();
})();
