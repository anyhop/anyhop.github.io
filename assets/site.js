/* Copy, first-match trace, and appearance toggle.
   Theme class is set before paint by the head script; this only wires the button. */
(function () {
  "use strict";

  var KEY = "anyhop-theme";
  var root = document.documentElement;
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var MOON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.2 9.5A5.2 5.2 0 1 1 6.5 2.8 4.2 4.2 0 0 0 13.2 9.5z"/></svg>';
  var SUN = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="2.9"/><path d="M8 1.6v1.4M8 13v1.4M14.4 8H13M3 8H1.6M12.4 3.6l-1 1M4.6 11.4l-1 1M12.4 12.4l-1-1M4.6 4.6l-1-1"/></svg>';

  function saved() {
    try { return localStorage.getItem(KEY); }
    catch (e) { return null; }
  }

  function apply(t) {
    root.classList.toggle("dark", t === "dark");
    var meta = document.getElementById("theme-color");
    if (meta) meta.setAttribute("content", t === "dark" ? "#0e1416" : "#f4f6f5");
  }

  function setTheme(t) {
    try { localStorage.setItem(KEY, t); }
    catch (e) {}
    apply(t);
  }

  function resolved() {
    var s = saved();
    if (s === "light" || s === "dark") return s;
    return mq.matches ? "dark" : "light";
  }

  // Follow OS while the user has not pinned a choice.
  mq.addEventListener("change", function () {
    if (!saved()) apply(mq.matches ? "dark" : "light");
    paintToggle();
  });

  var toggle = document.getElementById("theme-toggle");
  function paintToggle() {
    if (!toggle) return;
    var dark = root.classList.contains("dark");
    toggle.innerHTML = dark ? SUN : MOON;
    toggle.setAttribute("aria-label", dark ? "Switch to light appearance" : "Switch to dark appearance");
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.title = dark ? "Light appearance" : "Dark appearance";
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setTheme(root.classList.contains("dark") ? "light" : "dark");
      paintToggle();
    });
    paintToggle();
  }
  // Keep meta theme-color in sync with whatever the head script chose.
  apply(resolved());

  /* ---- copy ---- */

  document.querySelectorAll(".copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var el = document.getElementById(btn.getAttribute("data-copy"));
      if (!el) return;
      var label = btn.textContent;
      var text = el.textContent.trim();

      function done() {
        btn.textContent = "Copied";
        btn.dataset.done = "1";
        setTimeout(function () {
          btn.textContent = label;
          delete btn.dataset.done;
        }, 1400);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {});
        return;
      }
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      try { document.execCommand("copy"); done(); } catch (e) {}
      sel.removeAllRanges();
    });
  });

  /* ---- first-match trace ---- */

  var input = document.getElementById("q");
  var result = document.getElementById("result");
  var list = document.getElementById("rules");
  if (!input || !result || !list) return;

  var rules = Array.prototype.map.call(list.querySelectorAll(".rule"), function (el) {
    return {
      el: el,
      name: el.querySelector(".name").textContent.trim(),
      exit: "",
      domains: (el.dataset.domain || "").split(/\s+/).filter(Boolean),
      cidrs: (el.dataset.cidr || "").split(/\s+/).filter(Boolean),
      all: el.dataset.all === "true"
    };
  });
  rules.forEach(function (r) {
    var via = r.el.querySelector(".via");
    r.exit = via.childNodes[via.childNodes.length - 1].textContent.trim();
  });

  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ipInt(v) {
    var p = v.split(".");
    if (p.length !== 4) return null;
    var n = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(p[i])) return null;
      var o = Number(p[i]);
      if (o > 255) return null;
      n = n * 256 + o;
    }
    return n;
  }

  function inCidr(ip, cidr) {
    var h = cidr.split("/");
    var net = ipInt(h[0]), addr = ipInt(ip);
    if (net === null || addr === null) return false;
    var bits = h.length === 2 ? Number(h[1]) : 32;
    if (!(bits >= 0 && bits <= 32)) return false;
    var mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return ((addr & mask) >>> 0) === ((net & mask) >>> 0);
  }

  function matches(rule, q) {
    if (rule.all) return true;
    if (ipInt(q) !== null) {
      return rule.cidrs.some(function (c) { return inCidr(q, c); });
    }
    var lower = q.toLowerCase();
    return rule.domains.some(function (d) {
      d = d.toLowerCase();
      return lower === d || lower.endsWith("." + d);
    });
  }

  function render(raw) {
    var q = raw.trim();
    document.querySelectorAll(".chips button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.q === q));
    });

    if (!q) {
      rules.forEach(function (r) { r.el.className = "rule"; });
      result.textContent = "";
      return;
    }

    var win = -1;
    for (var i = 0; i < rules.length; i++) {
      if (matches(rules[i], q)) { win = i; break; }
    }

    rules.forEach(function (r, i) {
      r.el.className = "rule " + (i === win ? "win" : i < win ? "skip" : "idle");
    });

    if (win < 0) {
      result.innerHTML = "<strong>" + esc(q) + "</strong> matched nothing.";
      return;
    }

    result.innerHTML =
      "<strong>" + esc(q) + "</strong> → <strong>" + esc(rules[win].exit) + "</strong>" +
      '<span class="note"><span class="hit">' + esc(rules[win].name) +
      "</span> · priority " + win + "</span>";
  }

  var t;
  input.addEventListener("input", function () {
    clearTimeout(t);
    t = setTimeout(function () { render(input.value); }, 50);
  });

  document.querySelectorAll(".chips button").forEach(function (b) {
    b.addEventListener("click", function () {
      input.value = b.dataset.q;
      render(b.dataset.q);
      input.focus();
    });
  });
})();
