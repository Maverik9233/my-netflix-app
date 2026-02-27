const PLAYLIST_URL = 'https://github.com/Maverik9233/daddylive--player/raw/refs/heads/main/serietv.json'; // O JSON, sostituisci qui

async function loadPlaylist() {
    const response = await fetch(PLAYLIST_URL);
    const text = await response.text();
    
    let items = [];
    if (PLAYLIST_URL.endsWith('.m3u')) {
        // Parsa M3U
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXTINF:')) {
                const title = lines[i].split(',')[1] || 'Untitled';
                const url = lines[i+1].trim();
                items.push({ title, url, poster: '' }); // Aggiungi poster se hai #EXTINF con tvg-logo
            }
        }
    } else if (PLAYLIST_URL.endsWith('.json')) {
        // Parsa JSON
        items = JSON.parse(text);
    }
    
    const grid = document.getElementById('content-grid');
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.onclick = () => playVideo(item.url);
        if (item.poster) {
            const img = document.createElement('img');
            img.src = item.poster;
            div.appendChild(img);
        }
        const p = document.createElement('p');
        p.textContent = item.title;
        div.appendChild(p);
        grid.appendChild(div);
    });
}

function playVideo(url) {
    const video = document.getElementById('video-player');
    const modal = document.getElementById('player-modal');
    modal.style.display = 'flex';
    
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
    }
    video.play();
}

function closePlayer() {
    const video = document.getElementById('video-player');
    video.pause();
    document.getElementById('player-modal').style.display = 'none';
}

loadPlaylist();
