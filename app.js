const audio = new Audio();
let isPlaying = false;
let currentPlaylist = [];
let currentIndex = 0;

// UI Elements
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const playerImg = document.getElementById('player-img');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const seekBar = document.getElementById('seek-bar');
const timeCurrent = document.getElementById('time-current');
const timeDuration = document.getElementById('time-duration');
const searchInput = document.getElementById('search-input');
const searchSpinner = document.getElementById('search-spinner');
const songsGrid = document.getElementById('songs-grid');
const sectionTitle = document.getElementById('section-title');
const resultsCount = document.getElementById('results-count');
const engineStatus = document.getElementById('engine-status');

// Free Audius App Name identifier
const APP_NAME = "AURA_STREAM_APP";

window.addEventListener('DOMContentLoaded', () => {
  engineStatus.innerText = "● LIVE ENGINE READY";
  engineStatus.className = "text-[10px] text-emerald-400 font-semibold block leading-none";
  // Initial trending tracks
  fetchTrendingFullTracks();
});

// Trending Full Length Songs
async function fetchTrendingFullTracks() {
  sectionTitle.innerText = "Trending Hits (Full Length)";
  resultsCount.innerText = "Loading tracks...";
  try {
    const res = await fetch(`https://discoveryprovider.audius.co/v1/tracks/trending?app_name=${APP_NAME}`);
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      currentPlaylist = json.data.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.user.name,
        image: t.artwork ? t.artwork['480x480'] || t.artwork['150x150'] : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480',
        audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=${APP_NAME}`
      }));
      renderSongCards(currentPlaylist);
      resultsCount.innerText = `${currentPlaylist.length} full tracks ready`;
    }
  } catch (err) {
    console.warn("Trending fetch failed:", err);
  }
}

function renderSongCards(songs) {
  songsGrid.innerHTML = '';
  if (!songs || songs.length === 0) {
    songsGrid.innerHTML = `<div class="col-span-full text-center py-10 text-white/40 text-sm">No songs found. Try another search.</div>`;
    return;
  }

  songs.forEach((song, idx) => {
    const card = document.createElement('div');
    card.className = "liquid-glass p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.08] transition-all group";
    card.onclick = () => playSongAtIndex(idx);

    card.innerHTML = `
      <div class="flex items-center gap-3 overflow-hidden">
        <img src="${song.image}" class="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0 shadow-md">
        <div class="truncate">
          <h4 class="text-sm font-semibold text-white/90 group-hover:text-white truncate">${song.title}</h4>
          <p class="text-xs text-white/50 truncate">${song.artist}</p>
        </div>
      </div>
      <button class="w-10 h-10 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black flex items-center justify-center shrink-0 transition-all">
        <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
      </button>
    `;
    songsGrid.appendChild(card);
  });
}

function playSongAtIndex(index) {
  if (!currentPlaylist || index < 0 || index >= currentPlaylist.length) return;
  currentIndex = index;
  const song = currentPlaylist[currentIndex];

  playerTitle.innerText = song.title;
  playerArtist.innerText = song.artist;
  playerImg.src = song.image;

  audio.src = song.audioUrl;
  audio.load();

  audio.play().then(() => {
    isPlaying = true;
    updatePlayIcons();
  }).catch(err => {
    console.warn("Playback error:", err);
  });
}

function togglePlay() {
  if (!audio.src) {
    if (currentPlaylist.length > 0) playSongAtIndex(0);
    return;
  }

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    updatePlayIcons();
  } else {
    audio.play().then(() => {
      isPlaying = true;
      updatePlayIcons();
    }).catch(err => console.warn(err));
  }
}

function playNext() {
  if (currentPlaylist.length === 0) return;
  currentIndex = (currentIndex + 1) % currentPlaylist.length;
  playSongAtIndex(currentIndex);
}

function playPrev() {
  if (currentPlaylist.length === 0) return;
  currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
  playSongAtIndex(currentIndex);
}

function updatePlayIcons() {
  if (isPlaying) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }
}

// Progress Bar & Duration Tracking
audio.addEventListener('timeupdate', () => {
  if (!isNaN(audio.duration) && audio.duration > 0) {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
    timeCurrent.innerText = formatTime(audio.currentTime);
    timeDuration.innerText = formatTime(audio.duration);
  }
});

// Gaana khatam hone par seedha agla gaana baje
audio.addEventListener('ended', () => {
  playNext();
});

seekBar.addEventListener('input', () => {
  if (!isNaN(audio.duration) && audio.duration > 0) {
    audio.currentTime = (seekBar.value / 100) * audio.duration;
  }
});

function formatTime(secs) {
  const min = Math.floor(secs / 60) || 0;
  const sec = Math.floor(secs % 60) || 0;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Full Search with No 30s Cutoff
let searchDebounce = null;
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim();
  clearTimeout(searchDebounce);
  if (!q) return;

  searchDebounce = setTimeout(async () => {
    sectionTitle.innerText = `Search: "${q}"`;
    resultsCount.innerText = "Searching full tracks...";
    searchSpinner.classList.remove('hidden');

    try {
      const res = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=${APP_NAME}`);
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        currentPlaylist = json.data.map(t => ({
          id: t.id,
          title: t.title,
          artist: t.user.name,
          image: t.artwork ? t.artwork['480x480'] || t.artwork['150x150'] : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480',
          audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=${APP_NAME}`
        }));

        renderSongCards(currentPlaylist);
        resultsCount.innerText = `${currentPlaylist.length} full songs found`;
      } else {
        renderSongCards([]);
      }
    } catch (err) {
      console.warn("Search error:", err);
      resultsCount.innerText = "Search failed, try again";
    } finally {
      searchSpinner.classList.add('hidden');
    }
  }, 400);
});

function quickSearch(name) {
  searchInput.value = name;
  searchInput.dispatchEvent(new Event('input'));
}
