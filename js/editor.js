/**
 * Editor Mode Module
 * 浮层控制台编辑模式
 */

// ========== State ==========
let editorMode = false;
let editingData = [];
let objectURLs = []; // Track object URLs for cleanup

// ========== LocalStorage Keys ==========
const STORAGE_KEYS = {
  TIMELINE_DATA: 'timeline_data',
  ENDING_CONFIG: 'ending_config',
  MUSIC_DATA: 'music_data',
  EDITOR_MODE: 'editor_mode'
};

// ========== Storage Manager ==========
const StorageManager = {
  save(key, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      showToast('保存失败，存储空间不足', 'error');
      return false;
    }
  },

  load(key) {
    try {
      const json = localStorage.getItem(key);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error('Storage load error:', e);
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.TIMELINE_DATA);
    localStorage.removeItem(STORAGE_KEYS.ENDING_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.MUSIC_DATA);
  },

  getUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return {
      used: total,
      max: 5 * 1024 * 1024,
      percentage: (total / (5 * 1024 * 1024)) * 100
    };
  }
};

// ========== Toggle Editor Mode ==========
/**
 * Toggle editor mode on/off
 */
function toggleEditorMode() {
  editorMode = !editorMode;
  document.body.classList.toggle('editor-mode', editorMode);

  const toggleBtn = document.querySelector('.btn-editor-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = editorMode ? '退出编辑' : '进入编辑';
  }

  const musicSection = document.querySelector('.music-upload-section');
  if (musicSection) {
    musicSection.classList.toggle('visible', editorMode);
  }

  if (editorMode) {
    enterEditMode();
  } else {
    exitEditMode();
  }

  StorageManager.save(STORAGE_KEYS.EDITOR_MODE, editorMode);
  showToast(editorMode ? '已进入编辑模式' : '已退出编辑模式', 'info');
}

/**
 * Enter edit mode
 */
function enterEditMode() {
  // Load saved data or clone default data
  const savedData = StorageManager.load(STORAGE_KEYS.TIMELINE_DATA);
  editingData = savedData || cloneTimelineData();

  // Re-render timeline with edit controls
  renderTimelineWithEditControls();
  updateStorageIndicator();
}

/**
 * Exit edit mode
 */
function exitEditMode() {
  // Re-render in view mode
  const container = document.getElementById('timeline-nodes');
  if (!container) return;

  container.innerHTML = '';

  // Use saved data
  const savedData = StorageManager.load(STORAGE_KEYS.TIMELINE_DATA) || editingData;
  savedData.forEach((node, index) => {
    const nodeEl = createTimelineNode(node, index);
    container.appendChild(nodeEl);
  });

  // Render ending
  const endingConfig = StorageManager.load(STORAGE_KEYS.ENDING_CONFIG) || window.endingConfig;
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

  // Cleanup object URLs
  cleanupObjectURLs();
}

/**
 * Clone timeline data
 */
function cloneTimelineData() {
  return JSON.parse(JSON.stringify(timelineData || []));
}

// ========== Render with Edit Controls ==========
/**
 * Render timeline with edit controls
 */
function renderTimelineWithEditControls() {
  const container = document.getElementById('timeline-nodes');
  if (!container) return;

  container.innerHTML = '';

  editingData.forEach((node, index) => {
    const nodeEl = createEditableNode(node, index);
    container.appendChild(nodeEl);
  });

  // Add "Add Node" button
  const addContainer = document.createElement('div');
  addContainer.className = 'add-node-container';
  addContainer.innerHTML = `
    <button class="add-node-btn" onclick="addNewNode()">
      <span>➕</span> 添加新节点
    </button>
  `;
  container.appendChild(addContainer);

  // Render editable ending
  const endingEl = createEditableEnding();
  container.appendChild(endingEl);
}

/**
 * Create an editable timeline node
 */
