(() => {
  const API_ENDPOINT = 'https://solid-goldfish-4jw6wv5wv4jvcq59v-3000.app.github.dev/track-play'; // DIGANTI nanti!
  const videoEl = document.getElementById('video');
  const statusEl = document.getElementById('status');
  let lastSentAt = 0, COOLDOWN_MS = 5000;
  function getClientMeta() {
    const now = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const offsetMin = now.getTimezoneOffset();
    return {
      client_ts_iso: now.toISOString(),
      tz,
      offset_min: offsetMin,
      ua: navigator.userAgent
    };
  }
  async function sendPlayEvent() {
    if (Date.now() - lastSentAt < COOLDOWN_MS) return;
    lastSentAt = Date.now();
    const payload = {
      event: 'video_play',
      video_id: videoEl.dataset.videoId || 'unknown',
      ...getClientMeta()
    };
    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
        keepalive: true
      });
      statusEl.textContent = res.ok ? 'Event play terkirim.' : 'Gagal mengirim event.';
    } catch (err) {
      statusEl.textContent = 'Gagal mengirim event.';
    }
  }
  videoEl.addEventListener('play', sendPlayEvent, { passive: true });
  videoEl.addEventListener('playing', sendPlayEvent, { passive: true });
})();
