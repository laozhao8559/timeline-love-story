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
 * 布局：中间大图（刘浩），四角小图（胡歌、彭于晏、张若昀、王凯）
 */
const avatarData = [
  {
    id: 'center',
    name: '刘浩',
    emoji: '👨',
    isMe: true,
    photo: null,
    position: 'center', // 中间大图
    remark: '', // 备注文字
    imageOffset: { x: 0, y: 0 } // 图片偏移量（拖动调整）
  },
  {
    id: 'top-left',
    name: '胡歌',
    emoji: '🎭',
    isMe: false,
    photo: null,
    position: 'top-left', // 左上角
    remark: '',
    imageOffset: { x: 0, y: 0 }
  },
  {
    id: 'top-right',
    name: '彭于晏',
    emoji: '🤵',
    isMe: false,
    photo: null,
    position: 'top-right', // 右上角
    remark: '',
    imageOffset: { x: 0, y: 0 }
  },
  {
    id: 'bottom-left',
    name: '张若昀',
    emoji: '🎬',
    isMe: false,
    photo: null,
    position: 'bottom-left', // 左下角
    remark: '',
    imageOffset: { x: 0, y: 0 }
  },
  {
    id: 'bottom-right',
    name: '王凯',
    emoji: '🎩',
    isMe: false,
    photo: null,
    position: 'bottom-right', // 右下角
    remark: '',
    imageOffset: { x: 0, y: 0 }
  }
];

const AVATAR_PHOTOS_KEY = 'avatar_photos';
const AVATAR_REMARKS_KEY = 'avatar_remarks';
const AVATAR_OFFSETS_KEY = 'avatar_offsets';

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

  // Load saved names
  const savedNames = StorageManager?.load?.('avatar_names') || {};
  avatarData.forEach(avatar => {
    if (savedNames[avatar.id]) {
      avatar.name = savedNames[avatar.id];
    }
  });

  // Load saved remarks
  const savedRemarks = StorageManager?.load?.(AVATAR_REMARKS_KEY) || {};
  avatarData.forEach(avatar => {
    if (savedRemarks[avatar.id]) {
      avatar.remark = savedRemarks[avatar.id];
    }
  });

  // Load saved image offsets
  const savedOffsets = StorageManager?.load?.(AVATAR_OFFSETS_KEY) || {};
  avatarData.forEach(avatar => {
    if (savedOffsets[avatar.id]) {
      avatar.imageOffset = savedOffsets[avatar.id];
    }
  });

  // Create avatar cards according to their positions
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
 * 注意：现在可以直接点击头像上传，这个区域只是辅助说明
 */
function createAvatarUploadSection() {
  const section = document.createElement('div');
  section.className = 'avatar-upload-section';

  section.innerHTML = `
    <h3>📷 点击上方头像即可上传照片</h3>
    <p style="text-align: center; color: var(--text-secondary); font-size: 12px;">
      中间大图是主角，四角小图会逃跑～
    </p>
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

  // 添加位置类名
  const positionClass = avatar.position === 'center' ? 'center' : `corner ${avatar.position}`;
  card.className = `avatar-card ${positionClass}`;
  card.dataset.avatarId = avatar.id;
  card.dataset.avatarIndex = index;

  // Display photo if available, otherwise emoji
  let avatarContent;
  if (avatar.photo) {
    // 应用保存的图片偏移量
    const offsetX = avatar.imageOffset?.x || 0;
    const offsetY = avatar.imageOffset?.y || 0;
    avatarContent = `<img src="${avatar.photo}" alt="${avatar.name}"
      style="transform: translate(${offsetX}px, ${offsetY}px)"
      data-avatar-index="${index}">`;
  } else {
    avatarContent = `<span class="avatar-emoji">${avatar.emoji}</span>`;
  }

  // Name display: editable input in editor mode, plain text otherwise
  const nameHtml = editorMode
    ? `<input type="text" class="avatar-name-input" value="${escapeHtml(avatar.name)}"
        onchange="updateAvatarName(${index}, this.value)">`
    : `<div class="avatar-name">${avatar.name}</div>`;

  // Remark display: editable input in editor mode, plain text otherwise (only if has content)
  let remarkHtml = '';
  if (editorMode) {
    remarkHtml = `<textarea class="avatar-remark-input" placeholder="添加备注..."
      onchange="updateAvatarRemark(${index}, this.value)"
      oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'">${escapeHtml(avatar.remark || '')}</textarea>`;
  } else if (avatar.remark && avatar.remark.trim()) {
    remarkHtml = `<div class="avatar-remark">${escapeHtml(avatar.remark)}</div>`;
  }

  card.innerHTML = `
    <div class="avatar-image-wrapper">
      ${avatarContent}
    </div>
    ${nameHtml}
    ${remarkHtml}
  `;

  // 编辑模式：添加图片拖动功能
  if (editorMode && avatar.photo) {
    const img = card.querySelector('img');
    if (img) {
      setupImageDrag(img, index);
    }
  }

  // Add click handler
  card.addEventListener('click', (e) => {
    // Don't trigger if clicking on input/textarea in editor mode
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (editorMode) {
      // 编辑模式：点击上传图片
      uploadAvatarPhoto(index);
    } else {
      // 预览模式：点击处理交互
      handleAvatarClick(avatar, card);
    }
  });

  return card;
}

/**
 * 设置图片拖动功能（编辑模式）
 */
function setupImageDrag(img, index) {
  let isDragging = false;
  let startX, startY;
  const avatar = avatarData[index];
  const currentOffset = avatar.imageOffset || { x: 0, y: 0 };

  img.addEventListener('mousedown', startDrag);
  img.addEventListener('touchstart', startDrag, { passive: false });

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    startX = clientX - currentOffset.x;
    startY = clientY - currentOffset.y;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const newX = clientX - startX;
    const newY = clientY - startY;

    // 更新图片位置
    avatar.imageOffset = { x: newX, y: newY };
    img.style.transform = `translate(${newX}px, ${newY}px)`;
  }

  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;

    // 保存偏移量到 localStorage
    const savedOffsets = StorageManager?.load?.(AVATAR_OFFSETS_KEY) || {};
    savedOffsets[avatar.id] = avatar.imageOffset;
    StorageManager?.save?.(AVATAR_OFFSETS_KEY, savedOffsets);

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', stopDrag);
  }
}

/**
 * Update avatar name
 */
function updateAvatarName(index, newName) {
  avatarData[index].name = newName;

  // 保存名字到 localStorage
  const savedNames = StorageManager?.load?.('avatar_names') || {};
  savedNames[avatarData[index].id] = newName;
  StorageManager?.save?.('avatar_names', savedNames);
}

/**
 * Update avatar remark
 */
function updateAvatarRemark(index, newRemark) {
  avatarData[index].remark = newRemark;

  // 保存备注到 localStorage
  const savedRemarks = StorageManager?.load?.(AVATAR_REMARKS_KEY) || {};
  savedRemarks[avatarData[index].id] = newRemark;
  StorageManager?.save?.(AVATAR_REMARKS_KEY, savedRemarks);
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

  // 根据卡片位置决定逃跑方向
  if (card.classList.contains('top-left')) {
    card.classList.add('escaping'); // CSS 会根据 top-left 类自动处理逃跑方向
  } else if (card.classList.contains('top-right')) {
    card.classList.add('escaping');
  } else if (card.classList.contains('bottom-left')) {
    card.classList.add('escaping');
  } else if (card.classList.contains('bottom-right')) {
    card.classList.add('escaping');
  }
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