function createEditableNode(node, index) {
  const article = document.createElement('article');
  article.className = `timeline-node${node.isHighlight ? ' highlight' : ''}`;
  article.dataset.index = index;

  // Floating edit toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'edit-toolbar';
  toolbar.innerHTML = `
    <button class="edit-toolbar-btn" onclick="openFileUpload(${index})" title="上传图片/视频">📷</button>
    <button class="edit-toolbar-btn" onclick="toggleTextEdit(${index})" title="编辑文字">✏️</button>
    <button class="edit-toolbar-btn" onclick="moveNode(${index}, -1)" title="上移">↑</button>
    <button class="edit-toolbar-btn" onclick="moveNode(${index}, 1)" title="下移">↓</button>
    <button class="edit-toolbar-btn danger" onclick="deleteNode(${index})" title="删除">🗑️</button>
  `;
  article.appendChild(toolbar);

  // Date (editable)
  const dateEl = document.createElement('div');
  dateEl.className = 'timeline-date editable-field';
  dateEl.innerHTML = `
    <input type="text" class="date-edit-input" value="${escapeHtml(node.date)}"
           onchange="updateNodeField(${index}, 'date', this.value)" placeholder="日期">
    <label class="highlight-checkbox-wrapper">
      <input type="checkbox" ${node.isHighlight ? 'checked' : ''}
             onchange="updateNodeField(${index}, 'isHighlight', this.checked)">
      高亮
    </label>
  `;
  article.appendChild(dateEl);

  // Content
  const contentEl = document.createElement('div');
  contentEl.className = 'timeline-content';

  // Media
  if (node.media && node.media.length > 0) {
    const mediaEl = createEditableMedia(node.media, index);
    contentEl.appendChild(mediaEl);
  }

  // Add media button
  const addMediaBtn = document.createElement('div');
  addMediaBtn.className = 'add-media-btn';
  addMediaBtn.innerHTML = `
    <span class="upload-icon">📷</span>
    <span class="upload-text">添加图片/视频</span>
  `;
  addMediaBtn.onclick = () => openFileUpload(index);
  contentEl.appendChild(addMediaBtn);

  // Title (editable)
  const titleEl = document.createElement('h3');
  titleEl.className = 'timeline-title editable-field';
  titleEl.innerHTML = `<textarea class="timeline-title-edit" rows="1"
    onchange="updateNodeField(${index}, 'title', this.value)">${escapeHtml(node.title)}</textarea>`;

  // Description (editable)
  const descEl = document.createElement('p');
  descEl.className = 'timeline-description editable-field';
  descEl.innerHTML = `<textarea class="timeline-description-edit" rows="2"
    onchange="updateNodeField(${index}, 'description', this.value)">${escapeHtml(node.description)}</textarea>`;

  contentEl.appendChild(titleEl);
  contentEl.appendChild(descEl);
  article.appendChild(contentEl);

  return article;
}

/**
 * Create editable media items
 */
function createEditableMedia(mediaItems, nodeIndex) {
  const container = document.createElement('div');
  container.className = 'timeline-media';

  mediaItems.forEach((media, mediaIndex) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'media-item';

    let element;
    if (media.type === 'image') {
      element = document.createElement('img');
      element.src = media.src;
      element.alt = media.alt || '';
      element.className = 'timeline-image';
    } else if (media.type === 'video') {
      element = createVideoElement(media);
    }

    // Actions overlay
    const actions = document.createElement('div');
    actions.className = 'media-actions-overlay';
    actions.innerHTML = `
      <button class="media-action-btn" onclick="replaceMedia(${nodeIndex}, ${mediaIndex})" title="替换">🔄</button>
      <button class="media-action-btn danger" onclick="deleteMedia(${nodeIndex}, ${mediaIndex})" title="删除">🗑️</button>
    `;

    wrapper.appendChild(element);
    wrapper.appendChild(actions);
    container.appendChild(wrapper);
  });

  return container;
}

/**
 * Create editable ending
 */
