/**
 * ProxiHealth App.js v3
 * - Dismissible disclaimer banner (localStorage, never blocks)
 * - JSON loader with 3s timeout fallback
 * - Shared utilities
 */

const ProxiApp = (() => {
  'use strict';

  // ── Disclaimer Banner (non-blocking, remembers dismissal) ──
  function initDisclaimer() {
    const banner = document.getElementById('disclaimer-banner');
    if (!banner) return;

    // Check if already dismissed this session (or ever, for 7 days)
    try {
      const dismissed = localStorage.getItem('proxihealth_disclaimer');
      if (dismissed) {
        const ts = parseInt(dismissed, 10);
        // Hide for 7 days after dismissal
        if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) {
          banner.classList.add('dismissed');
          return;
        }
      }
    } catch (e) { /* localStorage blocked — just show banner */ }

    const closeBtn = document.getElementById('disclaimer-banner__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        banner.classList.add('dismissed');
        try { localStorage.setItem('proxihealth_disclaimer', Date.now()); } catch (e) {}
      });
    }
  }

  // ── JSON loader with 3s timeout ──────────────────────────
  function loadJSON(url, onSuccess, onFallback, timeoutMs = 3000) {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn(`[ProxiApp] JSON timeout (${timeoutMs}ms): ${url}`);
        onFallback && onFallback();
      }
    }, timeoutMs);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          onSuccess(data);
        }
      })
      .catch(err => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          console.error(`[ProxiApp] JSON error: ${err.message}`);
          onFallback && onFallback();
        }
      });
  }

  // ── Loading/fallback helpers ─────────────────────────────
  function showLoading(el) { if (el) el.style.display = 'flex'; }
  function hideLoading(el) { if (el) el.style.display = 'none'; }
  function showFallback(loadingEl, fallbackEl) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (fallbackEl) fallbackEl.classList.add('visible');
  }

  // ── DOM helpers ──────────────────────────────────────────
  function $  (sel, p = document) { return p.querySelector(sel); }
  function $$ (sel, p = document) { return Array.from(p.querySelectorAll(sel)); }

  // ── Offline indicator ─────────────────────────────────────
  function initOfflineIndicator() {
    function update() {
      let el = document.getElementById('offline-indicator');
      if (!navigator.onLine) {
        if (!el) {
          el = document.createElement('div');
          el.id = 'offline-indicator';
          el.className = 'status-banner status-banner--warn';
          el.style.cssText = 'margin:0;border-radius:0;position:sticky;top:60px;z-index:190;justify-content:center;';
          el.textContent = '📵 You\'re offline — protocols still available';
          document.body.insertBefore(el, document.body.children[1] || document.body.firstChild);
        }
      } else {
        if (el) el.remove();
      }
    }
    update();
    window.addEventListener('online',  update);
    window.addEventListener('offline', update);
  }

  // ── Active nav link ───────────────────────────────────────
  function highlightNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(a => {
      if (a.getAttribute('href') && a.getAttribute('href').includes(page)) {
        a.classList.add('nav__link--active');
      }
    });
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    highlightNav();
    initDisclaimer();
    initOfflineIndicator();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { loadJSON, showLoading, hideLoading, showFallback, $, $$ };
})();

window.ProxiApp = ProxiApp;
