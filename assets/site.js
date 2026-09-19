/* Progressive enhancement for the landing page: the copy button on the install
   command, and the trace control on the router schematic. The schematic itself
   is plain HTML and CSS — everything the page claims is readable without this
   file; only the interaction needs it. */

(function () {
  "use strict";

  /* ---- copy the install command ---- */

  Array.prototype.forEach.call(document.querySelectorAll(".copy"), function (btn) {
    btn.addEventListener("click", function () {
      var source = document.getElementById(btn.dataset.copyTarget);
      if (!source) return;
      var label = btn.textContent;

      function flash() {
        btn.textContent = "Copied";
        btn.dataset.done = "1";
        setTimeout(function () {
          btn.textContent = label;
          delete btn.dataset.done;
        }, 1600);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(source.textContent.trim()).then(flash, function () {});
        return;
      }
      // the async clipboard API needs a secure context; fall back to a selection
      var range = document.createRange();
      range.selectNodeContents(source);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      try { document.execCommand("copy"); flash(); } catch (err) { /* nothing to do */ }
      selection.removeAllRanges();
    });
  });

  /* ---- trace a destination through the rule table ---- */

  var input = document.getElementById("trace-input");
  var rig = document.getElementById("rig");
  var result = document.getElementById("trace-result");
  if (!input || !rig || !result) return;

  var rules = Array.prototype.map.call(rig.querySelectorAll(".rule"), function (el) {
    return {
      el: el,
      name: el.querySelector(".rule-name").textContent.trim(),
      exit: el.querySelector(".exit-name").textContent.trim(),
      domains: (el.dataset.domain || "").split(/\s+/).filter(Boolean),
      cidrs: (el.dataset.cidr || "").split(/\s+/).filter(Boolean),
      all: el.dataset.all === "true"
    };
  });

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function ipToInt(value) {
    var parts = value.split(".");
    if (parts.length !== 4) return null;
    var n = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) return null;
      var octet = Number(parts[i]);
      if (octet > 255) return null;
      n = n * 256 + octet;
    }
    return n;
  }

  function inCidr(ip, cidr) {
    var halves = cidr.split("/");
    var net = ipToInt(halves[0]);
    var addr = ipToInt(ip);
    if (net === null || addr === null) return false;
    var bits = halves.length === 2 ? Number(halves[1]) : 32;
    if (!(bits >= 0 && bits <= 32)) return false;
    var mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return ((addr & mask) >>> 0) === ((net & mask) >>> 0);
  }

  // Mirrors the CLI: --cidr matches IP-literal destinations only, and --domain
  // matches a domain plus everything under it, on a dot boundary.
  function matches(rule, query) {
    if (rule.all) return true;
    if (ipToInt(query) !== null) {
      return rule.cidrs.some(function (cidr) { return inCidr(query, cidr); });
    }
    var lower = query.toLowerCase();
    return rule.domains.some(function (domain) {
      domain = domain.toLowerCase();
      return lower === domain || lower.endsWith("." + domain);
    });
  }

  function render(rawQuery) {
    var query = rawQuery.trim();

    Array.prototype.forEach.call(
      document.querySelectorAll(".trace-chips button"),
      function (chip) {
        chip.setAttribute("aria-pressed", String(chip.dataset.trace === query));
      }
    );

    if (!query) {
      rules.forEach(function (rule) { rule.el.className = "rule"; });
      result.innerHTML = '<span class="trace-idle">Pick one above, or type a destination.</span>';
      return;
    }

    var winner = -1;
    for (var i = 0; i < rules.length; i++) {
      if (matches(rules[i], query)) { winner = i; break; }
    }

    rules.forEach(function (rule, i) {
      rule.el.className = "rule " + (i === winner ? "win" : i < winner ? "skip" : "idle");
    });

    var shown = "<strong>" + escapeHtml(query) + "</strong>";

    if (winner < 0) {
      result.innerHTML = shown + " <span class=\"miss\">matched no ruleset.</span>";
      return;
    }

    result.innerHTML =
      shown + " → <strong>" + escapeHtml(rules[winner].exit) + "</strong>" +
      '<span class="trace-note"><span class="hit">' + escapeHtml(rules[winner].name) +
      "</span> · priority " + winner + "</span>";
  }

  var debounce;
  input.addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () { render(input.value); }, 60);
  });

  Array.prototype.forEach.call(
    document.querySelectorAll(".trace-chips button"),
    function (chip) {
      chip.addEventListener("click", function () {
        input.value = chip.dataset.trace;
        render(chip.dataset.trace);
      });
    }
  );
})();
