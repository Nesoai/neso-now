/* NESO Now · state map. Click a state for its latest government-published numbers.
   Built and published hourly with now.nesohq.com (neso_live/statemap.py).

   Put this where the map should appear:
     <div data-neso-map data-measures="permits,homeprices,construction" data-stream="birdseye">
       <a href="https://now.nesohq.com/map/">See the latest official numbers for every state</a>
     </div>
     <script src="https://now.nesohq.com/map/neso-map.js" defer></script>
   data-measures: any of payrolls, jobs, construction, homeprices, permits (first is shown first)
   data-stream:   hub, birdseye or delta (which live stream the "Watch live" link opens)
   data-accent:   optional, the site's own colour for the buttons in light mode, e.g. #1E3B33
   The link inside the div is what shows if the script cannot load. */
(function () {
  "use strict";
  var BASE = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, "")) || "https://now.nesohq.com/map/";
  var SITE = BASE.replace(/map\/$/, "");
  var cache = {};
  function get(u) {
    if (!cache[u]) cache[u] = fetch(BASE + u, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(u + " " + r.status);
      return r.json();
    });
    return cache[u];
  }
  function h(tag, attrs, kids) {
    var svg = tag === "svg" || tag === "path" || tag === "g";
    var e = svg ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") e.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  var CSS = ".nm{--nm-bg:#fff;--nm-ink:#1d1526;--nm-muted:#5d5168;--nm-rule:#e4dcea;--nm-acc:#5B2A86;--nm-stroke:#fff;--nm-empty:#e9e5ee;" +
    "font:15px/1.5 Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--nm-ink);background:var(--nm-bg);border:1px solid var(--nm-rule);" +
    "border-radius:14px;padding:16px;max-width:1040px;margin:0 auto;box-sizing:border-box;text-align:left}" +
    ".nm.dark{--nm-bg:#1b1424;--nm-ink:#f2ecf7;--nm-muted:#b6aac9;--nm-rule:#3a2f4d;--nm-acc:#cfa6f0;--nm-stroke:#1b1424;--nm-empty:#2c2338}" +
    ".nm *{box-sizing:border-box}.nm-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:10px}" +
    ".nm-tabs{display:flex;flex-wrap:wrap;gap:6px}.nm-tab{font:inherit;font-size:14px;font-weight:600;padding:7px 12px;border-radius:999px;border:1px solid var(--nm-rule);background:transparent;color:var(--nm-ink);cursor:pointer}" +
    ".nm-tab[aria-selected=true]{background:var(--nm-acc);border-color:var(--nm-acc);color:var(--nm-bg)}" +
    ".nm select{font:inherit;font-size:14px;padding:7px 10px;border-radius:8px;border:1px solid var(--nm-rule);background:var(--nm-bg);color:var(--nm-ink);max-width:100%}" +
    ".nm-body{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:16px;align-items:start}" +
    "@media (max-width:760px){.nm-body{grid-template-columns:1fr}}" +
    ".nm svg{width:100%;height:auto;display:block}.nm path.st{stroke:var(--nm-stroke);stroke-width:.8;cursor:pointer;transition:opacity .15s}" +
    ".nm path.st:hover{opacity:.8}.nm path.sel{stroke:var(--nm-ink);stroke-width:2.2}" +
    ".nm-leg{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--nm-muted);margin-top:6px}.nm-leg i{display:inline-block;width:22px;height:10px;border-radius:2px}" +
    ".nm-panel h3{margin:0 0 2px;font-size:20px;line-height:1.25;color:var(--nm-ink)}.nm-panel p{margin:0 0 8px}.nm-muted{color:var(--nm-muted);font-size:13px}" +
    ".nm-row{padding:9px 0;border-top:1px solid var(--nm-rule)}.nm-row b{display:block;font-size:13px;color:var(--nm-muted);font-weight:600}.nm-row .v{font-size:18px;font-weight:650}" +
    ".nm-row.on .v{color:var(--nm-acc)}.nm a{color:var(--nm-acc)}" +
    ".nm-tip{position:fixed;pointer-events:none;background:var(--nm-ink);color:var(--nm-bg);font-size:13px;padding:5px 9px;border-radius:6px;z-index:9999;display:none;white-space:nowrap}" +
    ".nm-foot{margin-top:10px;font-size:12.5px;color:var(--nm-muted)}.nm-foot a{margin-left:4px}";
  function styleOnce() {
    if (document.getElementById("nm-css")) return;
    document.head.appendChild(h("style", { id: "nm-css", text: CSS }));
  }
  // The map takes the host page's light or dark look from the colour behind it.
  function isDark(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var c = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
      if (c && (c.length < 4 || +c[3] > 0.5)) return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.45;
    }
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function mix(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); });
    var pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return "#" + pa.map(function (x, i) { return ("0" + Math.round(x + (pb[i] - x) * t).toString(16)).slice(-2); }).join("");
  }
  function pct(x) { return (x > 0 ? "+" : "") + x.toFixed(1) + "%"; }
  // Five classes. Change measures diverge around zero (down warm, up cool); a level measure runs light to dark.
  function scale(m, dark) {
    var vals = [];
    for (var s in m.states) { var x = m.shade === "level" ? m.states[s].v : m.states[s].chg; if (x != null) vals.push(x); }
    vals.sort(function (a, b) { return a - b; });
    var mid = dark ? "#3b3346" : "#ece8f0";
    if (m.shade === "level") {
      var q = [0.2, 0.4, 0.6, 0.8].map(function (p) { return vals[Math.floor(p * (vals.length - 1))]; });
      var cols = [0.15, 0.35, 0.55, 0.75, 0.95].map(function (t) { return mix(dark ? "#4a3d5c" : "#e6dcf0", dark ? "#e3c6ff" : "#3d1a5c", t); });
      return { color: function (v) { var i = 0; while (i < 4 && v > q[i]) i++; return cols[i]; },
        cuts: q, cols: cols, level: true };
    }
    var top = Math.max(Math.abs(vals[0] || 0), Math.abs(vals[vals.length - 1] || 0)) || 1;
    var big = Math.max(1, Math.round(top * 0.6 * 10) / 10), small = Math.max(0.2, Math.round(big / 4 * 10) / 10);
    var warm = dark ? "#ff9a7a" : "#b4441f", cool = dark ? "#7fd0e6" : "#1f6f8b";
    var C = [mix(mid, warm, 0.95), mix(mid, warm, 0.5), mid, mix(mid, cool, 0.5), mix(mid, cool, 0.95)];
    return { color: function (v) { return v <= -big ? C[0] : v < -small ? C[1] : v <= small ? C[2] : v < big ? C[3] : C[4]; },
      legend: [[C[0], "down " + big + "%+"], [C[1], "down"], [C[2], "about the same"], [C[3], "up"], [C[4], "up " + big + "%+"]] };
  }
  function slug(name) { return name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""); }

  function mount(el) {
    var want = (el.getAttribute("data-measures") || "payrolls,jobs,permits,construction,homeprices").split(/\s*,\s*/);
    var stream = el.getAttribute("data-stream") || "hub";
    Promise.all([get("data.json"), get("us-states.json")]).then(function (res) {
      var data = res[0], geo = res[1];
      var ms = want.filter(function (m) { return data.measures[m]; });
      if (!ms.length) return;
      styleOnce();
      var state = { m: ms[0], st: el.getAttribute("data-state") || "" };
      var root = h("div", { class: "nm", role: "region", "aria-label": "Official numbers by state" });
      var accent = el.getAttribute("data-accent");          // the host site's own colour, used in light mode
      var tip = h("div", { class: "nm-tip", "aria-hidden": "true" });
      var tabs = h("div", { class: "nm-tabs", role: "tablist" });
      var sel = h("select", { "aria-label": "Choose a state" }, [h("option", { value: "", text: "Choose a state\u2026" })]);
      Object.keys(data.names).sort(function (a, b) { return data.names[a] < data.names[b] ? -1 : 1; }).forEach(function (s) {
        sel.appendChild(h("option", { value: s, text: data.names[s] }));
      });
      sel.value = state.st;
      sel.addEventListener("change", function () { state.st = sel.value; draw(); });
      var svg = h("svg", { viewBox: "0 0 " + geo.width + " " + geo.height, role: "img", "aria-label": "Map of the United States" });
      var paths = {};
      Object.keys(geo.states).forEach(function (s) {
        var p = h("path", { d: geo.states[s].d, class: "st" });
        p.addEventListener("click", function () { state.st = s; sel.value = s; draw(); });
        p.addEventListener("mousemove", function (ev) {
          var m = data.measures[state.m], r = m.states[s];
          tip.textContent = data.names[s] + (r ? " \u00b7 " + (r.text != null ? r.text : "") +
            (r.chg != null ? (r.text != null ? " (" + pct(r.chg) + " in a year)" : pct(r.chg) + " in a year") : "") : " \u00b7 no current figure");
          tip.style.display = "block"; tip.style.left = ev.clientX + 12 + "px"; tip.style.top = ev.clientY + 12 + "px";
        });
        p.addEventListener("mouseleave", function () { tip.style.display = "none"; });
        paths[s] = p; svg.appendChild(p);
      });
      var leg = h("div", { class: "nm-leg" });
      var panel = h("div", { class: "nm-panel", "aria-live": "polite" });
      var foot = h("div", { class: "nm-foot" });
      ms.forEach(function (m) {
        tabs.appendChild(h("button", { class: "nm-tab", role: "tab", type: "button", "data-m": m, text: data.measures[m].short,
          onclick: function () { state.m = m; draw(); } }));
      });
      root.appendChild(h("div", { class: "nm-top" }, [tabs, sel]));
      root.appendChild(h("div", { class: "nm-body" }, [h("div", {}, [svg, leg]), panel]));
      root.appendChild(foot);
      el.innerHTML = ""; el.appendChild(root); document.body.appendChild(tip);

      function draw() {
        var dark = isDark(el);
        root.classList.toggle("dark", dark);
        root.style.setProperty("--nm-acc", accent && !dark ? accent : "");
        var m = data.measures[state.m], sc = scale(m, dark);
        [].forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.getAttribute("data-m") === state.m); });
        Object.keys(paths).forEach(function (s) {
          var r = m.states[s], x = r ? (m.shade === "level" ? r.v : r.chg) : null;
          paths[s].setAttribute("fill", x == null ? getComputedStyle(root).getPropertyValue("--nm-empty") : sc.color(x));
          paths[s].classList.toggle("sel", s === state.st);
          if (s === state.st) svg.appendChild(paths[s]);      // drawn last, so its outline is on top
        });
        leg.innerHTML = "";
        if (sc.level) {
          leg.appendChild(h("span", { text: m.legend }));
          sc.cols.forEach(function (c, i) {
            leg.appendChild(h("span", {}, [h("i", { style: "background:" + c }), i === 0 ? " lowest" : i === 4 ? " highest" : ""]));
          });
        } else {
          leg.appendChild(h("span", { text: m.legend }));
          sc.legend.forEach(function (l) { leg.appendChild(h("span", {}, [h("i", { style: "background:" + l[0] }), " " + l[1]])); });
        }
        panel.innerHTML = "";
        if (!state.st) {
          panel.appendChild(h("h3", { text: m.title }));
          panel.appendChild(h("p", { text: m.blurb }));
          panel.appendChild(h("p", { class: "nm-muted", text: "Tap a state on the map, or choose one from the list, for its latest published numbers." }));
          if (m.top && m.top.length) {
            panel.appendChild(h("p", { class: "nm-muted", text: (m.shade === "level" ? "Lowest: " : "Biggest rise: ") +
              m.top.map(function (s) { return data.names[s]; }).join(", ") + "." }));
          }
        } else {
          var name = data.names[state.st];
          panel.appendChild(h("h3", { text: name }));
          panel.appendChild(h("p", { class: "nm-muted", text: "The latest published figures" }));
          Object.keys(data.measures).forEach(function (k) {
            var mm = data.measures[k], r = mm.states[state.st];
            if (!r) return;
            var main = r.text != null ? r.text : (r.chg != null ? pct(r.chg) + " from a year earlier" : "");
            var sub = [];
            if (r.text != null && r.ya_text) sub.push("A year earlier: " + r.ya_text +
              (r.chg != null ? " (" + pct(r.chg) + ")" : r.pts != null ? " (" + (r.pts > 0 ? "+" : "") + r.pts.toFixed(1) + " points)" : ""));
            sub.push(r.period + " \u00b7 " + mm.source);
            panel.appendChild(h("div", { class: "nm-row" + (k === state.m ? " on" : "") }, [
              h("b", { text: mm.short }), h("span", { class: "v", text: main }),
              h("div", { class: "nm-muted" }, [sub.join(" \u00b7 ") + " \u00b7 ", h("a", { href: "https://fred.stlouisfed.org/series/" + r.sid, rel: "noopener", text: "data" })])
            ]));
          });
          panel.appendChild(h("p", { style: "margin-top:10px" }, [h("a", { href: SITE + "states/" + slug(name) + "/", text: "More on " + name + " \u2192" })]));
        }
        foot.innerHTML = "";
        var w = (data.streams || {})[stream] || {};
        foot.appendChild(document.createTextNode("Government figures via FRED, Federal Reserve Bank of St. Louis \u00b7 checked " + data.updated_text + " \u00b7"));
        foot.appendChild(h("a", { href: SITE + "map/", text: "All states" }));
        if (w.watch) { foot.appendChild(document.createTextNode(" \u00b7")); foot.appendChild(h("a", { href: w.watch, text: "Watch " + w.name + " live" })); }
      }
      draw();
      // Follow the host page when its own light / dark switch is used.
      var mo = new MutationObserver(function () { draw(); });
      [document.documentElement, document.body].forEach(function (n) { mo.observe(n, { attributes: true, attributeFilter: ["class", "data-theme", "style"] }); });
      if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
    }).catch(function () { /* the fallback link inside the div stays */ });
  }
  function start() { [].forEach.call(document.querySelectorAll("[data-neso-map]"), mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
