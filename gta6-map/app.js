/* GTA 6 Carte — application PWA (iPhone via « Ajouter à l’écran d’accueil »).
 * Les données viennent de data/locations.json (voir data/README.md).
 */
(() => {
  'use strict';

  const DATA_URL = 'data/locations.json';
  const FAV_KEY = 'gta6map.favorites';
  const DONE_KEY = 'gta6map.done';

  // Carte image : coordonnées en pixels de l’image (x, y), origine en haut à gauche.
  const MAP_IMAGE = 'maps/carte.jpg';
  const MAP_SIZE = [4096, 4096];

  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* navigation privée */ }
    }
  };

  const state = {
    data: null,
    locations: [],
    categoryFilter: 'all',
    favorites: new Set(store.get(FAV_KEY, [])),
    done: new Set(store.get(DONE_KEY, [])),
    markers: new Map(),
    current: null
  };

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function notify(msg, ms = 2200) {
    const el = $('#notice');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(notify._t);
    notify._t = setTimeout(() => { el.hidden = true; }, ms);
  }

  // ---------- Carte ----------
  const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 3,
    zoomSnap: 0.25,
    attributionControl: false,
    zoomControl: false,
    tap: true
  });
  const bounds = [[0, 0], [MAP_SIZE[1], MAP_SIZE[0]]];

  // Si l’image n’est pas encore fournie, on affiche une grille de repère.
  const gridLayer = L.layerGroup();
  for (let i = 0; i <= MAP_SIZE[0]; i += 512) {
    L.polyline([[0, i], [MAP_SIZE[1], i]], { color: '#1e2740', weight: 1, interactive: false }).addTo(gridLayer);
    L.polyline([[i, 0], [i, MAP_SIZE[0]]], { color: '#1e2740', weight: 1, interactive: false }).addTo(gridLayer);
  }
  gridLayer.addTo(map);

  const img = new Image();
  img.onload = () => {
    L.imageOverlay(MAP_IMAGE, bounds).addTo(map);
    gridLayer.remove();
  };
  img.src = MAP_IMAGE;

  map.fitBounds(bounds);
  const homeView = () => map.fitBounds(bounds, { animate: true });

  // ---------- Données ----------
  async function loadData() {
    const res = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Données indisponibles');
    return res.json();
  }

  function buildFilters() {
    const nav = $('#filters');
    const counts = {};
    state.locations.forEach((l) => { counts[l.category] = (counts[l.category] || 0) + 1; });
    const cats = state.data.categories || [];
    const chips = [{ id: 'all', label: '🗺️ Tout', icon: '', count: state.locations.length }]
      .concat(cats.map((c) => ({ id: c.id, label: `${c.icon} ${c.label}`, icon: c.icon, count: counts[c.id] || 0 })));
    nav.innerHTML = chips.map((c) =>
      `<button class="chip${c.id === state.categoryFilter ? ' active' : ''}" data-cat="${esc(c.id)}">${esc(c.label)}<span class="count">${c.count}</span></button>`
    ).join('');
    nav.onclick = (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      state.categoryFilter = btn.dataset.cat;
      buildFilters();
      renderMarkers();
    };
  }

  function iconFor(loc) {
    const cat = (state.data.categories || []).find((c) => c.id === loc.category);
    const icon = loc.icon || (cat && cat.icon) || '📍';
    const cls = ['marker-pin'];
    if (state.done.has(loc.id)) cls.push('done');
    return L.divIcon({
      className: '',
      html: `<div class="${cls.join(' ')}"><span>${esc(icon)}</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });
  }

  function renderMarkers() {
    state.markers.forEach((m) => m.remove());
    state.markers.clear();
    state.locations
      .filter((l) => state.categoryFilter === 'all' || l.category === state.categoryFilter)
      .forEach((loc) => {
        const m = L.marker(loc.coords, { icon: iconFor(loc), keyboard: true, title: loc.name })
          .on('click', () => openPanel(loc.id))
          .addTo(map);
        state.markers.set(loc.id, m);
      });
  }

  // ---------- Panneau détail ----------
  function openPanel(id) {
    const loc = state.locations.find((l) => l.id === id);
    if (!loc) return;
    state.current = id;
    const cat = (state.data.categories || []).find((c) => c.id === loc.category);
    const fav = state.favorites.has(id);
    const done = state.done.has(id);
    const tips = (loc.tips || []).map((t) => `<div class="tip">💡 ${esc(t)}</div>`).join('');
    const details = (loc.details || []).map((d) => `<li>${esc(d)}</li>`).join('');
    const extra = loc.image ? `<img src="${esc(loc.image)}" alt="" style="width:100%;border-radius:12px;margin-top:10px">` : '';
    $('#panel-content').innerHTML = `
      <h2>${esc(loc.icon || cat?.icon || '📍')} ${esc(loc.name)}</h2>
      <div class="meta">${esc(cat ? cat.label : '')}${loc.region ? ' · ' + esc(loc.region) : ''}</div>
      ${loc.summary ? `<p>${esc(loc.summary)}</p>` : ''}
      ${details ? `<ul>${details}</ul>` : ''}
      ${tips}
      ${extra}
      <div class="actions">
        <button class="btn" id="act-fav">${fav ? '⭐ Retiré des favoris' : '☆ Ajouter aux favoris'}</button>
        <button class="btn" id="act-done">${done ? '↩️ Marquer non fait' : '✅ Marquer comme fait'}</button>
        <button class="btn" id="act-share">🔗 Partager</button>
        <button class="btn primary" id="act-go">🧭 Y aller</button>
      </div>`;
    $('#panel').hidden = false;
    map.flyTo(loc.coords, Math.max(map.getZoom(), 1), { duration: 0.5 });

    $('#act-fav').onclick = () => { toggle(state.favorites, FAV_KEY, id); openPanel(id); updateFavCount(); renderMarkers(); };
    $('#act-done').onclick = () => { toggle(state.done, DONE_KEY, id); openPanel(id); renderMarkers(); };
    $('#act-share').onclick = () => shareLoc(loc);
    $('#act-go').onclick = () => {
      notify('Astuce : sur la carte, repérez le marqueur ; ouvrez ce lieu dans les détails.');
    };
  }

  function toggle(set, key, id) {
    set.has(id) ? set.delete(id) : set.add(id);
    store.set(key, [...set]);
  }

  async function shareLoc(loc) {
    const text = `${loc.name} — GTA 6 Carte`;
    try {
      if (navigator.share) await navigator.share({ title: text, text: loc.summary || text, url: location.href });
      else { await navigator.clipboard.writeText(`${text} ${location.href}`); notify('Lien copié'); }
    } catch { /* annulé */ }
  }

  function updateFavCount() { $('#fav-count').textContent = state.favorites.size; }

  // ---------- Recherche ----------
  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function searchLocations(q) {
    const terms = normalize(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return state.locations
      .map((l) => {
        const hay = normalize([l.name, l.summary, l.region, ...(l.tags || []), ...(l.tips || []), ...(l.details || [])].join(' '));
        if (!terms.every((t) => hay.includes(t))) return null;
        const score = (normalize(l.name).includes(terms[0]) ? 10 : 0) + (l.featured ? 1 : 0);
        return { l, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 25)
      .map((x) => x.l);
  }

  function renderResults(q) {
    const box = $('#results');
    if (!q.trim()) { box.hidden = true; return; }
    const list = searchLocations(q);
    box.hidden = false;
    box.innerHTML = list.length
      ? list.map((l) => {
          const cat = (state.data.categories || []).find((c) => c.id === l.category);
          return `<div class="result-item" data-id="${esc(l.id)}">
            <span style="font-size:22px">${esc(l.icon || cat?.icon || '📍')}</span>
            <div><strong>${esc(l.name)}</strong><small>${esc(cat ? cat.label : '')}${l.region ? ' · ' + esc(l.region) : ''}</small></div>
          </div>`;
        }).join('')
      : '<div class="empty">🔍 Aucun résultat</div>';
  }

  $('#search').addEventListener('input', (e) => {
    const v = e.target.value;
    $('#clear-search').hidden = !v;
    renderResults(v);
  });
  $('#search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = $('#results .result-item');
      if (first) first.click();
      e.target.blur();
    }
  });
  $('#results').addEventListener('click', (e) => {
    const item = e.target.closest('.result-item');
    if (!item) return;
    const loc = state.locations.find((l) => l.id === item.dataset.id);
    $('#results').hidden = true;
    $('#search').blur();
    if (!loc) return;
    if (state.categoryFilter !== 'all' && state.categoryFilter !== loc.category) {
      state.categoryFilter = 'all';
      buildFilters();
      renderMarkers();
    }
    map.setView(loc.coords, Math.max(map.getZoom(), 1));
    openPanel(loc.id);
  });
  $('#clear-search').onclick = () => {
    $('#search').value = '';
    $('#clear-search').hidden = true;
    $('#results').hidden = true;
  };

  // ---------- Barre d’outils ----------
  $('#btn-reset').onclick = homeView;
  $('#panel-close').onclick = () => { $('#panel').hidden = true; state.current = null; };
  $('#btn-fav').onclick = () => {
    const ids = [...state.favorites];
    if (!ids.length) return notify('Aucun favori pour le moment ⭐');
    const id = ids[Math.floor(Math.random() * ids.length)];
    openPanel(id);
  };
  $('#btn-random').onclick = () => {
    const pool = state.locations.filter((l) => state.categoryFilter === 'all' || l.category === state.categoryFilter);
    if (!pool.length) return notify('Aucun lieu dans cette catégorie');
    const loc = pool[Math.floor(Math.random() * pool.length)];
    map.setView(loc.coords, Math.max(map.getZoom(), 1));
    openPanel(loc.id);
  };
  $('#btn-locate').onclick = () => {
    // Les coordonnées GPS ne correspondent pas à la carte du jeu : on ne fait que signaler la position.
    if (!navigator.geolocation) return notify('Géolocalisation indisponible');
    navigator.geolocation.getCurrentPosition(
      () => notify('Position reçue. La carte du jeu n’est pas géoréférencée : utilisez la recherche.', 3200),
      () => notify('Autorisez la localisation dans les réglages de Safari.', 3200)
    );
  };

  map.on('click', () => { if (!$('#panel').hidden) { $('#panel').hidden = true; } $('#results').hidden = true; });

  // ---------- Démarrage ----------
  async function init() {
    try {
      state.data = await loadData();
      state.locations = state.data.locations || [];
      buildFilters();
      renderMarkers();
      updateFavCount();
      if (!state.locations.length) notify('Aucun lieu chargé : ajoutez des entrées dans data/locations.json', 4000);
    } catch (err) {
      notify('Impossible de charger les données : ' + err.message, 4000);
    }
  }

  init();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
