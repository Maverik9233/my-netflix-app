const PLAYLISTS_URL = 'https://github.com/Maverik9233/daddylive--player/raw/refs/heads/main/serietv.json'; // ← SOSTITUISCI

let allContent = [];          // Tutti i contenuti per la ricerca
let currentItems = [];
let currentListName = '';

const playlistsGrid = document.getElementById('playlists-grid');
const contentGrid = document.getElementById('content-grid');
const playlistsSection = document.getElementById('playlists-section');
const contentSection = document.getElementById('content-section');
const currentListTitle = document.getElementById('current-list-name');
const backBtn = document.getElementById('back-btn');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const video = document.getElementById('video-player');
const playerModal = document.getElementById('player-modal');
const seriesModal = document.getElementById('series-modal');
const seriesTitle = document.getElementById('series-title');
const seasonsContainer = document.getElementById('seasons-container');

backBtn.onclick = backToLists;

// Carica tutte le liste e raccogli contenuti per ricerca
async function initApp() {
    try {
        const res = await fetch(PLAYLISTS_URL);
        if (!res.ok) throw new Error('Errore playlists');
        const playlists = await res.json();

        playlistsGrid.innerHTML = '';
        allContent = [];

        for (const pl of playlists) {
            const div = document.createElement('div');
            div.className = 'playlist-item';
            div.innerHTML = `<h3>${pl.name || 'Collezione'}</h3>`;
            div.onclick = () => loadSinglePlaylist(pl.url, pl.name || 'Collezione', pl.type || 'm3u');
            playlistsGrid.appendChild(div);

            // Carica contenuti per ricerca globale
            await loadContentForSearch(pl.url, pl.name, pl.type || 'm3u');
        }
    } catch (err) {
        playlistsGrid.innerHTML = `<p style="color:#ff3366;">Errore: ${err.message}</p>`;
    }
}

async function loadContentForSearch(url, listName, type) {
    try {
        const res = await fetch(url);
        let data = type === 'json' ? await res.json() : await res.text();

        let items = [];
        if (type === 'm3u' || url.endsWith('.m3u') || url.endsWith('.m3u8')) {
            const lines = data.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXTINF:')) {
                    let title = lines[i].split(',').slice(1).join(',').trim() || 'Senza titolo';
                    let poster = (lines[i].match(/tvg-logo="([^"]+)"/i) || [])[1] || '';
                    let videoUrl = lines[i+1]?.trim();
                    if (videoUrl?.startsWith('http')) {
                        items.push({ title, url: videoUrl, poster, type: 'movie', list: listName });
                    }
                }
            }
        } else {
            items = data.map(item => ({
                ...item,
                list: listName,
                type: item.seasons ? 'series' : 'movie'
            }));
        }

        allContent.push(...items);
    } catch (e) {}
}

// Ricerca live con autocomplete
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = '';
    searchResults.style.display = query.length > 1 ? 'block' : 'none';

    if (query.length < 2) return;

    const matches = allContent
        .filter(item => item.title.toLowerCase().includes(query))
        .slice(0, 12); // Limite suggerimenti

    if (matches.length === 0) {
        searchResults.innerHTML = '<div class="search-item">Nessun risultato</div>';
        return;
    }

    matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
            ${item.title}
            <span class="type">(${item.type === 'series' ? 'Serie' : 'Film'} • ${item.list || ''})</span>
        `;
        div.onclick = () => {
            searchInput.value = '';
            searchResults.style.display = 'none';
            if (item.type === 'series') {
                showSeriesDetails(item);
            } else {
                playVideo(item.url);
            }
        };
        searchResults.appendChild(div);
    });
});

// Nascondi dropdown se clicchi fuori
document.addEventListener('click', e => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

async function loadSinglePlaylist(url, name, type) {
    // ... stessa funzione di prima per caricare griglia singola lista ...
    // (copia da versione precedente: currentListName, display sections, parsing items, creazione cards)
    // Aggiungi onclick alle card: se item.seasons → showSeriesDetails(item), else playVideo(item.url)
}

function showSeriesDetails(series) {
    seriesTitle.textContent = series.title;
    seasonsContainer.innerHTML = '';

    series.seasons.forEach((season, idx) => {
        const btn = document.createElement('button');
        btn.className = 'season-btn';
        btn.textContent = `Stagione ${season.season}`;
        btn.onclick = () => showEpisodes(season.episodes, btn);
        seasonsContainer.appendChild(btn);

        if (idx === 0) btn.click(); // Apri prima stagione di default
    });

    seriesModal.style.display = 'flex';
}

function showEpisodes(episodes, activeBtn) {
    document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');

    let grid = document.createElement('div');
    grid.className = 'episode-grid';

    episodes.forEach(ep => {
        const div = document.createElement('div');
        div.className = 'episode-item';
        div.innerHTML = `<strong>S${ep.season || '?'}E${ep.episode}</strong><br>${ep.title}`;
        div.onclick = () => {
            closeSeriesModal();
            playVideo(ep.url);
        };
        grid.appendChild(div);
    });

    // Sostituisci contenuto episodi
    const oldGrid = seasonsContainer.querySelector('.episode-grid');
    if (oldGrid) oldGrid.remove();
    seasonsContainer.appendChild(grid);
}

function closeSeriesModal() {
    seriesModal.style.display = 'none';
}

// Funzioni playVideo, closePlayer, backToLists, createPlaceholder rimangono come prima...

// Avvia
initApp();
