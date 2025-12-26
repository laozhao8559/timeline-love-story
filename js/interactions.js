/**
 * Interactions
 * Handles user interactions: lightbox, music, choice buttons
 */

// ========== Lightbox ==========
let currentLightbox = null;

/**
 * Open lightbox with an image
 */
function openLightbox(src, alt = '') {
  if (!currentLightbox) {
    currentLightbox = createLightbox();
    document.body.appendChild(currentLightbox);
  }

  const img = currentLightbox.querySelector('img');
  img.src = src;
  img.alt = alt;

  currentLightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Close lightbox
 */
function closeLightbox() {
  if (currentLightbox) {
    currentLightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Create lightbox element
 */
function createLightbox() {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <button class="lightbox-close" aria-label="关闭">×</button>
    <div class="lightbox-content">
      <img src="" alt="" />
    </div>
  `;

  const closeBtn = lightbox.querySelector('.lightbox-close');
  const backdrop = lightbox.querySelector('.lightbox-backdrop');

  closeBtn.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  return lightbox;
}

// ========== Music Player ==========
let bgMusic = null;
let isMusicPlaying = false;

/**
 * Initialize music player
 * - Does NOT autoplay
 * - Waits for user to click the music button
 * - Volume set to 0.35
 */
function initMusic() {
  bgMusic = document.createElement('audio');
  bgMusic.src = 'js/assets/music/bg-music.mp3';
  bgMusic.loop = true;
  bgMusic.volume = 0.35; // Softer initial volume

  const toggleBtn = document.getElementById('music-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleMusic);
  }

  bgMusic.addEventListener('play', () => {
    isMusicPlaying = true;
    updateMusicUI();
  });

  bgMusic.addEventListener('pause', () => {
    isMusicPlaying = false;
    updateMusicUI();
  });

  // Set initial UI state (muted)
  updateMusicUI();
}

/**
 * Toggle music play/pause
 */
function toggleMusic() {
  if (!bgMusic) return;

  if (isMusicPlaying) {
    bgMusic.pause();
  } else {
    bgMusic.play();
  }
}

/**
 * Update music button UI
 */
function updateMusicUI() {
  const toggleBtn = document.getElementById('music-toggle');
  if (!toggleBtn) return;

  const icon = toggleBtn.querySelector('.music-icon');

  if (isMusicPlaying) {
    icon.textContent = '🎵';
    toggleBtn.classList.add('playing');
  } else {
    icon.textContent = '🔇';
    toggleBtn.classList.remove('playing');
  }
}


// ========== Choice Page Buttons ==========
/**
 * Initialize choice page buttons
 */
function initChoiceButtons() {
  const btnYes = document.getElementById('btn-yes');
  const btnNo = document.getElementById('btn-no');

  if (!btnYes || !btnNo) return;

  let noClickCount = 0;

  btnYes.addEventListener('click', () => {
    transitionToPage('proposal');
  });

  btnNo.addEventListener('click', () => {
    noClickCount++;

    if (noClickCount === 1) {
      btnNo.style.transform = 'translateX(100px)';
      btnNo.textContent = '真的吗？';
    } else if (noClickCount === 2) {
      btnNo.style.transform = 'translateX(-100px)';
      btnNo.textContent = '再考虑一下？';
    } else {
      btnNo.classList.remove('btn-secondary');
      btnNo.classList.add('btn-primary');
      btnNo.textContent = '愿意❤';
      btnNo.style.transform = 'translateX(0)';

      btnNo.addEventListener('click', () => {
        transitionToPage('proposal');
      }, { once: true });
    }
  });
}
