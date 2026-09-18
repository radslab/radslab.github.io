// app.js – fetch index.json, render cards, search, tag filter, dark‑mode toggle

(async () => {
  const root = document.querySelector('#root');
  const darkToggle = document.getElementById('dark-toggle');

  const setDark = (on) => {
    document.documentElement.dataset.theme = on ? 'dark' : 'light';
    document.body.classList.toggle('dark', on);
    localStorage.setItem('dark', on);
  };
  setDark(localStorage.getItem('dark') === 'true');
  darkToggle.addEventListener('click', () => setDark(!document.body.classList.contains('dark')));

  const fetchIndex = async () => {
    try {
      const res = await fetch('index.json');
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      return data.extensions;
    } catch (e) {
      root.innerHTML = `<p class="error">Failed to load extensions. <button id="retry">Retry</button></p>`;
      document.getElementById('retry').addEventListener('click', () => location.reload());
      return [];
    }
  };

  const render = (exts) => {
    const html = exts.map(e => `
      <div class="card" data-tags="${e.tags.join(' ')}" data-name="${e.name.toLowerCase()}">
        <h3>${e.name}</h3>
        <p>${e.description}</p>
        <p><strong>v${e.version}</strong></p>
        <p>${e.tags.map(t=>`<span class="tag">${t}</span>`).join(' ')}</p>
        <button data-slug="${e.slug}" class="install">Install</button>
      </div>`).join('');
    root.innerHTML = `<div class="grid">${html}</div>`;
  };

  const allExt = await fetchIndex();
  render(allExt);
})();
