let ytPlayer = null;
let isYtReady = false;
let isPlaying = false;
let currentPlaylist = [];
let currentIndex = 0;
let progressInterval = null;

// DOM Elements
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

// YouTube API initialization
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('yt-audio-engine', {
    height: '1',
    width: '1',
    videoId: defaultTracks[0].videoId,
    playerVars: {
      'playsinline': 1,
      'controls': 0,
      'disablekb': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  isYtReady = true;
  engineStatus.innerText = "● LIVE AUDIO READY";
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

function renderSongCards(songs) {
  songsGrid.innerHTML = '';
  if (!songs || songs.length === 0) {
    songsGrid.innerHTML = `<div class="col-span-full text-center py-10 text-white/40 text-sm">No songs found.</div>`;
    return;
  }

  songs.forEach((song, idx) => {
    const card = document.createElement('div');
    card.className = "liquid-glass p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.08] transition-all group";
    card.onclick = () => playSongAtIndex(idx);

    card.innerHTML = `
      <div class="flex items-center gap-3 overflow-hidden">
        <img src="${song.image}" class="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0">
        <div class="truncate">
          <h4 class="text-sm font-semibold text-white/90 group-hover:text-white truncate">${song.title}</h4>
          <p class="text-xs text-white/50 truncate">${song.artist}</p>
        </div>
      </div>
      <button class="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black flex items-center justify-center shrink-0 transition-all">
        <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
      </button>
    `;
    songsGrid.appendChild(card);
  });
}

function playSongAtIndex(index) {
  if (!isYtReady || !currentPlaylist || index < 0 || index >= currentPlaylist.length) return;
  currentIndex = index;
  const song = currentPlaylist[currentIndex];

  playerTitle.innerText = song.title;
  playerArtist.innerText = song.artist;
  playerImg.src = song.image;

  ytPlayer.loadVideoById(song.videoId);
  ytPlayer.playVideo();
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

// Search functionality
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
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=music_songs`)}`);
      const json = await res.json();
      const data = JSON.parse(json.contents);
      
      if (data && data.items) {
        currentPlaylist = data.items.map(item => ({
          title: item.title,
          artist: item.uploaderName || 'Artist',
          videoId: item.url.replace('/watch?v=', ''),
          image: item.thumbnail || `https://i.ytimg.com/vi/${item.url.replace('/watch?v=', '')}/hqdefault.jpg`
        })).filter(s => s.videoId);

        renderSongCards(currentPlaylist);
        resultsCount.innerText = `${currentPlaylist.length} songs found`;
      }
    } catch (err) {
      console.warn("Search fallback activated");
    } finally {
      searchSpinner.classList.add('hidden');
    }
  }, 500);
});

function quickSearch(name) {
  searchInput.value = name;
  searchInput.dispatchEvent(new Event('input'));
}
