/**
 * Main Entry Point
 * Coordinates page transitions and initialization
 */

// Page elements
const pages = {
  loading: document.getElementById('loading-page'),
  choice: document.getElementById('choice-page'),
  proposal: document.getElementById('proposal-page'),
  timeline: document.getElementById('timeline-page')
};

let countdownTimer = null;

/**
 * Transition to a specific page
 */
function transitionToPage(pageName) {
  const pageKey = pageName.replace('-page', '');
  const targetPage = pages[pageKey];

  if (!targetPage) {
    console.error(`Page not found: ${pageName}`);
    return;
  }

  // Clear any running timers
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    countdownTimer = null;
  }

  // Hide all pages
  Object.values(pages).forEach(page => {
    if (page && page.classList.contains('active')) {
      page.classList.remove('active');
      setTimeout(() => {
        if (!page.classList.contains('active')) {
          page.classList.add('hidden');
        }
      }, 500);
    }
  });

  // Show target page
  targetPage.classList.remove('hidden');
  targetPage.offsetHeight; // Force reflow
  targetPage.classList.add('active');

  // Page-specific initialization
  handlePageInit(pageKey);
}

/**
 * Handle page-specific initialization
 */
function handlePageInit(pageKey) {
  // Update editor navigation highlight
  if (editorMode) {
    updateEditorNavHighlight(pageKey);
  }

  switch (pageKey) {
    case 'proposal':
      initProposalPage();
      break;
    case 'timeline':
      // Check if in editor mode
      if (editorMode) {
        // Editor mode uses its own render
        if (typeof renderTimelineWithEditControls === 'function') {
          renderTimelineWithEditControls();
        }
      } else {
        // View mode uses normal timeline
        const savedData = StorageManager?.load?.('timeline_data');
        if (savedData) {
          // Use saved data
          const container = document.getElementById('timeline-nodes');
          container.innerHTML = '';
          savedData.forEach((node, index) => {
            const nodeEl = createTimelineNode(node, index);
            container.appendChild(nodeEl);
          });
          const endingConfig = StorageManager?.load?.('ending_config') || window.endingConfig;
          const endingEl = document.createElement('section');
          endingEl.className = 'timeline-ending';
          endingEl.innerHTML = `
            <div class="ending-content">
              <div class="ending-icon">💕</div>
              <h2 class="ending-message">${escapeHtml(endingConfig.message)}</h2>
              <div class="ending-signature">
                <p>${escapeHtml(endingConfig.signature)}</p>
                <p class="ending-name">${escapeHtml(endingConfig.name)}</p>
                <p class="ending-date">${escapeHtml(endingConfig.date)}</p>
              </div>
              <div class="ending-hearts">
                <span>❤</span><span>❤</span><span>❤</span>
              </div>
            </div>
          `;
          container.appendChild(endingEl);
        } else {
          initTimeline();
        }
      }
      initScrollAnimations();
      initMusicWithEditor();
      break;
  }
}

/**
 * Initialize music with editor support
 * - Does NOT autoplay
 * - Waits for user to click the music button
 * - Volume set to 0.35
 */
function initMusicWithEditor() {
  // Get saved music URL or use default
  const savedMusic = loadSavedMusic ? loadSavedMusic() : 'js/assets/music/bg-music.mp3';

  bgMusic = document.createElement('audio');
  bgMusic.src = savedMusic;
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
 * Editor navigation - go to a specific page in editor mode
 */
function editorGoToPage(pageKey) {
  transitionToPage(pageKey);
  updateEditorNavHighlight(pageKey);
}

/**
 * Update editor navigation highlight
 */
function updateEditorNavHighlight(pageKey) {
  const navBtns = document.querySelectorAll('.editor-nav-btn');
  navBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.onclick.toString().includes(`'${pageKey}'`)) {
      btn.classList.add('active');
    }
  });
}

/**
 * Initialize the app
 */
function init() {
  // Initialize editor first (to check saved mode)
  if (typeof initEditor === 'function') {
    initEditor();
  }

  // Initialize choice buttons
  initChoiceButtons();

  // Initialize toolbar buttons
  initToolbarButtons();

  // Start with loading page, then transition to choice
  setTimeout(() => {
    transitionToPage('choice');
  }, 1500);
}

/**
 * Initialize toolbar buttons
 */
