'use strict';

const STORAGE_KEY = 'playdeck-games-v1';
const defaultGames = [
  { id: 'demo-cyberpunk', name: 'Cyberpunk 2077', genre: 'RPG', platform: 'PC', status: 'installed', favorite: true, cover: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg', link: 'https://store.steampowered.com/app/1091500/', description: 'Explore Night City, uma megalópole obcecada por poder, glamour e modificações corporais.', createdAt: 6 },
  { id: 'demo-rdr2', name: 'Red Dead Redemption 2', genre: 'Aventura', platform: 'PC', status: 'installed', favorite: true, cover: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg', link: 'https://store.steampowered.com/app/1174180/', description: 'Uma jornada épica pelo Velho Oeste em um mundo aberto cheio de vida.', createdAt: 5 },
  { id: 'demo-eldenring', name: 'ELDEN RING', genre: 'RPG', platform: 'PC', status: 'backlog', favorite: false, cover: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg', link: 'https://store.steampowered.com/app/1245620/', description: 'Desvende os mistérios das Terras Intermédias e enfrente desafios lendários.', createdAt: 4 },
  { id: 'demo-bg3', name: "Baldur's Gate 3", genre: 'Estratégia', platform: 'PC', status: 'owned', favorite: false, cover: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg', link: 'https://store.steampowered.com/app/1086940/', description: 'Reúna seu grupo e decida o destino de um mundo em uma aventura de RPG.', createdAt: 3 },
  { id: 'demo-forza', name: 'Forza Horizon 5', genre: 'Corrida', platform: 'PC', status: 'installed', favorite: false, cover: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1551360/header.jpg', link: 'https://store.steampowered.com/app/1551360/', description: 'Corra por paisagens vibrantes e descubra o México em um festival automotivo.', createdAt: 2 },
  { id: 'demo-gta', name: 'Grand Theft Auto V', genre: 'Ação', platform: 'PC', status: 'backlog', favorite: false, cover: 'https://shared.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg', link: 'https://store.steampowered.com/app/271590/', description: 'Três protagonistas, uma cidade enorme e uma história de crime e ambição.', createdAt: 1 }
];

let games = loadGames();
let activeView = 'discover';
let activeFilter = 'all';
let activeGenre = 'all';
let selectedGameId = null;
let pendingCoverData = '';
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadGames() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [...defaultGames];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [...defaultGames];
  } catch (error) {
    console.warn('Não foi possível ler a biblioteca salva:', error);
    return [...defaultGames];
  }
}

function saveGames() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    return true;
  } catch (error) {
    showToast('Não foi possível salvar. A imagem pode ser muito grande.');
    console.error(error);
    return false;
  }
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function statusLabel(status) {
  return status === 'installed' ? 'INSTALADO' : status === 'backlog' ? 'QUERO JOGAR' : 'NA BIBLIOTECA';
}

function getVisibleGames() {
  const search = $('#searchInput').value.trim().toLocaleLowerCase('pt-BR');
  let result = [...games];
  if (activeView === 'favorites') result = result.filter(game => game.favorite);
  if (activeView === 'library') result = result.filter(game => game.status !== 'backlog');
  if (activeFilter === 'installed') result = result.filter(game => game.status === 'installed');
  if (activeFilter === 'backlog') result = result.filter(game => game.status === 'backlog');
  if (activeGenre !== 'all') result = result.filter(game => game.genre === activeGenre);
  if (search) result = result.filter(game => `${game.name} ${game.genre} ${game.platform}`.toLocaleLowerCase('pt-BR').includes(search));

  const sort = $('#sortSelect').value;
  if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  else if (sort === 'genre') result.sort((a, b) => a.genre.localeCompare(b.genre, 'pt-BR'));
  else result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return result;
}

function render() {
  renderStats();
  renderHero();
  renderGames();
  $('#libraryCount').textContent = games.filter(game => game.status !== 'backlog').length;
  $('#storageText').textContent = `${games.length} ${games.length === 1 ? 'jogo salvo' : 'jogos salvos'} neste navegador`;
}

function renderStats() {
  $('#statTotal').textContent = String(games.length).padStart(2, '0');
  $('#statInstalled').textContent = String(games.filter(game => game.status === 'installed').length).padStart(2, '0');
  $('#statFavorites').textContent = String(games.filter(game => game.favorite).length).padStart(2, '0');
}

function renderHero() {
  const featured = games.find(game => game.id === 'demo-cyberpunk') || games[0];
  const hero = $('#heroSection');
  if (!featured) {
    hero.hidden = true;
    return;
  }
  hero.hidden = false;
  $('#heroArt').style.backgroundImage = featured.cover
    ? `linear-gradient(90deg, rgba(8,15,22,.2), rgba(8,15,22,.05)), url("${featured.cover.replace(/["\\]/g, '')}")`
    : 'linear-gradient(120deg, #24465e, #172433 65%, #293a4b)';
  $('#heroTitle').textContent = featured.name;
  $('#heroDescription').textContent = featured.description || `${featured.name} faz parte da sua coleção. Adicione uma descrição para personalizar este destaque.`;
  $('#heroPlatform').textContent = featured.platform.toUpperCase();
  $('#heroGenre').textContent = `${featured.genre} · ${featured.platform}`;
  $('#heroAction').onclick = () => openDetails(featured.id);
}

function renderGames() {
  const visible = getVisibleGames();
  const grid = $('#gamesGrid');
  grid.innerHTML = visible.map(game => {
    const cover = game.cover ? `<img src="${escapeHTML(game.cover)}" alt="Capa de ${escapeHTML(game.name)}" loading="lazy" onerror="this.style.display='none'">` : '';
    return `
      <article class="game-card" data-id="${escapeHTML(game.id)}">
        <div class="game-card-cover" data-open="${escapeHTML(game.id)}">
          <div class="cover-fallback">${escapeHTML(game.name.slice(0, 2).toUpperCase())}</div>
          ${cover}
          <div class="cover-shade"></div>
          <span class="status-pill ${game.status}">${statusLabel(game.status)}</span>
          <button class="favorite-button ${game.favorite ? 'is-favorite' : ''}" data-favorite="${escapeHTML(game.id)}" aria-label="${game.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${game.favorite ? '♥' : '♡'}</button>
        </div>
        <div class="game-card-info">
          <div class="game-card-title-row"><h3 data-open="${escapeHTML(game.id)}" title="${escapeHTML(game.name)}">${escapeHTML(game.name)}</h3><span class="game-platform">${escapeHTML(game.platform)}</span></div>
          <div class="game-subtitle">${escapeHTML(game.genre)} <span>·</span> ${escapeHTML(game.platform)}</div>
          <div class="game-card-footer"><button class="game-link-button" data-open="${escapeHTML(game.id)}">Ver detalhes ↗</button><span class="game-card-date">PLAYDECK</span></div>
        </div>
      </article>`;
  }).join('');
  $('#emptyState').hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  $('#gamesHeading').textContent = activeView === 'favorites' ? 'Seus favoritos' : activeView === 'library' ? 'Sua biblioteca' : activeGenre === 'all' ? 'Jogos em destaque' : `Jogos de ${activeGenre}`;
}

function setView(view) {
  activeView = view;
  $$('.side-nav [data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  const labels = { discover: 'DESCOBRIR', library: 'BIBLIOTECA', favorites: 'FAVORITOS' };
  $('#breadcrumbCurrent').textContent = labels[view];
  $('#pageTitle').innerHTML = view === 'favorites' ? 'Seus jogos <span>favoritos.</span>' : view === 'library' ? 'Sua coleção, <span>do seu jeito.</span>' : 'Descubra seu próximo <span>jogo favorito.</span>';
  $('#pageSubtitle').textContent = view === 'favorites' ? 'Os jogos que você marcou para encontrar rapidinho.' : view === 'library' ? 'Todos os jogos que já fazem parte da sua coleção.' : 'Organize sua coleção, acompanhe o que quer jogar e deixe tudo no seu estilo.';
  activeFilter = 'all';
  $$('.filter-tab').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
  renderGames();
}

function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if (!$('.modal-backdrop.open')) document.body.style.overflow = '';
}

function openGameForm(game = null) {
  $('#gameForm').reset();
  $('#gameId').value = game?.id || '';
  $('#modalTitle').textContent = game ? 'Editar jogo' : 'Adicionar jogo';
  $('#gameName').value = game?.name || '';
  $('#gameGenre').value = game?.genre || 'Ação';
  $('#gamePlatform').value = game?.platform || 'PC';
  $('#gameStatus').value = game?.status || 'installed';
  $('#gameCover').value = game?.cover && !game.cover.startsWith('data:') ? game.cover : '';
  $('#gameLink').value = game?.link || '';
  $('#gameDescription').value = game?.description || '';
  $('#gameFavorite').checked = Boolean(game?.favorite);
  $('#formError').textContent = '';
  pendingCoverData = game?.cover?.startsWith('data:') ? game.cover : '';
  openModal('gameModal');
  setTimeout(() => $('#gameName').focus(), 80);
}

function openDetails(id) {
  const game = games.find(item => item.id === id);
  if (!game) return;
  selectedGameId = id;
  $('#detailTitle').textContent = game.name;
  $('#detailCover').style.backgroundImage = game.cover ? `url("${game.cover.replace(/["\\]/g, '')}")` : 'linear-gradient(130deg, #24465e, #111d28)';
  $('#detailTags').innerHTML = `<span>${escapeHTML(game.genre)}</span><span>${escapeHTML(game.platform)}</span><span>${statusLabel(game.status)}</span>${game.favorite ? '<span>♥ FAVORITO</span>' : ''}`;
  $('#detailDescription').textContent = game.description || 'Nenhuma descrição adicionada.';
  $('#detailOpenButton').disabled = !game.link;
  $('#detailOpenButton').style.opacity = game.link ? '1' : '.45';
  $('#detailOpenButton').onclick = () => { if (game.link) window.open(game.link, '_blank', 'noopener,noreferrer'); };
  openModal('detailModal');
}

function toggleFavorite(id) {
  const game = games.find(item => item.id === id);
  if (!game) return;
  game.favorite = !game.favorite;
  saveGames();
  render();
  if ($('#detailModal').classList.contains('open')) openDetails(id);
  showToast(game.favorite ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.');
}

function deleteGame(id) {
  const game = games.find(item => item.id === id);
  if (!game) return;
  if (!window.confirm(`Excluir “${game.name}” da sua biblioteca?`)) return;
  games = games.filter(item => item.id !== id);
  saveGames();
  closeModal('detailModal');
  render();
  showToast('Jogo removido da biblioteca.');
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function exportLibrary() {
  const data = JSON.stringify({ app: 'PLAYDECK', version: 1, exportedAt: new Date().toISOString(), games }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'playdeck-biblioteca.json';
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Backup da biblioteca exportado.');
}

function importLibrary(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const incoming = Array.isArray(parsed) ? parsed : parsed.games;
      if (!Array.isArray(incoming)) throw new Error('Formato inválido');
      const valid = incoming.filter(game => game && typeof game.name === 'string' && typeof game.genre === 'string')
        .map(game => ({
          id: String(game.id || crypto.randomUUID()), name: String(game.name).slice(0, 60), genre: String(game.genre),
          platform: String(game.platform || 'PC'), status: ['installed', 'backlog', 'owned'].includes(game.status) ? game.status : 'owned',
          favorite: Boolean(game.favorite), cover: typeof game.cover === 'string' ? game.cover : '',
          link: typeof game.link === 'string' ? game.link : '', description: typeof game.description === 'string' ? game.description.slice(0, 240) : '',
          createdAt: Number(game.createdAt) || Date.now()
        }));
      if (!valid.length && incoming.length) throw new Error('Nenhum jogo válido encontrado');
      games = valid;
      saveGames();
      render();
      showToast(`${games.length} jogos importados.`);
    } catch (error) {
      showToast('Arquivo inválido. Selecione um backup PLAYDECK em JSON.');
    }
    $('#importFile').value = '';
  };
  reader.onerror = () => showToast('Não foi possível ler o arquivo.');
  reader.readAsText(file);
}

function isSafeUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

$('#gameForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = $('#gameId').value;
  const existing = games.find(game => game.id === id);
  const coverInput = $('#gameCover').value.trim();
  const link = $('#gameLink').value.trim();
  if (!isSafeUrl(coverInput) || !isSafeUrl(link)) {
    $('#formError').textContent = 'Use links que comecem com http:// ou https://.';
    return;
  }
  const game = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : `game-${Date.now()}`),
    name: $('#gameName').value.trim(), genre: $('#gameGenre').value, platform: $('#gamePlatform').value,
    status: $('#gameStatus').value, favorite: $('#gameFavorite').checked,
    cover: pendingCoverData || coverInput || existing?.cover || '', link,
    description: $('#gameDescription').value.trim(), createdAt: existing?.createdAt || Date.now()
  };
  if (!game.name) {
    $('#formError').textContent = 'Digite o nome do jogo.';
    return;
  }
  if (existing) games = games.map(item => item.id === id ? game : item);
  else games.unshift(game);
  if (!saveGames()) return;
  closeModal('gameModal');
  render();
  showToast(existing ? 'Jogo atualizado.' : 'Jogo adicionado à biblioteca.');
});

