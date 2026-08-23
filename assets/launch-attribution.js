(() => {
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  const allowedCampaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'];
  const clean = (value, limit = 120) => String(value || '')
    .replace(/[^a-zA-Z0-9._~:@/+ -]/g, '')
    .trim()
    .slice(0, limit);
  const pageSource = location.pathname === '/'
    ? 'home'
    : clean(location.pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '_'), 80) || 'direct';
  const currentParams = new URLSearchParams(location.search);

  document.querySelectorAll('a[href]').forEach((link) => {
    const target = new URL(link.getAttribute('href'), location.origin);
    if (target.origin !== location.origin || target.pathname !== '/brief/') return;
    if (!target.searchParams.has('source')) target.searchParams.set('source', pageSource);
    allowedCampaignKeys.forEach((key) => {
      const value = clean(currentParams.get(key));
      if (value && !target.searchParams.has(key)) target.searchParams.set(key, value);
    });
    link.setAttribute('href', `${target.pathname}${target.search}${target.hash}`);
  });

  window.armLaunchContext = () => {
    let referrer = '';
    try {
      const parsed = new URL(document.referrer);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        referrer = clean(`${parsed.origin}${parsed.pathname}`, 240);
      }
    } catch (_) {}
    const context = {
      source: clean(currentParams.get('source')) || 'direct',
      referrer
    };
    allowedCampaignKeys.forEach((key) => {
      const value = clean(currentParams.get(key));
      if (value) context[key] = value;
    });
    return context;
  };
})();