function initToolbarButtons() {
  // Export HTML button
  const exportHTMLBtn = document.getElementById('btn-export-html');
  if (exportHTMLBtn) {
    exportHTMLBtn.addEventListener('click', () => {
      if (typeof exportStandaloneHTML === 'function') {
        exportStandaloneHTML();
      }
    });
  }

  // Export button
  const exportBtn = document.getElementById('btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (typeof exportData === 'function') {
        exportData();
      }
    });
  }

  // Import button
  const importBtn = document.getElementById('btn-import');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      if (typeof importData === 'function') {
        importData();
      }
    });
  }

  // Clear button
  const clearBtn = document.getElementById('btn-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (typeof clearAllData === 'function') {
        clearAllData();
      }
    });
  }

  // Reset button
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (typeof resetToDefault === 'function') {
        resetToDefault();
      }
    });
  }

  // Music upload button
  const musicUploadBtn = document.getElementById('btn-upload-music');
  if (musicUploadBtn) {
    musicUploadBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.onchange = (e) => {
        if (e.target.files.length > 0 && typeof uploadBackgroundMusic === 'function') {
          uploadBackgroundMusic(e.target.files[0]);
        }
      };
      input.click();
    });
  }
}

/**
 * Escape HTML helper
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== Proposal Page Logic ==========

/**
 * Avatar data for the proposal page
 */
const avatarData = [
  {
    id: 'me',
    name: '刘浩',
    emoji: '👨',
    isMe: true,
    photo: null, // Will store uploaded photo data URL
    bubbleText: ''
  },
  {
    id: 'star1',
    name: '彭于晏',
    emoji: '🤵',
    isMe: false,
    photo: null,
    bubbleText: '我只是来凑热闹的～'
  },
  {
    id: 'star2',
    name: '胡歌',
    emoji: '🎭',
    isMe: false,
    photo: null,
    bubbleText: '不合适不合适～'
  },
  {
    id: 'star3',
    name: '易烊千玺',
    emoji: '💃',
    isMe: false,
    photo: null,
    bubbleText: '抓不到我哦～'
  },
  {
    id: 'star4',
    name: '王俊凯',
    emoji: '🎤',
    isMe: false,
    photo: null,
    bubbleText: '我选择退出～'
  }
];

const AVATAR_PHOTOS_KEY = 'avatar_photos';

/**
 * Initialize proposal page
 */
function initProposalPage() {
  const grid = document.getElementById('avatar-grid');
  if (!grid) return;

  // Clear existing content
  grid.innerHTML = '';

  // Load saved photos
  const savedPhotos = StorageManager?.load?.(AVATAR_PHOTOS_KEY) || {};
  avatarData.forEach(avatar => {
    if (savedPhotos[avatar.id]) {
      avatar.photo = savedPhotos[avatar.id];
    }
  });

  // Shuffle non-me avatars
  const nonMeAvatars = avatarData.filter(a => !a.isMe);
  shuffleArray(nonMeAvatars);

  // Rebuild avatarData with shuffled order (keep 'me' at position 0)
  const shuffledData = [avatarData[0], ...nonMeAvatars];
  for (let i = 0; i < avatarData.length; i++) {
    avatarData[i] = shuffledData[i];
  }

  // Create avatar cards
  avatarData.forEach((avatar, index) => {
    const card = createAvatarCard(avatar, index);
    grid.appendChild(card);
  });

  // Add upload section in editor mode
  if (editorMode) {
    const uploadSection = createAvatarUploadSection();
    grid.appendChild(uploadSection);
  }
}

/**
 * Create avatar upload section (editor mode)
 */
function createAvatarUploadSection() {
  const section = document.createElement('div');
  section.className = 'avatar-upload-section';
  section.style.cssText = 'grid-column: 1 / -1; padding: 20px; background: rgba(255,182,193,0.1); border-radius: 12px; margin-top: 20px;';

  section.innerHTML = `
    <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 16px;">📷 上传照片</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
      ${avatarData.map((avatar, index) => `
        <div class="avatar-upload-item" data-index="${index}" style="text-align: center;">
          <button class="avatar-upload-btn" onclick="uploadAvatarPhoto(${index})" style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 2px dashed var(--primary-light);
            background: white;
            cursor: pointer;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 8px;
          ">📷</button>
          <div style="font-size: 12px; color: var(--text-secondary);">${avatar.name}</div>
        </div>
      `).join('')}
    </div>
  `;

  return section;
}

/**
 * Upload avatar photo
 */