$('#gameCoverFile').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 1_200_000) {
    $('#formError').textContent = 'A imagem deve ter até 1,2 MB. Reduza o tamanho e tente novamente.';
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingCoverData = String(reader.result);
    $('#formError').textContent = 'Imagem local selecionada.';
  };
  reader.onerror = () => { $('#formError').textContent = 'Não foi possível carregar essa imagem.'; };
  reader.readAsDataURL(file);
});

$('#gamesGrid').addEventListener('click', (event) => {
  const favoriteButton = event.target.closest('[data-favorite]');
  if (favoriteButton) {
    event.stopPropagation();
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }
  const openButton = event.target.closest('[data-open]');
  if (openButton) openDetails(openButton.dataset.open);
});

$$('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$$('[data-genre]').forEach(button => button.addEventListener('click', () => {
  activeGenre = button.dataset.genre;
  $$('#genreNav [data-genre]').forEach(item => item.classList.toggle('active', item === button));
  activeView = 'discover';
  $$('.side-nav [data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === 'discover'));
  $('#breadcrumbCurrent').textContent = 'DESCOBRIR';
  renderGames();
}));
$$('.filter-tab').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  $$('.filter-tab').forEach(item => item.classList.toggle('active', item === button));
  renderGames();
}));

$('#searchInput').addEventListener('input', renderGames);
$('#sortSelect').addEventListener('change', renderGames);
$('#addGameButton').addEventListener('click', () => openGameForm());
$('#emptyAddButton').addEventListener('click', () => openGameForm());
$('#detailEditButton').addEventListener('click', () => {
  const game = games.find(item => item.id === selectedGameId);
  if (game) { closeModal('detailModal'); openGameForm(game); }
});
$('#detailDeleteButton').addEventListener('click', () => deleteGame(selectedGameId));
$('#exportButton').addEventListener('click', exportLibrary);
$('#importButton').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', (event) => importLibrary(event.target.files?.[0]));
$$('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.close)));
$$('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => {
  if (event.target === backdrop) closeModal(backdrop.id);
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') $$('.modal-backdrop.open').forEach(modal => closeModal(modal.id));
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    $('#searchInput').focus();
  }
});
$('#mobileMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
document.addEventListener('click', event => {
  if (window.innerWidth <= 760 && $('#sidebar').classList.contains('open') && !event.target.closest('#sidebar') && !event.target.closest('#mobileMenu')) {
    $('#sidebar').classList.remove('open');
  }
});

render();
