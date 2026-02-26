/**
 * ProxiHealth Security Layer
 */
const ProxiSecurity = (() => {
  'use strict';

  document.addEventListener('contextmenu', e => { e.preventDefault(); return false; });

  document.addEventListener('keydown', e => {
    if (e.key === 'F12') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) { e.preventDefault(); return false; }
  });

  // Rate limiter
  const _limits = {};
  const rateLimiter = {
    check(key, max = 10, windowMs = 60000) {
      const now = Date.now();
      if (!_limits[key]) _limits[key] = { count: 0, resetAt: now + windowMs };
      if (now > _limits[key].resetAt) _limits[key] = { count: 0, resetAt: now + windowMs };
      _limits[key].count++;
      if (_limits[key].count > max) { console.warn(`[Security] Rate limit: ${key}`); return false; }
      return true;
    }
  };

  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
  }

  return { rateLimiter, sanitize };
})();

window.ProxiSecurity = ProxiSecurity;
