/**
 * RolliDex Analytics — silent Discord backend
 * Zero user impact. All data routes through the Cloudflare Worker proxy.
 * Configured by window.SITE_ID / SITE_NAME / SITE_EMOJI / SITE_COLOR / PROXY_URL
 */
(function () {
  'use strict';

  // ── Config (injected by page) ──────────────────────────────────────────
  const SITE_ID    = window.SITE_ID    || 'rollidex';
  const SITE_NAME  = window.SITE_NAME  || 'RolliDex';
  const SITE_EMOJI = window.SITE_EMOJI || '⌚';
  const SITE_COLOR = window.SITE_COLOR || 0xC9A84C;
  const PROXY_URL  = window.PROXY_URL  || '';

  if (!PROXY_URL) return; // not configured — bail silently

  // ── Session management ─────────────────────────────────────────────────
  // One unique session ID per browser tab, cleared when tab closes
  const SESSION_KEY = 'rdx_sid_' + SITE_ID;
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = Date.now().toString(36).toUpperCase() + '-'
      + Math.random().toString(36).slice(2, 6).toUpperCase();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  const sessionStart      = Date.now();
  let   sessionEndSent    = false;
  const alreadyPingedKey  = 'rdx_pinged_' + SITE_ID;
  let   alreadyPinged     = sessionStorage.getItem(alreadyPingedKey) === '1';

  // ── Daily counters (localStorage, keyed by date) ───────────────────────
  const TODAY       = new Date().toISOString().slice(0, 10);
  const COUNTER_KEY = 'rdx_cnt_' + SITE_ID + '_' + TODAY;

  function getCounters() {
    try {
      return JSON.parse(localStorage.getItem(COUNTER_KEY))
          || { visits: 0, clicks: 0, scrollDepth: 0, forms: 0 };
    } catch { return { visits: 0, clicks: 0, scrollDepth: 0, forms: 0 }; }
  }

  function saveCounters(c) {
    try { localStorage.setItem(COUNTER_KEY, JSON.stringify(c)); } catch {}
  }

  // ── Bot scoring engine (0–15) ──────────────────────────────────────────
  // Start at 7 (neutral). Deduct for bot signals, add for human signals.
  let botScore       = 7;
  let mouseHasMoved  = false;
  let hasScrolled    = false;
  let hasTouched     = false;

  // Immediate static checks
  if (navigator.webdriver)                          botScore -= 5;
  if (!navigator.plugins || navigator.plugins.length === 0) botScore -= 2;

  function clamp(n) { return Math.max(0, Math.min(15, n)); }

  function botLabel() {
    if (botScore >= 8)  return '🟢 Human';
    if (botScore >= 4)  return '🟡 Uncertain';
    return '🔴 Bot';
  }

  // Route low-scoring visitors to #bot-traffic instead of the real channel
  function route(channel) {
    return botScore <= 3 ? 'bot-traffic' : channel;
  }

  // ── Proxy send ─────────────────────────────────────────────────────────
  function send(channel, payload, keepalive) {
    try {
      fetch(PROXY_URL, {
        method:    'POST',
        headers:   { 'Content-Type': 'application/json' },
        body:      JSON.stringify({ channel: route(channel), payload }),
        ...(keepalive ? { keepalive: true } : {})
      }).catch(() => {});
    } catch {}
  }

  // ── Interaction timing — too fast = bot ───────────────────────────────
  let firstInteractionChecked = false;

  function checkFirstInteractionTiming() {
    if (firstInteractionChecked) return;
    firstInteractionChecked = true;
    const elapsed = Date.now() - sessionStart;
    if (elapsed < 200) {
      botScore = clamp(botScore - 5);
    }
  }

  // ── Human signal listeners ─────────────────────────────────────────────
  document.addEventListener('mousemove', function onMove() {
    if (!mouseHasMoved) {
      mouseHasMoved = true;
      botScore = clamp(botScore + 2);
      document.removeEventListener('mousemove', onMove);
    }
  }, { passive: true });

  document.addEventListener('touchstart', function onTouch() {
    if (!hasTouched) {
      hasTouched = true;
      botScore = clamp(botScore + 2);
      document.removeEventListener('touchstart', onTouch);
    }
  }, { passive: true });

  // 5 seconds on page = human signal
  setTimeout(function () {
    botScore = clamp(botScore + 2);
  }, 5000);

  // ── Page visit ping (once per session) ────────────────────────────────
  function pingVisit() {
    if (alreadyPinged) return;
    alreadyPinged = true;
    sessionStorage.setItem(alreadyPingedKey, '1');

    const counters = getCounters();
    counters.visits++;
    saveCounters(counters);

    const ref    = document.referrer
      ? (document.referrer.length > 80 ? document.referrer.slice(0, 80) + '…' : document.referrer)
      : 'Direct';
    const page   = window.location.pathname + window.location.search || '/';
    const screen = window.screen.width + '×' + window.screen.height;
    const lang   = navigator.language || '—';
    const tz     = (Intl && Intl.DateTimeFormat)
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : '—';

    send('live-feed', {
      embeds: [{
        title:     `${SITE_EMOJI} New Visit — ${SITE_NAME}`,
        color:     SITE_COLOR,
        fields: [
          { name: '📄 Page',       value: page || '/',           inline: true  },
          { name: '🔗 Referrer',   value: ref,                   inline: true  },
          { name: '🤖 Bot Score',  value: `${botLabel()} (${botScore}/15)`, inline: true },
          { name: '🖥️ Screen',     value: screen,                inline: true  },
          { name: '🌍 Language',   value: lang,                  inline: true  },
          { name: '🕐 Timezone',   value: tz,                    inline: true  },
          { name: '🪪 Session',    value: sessionId,             inline: true  },
        ],
        timestamp: new Date().toISOString(),
      }]
    });
  }

  // ── Session end ────────────────────────────────────────────────────────
  function pingSessionEnd() {
    if (sessionEndSent) return;
    sessionEndSent = true;

    const secs = Math.round((Date.now() - sessionStart) / 1000);
    const dur  = secs >= 60
      ? `${Math.floor(secs / 60)}m ${secs % 60}s`
      : `${secs}s`;

    const counters = getCounters();

    send('live-feed', {
      embeds: [{
        title:  `${SITE_EMOJI} Session Ended — ${SITE_NAME}`,
        color:  0x36393F,
        fields: [
          { name: '⏱️ Duration',   value: dur,                           inline: true },
          { name: '🤖 Bot Score',  value: `${botLabel()} (${botScore}/15)`, inline: true },
          { name: '📊 Max Scroll', value: `${counters.scrollDepth || 0}%`, inline: true },
          { name: '🪪 Session',    value: sessionId,                     inline: true },
        ],
        timestamp: new Date().toISOString(),
      }]
    }, true /* keepalive */);
  }

  window.addEventListener('beforeunload', pingSessionEnd);
  window.addEventListener('pagehide',     pingSessionEnd);

  // ── Scroll depth milestones 25 / 50 / 75 / 100% ───────────────────────
  const scrollMilestones = { 25: false, 50: false, 75: false, 100: false };

  window.addEventListener('scroll', function () {
    if (!hasScrolled) {
      hasScrolled = true;
      botScore = clamp(botScore + 2);
    }

    const scrolled = window.scrollY + window.innerHeight;
    const total    = Math.max(1, document.documentElement.scrollHeight);
    const pct      = Math.min(100, Math.round((scrolled / total) * 100));

    const counters = getCounters();
    if (pct > (counters.scrollDepth || 0)) {
      counters.scrollDepth = pct;
      saveCounters(counters);
    }

    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m && !scrollMilestones[m]) {
        scrollMilestones[m] = true;
        send('live-feed', {
          embeds: [{
            title:  `${SITE_EMOJI} Scroll ${m}% — ${SITE_NAME}`,
            color:  SITE_COLOR,
            fields: [
              { name: '📊 Depth',   value: `${m}%`,   inline: true },
              { name: '🪪 Session', value: sessionId, inline: true },
            ],
            timestamp: new Date().toISOString(),
          }]
        });
      }
    });
  }, { passive: true });

  // ── Click tracking via data-track attributes ───────────────────────────
  document.addEventListener('click', function (e) {
    checkFirstInteractionTiming();

    const el = e.target && e.target.closest
      ? e.target.closest('[data-track]')
      : null;
    if (!el) return;

    const label    = el.getAttribute('data-track') || 'unknown';
    const counters = getCounters();
    counters.clicks++;
    saveCounters(counters);

    send('live-feed', {
      embeds: [{
        title:  `${SITE_EMOJI} Click — ${SITE_NAME}`,
        color:  SITE_COLOR,
        fields: [
          { name: '🖱️ Element',  value: label,     inline: true },
          { name: '📄 Page',     value: window.location.pathname, inline: true },
          { name: '🪪 Session',  value: sessionId, inline: true },
        ],
        timestamp: new Date().toISOString(),
      }]
    });
  });

  // ── Email signup form watcher (coming soon page + future forms) ────────
  function watchEmailForms() {
    // Covers .form-wrap divs and <form> elements with an email input
    document.querySelectorAll('form, .form-wrap').forEach(function (wrap) {
      if (wrap._rdxWatched) return;
      wrap._rdxWatched = true;

      const btn        = wrap.querySelector('button');
      const emailInput = wrap.querySelector('input[type="email"]');
      if (!btn || !emailInput) return;

      btn.addEventListener('click', function () {
        const email = emailInput.value.trim();
        if (!email || !email.includes('@')) return;

        // Wait 1.5s — if the success state appeared, submission went through
        setTimeout(function () {
          const successEl = document.getElementById('successState');
          const formHidden = document.getElementById('formContainer');

          if ((successEl && successEl.classList.contains('show'))
              || (formHidden && formHidden.style.display === 'none')) {

            const counters = getCounters();
            counters.forms++;
            saveCounters(counters);

            send('new-messages', {
              embeds: [{
                title:  `${SITE_EMOJI} Email Signup — ${SITE_NAME}`,
                color:  0x57F287,
                fields: [
                  { name: '📧 Email',   value: email,     inline: true },
                  { name: '📄 Page',    value: window.location.pathname, inline: true },
                  { name: '🪪 Session', value: sessionId, inline: true },
                ],
                timestamp: new Date().toISOString(),
              }]
            });
          }
        }, 1500);
      });
    });

    // Standard Formspree <form> submissions
    document.querySelectorAll('form[action*="formspree"]').forEach(function (form) {
      if (form._rdxFormspree) return;
      form._rdxFormspree = true;

      form.addEventListener('submit', function () {
        const nameEl  = form.querySelector('[name="name"],[name="_name"]');
        const emailEl = form.querySelector('[name="email"],[name="_replyto"]');
        const msgEl   = form.querySelector('[name="message"],textarea');

        const name    = (nameEl  && nameEl.value)  ? nameEl.value                        : '—';
        const email   = (emailEl && emailEl.value) ? emailEl.value                       : '—';
        const message = (msgEl   && msgEl.value)   ? msgEl.value.slice(0, 300)           : '—';

        const counters = getCounters();
        counters.forms++;
        saveCounters(counters);

        send('new-messages', {
          embeds: [{
            title:  `${SITE_EMOJI} New Message — ${SITE_NAME}`,
            color:  0x57F287,
            fields: [
              { name: '👤 Name',    value: name,      inline: true  },
              { name: '📧 Email',   value: email,     inline: true  },
              { name: '💬 Message', value: message,   inline: false },
              { name: '🪪 Session', value: sessionId, inline: true  },
            ],
            timestamp: new Date().toISOString(),
          }]
        });
      });
    });
  }

  // ── Honeypot form protection ───────────────────────────────────────────
  // Injects a hidden field into every <form>. Bots fill it; humans don't see it.
  function injectHoneypots() {
    document.querySelectorAll('form').forEach(function (form) {
      if (form.querySelector('.rdx-hp')) return;

      var hp = document.createElement('input');
      hp.type = 'text';
      hp.name = 'website';
      hp.className = 'rdx-hp';
      hp.setAttribute('tabindex', '-1');
      hp.setAttribute('autocomplete', 'off');
      hp.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;width:0;pointer-events:none;';
      form.appendChild(hp);

      var formOpenTime = Date.now();

      form.addEventListener('submit', function (e) {
        var filledHp = form.querySelector('.rdx-hp');
        var elapsed  = Date.now() - formOpenTime;
        var triggered = (filledHp && filledHp.value !== '') || elapsed < 1500;

        if (triggered) {
          e.preventDefault();
          e.stopImmediatePropagation();

          send('bot-traffic', {
            embeds: [{
              title:  `🍯 Honeypot Triggered — ${SITE_NAME}`,
              color:  0xED4245,
              fields: [
                { name: '🪤 Reason',     value: (filledHp && filledHp.value) ? 'Field filled' : 'Submitted in ' + elapsed + 'ms', inline: true },
                { name: '🤖 Bot Score',  value: `${botLabel()} (${botScore}/15)`, inline: true },
                { name: '📄 Page',       value: window.location.pathname, inline: true },
                { name: '🪪 Session',    value: sessionId, inline: true },
              ],
              timestamp: new Date().toISOString(),
            }]
          });

          return false;
        }
      }, true /* capture */);
    });
  }

  // ── Easter egg tracker (public API) ────────────────────────────────────
  window.trackEasterEgg = function (name) {
    send('easter-eggs', {
      embeds: [{
        title:  `🥚 Easter Egg Found — ${SITE_NAME}`,
        color:  0xFEE75C,
        fields: [
          { name: '🎯 Egg',      value: String(name), inline: true },
          { name: '📄 Page',     value: window.location.pathname, inline: true },
          { name: '🪪 Session',  value: sessionId,    inline: true },
        ],
        timestamp: new Date().toISOString(),
      }]
    });
  };

  // ── Daily digest ───────────────────────────────────────────────────────
  // Strategy A: on page load, send yesterday's digest if not yet sent
  function sendRetroDigest() {
    try {
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yd       = yesterday.toISOString().slice(0, 10);
      var sentKey  = 'rdx_digest_sent_' + SITE_ID + '_' + yd;
      var cntKey   = 'rdx_cnt_' + SITE_ID + '_' + yd;

      if (localStorage.getItem(sentKey)) return; // already sent
      var counters = JSON.parse(localStorage.getItem(cntKey) || 'null');
      if (!counters || counters.visits === 0) return; // nothing to report

      localStorage.setItem(sentKey, '1');

      send('daily-digest', {
        embeds: [{
          title:       `${SITE_EMOJI} Daily Digest — ${SITE_NAME}`,
          color:       SITE_COLOR,
          description: `Summary for **${yd}**`,
          fields: [
            { name: '👁️ Visits',      value: String(counters.visits),                 inline: true },
            { name: '🖱️ Clicks',      value: String(counters.clicks),                 inline: true },
            { name: '📬 Forms',        value: String(counters.forms),                  inline: true },
            { name: '📊 Max Scroll',   value: `${counters.scrollDepth || 0}%`,         inline: true },
          ],
          timestamp: new Date().toISOString(),
        }]
      });
    } catch {}
  }

  // Strategy B: schedule tonight's midnight digest for users on the page then
  function scheduleMidnightDigest() {
    var now      = new Date();
    var midnight = new Date(now);
    midnight.setHours(24, 0, 1, 0); // 00:00:01 tomorrow
    var ms = midnight.getTime() - now.getTime();

    setTimeout(function () {
      var counters = getCounters();
      var sentKey  = 'rdx_digest_sent_' + SITE_ID + '_' + TODAY;
      if (localStorage.getItem(sentKey)) return;
      localStorage.setItem(sentKey, '1');

      send('daily-digest', {
        embeds: [{
          title:       `${SITE_EMOJI} Daily Digest — ${SITE_NAME}`,
          color:       SITE_COLOR,
          description: `Summary for **${TODAY}**`,
          fields: [
            { name: '👁️ Visits',    value: String(counters.visits),         inline: true },
            { name: '🖱️ Clicks',    value: String(counters.clicks),         inline: true },
            { name: '📬 Forms',     value: String(counters.forms),           inline: true },
            { name: '📊 Max Scroll',value: `${counters.scrollDepth || 0}%`, inline: true },
          ],
          timestamp: new Date().toISOString(),
        }]
      });
    }, ms);
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    watchEmailForms();
    injectHoneypots();
    sendRetroDigest();
    scheduleMidnightDigest();

    // Slight delay for visit ping so bot score has time to collect
    // synchronous signals (webdriver, plugins) before sending
    setTimeout(pingVisit, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