function createEditableEnding() {
  const ending = document.createElement('section');
  ending.className = 'timeline-ending';

  const savedConfig = StorageManager.load(STORAGE_KEYS.ENDING_CONFIG) || window.endingConfig;

  ending.innerHTML = `
    <div class="ending-content">
      <div class="ending-icon">💕</div>
      <h2 class="ending-message editable-field">
        <textarea class="ending-message-edit" rows="2"
                  onchange="updateEndingField('message', this.value)">${escapeHtml(savedConfig.message)}</textarea>
      </h2>
      <div class="ending-signature">
        <p>${escapeHtml(savedConfig.signature)}</p>
        <p class="ending-name editable-field">
          <textarea class="ending-name-edit" rows="1"
                    onchange="updateEndingField('name', this.value)">${escapeHtml(savedConfig.name)}</textarea>
        </p>
        <p class="ending-date editable-field">
          <textarea class="ending-date-edit" rows="1"
                    onchange="updateEndingField('date', this.value)">${escapeHtml(savedConfig.date)}</textarea>
        </p>
      </div>
      <div class="ending-hearts">
        <span>❤</span><span>❤</span><span>❤</span>
      </div>
    </div>
  `;

  return ending;
}

// ========== Node Operations ==========
/**
 * Update a node field (auto-saves)
 */
function updateNodeField(index, field, value) {
  editingData[index][field] = value;
  saveData();
}

/**
 * Move a node up or down
 */
function moveNode(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= editingData.length) return;

  // Swap
  [editingData[index], editingData[newIndex]] = [editingData[newIndex], editingData[index]];
  saveData();
  renderTimelineWithEditControls();
  showToast(direction < 0 ? '已上移' : '已下移', 'success');
}

/**
 * Delete a node
 */
function deleteNode(index) {
  if (confirm('确定要删除这个节点吗？')) {
    editingData.splice(index, 1);
    saveData();
    renderTimelineWithEditControls();
    showToast('已删除', 'success');
  }
}

/**
 * Add a new node
 */
function addNewNode() {
  const newNode = {
    id: Date.now(),
    date: '新日期',
    title: '新标题',
    description: '在这里添加描述...',
    media: [],
    isHighlight: false
  };

  editingData.push(newNode);
  saveData();
  renderTimelineWithEditControls();
  showToast('已添加新节点', 'success');

  // Scroll to new node
  setTimeout(() => {
    const nodes = document.querySelectorAll('.timeline-node');
    const lastNode = nodes[nodes.length - 1];
    if (lastNode) {
      lastNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

// ========== Media Operations ==========
/**
 * Open file upload dialog
 */
function openFileUpload(nodeIndex) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.onchange = (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0], nodeIndex);
    }
  };
  input.click();
}

/**
 * Replace existing media
 */
function replaceMedia(nodeIndex, mediaIndex) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.onchange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith('image/');

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      objectURLs.push(objectUrl);

      const mediaItem = {
        type: isImage ? 'image' : 'video',
        src: objectUrl,
        alt: isImage ? file.name : ''
      };

      editingData[nodeIndex].media[mediaIndex] = mediaItem;
      saveData();
      renderTimelineWithEditControls();
      showToast('已替换', 'success');
    }
  };
  input.click();
}

/**
 * Delete media
 */
function deleteMedia(nodeIndex, mediaIndex) {
  if (confirm('确定要删除这个媒体吗？')) {
    editingData[nodeIndex].media.splice(mediaIndex, 1);
    saveData();
    renderTimelineWithEditControls();
    showToast('已删除', 'success');
  }
}

/**
 * Handle file upload using URL.createObjectURL
 */
function handleFileUpload(file, nodeIndex) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    showToast('请选择图片或视频文件', 'error');
    return;
  }

  // Create object URL for preview
  const objectUrl = URL.createObjectURL(file);
  objectURLs.push(objectUrl);

  const mediaItem = {
    type: isImage ? 'image' : 'video',
    src: objectUrl,
    alt: isImage ? file.name : ''
  };

  if (!editingData[nodeIndex].media) {
    editingData[nodeIndex].media = [];
  }
  editingData[nodeIndex].media.push(mediaItem);

  saveData();
  renderTimelineWithEditControls();
  showToast('上传成功', 'success');
}

/**
 * Cleanup object URLs
 */
function cleanupObjectURLs() {
  objectURLs.forEach(url => URL.revokeObjectURL(url));
  objectURLs = [];
}

// ========== Ending Operations ==========
/**
 * Update ending field
 */
function updateEndingField(field, value) {
  const config = StorageManager.load(STORAGE_KEYS.ENDING_CONFIG) || window.endingConfig;
  config[field] = value;
  StorageManager.save(STORAGE_KEYS.ENDING_CONFIG, config);
  showToast('已保存', 'success');
}