function uploadAvatarPhoto(index) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For localStorage, convert to base64 (has size limits)
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;

      // Save to avatar data
      avatarData[index].photo = dataUrl;

      // Save to localStorage
      const savedPhotos = StorageManager?.load?.(AVATAR_PHOTOS_KEY) || {};
      savedPhotos[avatarData[index].id] = dataUrl;

      try {
        StorageManager.save(AVATAR_PHOTOS_KEY, savedPhotos);
        showToast('照片已上传', 'success');
        initProposalPage(); // Re-render
      } catch (e) {
        showToast('照片太大，无法保存', 'error');
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

/**
 * Create an avatar card
 */
function createAvatarCard(avatar, index) {
  const card = document.createElement('div');
  card.className = `avatar-card${avatar.isMe ? ' is-me' : ''}`;
  card.dataset.avatarId = avatar.id;

  // Display photo if available, otherwise emoji
  let avatarContent;
  if (avatar.photo) {
    avatarContent = `<img src="${avatar.photo}" alt="${avatar.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
  } else {
    avatarContent = avatar.emoji;
  }

  card.innerHTML = `
    <div class="bubble-message">${avatar.bubbleText || ''}</div>
    <div class="avatar-image-wrapper">
      ${avatarContent}
    </div>
    ${editorMode ? `<input type="text" value="${escapeHtml(avatar.name)}"
      onchange="updateAvatarName(${index}, this.value)"
      style="width: 100%; text-align: center; border: 1px dashed var(--primary-light);
      border-radius: 4px; padding: 2px; font-size: 12px; margin-top: 4px;">`
      : `<div class="avatar-name">${avatar.name}</div>`}
  `;

  // Add click handler
  card.addEventListener('click', (e) => {
    // Don't trigger if clicking on input in editor mode
    if (e.target.tagName === 'INPUT') return;
    handleAvatarClick(avatar, card);
  });

  return card;
}

/**
 * Update avatar name
 */
function updateAvatarName(index, newName) {
  avatarData[index].name = newName;
  // Note: names are not persisted separately, they're part of avatarData
  // You could add separate storage if needed
}

/**
 * Handle avatar card click
 */
function handleAvatarClick(avatar, card) {
  if (avatar.isMe) {
    // Clicked "me" - show success and transition
    showSuccessAndTransition();
  } else {
    // Clicked someone else - make them escape
    makeAvatarEscape(card);
  }
}

/**
 * Make avatar escape with animation
 */
function makeAvatarEscape(card) {
  if (card.classList.contains('escaping')) return;

  // Random escape direction
  const directions = ['escape-left', 'escape-right', 'escape-up', 'escape-down'];
  const randomDirection = directions[Math.floor(Math.random() * directions.length)];

  card.classList.add('escaping', randomDirection);
}

/**
 * Show success message and transition to timeline
 */
function showSuccessAndTransition() {
  const overlay = document.getElementById('success-overlay');
  const messageEl = document.getElementById('success-message');

  if (!overlay || !messageEl) return;

  // Show overlay
  overlay.classList.add('active');

  // Typewriter effect
  const message = '这才是属于我们的故事';
  typewriterEffect(messageEl, message, () => {
    // After typewriter completes, wait 1.5s then transition
    countdownTimer = setTimeout(() => {
      createConfetti();
      setTimeout(() => {
        transitionToPage('timeline');
      }, 500);
    }, 1500);
  });
}

/**
 * Typewriter effect for text
 */
function typewriterEffect(element, text, callback) {
  let index = 0;
  element.innerHTML = '<span class="typewriter-cursor"></span>';

  const interval = setInterval(() => {
    if (index < text.length) {
      const char = text.charAt(index);
      const cursor = '<span class="typewriter-cursor"></span>';
      element.innerHTML = text.substring(0, index + 1) + cursor;
      index++;
    } else {
      clearInterval(interval);
      // Remove cursor after a delay
      setTimeout(() => {
        element.innerHTML = text;
      }, 500);

      if (callback) callback();
    }
  }, 100);
}

/**
 * Create confetti effect
 */
function createConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  const colors = ['#FF6B9D', '#FFB3D1', '#FFD700', '#51cf66', '#339af0'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';

    container.appendChild(confetti);

    // Trigger animation
    setTimeout(() => {
      confetti.classList.add('falling');
    }, 10);

    // Clean up
    setTimeout(() => {
      confetti.remove();
    }, 4000);
  }
}

/**
 * Shuffle array in place
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
