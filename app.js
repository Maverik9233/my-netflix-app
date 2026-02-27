const PLAYLISTS_URL = 'https://www.dropbox.com/scl/fi/fvxhrlm03y7yyyoaog7k2/Film-e-serie-TV.txt?rlkey=m41lwrfel59cydeh213i5wxu7&st=7iysx6ta&dl=1'; // ← SOSTITUISCI
const OMDB_API_KEY = 'http://www.omdbapi.com/?i=tt3896198&apikey=ebab3099';

let allContent = [];          // per ricerca globale
let currentItems = [];
let currentListName = '';
let currentItem = null;       // per riprodurre da dettagli

const playlistsGrid     = document.getElementById('playlists-grid');
const contentGrid       = document.getElementById('content-grid');
const playlistsSection  = document.getElementById('playlists-section');
const contentSection    = document.getElementById('content-section');
const currentListTitle  = document.getElementById('current-list-name');
const backBtn           = document.getElementById('back-btn');
const searchInput       = document.getElementById('search-input');
const searchResults     = document.getElementById('search-results');
const video             = document.getElementById('video-player');
const playerModal       = document.getElementById('player-modal');
const seriesModal       = document.getElementById('series-modal');
const seriesTitleEl     = document.getElementById('series-title');
const seasonsContainer  = document.getElementById('seasons-container');
const detailsModal      = document.getElementById('details-modal');
const detailsTitle      = document.getElementById('details-title');
const detailsPoster     = document.getElementById('details-poster');
const detailsPlot       = document.getElementById('details-plot');
const detailsInfo       = document.getElementById('details-info');
const detailsRating     = document.getElementById('details-rating');
const detailsCast       = document.getElementById('details-cast');
const playFromDetails   = document.getElementById('play-from-details');

backBtn.onclick = backToLists;
playFromDetails.onclick = () => {
    closeDetailsModal();
    if (currentItem.type === 'series') {
        showSeriesDetails(currentItem);
    } else {
        playVideo(currentItem.url);
    }
};

async function initApp() {
    try {
        const res = await fetch(PLAYLISTS_URL);
        if (!res.ok) throw new Error('Impossibile caricare playlists.json');
        const playlists = await res.json();

        playlistsGrid.innerHTML = '';
        allContent = [];

        for (const pl of playlists) {
            const div = document.createElement('div');
            div.className = 'playlist-item';
            div.innerHTML = `<h3>${pl.name || 'Lista'}</h3>`;
            div.onclick = () => loadSinglePlaylist(pl.url, pl.name || 'Lista', pl.type || 'm3u');
            playlistsGrid.appendChild(div);

            await preloadForSearch(pl.url, pl.name || 'Lista', pl.type || 'm3u');
        }
    } catch (err) {
        playlistsGrid.innerHTML = `<p style="color:#ff3366;">Errore: ${err.message}</p>`;
    }
}

async function preloadForSearch(url, listName, type) {
    try {
        const res = await fetch(url);
        let items = [];

        if (type === 'm3u' || url.endsWith('.m3u') || url.endsWith('.m3u8')) {
            const text = await res.text();
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXTINF:')) {
                    let title = (lines[i].split(',').slice(1).join(',') || 'Senza titolo').trim();
                    let poster = (lines[i].match(/tvg-logo="([^"]+)"/i) || [])[1] || '';
                    let videoUrl = lines[i+1]?.trim();
                    if (videoUrl?.startsWith('http')) {
                        allContent.push({ title, url: videoUrl, poster, type: 'movie', list: listName });
                    }
                }
            }
        } else {
            const data = await res.json();
            data.forEach(item => {
                allContent.push({
                    title: item.title,
                    type: item.seasons ? 'series' : 'movie',
                    poster: item.poster || '',
                    url: item.url,
                    seasons: item.seasons,
                    list: listName
                });
            });
        }
    } catch (e) {
        console.warn('Errore preload:', url);
    }
}

// Ricerca live
searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = '';
    searchResults.style.display = q.length > 1 ? 'block' : 'none';

    if (q.length < 2) return;

    const matches = allContent.filter(item => item.title.toLowerCase().includes(q)).slice(0, 15);

    if (matches.length === 0) {
        searchResults.innerHTML = '<div class="search-item">Nessun risultato</div>';
        return;
    }

    matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `${item.title} <span class="type">(${item.type === 'series' ? 'Serie' : 'Film'} • ${item.list})</span>`;
        div.onclick = () => {
            searchInput.value = '';
            searchResults.style.display = 'none';
            showDetails(item);
        };
        searchResults.appendChild(div);
    });
});

