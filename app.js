const PLAYLISTS_URL = 'https://github.com/Maverik9233/daddylive--player/raw/refs/heads/main/serietv.json'; // ← SOSTITUISCI

let currentItems = [];
let currentListName = '';

const playlistsGrid = document.getElementById('playlists-grid');
const contentGrid = document.getElementById('content-grid');
const playlistsSection = document.getElementById('playlists-section');
const contentSection = document.getElementById('content-section');
const currentListTitle = document.getElementById('current-list-name');
const backBtn = document.getElementById('back-btn');
const video = document.getElementById('video-player');
const modal = document.getElementById('player-modal');

backBtn.onclick = backToLists;

async function loadPlaylists() {
    try {
        const res = await fetch(PLAYLISTS_URL);
        if (!res.ok) throw new Error('Impossibile caricare playlists.json');
        const playlists = await res.json();

        playlistsGrid.innerHTML = '';
        playlists.forEach(pl => {
            const div = document.createElement('div');
            div.className = 'playlist-item';
            div.innerHTML = `<h3>${pl.name || 'Collezione'}</h3>`;
            div.onclick = () => loadSinglePlaylist(pl.url, pl.name || 'Collezione', pl.type || 'm3u');
            playlistsGrid.appendChild(div);
        });
    } catch (err) {
        playlistsGrid.innerHTML = `<p style="color:#ff3366;">Errore: ${err.message}</p>`;
    }
}

// ... il resto della funzione loadSinglePlaylist, createPlaceholder, playVideo, closePlayer, backToLists rimane IDENTICO alla versione precedente che ti ho mandato ...

loadPlaylists();
