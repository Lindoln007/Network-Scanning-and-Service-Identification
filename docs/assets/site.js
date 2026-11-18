(() => {
  const doc = document.documentElement;
  doc.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Repository links ---------- */
  const repo = (window.SITE && SITE.repo || "").replace(/\/$/, "");
  $$("[data-repo]").forEach(a => { a.href = repo + (a.dataset.repo || ""); a.rel = "noopener"; });

  /* ---------- Headline word split ---------- */
  $$(".split-words").forEach(el => {
    let i = 0;
    const wrap = node => {
      const w = document.createElement("span"); w.className = "w";
      const inner = document.createElement("span"); inner.style.setProperty("--i", i++);
      inner.appendChild(node); w.appendChild(inner); return w;
    };
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(part) : wrap(document.createTextNode(part)));
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") {
        const clone = n.cloneNode(true); n.replaceWith(wrap(clone));
      }
    });
  });

  /* ---------- Scroll direction helpers ----------
     Animations play when an element enters the viewport and reverse when it
     leaves through the BOTTOM edge (i.e. the reader scrolled back up past it).
     Leaving through the top (scrolling down past it) keeps the finished state. */
  const leftBelow = e => !e.isIntersecting && e.boundingClientRect.top > innerHeight * 0.5;

  /* ---------- Scroll reveals (reversible) ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const el = e.target;
      if (e.isIntersecting) {
        if (el.dataset.dIn) el.style.setProperty("--d", el.dataset.dIn);
        el.classList.add("in");
      } else if (leftBelow(e) && !reduce) {
        if (el.dataset.dOut) el.style.setProperty("--d", el.dataset.dOut);
        el.classList.remove("in");
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  $$("[data-reveal]").forEach(el => io.observe(el));
  $$("[data-stagger]").forEach(group => {
    const kids = [...group.children], n = kids.length;
    kids.forEach((c, i) => {
      c.setAttribute("data-reveal", "");
      c.dataset.dIn = i * 80 + "ms";             // forward: first to last
      c.dataset.dOut = (n - 1 - i) * 50 + "ms";  // reverse: last to first
      c.style.setProperty("--d", c.dataset.dIn);
      io.observe(c);
    });
  });

  /* ---------- Count-up numbers (count back down on scroll up) ---------- */
  const countTo = (el, target, dur) => {
    cancelAnimationFrame(el._raf);
    const from = +el.textContent || 0, t0 = performance.now();
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(from + (target - from) * eased);
      if (k < 1) el._raf = requestAnimationFrame(tick);
    };
    el._raf = requestAnimationFrame(tick);
  };
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const el = e.target, end = +el.dataset.count;
      if (reduce) { el.textContent = end; return; }
      if (e.isIntersecting) countTo(el, end, 1200);
      else if (leftBelow(e)) countTo(el, 0, 600);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(el => { if (!reduce) el.textContent = "0"; countIO.observe(el); });

  /* ---------- Network map: replays the real scan ---------- */
  const map = $("#netmap");
  if (map && window.LAB) {
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs = {}, parent) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(el);
      return el;
    };
    const C = { x: 250, y: 205 };
    const svg = mk("svg", { viewBox: "0 0 500 440", role: "img", "aria-label": "Animated map of the lab network: a scanner in the centre probes three hosts and their open ports appear." });
    [70, 140, 210].forEach(r => mk("circle", { class: "ring", cx: C.x, cy: C.y, r }, svg));
    const sweepG = mk("g", { class: "sweep" }, svg);
    sweepG.style.transformOrigin = `${C.x}px ${C.y}px`;
    const grad = mk("defs", {}, svg);
    const lg = mk("linearGradient", { id: "sw", x1: "0", y1: "0", x2: "1", y2: "0" }, grad);
    mk("stop", { offset: "0", "stop-color": "var(--signal)", "stop-opacity": "0" }, lg);
    mk("stop", { offset: "1", "stop-color": "var(--signal)", "stop-opacity": ".22" }, lg);
    mk("path", { d: `M${C.x} ${C.y} L${C.x + 215} ${C.y} A215 215 0 0 0 ${C.x + 215 * Math.cos(-0.5)} ${C.y + 215 * Math.sin(-0.5)} Z`, fill: "url(#sw)" }, sweepG);

    const ports = [], hostsG = [];
    LAB.forEach(h => {
      mk("line", { class: "link", x1: C.x, y1: C.y, x2: h.x, y2: h.y }, svg);
    });
    LAB.forEach(h => {
      const g = mk("g", {}, svg);
      const n = h.ports.length;
      // spread ports on an arc facing away from the scanner
      const away = Math.atan2(h.y - C.y, h.x - C.x);
      h.ports.forEach((p, i) => {
        const a = away + (i - (n - 1) / 2) * 0.62;
        const px = h.x + Math.cos(a) * 72, py = h.y + Math.sin(a) * 62;
        const pg = mk("g", { class: "port" + (p.risk === "r" ? " risk" : "") }, g);
        const w = String(p.p).length * 7 + 16;
        mk("line", { x1: h.x, y1: h.y, x2: px, y2: py, stroke: "var(--rule)", "stroke-width": 1 }, pg);
        mk("rect", { x: px - w / 2, y: py - 10, width: w, height: 20, rx: 4 }, pg);
        const t = mk("text", { x: px, y: py }, pg); t.textContent = p.p;
        const title = mk("title", {}, pg); title.textContent = `${h.ip}:${p.p} ${p.svc} — ${p.ver}`;
        ports.push({ el: pg, host: h });
      });
      mk("circle", { class: "host-node", cx: h.x, cy: h.y, r: 26 }, g);
      mk("path", { d: `M${h.x - 9} ${h.y - 7}h18v11h-18z M${h.x - 4} ${h.y + 8}h8`, fill: "none", stroke: "var(--ink)", "stroke-width": 1.5 }, g);
      // labels sit on the scanner side; ports fan out on the far side
      const below = h.y < C.y;
      const lab = mk("text", { class: "host-label", x: h.x, y: h.y + (below ? 46 : -52), "text-anchor": "middle" }, g);
      lab.textContent = h.name;
      const ip = mk("text", { class: "host-ip", x: h.x, y: h.y + (below ? 61 : -37), "text-anchor": "middle" }, g);
      ip.textContent = h.ip;
      hostsG.push(g);
    });
    const sc = mk("g", { class: "scanner" }, svg);
    mk("circle", { cx: C.x, cy: C.y, r: 16, fill: "var(--paper)", stroke: "var(--ink)", "stroke-width": 1.5 }, sc);
    mk("circle", { class: "core", cx: C.x, cy: C.y, r: 6 }, sc);
    const st = mk("text", { x: C.x, y: C.y + 34, "text-anchor": "middle", class: "host-ip" }, sc);
    st.textContent = "nmap";
    map.prepend(svg);
    map.style.margin = "0";

    const status = $("#netmap-status");
    const say = s => { if (status) status.textContent = s; };
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let run = 0;

    const firePacket = (h, id) => new Promise(res => {
      if (id !== run) return res();
      const c = mk("circle", { class: "packet", r: 4, cx: 0, cy: 0 }, svg);
      const anim = c.animate(
        [{ transform: `translate(${C.x}px, ${C.y}px)`, opacity: 1 }, { transform: `translate(${h.x}px, ${h.y}px)`, opacity: .9 }],
        { duration: 650, easing: "cubic-bezier(.5,0,.2,1)" }
      );
      anim.onfinish = () => { c.remove(); res(); };
    });

    const play = async () => {
      const id = ++run;
      ports.forEach(p => { p.el.getAnimations().forEach(a => a.cancel()); p.el.classList.remove("lit"); });
      if (reduce) { ports.forEach(p => p.el.classList.add("lit")); say("Scan complete · 3 hosts · 13 open ports"); return; }
      say("Host discovery · 127.0.10.1–50");
      await sleep(600);
      let open = 0;
      for (const h of LAB) {
        if (id !== run) return;
        say(`Probing ${h.ip} …`);
        await Promise.all([firePacket(h, id), sleep(120).then(() => firePacket(h, id)), sleep(240).then(() => firePacket(h, id))]);
        for (const p of ports.filter(p => p.host === h)) {
          if (id !== run) return;
          p.el.classList.add("lit"); open++;
          await sleep(170);
        }
        say(`${h.ip} · ${h.ports.length} open`);
        await sleep(450);
      }
      say(`Scan complete · 3 hosts · ${open} open ports`);
    };

    // Reverse: retract the ports last-to-first and reset the status line.
    const retract = () => {
      run++;
      const lit = ports.filter(p => p.el.classList.contains("lit")).reverse();
      lit.forEach((p, i) => {
        const a = p.el.animate(
          [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.4)" }],
          { duration: 320, delay: i * 35, easing: "cubic-bezier(.7,0,.84,0)", fill: "forwards" }
        );
        a.onfinish = () => { p.el.classList.remove("lit"); a.cancel(); };
      });
      say("Waiting to scan");
    };

    // Play when the map comes into view, reverse when it leaves, replay on return.
    let shown = false;
    const mapIO = new IntersectionObserver(es => {
      const e = es[0];
      if (e.isIntersecting && !shown) { shown = true; play(); }
      else if (!e.isIntersecting && shown && !reduce) { shown = false; retract(); }
    }, { threshold: 0.35 });
    mapIO.observe(map);
    $("#netmap-replay")?.addEventListener("click", play);
  }

  /* ---------- Terminal typing (un-types on scroll up) ---------- */
  const termType = term => {
    const cmd = $(".cmd", term), id = ++term._run;
    const cur = $(".cursor", term) || Object.assign(document.createElement("span"), { className: "cursor" });
    cmd.after(cur);
    let i = cmd.textContent.length;
    const step = () => {
      if (id !== term._run) return;
      i = Math.min(term._full.length, i + 2); cmd.textContent = term._full.slice(0, i);
      if (i < term._full.length) setTimeout(step, 16);
      else setTimeout(() => { if (id === term._run) { cur.remove(); term.classList.add("done"); } }, 350);
    };
    step();
  };
  const termUntype = term => {
    const cmd = $(".cmd", term), id = ++term._run;
    term.classList.remove("done");                         // output folds back up
    const cur = $(".cursor", term) || Object.assign(document.createElement("span"), { className: "cursor" });
    cmd.after(cur);
    let i = cmd.textContent.length;
    const step = () => {
      if (id !== term._run) return;
      i = Math.max(0, i - 3); cmd.textContent = term._full.slice(0, i);
      if (i > 0) setTimeout(step, 10);
    };
    setTimeout(step, 250);
  };
  const termIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const term = e.target;
      if (e.isIntersecting) termType(term);
      else if (leftBelow(e)) termUntype(term);
    });
  }, { threshold: 0.4 });
  $$(".term[data-type]").forEach(t => {
    const cmd = $(".cmd", t);
    if (!cmd || reduce) { t.classList.add("done"); return; }
    t._full = cmd.textContent; t._run = 0; cmd.textContent = "";
    termIO.observe(t);
  });

  /* ---------- Timeline progress line ---------- */
  const phases = $(".phases");
  if (phases) {
    const line = $(".progress", phases);
    const items = $$(".phase", phases);
    const onScroll = () => {
      const r = phases.getBoundingClientRect(), mid = innerHeight * 0.55;
      const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      line.style.setProperty("--p", p.toFixed(3));
      items.forEach(it => it.classList.toggle("is-in", it.getBoundingClientRect().top < mid));
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* ---------- Findings: accordion + filter + matrix links ---------- */
  const setOpen = (btn, open) => btn.setAttribute("aria-expanded", String(open));
  $$(".finding-btn").forEach(btn => btn.addEventListener("click", () => setOpen(btn, btn.getAttribute("aria-expanded") !== "true")));

  const chips = $$(".chip[data-filter]");
  chips.forEach(chip => chip.addEventListener("click", () => {
    chips.forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
    const f = chip.dataset.filter;
    const list = $$(".finding");
    list.forEach(li => { li.hidden = !(f === "all" || li.dataset.sev === f); });
    if (!reduce) list.filter(li => !li.hidden).forEach((li, i) => li.animate(
      [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
      { duration: 500, delay: i * 50, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }
    ));
  }));

  $$("[data-goto]").forEach(el => el.addEventListener("click", () => {
    const target = document.getElementById(el.dataset.goto);
    if (!target) return;
    const all = $(".chip[data-filter='all']"); if (all && target.hidden) all.click();
    setOpen($(".finding-btn", target), true);
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    target.animate?.([{ background: "var(--signal-soft)" }, { background: "transparent" }], { duration: 1600, easing: "ease-out" });
  }));

  if (location.hash && $(location.hash)?.classList.contains("finding")) setOpen($(".finding-btn", $(location.hash)), true);
})();