document.addEventListener('click', e => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

async function loadSinglePlaylist(url, name, type) {
    currentListName = name;
    currentListTitle.textContent = name;
    playlistsSection.style.display = 'none';
    contentSection.style.display = 'block';
    contentGrid.innerHTML = '<p>Caricamento...</p>';

    try {
        const res = await fetch(url);
        let items = [];

        if (type === 'm3u' || url.endsWith('.m3u') || url.endsWith('.m3u8')) {
            const text = await res.text();
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXTINF:')) {
                    let title = (lines[i].split(',').slice(1).join(',') || 'Senza titolo').trim();
                    let poster = (lines[i].match(/tvg-logo="([^"]+)"/i) || [])[1] || '';
                    let videoUrl = lines[i+1]?.trim();
                    if (videoUrl?.startsWith('http')) {
                        items.push({ title, url: videoUrl, poster, type: 'movie' });
                    }
                }
            }
        } else {
            items = await res.json();
            items = items.map(item => ({
                ...item,
                type: item.seasons ? 'series' : 'movie'
            }));
        }

        currentItems = items;
        contentGrid.innerHTML = items.length ? '' : '<p>Nessun contenuto trovato.</p>';

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item';

            if (item.poster) {
                const img = document.createElement('img');
                img.src = item.poster;
                img.onerror = () => { img.src = `https://via.placeholder.com/200x300/0f1626/66aaff?text=${encodeURIComponent(item.title.substring(0,15))}`; };
                div.appendChild(img);
            } else {
                const ph = document.createElement('div');
                ph.className = 'placeholder';
                ph.textContent = item.title.substring(0, 25) + (item.title.length > 25 ? '...' : '');
                div.appendChild(ph);
            }

            const p = document.createElement('p');
            p.textContent = item.title;
            div.appendChild(p);

            div.onclick = () => showDetails(item);
            contentGrid.appendChild(div);
        });
    } catch (err) {
        contentGrid.innerHTML = `<p style="color:#ff3366;">Errore: ${err.message}</p>`;
    }
}

async function fetchDetails(item) {
    try {
        const title = encodeURIComponent(item.title);
        const typeParam = item.type === 'series' ? '&type=series' : '&type=movie';
        const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${title}${typeParam}&plot=full`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (data.Response === 'False') {
            throw new Error(data.Error || 'Titolo non trovato');
        }

        return data;
    } catch (e) {
        console.error('OMDb error:', e);
        return null;
    }
}

async function showDetails(item) {
    currentItem = item;
    detailsTitle.textContent = item.title;
    detailsPoster.src = item.poster || 'https://via.placeholder.com/300x450?text=Caricamento...';
    detailsPlot.textContent = 'Caricamento dettagli...';
    detailsInfo.textContent = '';
    detailsRating.textContent = '';
    detailsCast.textContent = 'Cast: Caricamento...';

    const data = await fetchDetails(item);

    if (data) {
        detailsPoster.src = data.Poster !== 'N/A' ? data.Poster : (item.poster || 'https://via.placeholder.com/300x450?text=No+Poster');
        detailsPlot.textContent = data.Plot !== 'N/A' ? data.Plot : 'Trama non disponibile.';
        
        detailsInfo.textContent = [
            data.Year !== 'N/A' ? `Anno: ${data.Year}` : '',
            data.Runtime !== 'N/A' ? `Durata: ${data.Runtime}` : '',
            data.Genre !== 'N/A' ? `Genere: ${data.Genre}` : ''
        ].filter(Boolean).join(' • ');

        detailsRating.textContent = [
            data.imdbRating !== 'N/A' ? `IMDb: ${data.imdbRating}/10` : '',
            data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || ''
        ].filter(Boolean).join(' • ');

        detailsCast.textContent = data.Actors !== 'N/A' ? `Cast: ${data.Actors}` : 'Cast: Non disponibile';
    } else {
        detailsPlot.textContent = 'Dati non trovati su OMDb.';
        detailsCast.textContent = 'Cast: Non disponibile';
    }

    detailsModal.style.display = 'flex';
}

function closeDetailsModal() {
    detailsModal.style.display = 'none';
}

// Funzioni serie (invariate)
function showSeriesDetails(series) {
    seriesTitleEl.textContent = series.title;
    seasonsContainer.innerHTML = '';

    (series.seasons || []).forEach((season, idx) => {
        const btn = document.createElement('button');
        btn.className = 'season-btn';
        btn.textContent = `Stagione ${season.season || idx+1}`;
        btn.onclick = () => {
            document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderEpisodes(season.episodes || []);
        };
        seasonsContainer.appendChild(btn);
        if (idx === 0) btn.click();
    });

    seriesModal.style.display = 'flex';
}

function renderEpisodes(episodes) {
    let grid = seasonsContainer.querySelector('.episode-grid');
    if (grid) grid.remove();

    grid = document.createElement('div');
    grid.className = 'episode-grid';

    episodes.forEach(ep => {
        const div = document.createElement('div');
        div.className = 'episode-item';
        div.innerHTML = `<strong>E${ep.episode || '?'}</strong> ${ep.title || 'Episodio'}`;
        div.onclick = () => {
            closeSeriesModal();
            playVideo(ep.url);
        };
        grid.appendChild(div);
    });

    seasonsContainer.appendChild(grid);
}

function closeSeriesModal() {
    seriesModal.style.display = 'none';
}

function playVideo(url) {
    playerModal.style.display = 'flex';
    video.pause();

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play().catch(() => {});
    }
}

function closePlayer() {
    video.pause();
    video.src = '';
    playerModal.style.display = 'none';
}

function backToLists() {
    contentSection.style.display = 'none';
    playlistsSection.style.display = 'block';
    contentGrid.innerHTML = '';
}

initApp();
