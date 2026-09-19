/* Copy + first-match trace. Page is readable without this file. */
(function () {
  "use strict";

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

  var input = document.getElementById("q");
  var result = document.getElementById("result");
  var list = document.getElementById("rules");
  if (!input || !result || !list) return;

  var rules = Array.prototype.map.call(list.querySelectorAll(".rule"), function (el) {
    return {
      el: el,
      name: el.querySelector(".name").textContent.trim(),
      exit: el.querySelector(".via").textContent.replace(/\s+/g, " ").trim().replace(/^·?\s*/, ""),
      domains: (el.dataset.domain || "").split(/\s+/).filter(Boolean),
      cidrs: (el.dataset.cidr || "").split(/\s+/).filter(Boolean),
      all: el.dataset.all === "true"
    };
  });
  // exit text includes the dot character area; clean via textContent of name only
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
