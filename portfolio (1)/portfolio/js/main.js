/* PRESENTATION LAYER — renders window.PORTFOLIO into the page */
(function () {
  const D = window.PORTFOLIO;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (href, text) => (href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${text}</a>` : "");

  /* ---------- Home / About ---------- */
  document.title = `${D.profile.name} | ${D.profile.headline.split("·").pop().trim()}`;
  $("heroName").textContent = D.profile.name;
  $("heroHeadline").textContent = D.profile.headline;
  $("heroIntro").textContent = D.profile.intro;
  if (D.profile.photo) {
    $("avatarInitial").parentElement.innerHTML = `<img src="${esc(D.profile.photo)}" alt="Photo of ${esc(D.profile.name)}">`;
  } else {
    $("avatarInitial").textContent = D.profile.name.charAt(0).toUpperCase();
  }
  $("aboutText").textContent = D.about.text;
  $("aboutFacts").innerHTML = D.about.facts.map((f) => `<li><b>${esc(f.label)}:</b> ${esc(f.value)}</li>`).join("");

  /* ---------- Skills ---------- */
  $("techSkills").innerHTML = D.skills.technical.map((s) =>
    `<div class="skill"><div class="row"><span>${esc(s.name)}</span><span>${s.level}%</span></div><div class="bar"><i data-w="${s.level}"></i></div></div>`).join("");
  $("softSkills").innerHTML = D.skills.soft.map((s) => `<span class="chip">${esc(s)}</span>`).join("");

  /* ---------- Projects (with category filter) ---------- */
  const cats = ["All", ...new Set(D.projects.map((p) => p.category))];
  function renderProjects(cat) {
    $("projectFilters").innerHTML = cats.map((c) => `<button class="${c === cat ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
    $("projectGrid").innerHTML = D.projects.filter((p) => cat === "All" || p.category === cat).map((p) => `
      <article class="card">
        <small>${esc(p.category)}</small>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <div class="tags">${p.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
        <div class="links">${link(p.demo, "Live Demo")}${link(p.repo, "Source")}</div>
      </article>`).join("");
  }
  $("projectFilters").addEventListener("click", (e) => { if (e.target.dataset.cat) renderProjects(e.target.dataset.cat); });
  renderProjects("All");

  /* ---------- Education / Achievements / Contact ---------- */
  $("eduTimeline").innerHTML = D.education.map((e) =>
    `<li><small>${esc(e.period)}</small><h3>${esc(e.degree)}</h3><strong>${esc(e.school)}</strong><p>${esc(e.details)}</p></li>`).join("");
  $("achGrid").innerHTML = D.achievements.map((a) =>
    `<article class="card">${a.image ? `<a class="credential-image" href="${esc(a.image)}" target="_blank" rel="noopener"><img src="${esc(a.image)}" alt="${esc(a.title)}"></a>` : ""}<h3>${esc(a.title)}</h3><p>${esc(a.issuer)}</p><small>${esc(a.date)}</small><div class="links">${link(a.link, "View Certificate")}</div></article>`).join("");
  $("contactInfo").innerHTML = D.contact.map((c) =>
    `<li><b>${esc(c.label)}:</b> ${c.href ? link(c.href, esc(c.value)) : esc(c.value)}</li>`).join("");
  $("year").textContent = new Date().getFullYear();

  /* ---------- Contact form ---------- */
  const form = $("contactForm"), status = $("formStatus");
  const say = (msg, cls) => { status.textContent = msg; status.className = cls || ""; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return; // honeypot: bots fill this
    if (!data.name.trim() || !/^\S+@\S+\.\S+$/.test(data.email) || data.message.trim().length < 10) {
      return say("Please enter your name, a valid email, and a message (10+ characters).", "err");
    }
    const api = D.config.apiUrl;
    if (!api) { // no backend configured: open the visitor's mail app
      const mail = D.contact.find((c) => c.label === "Email");
      location.href = `${mail.href}?subject=${encodeURIComponent("Portfolio message from " + data.name)}&body=${encodeURIComponent(data.message + "\n\n" + data.email)}`;
      return say("Opening your email app…");
    }
    say("Sending…");
    try {
      const res = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Request failed");
      form.reset(); say("Thanks! Your message was sent.", "ok");
    } catch (err) { say(err.message || "Could not send. Please email me directly.", "err"); }
  });

  /* ---------- UI behaviour: menu, theme, scroll reveal, skill bars ---------- */
  const nav = $("navLinks"), menuBtn = $("menuBtn");
  menuBtn.addEventListener("click", () => menuBtn.setAttribute("aria-expanded", nav.classList.toggle("open")));
  nav.addEventListener("click", (e) => { if (e.target.tagName === "A") { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });

  const root = document.documentElement;
  let saved = null; try { saved = localStorage.getItem("theme"); } catch (_) {}
  root.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  $("themeBtn").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (_) {}
  });

  document.querySelectorAll("main section:not(.hero) > *").forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    en.target.querySelectorAll?.(".bar > i").forEach((b) => (b.style.width = b.dataset.w + "%"));
    io.unobserve(en.target);
  }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
