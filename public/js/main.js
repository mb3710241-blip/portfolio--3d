// Main website logic: renders content from data/profile.json, navigation, theme,
// project filter/search, contact form and the RAG chatbot UI.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const hasTodo = (s) => typeof s === "string" && /\bTODO\b/.test(s);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

let profile = {};

init();

async function init() {
  $("#year").textContent = new Date().getFullYear();
  setupNav();
  setupTheme();
  setupChat();
  setupContact();
  try {
    profile = await (await fetch("/data/profile.json")).json();
    render(profile);
  } catch (e) {
    console.error("Could not load profile.json", e);
  }
  setupReveal();
  checkAssets();
}

/* ============================== RENDER ============================== */
function render(p) {
  const first = (p.name || "").split(" ").slice(-1)[0] || p.name;
  $$('[data-bind="name"]').forEach((el) => (el.textContent = p.name));
  $$('[data-bind="firstName"]').forEach((el) => (el.textContent = first));
  $$('[data-bind="intro"]').forEach((el) => (el.textContent = p.intro || ""));
  document.title = `${p.name} · 3D Portfolio`;
  typeRoles(p.typedRoles?.length ? p.typedRoles : [p.title]);

  $("#stats").innerHTML = (p.stats || [])
    .map((s) => `<li><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`).join("");

  $("#about-text").innerHTML = (p.about || []).map((t) => `<p>${esc(t)}</p>`).join("");
  const facts = [
    ["Roll No.", p.roll], ["University", p.university], ["Location", p.location],
    ["Languages", (p.languages || []).join(", ")],
  ].filter(([, v]) => v);
  $("#facts").innerHTML = facts.map(([k, v]) => `<li><span>${esc(k)}</span><span>${esc(v)}</span></li>`).join("");
  $("#interests").innerHTML = (p.interests || []).map((i) => `<span class="chip">${esc(i)}</span>`).join("");

  // skills
  $("#skills-grid").innerHTML = (p.skills || []).map((g) => `
    <article class="card skill-card reveal">
      <h3><span aria-hidden="true">${esc(g.icon || "⚡")}</span>${esc(g.category)}</h3>
      ${(g.items || []).map((s) => `
        <div class="skill">
          <div class="skill-top"><span>${esc(s.name)}</span><span>${Number(s.level) || 0}%</span></div>
          <div class="bar" role="progressbar" aria-label="${esc(s.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(s.level) || 0}"><i data-w="${Number(s.level) || 0}"></i></div>
        </div>`).join("")}
    </article>`).join("");

  renderProjects(p.projects || []);

  $("#achievements-list").innerHTML = (p.achievements || []).map((a) => `
    <article class="card achievement reveal">
      <span class="medal" aria-hidden="true">🏅</span>
      <div>
        <h4>${esc(a.title)}</h4>
        <small>${esc([a.issuer, a.year].filter(Boolean).join(" · "))}</small>
        ${a.description ? `<p>${esc(a.description)}</p>` : ""}
      </div>
    </article>`).join("");

  const timeline = (items, a, b) => items.map((x) => `
    <li class="reveal"><div class="card">
      <span class="period">${esc(x.period || "")}</span>
      <h4>${esc(x[a])}</h4>
      <div class="where">${esc(x[b] || "")}</div>
      ${x.details ? `<p>${esc(x.details)}</p>` : ""}
    </div></li>`).join("");
  $("#education-list").innerHTML = timeline(p.education || [], "degree", "institution");
  $("#experience-list").innerHTML = timeline(p.experience || [], "role", "org");

  const links = [
    ["✉️", p.email, `mailto:${p.email}`],
    ["🐙", p.social?.github?.replace(/^https?:\/\//, ""), p.social?.github],
    ["💼", p.social?.linkedin?.replace(/^https?:\/\/(www\.)?/, ""), p.social?.linkedin],
  ].filter(([, label, href]) => label && href && !hasTodo(label) && !hasTodo(href));
  $("#contact-links").innerHTML = links.length
    ? links.map(([icon, label, href]) => `<li><a href="${esc(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}><span aria-hidden="true">${icon}</span>${esc(label)}</a></li>`).join("")
    : `<li><small>(Add your email, GitHub and LinkedIn in profile.json)</small></li>`;
}

function renderProjects(projects) {
  const cats = ["All", ...new Set(projects.map((p) => p.category).filter(Boolean))];
  const icon = { Web: "🌐", Graphics: "🕷️", AI: "🤖", Enterprise: "📊", Mobile: "📱", Game: "🎮" };
  let active = "All";

  $("#filters").innerHTML = cats.map((c) => `<button type="button" aria-pressed="${c === "All"}">${esc(c)}</button>`).join("");
  $("#projects-grid").innerHTML = projects.map((p) => `
    <article class="card project reveal" id="project-${esc(p.id)}" data-cat="${esc(p.category)}"
      data-search="${esc([p.title, p.description, p.category, ...(p.tech || [])].join(" ").toLowerCase())}">
      <div class="project-thumb">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)} screenshot" loading="lazy" />` : `<span aria-hidden="true">${icon[p.category] || "💡"}</span>`}</div>
      <div class="project-meta"><span>${esc(p.category || "")}</span><span>${esc(p.year || "")}</span></div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description)}</p>
      ${(p.highlights || []).length ? `<ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      <div class="chips">${(p.tech || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
      <div class="project-links">
        ${p.link && !hasTodo(p.link) ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">Live ↗</a>` : ""}
        ${p.repo && !hasTodo(p.repo) ? `<a href="${esc(p.repo)}" target="_blank" rel="noopener">Code ↗</a>` : ""}
      </div>
    </article>`).join("");

  const apply = () => {
    const q = $("#project-search").value.trim().toLowerCase();
    let shown = 0;
    $$(".project").forEach((card) => {
      const ok = (active === "All" || card.dataset.cat === active) && (!q || card.dataset.search.includes(q));
      card.hidden = !ok;
      if (ok) shown++;
    });
    $("#projects-empty").hidden = shown > 0;
  };
  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    active = b.textContent;
    $$("#filters button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    apply();
  });
  $("#project-search").addEventListener("input", apply);

  // 3D tilt on hover
  if (!reducedMotion && matchMedia("(hover: hover)").matches) {
    $$(".project").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    });
  }
}

function typeRoles(roles) {
  const el = $("#typed");
  if (reducedMotion) { el.textContent = roles[0] || ""; return; }
  let r = 0, i = 0, deleting = false;
  (function tick() {
    const word = roles[r % roles.length] || "";
    i += deleting ? -1 : 1;
    el.textContent = word.slice(0, i);
    let delay = deleting ? 45 : 90;
    if (!deleting && i === word.length) { deleting = true; delay = 1600; }
    else if (deleting && i === 0) { deleting = false; r++; delay = 300; }
    setTimeout(tick, delay);
  })();
}

/* ============================== NAV / THEME / REVEAL ============================== */
function setupNav() {
  const nav = $("#nav"), links = $("#nav-links"), btn = $("#menu-btn");
  addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 20), { passive: true });
  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "✕" : "☰";
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) { links.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.textContent = "☰"; }
  });
  // highlight current section in the menu
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) $$(".nav-links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${en.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main > section").forEach((s) => io.observe(s));
}

function setupTheme() {
  const btn = $("#theme-toggle");
  const sync = () => {
    const t = document.documentElement.dataset.theme;
    btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  };
  sync();
  btn.addEventListener("click", () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    store.set("theme", t);
    sync();
    document.dispatchEvent(new CustomEvent("themechange", { detail: t }));
  });
}

function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("visible");
      $$(".bar i", en.target).forEach((b) => (b.style.width = b.dataset.w + "%"));
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el) => io.observe(el));
}

async function checkAssets() {
  const exists = async (url) => {
    try { return (await fetch(url, { method: "HEAD" })).ok; } catch { return false; }
  };
  if (!(await exists("/assets/video/promo.mp4"))) {
    $("#promo").hidden = true;
    $("#video-missing").hidden = false;
  }
  if (!(await exists(profile.cv || "/assets/cv.pdf"))) $("#cv-link").hidden = true;
  else $("#cv-link").href = profile.cv || "/assets/cv.pdf";
}

/* ============================== CONTACT FORM ============================== */
function setupContact() {
  const form = $("#contact-form");
  const status = $("#form-status");
  const startedAt = Date.now();
  const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
  const rules = {
    name: (v) => (v.length < 2 || v.length > 80 ? "Please enter your name (2-80 characters)." : ""),
    email: (v) => (!EMAIL_RE.test(v) ? "Please enter a valid email address." : ""),
    subject: (v) => (v.length < 3 || v.length > 120 ? "Subject must be 3-120 characters." : ""),
    message: (v) => (v.length < 10 ? "Message must be at least 10 characters." : v.length > 5000 ? "Message is too long." : ""),
  };
  const showError = (name, msg) => {
    const field = form.elements[name].closest(".field");
    field.classList.toggle("invalid", Boolean(msg));
    $(".error", field).textContent = msg || "";
    form.elements[name].setAttribute("aria-invalid", msg ? "true" : "false");
  };
  const check = (name) => {
    const msg = rules[name](form.elements[name].value.trim());
    showError(name, msg);
    return !msg;
  };
  Object.keys(rules).forEach((n) => form.elements[n].addEventListener("blur", () => check(n)));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const valid = Object.keys(rules).map(check).every(Boolean);
    if (!valid) {
      status.textContent = "Please fix the highlighted fields.";
      status.className = "form-status err";
      form.querySelector("[aria-invalid='true']")?.focus();
      return;
    }
    const btn = $("#cf-submit");
    btn.disabled = true;
    btn.textContent = "Sending…";
    status.textContent = "";
    try {
      const body = Object.fromEntries(new FormData(form));
      body.startedAt = startedAt;
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        form.reset();
        status.textContent = "✅ Thank you! Your message has been sent. I'll get back to you soon.";
        status.className = "form-status ok";
        document.dispatchEvent(new CustomEvent("avatar:wave"));
      } else {
        Object.entries(data.errors || {}).forEach(([k, v]) => form.elements[k] && showError(k, v));
        status.textContent = "❌ " + (data.error || "Something went wrong. Please try again.");
        status.className = "form-status err";
      }
    } catch {
      status.textContent = "❌ Network error. Please check your connection and try again.";
      status.className = "form-status err";
    } finally {
      btn.disabled = false;
      btn.textContent = "Send Message ✉️";
    }
  });
}

/* ============================== CHATBOT ============================== */
function setupChat() {
  const fab = $("#chat-fab"), panel = $("#chat-panel"), log = $("#chat-log"), form = $("#chat-form"), input = $("#chat-text");
  const speakBtn = $("#chat-speak"), micBtn = $("#chat-mic"), langSel = $("#chat-lang");
  const history = [];
  let greeted = false, speak = false, busy = false;

  const open = (show) => {
    panel.hidden = !show;
    fab.setAttribute("aria-expanded", String(show));
    fab.textContent = show ? "✕" : "🤖";
    if (show) {
      if (!greeted) {
        greeted = true;
        addMsg("bot", `Hi! 👋 I'm ${profile.name || "Basim"}'s AI assistant. Ask me about skills, projects, education or how to get in touch. (English, اردو or Roman Urdu)`);
      }
      input.focus();
    }
  };
  fab.addEventListener("click", () => open(panel.hidden));
  $("#chat-close").addEventListener("click", () => { open(false); fab.focus(); });
  $("#hero-chat").addEventListener("click", () => open(true));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) open(false); });
  $("#chat-suggest").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); });
  form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });

  function addMsg(role, text, sources = []) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    if (/[؀-ۿ]/.test(text)) div.dir = "rtl";
    div.textContent = text;
    if (sources.length) {
      const s = document.createElement("div");
      s.className = "sources";
      s.innerHTML = sources.map((src) => `<a href="${esc(src.anchor)}" data-anchor="${esc(src.anchor)}" title="Jump to this section">[${src.n}] ${esc(src.title)}</a>`).join("");
      div.appendChild(s);
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  // citation chips: scroll to the section and flash it
  log.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-anchor]");
    if (!a) return;
    e.preventDefault();
    const target = document.querySelector(a.dataset.anchor);
    if (!target) return;
    if (innerWidth < 760) open(false);
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    const flash = target.matches(".card") ? target : target.querySelector(".card") || target;
    flash.classList.remove("cite-flash");
    void flash.offsetWidth;
    flash.classList.add("cite-flash");
  });

  async function ask(raw) {
    const text = raw.trim().slice(0, 500);
    if (!text || busy) return;
    busy = true;
    input.value = "";
    $("#chat-suggest").hidden = true;
    addMsg("user", text);
    const typing = addMsg("bot", "");
    typing.innerHTML = '<span class="typing" aria-label="Assistant is typing"><span></span><span></span><span></span></span>';
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await r.json().catch(() => ({}));
      typing.remove();
      const answer = data.answer || data.error || "Sorry, something went wrong.";
      addMsg("bot", answer, data.sources || []);
      if (data.answer) {
        history.push({ role: "user", text }, { role: "model", text: answer });
        history.splice(0, Math.max(0, history.length - 6));
        say(answer);
        document.dispatchEvent(new CustomEvent("avatar:talk"));
      }
    } catch {
      typing.remove();
      addMsg("bot", "Network error. Please try again.");
    } finally {
      busy = false;
      input.focus();
    }
  }

  // ---- voice output (extra credit)
  speakBtn.addEventListener("click", () => {
    speak = !speak;
    speakBtn.setAttribute("aria-pressed", String(speak));
    speakBtn.textContent = speak ? "🔊" : "🔈";
    if (!speak) speechSynthesis?.cancel();
  });
  function say(text) {
    if (!speak || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\[\d+\]/g, ""));
    u.lang = /[؀-ۿ]/.test(text) ? "ur-PK" : langSel.value;
    speechSynthesis.speak(u);
  }

  // ---- voice input (extra credit)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { micBtn.hidden = true; return; }
  let rec = null;
  micBtn.addEventListener("click", () => {
    if (rec) { rec.stop(); return; }
    rec = new SR();
    rec.lang = langSel.value;
    rec.interimResults = true;
    micBtn.classList.add("listening");
    rec.onresult = (e) => {
      const t = [...e.results].map((r) => r[0].transcript).join("");
      input.value = t;
      if (e.results[e.results.length - 1].isFinal) ask(t);
    };
    rec.onend = rec.onerror = () => { micBtn.classList.remove("listening"); rec = null; };
    rec.start();
  });
}
