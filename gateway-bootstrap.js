(() => {
  // The gateway marks authenticated HTML. Ordinary desktop pages keep their normal transport.
  if (!document.querySelector('meta[name="dsh-mobile-gateway"][content="authenticated"]')) return;
  // Keep ordinary root reloads on the original DSH frontend after browser pairing/login redirects.
  if ((location.pathname === '/' || location.pathname === '/index.html') && new URLSearchParams(location.search).get('frontend') !== 'stock') {
    const target = new URL(location.href); target.searchParams.set('frontend','stock'); location.replace(target.href); return;
  }
  const nativeFetch = window.fetch.bind(window);
  let renewTask;
  let nextRenew = 0;
  const csrf = () => {
    for (const key of ['__Host-dsh_ma_csrf', 'dsh_ma_csrf']) {
      const values = document.cookie.split(';').map(row => row.trim()).filter(row => row.startsWith(key + '='));
      if (values.length === 1) return values[0].slice(key.length + 1);
    }
    return '';
  };
  const renew = () => {
    if (renewTask) return renewTask;
    renewTask = nativeFetch('/mobile-access/auth/renew', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}'
    }).then(async response => {
      if (!response.ok) return false;
      const result = await response.json();
      nextRenew = Math.max(Date.now() + 30000, result.sessionExpiresAt - 5 * 60000);
      return true;
    }).catch(() => false).finally(() => { renewTask = undefined; });
    return renewTask;
  };
  window.fetch = async (input, init) => {
    const source = input instanceof Request ? input : undefined;
    const target = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : source.url, location.href);
    if (target.origin !== location.origin || target.pathname.startsWith('/mobile-access/auth/')) return nativeFetch(input, init);
    // Renew before dispatch: never replay a message or tool approval after an uncertain response.
    if (Date.now() >= nextRenew) await renew();
    const method = String(init?.method || source?.method || 'GET').toUpperCase();
    const headers = new Headers(init?.headers || source?.headers);
    if (method !== 'GET' && method !== 'HEAD') {
      const token = csrf();
      if (token) headers.set('x-dsh-mobile-csrf', token);
    }
    return nativeFetch(input, { ...init, headers });
  };
  // Core DSH and optional plugins use the same authenticated fetch and retain their original UI.
  if (!window.__DSH_TRANSPORT__) window.__DSH_TRANSPORT__ = { fetch: (input, init) => window.fetch(input, init), ownsHost: true };
  if (!window.__DSH_FILE_UPLOAD__) window.__DSH_FILE_UPLOAD__ = { fetch: (input, init) => window.fetch(input, init) };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renew(); });
  window.addEventListener('online', () => renew());
})();
