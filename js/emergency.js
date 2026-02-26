/**
 * ProxiHealth Emergency.js v3
 * - Single "Can't reach help" button (no duplicates)
 * - Inline Call 112 on step 1 only
 * - 3s JSON timeout with inline fallback
 * - Print: only protocol content
 */

const ProxiEmergency = (() => {
  'use strict';

  let protocols = null;

  const grid       = document.getElementById('protocol-grid');
  const viewer     = document.getElementById('protocol-viewer');
  const loadingEl  = document.getElementById('protocol-loading');
  const fallbackEl = document.getElementById('protocol-fallback');
  const viewerTitle = document.getElementById('viewer-title');
  const viewerSteps = document.getElementById('viewer-steps');
  const backBtn    = document.getElementById('btn-back');
  const gridWrapper = document.getElementById('protocol-grid-wrapper');

  // ── Inline fallback protocols (if JSON fails) ─────────────
  const FALLBACK = [
    {
      id: 'childbirth', title: 'Emergency Childbirth', icon: '🤱', severity: 'critical',
      description: 'Baby arriving before reaching hospital',
      steps: [
        { num:1, text:'Wash your hands thoroughly with soap and water for at least 30 seconds.', note:'If no soap is available, use hand sanitizer or the cleanest cloth available.' },
        { num:2, text:'Lay the mother on her back with knees bent, or on her side if more comfortable.', note:'Use folded cloth, a mat, or anything clean under her.' },
        { num:3, text:'Do not pull the baby. Let the baby come naturally with each contraction.', note:'Pulling can injure the baby\'s neck.' },
        { num:4, text:'Gently support the baby\'s head with both hands as it appears. Check for cord around neck.', note:'If cord is around neck, gently slip it over the head.' },
        { num:5, text:'Keep the baby warm skin-to-skin on the mother\'s chest. Cover both with a clean blanket.', note:'Get to a health facility as soon as possible.' }
      ]
    },
    {
      id: 'bleeding', title: 'Severe Bleeding', icon: '🩸', severity: 'critical',
      description: 'Uncontrolled external bleeding',
      steps: [
        { num:1, text:'Press a clean cloth HARD directly onto the wound without lifting it to check.', note:'Hold firm pressure for at least 10 to 15 minutes continuously.' },
        { num:2, text:'If blood soaks through, add more cloth on top. Do not remove the first layer.', note:'Removing the first layer disrupts the clot that is forming underneath.' },
        { num:3, text:'Lay the person flat and raise their legs 30 centimetres if no spine injury is suspected.', note:'This keeps blood flowing to vital organs.' },
        { num:4, text:'Get to emergency care immediately without releasing pressure during transport.', note:'' }
      ]
    },
    {
      id: 'cpr_adult', title: 'CPR — Adult', icon: '💓', severity: 'critical',
      description: 'Person unconscious and not breathing',
      steps: [
        { num:1, text:'Check for response by tapping shoulders and shouting. No response and no breathing means start CPR now.', note:'Send someone to call emergency services immediately.' },
        { num:2, text:'Push hard and fast in the centre of the chest at 100 to 120 compressions per minute.', note:'Press down 5 to 6 centimetres. Release fully between each compression.' },
        { num:3, text:'After every 30 compressions, tilt the head back, lift the chin, pinch the nose, and give 2 rescue breaths.', note:'Skip rescue breaths if untrained — chest compressions alone still save lives.' },
        { num:4, text:'Continue without stopping until the person breathes normally, trained help arrives, or you are too exhausted to continue.', note:'' }
      ]
    }
  ];

  // ── Render protocol selection grid ───────────────────────
  function renderGrid(data) {
    const protos = data ? Object.values(data.protocols) : FALLBACK;
    protocols = protos;

    ProxiApp.hideLoading(loadingEl);

    grid.innerHTML = protos.map(p => `
      <button class="protocol-card" data-id="${p.id}" aria-label="Open ${p.title} protocol">
        <span class="protocol-card__icon">${p.icon}</span>
        <div class="protocol-card__title">${p.title}</div>
        <div class="protocol-card__desc">${p.description || ''}</div>
        <span class="protocol-card__severity severity--${p.severity}">
          ${p.severity === 'critical' ? '🔴 Critical' : p.severity === 'urgent' ? '🟡 Urgent' : '🟢 Moderate'}
        </span>
      </button>
    `).join('');

    // Single event delegation
    grid.addEventListener('click', e => {
      const card = e.target.closest('.protocol-card');
      if (card) openProtocol(card.dataset.id);
    });

    // Check if URL has a hash to auto-open
    checkHashOnLoad();
  }

  // ── Open protocol viewer ──────────────────────────────────
  function openProtocol(id) {
    const p = protocols.find(pr => pr.id === id);
    if (!p) return;

    viewerTitle.textContent = `${p.icon} ${p.title}`;

    viewerSteps.innerHTML = `<ul class="emergency-steps">${
      p.steps.map((s, i) => `
        <li class="emergency-step">
          <span class="emergency-step__num">${s.num}</span>
          <div class="emergency-step__content">
            <div class="emergency-step__text">${ProxiSecurity.sanitize(s.text)}</div>
            ${s.note ? `<div class="emergency-step__note">💡 ${ProxiSecurity.sanitize(s.note)}</div>` : ''}
            ${i === 0 ? `<a href="tel:112" class="call-btn-inline">📞 Call 112</a>` : ''}
          </div>
        </li>
      `).join('')
    }</ul>`;

    // Show viewer, hide grid
    gridWrapper.style.display = 'none';
    viewer.style.display = 'block';
    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Back button ───────────────────────────────────────────
  function goBack() {
    viewer.style.display = 'none';
    gridWrapper.style.display = 'block';
  }

  // ── Single "Can't reach help" button logic ────────────────
  // There is ONLY ONE button in the HTML. This handles it.
  function initNoHelpBtn() {
    const btn   = document.getElementById('btn-no-help');
    const panel = document.getElementById('no-help-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      if (!ProxiSecurity.rateLimiter.check('no-help', 5, 60000)) return;
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    document.getElementById('btn-close-no-help')?.addEventListener('click', () => {
      panel.classList.add('hidden');
    });
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    if (!grid) return;
    ProxiApp.showLoading(loadingEl);

    ProxiApp.loadJSON(
      'data/offline-tree.json',
      data => renderGrid(data),
      () => { renderGrid(null); ProxiApp.showFallback(loadingEl, fallbackEl); },
      3000
    );

    if (backBtn) backBtn.addEventListener('click', goBack);
    initNoHelpBtn();
  }

  // Auto-open protocol if URL has a hash (e.g. emergency.html#malaria)
  function checkHashOnLoad() {
    const hash = window.location.hash.replace('#', '');
    if (hash && protocols) {
      const found = protocols.find(p => p.id === hash);
      if (found) openProtocol(hash);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  return { openProtocol, goBack };
})();

window.ProxiEmergency = ProxiEmergency;
