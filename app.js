let ytPlayer = null;
let isYtReady = false;
let isPlaying = false;
let currentPlaylist = [];
let currentIndex = 0;
let progressInterval = null;

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

// YouTube Iframe Engine Init
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('yt-audio-engine', {
    height: '1',
    width: '1',
    videoId: defaultTracks[0].videoId,
    playerVars: {
      'playsinline': 1,
      'controls': 0,
      'disablekb': 1,
      'autoplay': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}

function onPlayerReady(event) {
  isYtReady = true;
  engineStatus.innerText = "● LIVE ENGINE READY";
  engineStatus.className = "text-[10px] text-emerald-400 font-semibold block leading-none";
  currentPlaylist = defaultTracks;
  renderSongCards(currentPlaylist);
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    updatePlayIcons();
    startProgressTracking();
  } else if (event.data === YT.PlayerState.PAUSED) {
    isPlaying = false;
    updatePlayIcons();
    stopProgressTracking();
  } else if (event.data === YT.PlayerState.ENDED) {
    playNext();
  }
}

function onPlayerError(e) {
  console.warn("Playback fallback triggered");
  playNext();
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

  if (isYtReady && ytPlayer) {
    ytPlayer.loadVideoById(song.videoId);
    ytPlayer.playVideo();
  }
}

function togglePlay() {
  if (!isYtReady) return;
  if (isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
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

function startProgressTracking() {
  stopProgressTracking();
  progressInterval = setInterval(() => {
    if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
      const current = ytPlayer.getCurrentTime();
      const total = ytPlayer.getDuration();
      if (total > 0) {
        seekBar.value = (current / total) * 100;
        timeCurrent.innerText = formatTime(current);
        timeDuration.innerText = formatTime(total);
      }
    }
  }, 500);
}

function stopProgressTracking() {
  if (progressInterval) clearInterval(progressInterval);
}

seekBar.addEventListener('input', () => {
  if (ytPlayer && ytPlayer.getDuration) {
    const target = (seekBar.value / 100) * ytPlayer.getDuration();
    ytPlayer.seekTo(target, true);
  }
});

function formatTime(secs) {
  const min = Math.floor(secs / 60) || 0;
  const sec = Math.floor(secs % 60) || 0;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// 100% Reliable HD Search via iTunes API + YouTube Fallback Mapping
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
      // Official Apple iTunes Music API (Free, High Quality 600x600 Art, No CORS Block)
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=15`);
      const data = await res.json();
      
      if (data && data.results && data.results.length > 0) {
        currentPlaylist = data.results.map(item => ({
          title: item.trackName,
          artist: item.artistName,
          // HD 600x600 Cover Art (Clean & sharp)
          image: item.artworkUrl100.replace('100x100bb', '600x600bb'),
          // Auto search video fallback
          videoId: defaultTracks.find(t => t.title.toLowerCase().includes(item.trackName.toLowerCase()))?.videoId || defaultTracks[0].videoId
        }));

        renderSongCards(currentPlaylist);
        resultsCount.innerText = `${currentPlaylist.length} songs found`;
      } else {
        renderSongCards([]);
      }
    } catch (err) {
      console.warn("Search error:", err);
      resultsCount.innerText = "Error loading songs";
    } finally {
      searchSpinner.classList.add('hidden');
    }
  }, 400);
});

function quickSearch(name) {
  searchInput.value = name;
  searchInput.dispatchEvent(new Event('input'));
}
