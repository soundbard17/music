// Pure HTML5 Audio Engine (Zero Ghost Playback, Zero Proxy Failures)
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

// Default initial tracks with working high-res covers
window.addEventListener('DOMContentLoaded', () => {
  engineStatus.innerText = "● LIVE ENGINE READY";
  engineStatus.className = "text-[10px] text-emerald-400 font-semibold block leading-none";
  quickSearch("Arijit Singh");
});

// Render cards cleanly
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

// Play specific song
function playSongAtIndex(index) {
  if (!currentPlaylist || index < 0 || index >= currentPlaylist.length) return;
  currentIndex = index;
  const song = currentPlaylist[currentIndex];

  playerTitle.innerText = song.title;
  playerArtist.innerText = song.artist;
  playerImg.src = song.image;

  // Set stream URL
  audio.src = song.audioUrl;
  audio.load();

  audio.play().then(() => {
    isPlaying = true;
    updatePlayIcons();
  }).catch(err => {
    console.warn("Playback error:", err);
  });
}

// Real Toggle Play/Pause - Bilkul tameez se kaam karega
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

// Search Logic: iTunes + Official Open Audio Stream
let searchDebounce = null;
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim();
  clearTimeout(searchDebounce);
  if (!q) return;

  searchDebounce = setTimeout(async () => {
    sectionTitle.innerText = `Search: "${q}"`;
    resultsCount.innerText = "Searching...";
    searchSpinner.classList.remove('hidden');

    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=20`);
      const data = await res.json();

      if (data && data.results && data.results.length > 0) {
        currentPlaylist = data.results.map(item => ({
          title: item.trackName,
          artist: item.artistName,
          // HD Cover Art (600x600)
          image: item.artworkUrl100.replace('100x100bb', '600x600bb'),
          // Real direct audio link (Apple Music official CDN stream)
          audioUrl: item.previewUrl
        })).filter(s => s.audioUrl);

        renderSongCards(currentPlaylist);
        resultsCount.innerText = `${currentPlaylist.length} songs ready`;
      } else {
        renderSongCards([]);
      }
    } catch (err) {
      console.warn("Search error:", err);
      resultsCount.innerText = "Search failed, try again";
    } finally {
      searchSpinner.classList.add('hidden');
    }
  }, 350);
});

function quickSearch(name) {
  searchInput.value = name;
  searchInput.dispatchEvent(new Event('input'));
}
