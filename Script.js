// ---------- STATE ----------
let allAnime = [];
let watchlist = JSON.parse(localStorage.getItem('animeWatchlist')) || [];

// ---------- DOM REFS ----------
const grid = document.getElementById('cardGrid');
const searchInput = document.getElementById('searchInput');
const genreFilter = document.getElementById('genreFilter');
const stats = document.getElementById('stats');
const watchlistContainer = document.getElementById('watchlistContainer');

// ---------- FETCH DATA ----------
async function fetchAnime() {
  try {
    const res = await fetch('https://api.jikan.moe/v4/top/anime?limit=50');
    const data = await res.json();
    allAnime = data.data;
    render();
  } catch (err) {
    grid.innerHTML = `<p style="color:#f5576c;">⚠️ Failed to load. Refresh or try again later.</p>`;
    console.error(err);
  }
}

// ---------- RENDER CARDS ----------
function render() {
  const query = searchInput.value.toLowerCase().trim();
  const genre = genreFilter.value;

  let filtered = allAnime.filter(anime => {
    const matchTitle = anime.title.toLowerCase().includes(query);
    const matchGenre = genre === '' || (anime.genres && anime.genres.some(g => g.name === genre));
    return matchTitle && matchGenre;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="empty-state">No results found 😢</p>`;
    stats.textContent = `0 anime found`;
    return;
  }

  stats.textContent = `Showing ${filtered.length} of ${allAnime.length} anime`;

  grid.innerHTML = filtered.map(anime => {
    const isInWatchlist = watchlist.includes(anime.mal_id);
    const watchUrl = `https://www.google.com/search?q=${encodeURIComponent(anime.title + ' anime watch')}`;
    return `
      <div class="card" data-id="${anime.mal_id}">
        <img src="${anime.images.jpg.image_url}" alt="${anime.title}" loading="lazy" />
        <div class="card-body">
          <h3 title="${anime.title}">${anime.title}</h3>
          <div class="meta">
            <span>⭐ ${anime.score || 'N/A'}</span>
            <span>${anime.year || '?'}</span>
          </div>
          <div class="btn-group">
            <button class="btn btn-watchlist ${isInWatchlist ? 'added' : ''}" data-id="${anime.mal_id}">
              ${isInWatchlist ? '❤️' : '🤍'}
            </button>
            <a href="${watchUrl}" target="_blank" class="btn-watch">▶ Watch</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach watchlist toggle events
  document.querySelectorAll('.btn-watchlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      toggleWatchlist(id);
    });
  });

  // Click card to show more info
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn') || e.target.closest('.btn-watch')) return;
      const id = parseInt(card.dataset.id);
      const anime = allAnime.find(a => a.mal_id === id);
      if (anime) {
        alert(`📺 ${anime.title}\n\n⭐ Score: ${anime.score || 'N/A'}\n📅 Year: ${anime.year || 'Unknown'}\n📖 Synopsis: ${anime.synopsis || 'No synopsis available.'}`);
      }
    });
  });

  renderWatchlist();
}

// ---------- WATCHLIST LOGIC ----------
function toggleWatchlist(id) {
  const index = watchlist.indexOf(id);
  if (index > -1) {
    watchlist.splice(index, 1);
  } else {
    watchlist.push(id);
  }
  localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
  render();
}

function renderWatchlist() {
  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = `<p class="empty-state">No anime added yet. Click the ❤️ button on any card!</p>`;
    return;
  }

  const watchlistAnime = allAnime.filter(a => watchlist.includes(a.mal_id));
  if (watchlistAnime.length === 0) {
    watchlistContainer.innerHTML = `<p class="empty-state">Loading watchlist...</p>`;
    return;
  }

  watchlistContainer.innerHTML = `
    <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));">
      ${watchlistAnime.map(anime => `
        <div class="card" style="cursor:default;">
          <img src="${anime.images.jpg.image_url}" alt="${anime.title}" loading="lazy" style="height:180px;" />
          <div class="card-body">
            <h3 style="font-size:0.8rem;">${anime.title}</h3>
            <button class="btn btn-watchlist added" style="width:100%;margin-top:0.3rem;" data-id="${anime.mal_id}">❤️ Remove</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  watchlistContainer.querySelectorAll('.btn-watchlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      toggleWatchlist(id);
    });
  });
}

// ---------- SEARCH & FILTER EVENTS ----------
searchInput.addEventListener('input', render);
genreFilter.addEventListener('change', render);

// ---------- START ----------
fetchAnime();
