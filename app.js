let ytPlayer = null;
let isYtReady = false;
let isPlaying = false;
let userPaused = false;
let currentPlaylist = typeof defaultTracks !== 'undefined' ? defaultTracks : [];
let currentIndex = 0;
let progressInterval = null;

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

// Page load hote hi cards render karein
window.addEventListener('DOMContentLoaded', () => {
  if (currentPlaylist.length > 0) {
    renderSongCards(currentPlaylist);
    resultsCount.innerText = `${currentPlaylist.length} tracks ready`;
  }
});

// YouTube Official Iframe Callback
window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('yt-audio-engine', {
    height: '1',
    width: '1',
    videoId: currentPlaylist[0]?.videoId || 'BddP6PYo2gs',
    playerVars: {
      'playsinline': 1,
      'controls': 0,
      'disablekb': 1,
      'autoplay': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
};

function onPlayerReady() {
  isYtReady = true;
  engineStatus.innerText = "● LIVE AUDIO READY";
  engineStatus.className = "text-[10px] text-emerald-400 font-semibold block leading-none";
  if (songsGrid.children.length === 0 && currentPlaylist.length > 0) {
    renderSongCards(currentPlaylist);
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    if (userPaused) {
      ytPlayer.pauseVideo();
      return;
    }
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
        <img src="${song.image}" onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'" class="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0 shadow-md">
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

  userPaused = false;

  if (isYtReady && ytPlayer) {
    ytPlayer.loadVideoById(song.videoId);
    ytPlayer.playVideo();
  }
}

function togglePlay() {
  if (!isYtReady || !ytPlayer) return;
  if (isPlaying) {
    userPaused = true;
    ytPlayer.pauseVideo();
    isPlaying = false;
    updatePlayIcons();
  } else {
    userPaused = false;
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

// Search Handler
let searchDebounce = null;
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  clearTimeout(searchDebounce);
  if (!q) {
    currentPlaylist = defaultTracks;
    renderSongCards(currentPlaylist);
    sectionTitle.innerText = "Curated Playlist";
    resultsCount.innerText = `${currentPlaylist.length} tracks ready`;
    return;
  }

  searchDebounce = setTimeout(() => {
    sectionTitle.innerText = `Search: "${q}"`;
    const filtered = defaultTracks.filter(s => 
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
    currentPlaylist = filtered;
    renderSongCards(currentPlaylist);
    resultsCount.innerText = `${filtered.length} found in playlist`;
  }, 300);
});

function quickSearch(name) {
  searchInput.value = name;
  searchInput.dispatchEvent(new Event('input'));
}
