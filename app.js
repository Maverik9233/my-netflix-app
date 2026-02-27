const PLAYLISTS_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://raw.githubusercontent.com/Maverik9233/my-netflix-app/main/playlists.json');

const OMDB_API_KEY = 'http://www.omdbapi.com/?i=tt3896198&apikey=ebab3099';

let allContent = [];
let currentItems = [];
let currentListName = '';
let currentItem = null;

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
  if (currentItem && currentItem.type === 'series') {
    showSeriesDetails(currentItem);
  } else if (currentItem) {
    playVideo(currentItem.url);
  }
};

async function initApp() {
  try {
    const res = await fetch(PLAYLISTS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const playlists = await res.json();

    playlistsGrid.innerHTML = '';
    allContent = [];

    for (const pl of playlists) {
      const div = document.createElement('div');
      div.className = 'playlist-item';
      div.innerHTML = `<h3>${pl.name || 'Lista'}</h3>`;
      div.onclick = () => loadSinglePlaylist(pl.url, pl.name || 'Lista', pl.type || 'json');
      playlistsGrid.appendChild(div);

      await preloadForSearch(pl.url, pl.name || 'Lista', pl.type || 'json');
    }
  } catch (err) {
    playlistsGrid.innerHTML = `<p style="color:red;">Errore caricamento liste: ${err.message} (controlla console)</p>`;
    console.error('Fetch playlists error:', err);
  }
}

// ... (il resto del codice app.js rimane uguale alla versione precedente che ti ho mandato: preloadForSearch, ricerca live, loadSinglePlaylist, fetchDetails con OMDb, showDetails, showSeriesDetails, playVideo, ecc.)

initApp();