// ========== Save/Load ==========
/**
 * Save data to localStorage
 */
function saveData() {
  StorageManager.save(STORAGE_KEYS.TIMELINE_DATA, editingData);
  updateStorageIndicator();
}

/**
 * Export data
 */
function exportData() {
  const data = {
    timeline: StorageManager.load(STORAGE_KEYS.TIMELINE_DATA),
    ending: StorageManager.load(STORAGE_KEYS.ENDING_CONFIG),
    music: StorageManager.load(STORAGE_KEYS.MUSIC_DATA),
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `timeline-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showToast('数据已导出', 'success');
}

/**
 * Import data
 */
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.timeline) StorageManager.save(STORAGE_KEYS.TIMELINE_DATA, data.timeline);
      if (data.ending) StorageManager.save(STORAGE_KEYS.ENDING_CONFIG, data.ending);
      if (data.music) StorageManager.save(STORAGE_KEYS.MUSIC_DATA, data.music);

      showToast('数据已导入，请刷新页面', 'success');
    } catch (e) {
      console.error('Import error:', e);
      showToast('导入失败，文件格式错误', 'error');
    }
  };
  input.click();
}

/**
 * Clear all data
 */
function clearAllData() {
  if (confirm('确定要清除所有编辑数据吗？此操作不可恢复！')) {
    StorageManager.clearAll();
    showToast('数据已清除，请刷新页面', 'success');
  }
}

/**
 * Reset to default
 */
function resetToDefault() {
  if (confirm('确定要重置为默认数据吗？所有编辑将丢失！')) {
    StorageManager.clearAll();
    location.reload();
  }
}

// ========== Music Upload ==========
/**
 * Upload background music
 */
function uploadBackgroundMusic(file) {
  if (!file.type.startsWith('audio/')) {
    showToast('请选择音频文件', 'error');
    return;
  }

  // Convert to base64 for storage
  const reader = new FileReader();
  reader.onload = (e) => {
    const musicData = {
      name: file.name,
      size: formatFileSize(file.size),
      data: e.target.result
    };

    StorageManager.save(STORAGE_KEYS.MUSIC_DATA, musicData);

    // Update audio element
    if (bgMusic) {
      bgMusic.src = e.target.result;
    }

    updateMusicDisplay();
    showToast('背景音乐已更新', 'success');
  };
  reader.onerror = () => {
    showToast('上传失败，文件可能太大', 'error');
  };
  reader.readAsDataURL(file);
}

/**
 * Update music display
 */
function updateMusicDisplay() {
  const musicInfo = document.querySelector('.music-current-name');
  const musicSize = document.querySelector('.music-current-size');

  const saved = StorageManager.load(STORAGE_KEYS.MUSIC_DATA);
  if (saved) {
    if (musicInfo) musicInfo.textContent = saved.name;
    if (musicSize) musicSize.textContent = saved.size;
  }
}

/**
 * Load saved music
 */
function loadSavedMusic() {
  const saved = StorageManager.load(STORAGE_KEYS.MUSIC_DATA);
  if (saved && saved.data) {
    updateMusicDisplay();
    return saved.data;
  }
  return 'js/assets/music/bg-music.mp3';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Update storage indicator
 */
function updateStorageIndicator() {
  const indicator = document.querySelector('.storage-indicator');
  if (!indicator) return;

  const usage = StorageManager.getUsage();
  indicator.textContent = `存储: ${formatFileSize(usage.used)} / ~5MB`;

  indicator.classList.remove('warning', 'danger');
  if (usage.percentage > 80) {
    indicator.classList.add('danger');
  } else if (usage.percentage > 60) {
    indicator.classList.add('warning');
  }
}

// ========== Toast ==========
/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== Initialize ==========
/**
 * Initialize editor on page load
 */
function initEditor() {
  // Check if editor mode was active
  const savedMode = StorageManager.load(STORAGE_KEYS.EDITOR_MODE);
  if (savedMode) {
    editorMode = savedMode;
    document.body.classList.add('editor-mode');

    const toggleBtn = document.querySelector('.btn-editor-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = '退出编辑';
    }
  }

  // Load saved music
  const savedMusic = loadSavedMusic();
  return savedMusic;
}
