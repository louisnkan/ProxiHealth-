/**
 * ProxiHealth AI Module — js/ai.js
 *
 * Connects the homepage search bar to the Vercel backend.
 * Falls back to keyword routing if the API is unavailable.
 *
 * IMPORTANT: Change API_BASE_URL to your actual Vercel deployment URL
 * after you deploy. Example:
 *   const API_BASE_URL = 'https://proxihealth-api.vercel.app';
 */

const ProxiAI = (() => {
  'use strict';

  // ── Change this after Vercel deployment ───────────────────
  // During development: leave as empty string (will show fallback)
  // After deployment:   'https://your-project-name.vercel.app'
  const API_BASE_URL = 'https://proxihealth-api.vercel.app';

  // Timeout for API call (milliseconds)
  const API_TIMEOUT_MS = 12000;

  // ── Urgency colour map ────────────────────────────────────
  const URGENCY_STYLES = {
    critical: {
      border:  'rgba(192,57,43,0.5)',
      bg:      'rgba(192,57,43,0.12)',
      label:   '🚨 Emergency Response',
      labelColor: '#FF8A80'
    },
    high: {
      border:  'rgba(230,126,34,0.4)',
      bg:      'rgba(230,126,34,0.10)',
      label:   '⚠️ Medical Attention Needed',
      labelColor: '#FFCC80'
    },
    medium: {
      border:  'rgba(255,255,255,0.18)',
      bg:      'rgba(255,255,255,0.10)',
      label:   '🌡️ Symptom Assessment',
      labelColor: '#7AE89A'
    },
    low: {
      border:  'rgba(255,255,255,0.18)',
      bg:      'rgba(255,255,255,0.10)',
      label:   '💊 Care Guidance',
      labelColor: '#7AE89A'
    }
  };

  // ── Keyword fallback (if API unavailable) ─────────────────
  const KEYWORD_MAP = [
    { keys:['childbirth','birth','labour','labor','pregnant','baby','delivery'], page:'emergency.html', label:'Emergency Childbirth protocol' },
    { keys:['bleed','blood','wound','cut','lacerat'],                            page:'emergency.html', label:'Severe Bleeding protocol' },
    { keys:['cpr','not breathing','unconscious','cardiac'],                      page:'emergency.html', label:'CPR protocol' },
    { keys:['snake','venom'],                                                    page:'emergency.html', label:'Snake Bite protocol' },
    { keys:['burn','fire','scald'],                                              page:'emergency.html', label:'Burns protocol' },
    { keys:['chok','airway'],                                                    page:'emergency.html', label:'Choking protocol' },
    { keys:['fever','malaria','chills'],                                         page:'triage.html',    label:'Fever triage' },
    { keys:['diarrh','vomit','cholera'],                                         page:'triage.html',    label:'Cholera triage' },
    { keys:['headache','stiff neck','meningit'],                                 page:'triage.html',    label:'Meningitis triage' },
    { keys:['typhoid','abdomen','stomach'],                                       page:'triage.html',    label:'Typhoid triage' },
    { keys:['rash','itch','skin'],                                                page:'triage.html',    label:'Rash triage' }
  ];

  function keywordFallback(query) {
    var lower = query.toLowerCase();
    for (var i = 0; i < KEYWORD_MAP.length; i++) {
      for (var j = 0; j < KEYWORD_MAP[i].keys.length; j++) {
        if (lower.indexOf(KEYWORD_MAP[i].keys[j]) !== -1) {
          return KEYWORD_MAP[i];
        }
      }
    }
    return null;
  }

  // ── Convert markdown-style bold to HTML ───────────────────
  function formatResponse(text) {
    return text
      // **bold** → <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Numbered list items
      .replace(/^(\d+)\.\s(.+)$/gm, '<div class="ai-step"><span class="ai-step-num">$1</span> $2</div>')
      // Bullet items
      .replace(/^- (.+)$/gm, '<div class="ai-bullet">• $1</div>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  // ── Main query function ───────────────────────────────────
  async function query(userQuery, onLoading, onResult, onError) {
    if (!userQuery || !userQuery.trim()) return;

    // Show loading state
    if (onLoading) onLoading();

    // Abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await fetch(API_BASE_URL + '/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery.trim() }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'API error ' + res.status);
      }

      const data = await res.json();

      if (data.fallback || !data.response) {
        throw new Error(data.error || 'No response');
      }

      // Format and return
      const style = URGENCY_STYLES[data.urgency] || URGENCY_STYLES.medium;
      const formatted = formatResponse(data.response);

      onResult({
        html: formatted,
        urgency: data.urgency,
        protocol: data.protocol,
        style,
        source: 'gemini'
      });

    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[ProxiAI] API error, falling back to keyword routing:', err.message);

      // Keyword fallback
      const match = keywordFallback(userQuery);
      if (match) {
        onResult({
          html: 'Based on <strong>"' + userQuery + '"</strong>, I recommend the <a href="' + match.page + '" style="color:#7AE89A;font-weight:700;">' + match.label + ' &rarr;</a><br><small style="color:rgba(255,255,255,0.44);margin-top:6px;display:block;">AI guidance temporarily unavailable &mdash; using offline matching.</small>',
          urgency: 'medium',
          protocol: null,
          style: URGENCY_STYLES.medium,
          source: 'fallback'
        });
      } else if (onError) {
        onError('AI guidance is temporarily unavailable. Please use the Emergency Protocols or Symptom Check below.');
      }
    }
  }

  return { query, formatResponse, URGENCY_STYLES };
})();

window.ProxiAI = ProxiAI;
