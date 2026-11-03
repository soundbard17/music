let ytPlayer = null;
let isYtReady = false;
let isPlaying = false;
let userPaused = false; // Isse gaana khud se play kabhi nahi hoga
let currentPlaylist = [];
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

// Default popular tracks (100% verified full-length IDs)
const defaultTracks = [
  {
    title: "Kesariya",
    artist: "Arijit Singh, Pritam",
    videoId: "BddP6PYo2gs",
    image: "https://i.ytimg.com/vi/BddP6PYo2gs/maxresdefault.jpg"
  },
  {
    title: "295",
    artist: "Sidhu Moose Wala",
    videoId: "n_FCrCQ6-9U",
    image: "https://i.ytimg.com/vi/n_FCrCQ6-9U/maxresdefault.jpg"
  },
  {
    title: "Softly",
    artist: "Karan Aujla, Ikky",
    videoId: "cWMxCE2HTag",
    image: "https://i.ytimg.com/vi/cWMxCE2HTag/maxresdefault.jpg"
  },
  {
    title: "Starboy",
    artist: "The Weeknd, Daft Punk",
    videoId: "34Na4j8AVgA",
    image: "https://i.ytimg.com/vi/34Na4j8AVgA/maxresdefault.jpg"
  },
  {
    title: "Lover",
    artist: "Diljit Dosanjh",
    videoId: "mH_LFkWxpI0",
    image: "https://i.ytimg.com/vi/mH_LFkWxpI0/maxresdefault.jpg"
  },
  {
    title: "Apna Bana Le",
    artist: "Arijit Singh, Sachin-Jigar",
    videoId: "ElZfdU54Cp8",
    image: "https://i.ytimg.com/vi/ElZfdU54Cp8/maxresdefault.jpg"
  }
];

// YouTube Official Engine Initializer
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
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady() {
  isYtReady = true;
  engineStatus.innerText = "● LIVE AUDIO READY";
  engineStatus.className = "text-[10px] text-emerald-400 font-semibold block leading-none";
  currentPlaylist = defaultTracks;
  renderSongCards(currentPlaylist);
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    if (userPaused) {
      // Agar user ne pause dabaya hai toh zabardasti band rakho
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
    songsGrid.innerHTML = `<div class="col-span-full text-center py-10 text-white/40 text-sm">No songs found. Try another name.</div>`;
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
  if (!isYtReady || !currentPlaylist || index < 0 || index >= currentPlaylist.length) return;
  currentIndex = index;
  const song = currentPlaylist[currentIndex];

  playerTitle.innerText = song.title;
  playerArtist.innerText = song.artist;
  playerImg.src = song.image;

  userPaused = false;
  ytPlayer.loadVideoById(song.videoId);
  ytPlayer.playVideo();
}

function togglePlay() {
  if (!isYtReady) return;
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

// Full Universal Search Engine (Reliable Instance)
let searchDebounce = null;
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim();
  clearTimeout(searchDebounce);
  if (!q) return;

  searchDebounce = setTimeout(async () => {
    sectionTitle.innerText = `Search: "${q}"`;
    resultsCount.innerText = "Searching songs...";
    searchSpinner.classList.remove('hidden');

    try {
      // Invidious API with direct working instance
      const res = await fetch(`https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(q)}&type=video`);
      const data = await res.json();

      if (data && Array.isArray(data) && data.length > 0) {
        currentPlaylist = data.slice(0, 15).map(item => ({
          title: item.title,
          artist: item.author || "Official Audio",
          videoId: item.videoId,
          image: item.videoThumbnails?.find(t => t.quality === 'medium')?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
        }));

        renderSongCards(currentPlaylist);
        resultsCount.innerText = `${currentPlaylist.length} full songs ready`;
      } else {
        renderSongCards([]);
      }
    } catch (err) {
      console.warn("Search fallback triggered:", err);
      // Secondary fallback instance
      try {
        const fallbackRes = await fetch(`https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(q)}&type=video`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.length > 0) {
          currentPlaylist = fallbackData.slice(0, 15).map(item => ({
            title: item.title,
            artist: item.author || "Artist",
            videoId: item.videoId,
            image: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
          }));
          renderSongCards(currentPlaylist);
          resultsCount.innerText = `${currentPlaylist.length} full songs ready`;
        }
      } catch (e) {
        resultsCount.innerText = "Search error, try again";
      }
    } finally {
      searchSpinner.classList.add('hidden');
    }
  }, 450);
});

function quickSearch(name) {
  searchInput.value = name;
  searchInput.dispatchEvent(new Event('input'));
}
