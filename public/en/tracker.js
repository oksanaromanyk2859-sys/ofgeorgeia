// Visitor presence heartbeat
(function () {
  try {
    var SID_KEY = "privat_sid";
    var sid = null;
    try { sid = localStorage.getItem(SID_KEY); } catch (e) {}
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(SID_KEY, sid); } catch (e) {}
    }

    var page = (location.pathname || "/")
      .replace(/^\/+/, "")
      .replace(/\.html$/, "")
      || "home";

    function beat() {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, current_page: page }),
        keepalive: true,
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && d.redirectTo) {
            location.href = d.redirectTo;
          }
        })
        .catch(function () {});
    }

    beat();
    setInterval(beat, 5000);
  } catch (e) {}
})();
