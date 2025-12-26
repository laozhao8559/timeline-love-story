/**
 * Editor Mode Module
 * 浮层控制台编辑模式
 */

// ========== State ==========
let editorMode = false;
let editingData = [];
let editingStandaloneBlocks = []; // 独立内容块
let objectURLs = []; // Track object URLs for cleanup

// ========== LocalStorage Keys ==========
const STORAGE_KEYS = {
  TIMELINE_DATA: 'timeline_data',
  STANDALONE_BLOCKS: 'standalone_blocks',
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
    localStorage.removeItem(STORAGE_KEYS.STANDALONE_BLOCKS);
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

  // Update navigation highlight
  if (editorMode) {
    const currentPage = getCurrentPageKey();
    if (typeof updateEditorNavHighlight === 'function') {
      updateEditorNavHighlight(currentPage);
    }
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
 * Get current page key
 */
function getCurrentPageKey() {
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const id = activePage.id;
    return id.replace('-page', '');
  }
  return 'choice'; // Default
}

/**
 * Enter edit mode
 */
function enterEditMode() {
  // Load saved data or clone default data
  const savedData = StorageManager.load(STORAGE_KEYS.TIMELINE_DATA);
  editingData = savedData || cloneTimelineData();

  // Load saved standalone blocks
  const savedBlocks = StorageManager.load(STORAGE_KEYS.STANDALONE_BLOCKS);
  editingStandaloneBlocks = savedBlocks || [];

  // Re-render timeline with edit controls
  renderTimelineWithEditControls();
  updateStorageIndicator();
}

/**
 * Exit edit mode
 */
function exitEditMode() {
  // 更新全局 standaloneBlocks 变量以供渲染使用
  const savedBlocks = StorageManager.load(STORAGE_KEYS.STANDALONE_BLOCKS) || editingStandaloneBlocks;
  if (typeof window !== 'undefined') {
    window.standaloneBlocks = savedBlocks;
  }

  // 使用 initTimeline 重新渲染（它会读取 standaloneBlocks 和 ending）
  initTimeline();

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
 * 支持独立内容块渲染
 */
function renderTimelineWithEditControls() {
  const container = document.getElementById('timeline-nodes');
  if (!container) return;

  container.innerHTML = '';

  // 获取独立内容块数据
  const standaloneData = editingStandaloneBlocks || [];

  // 先渲染 insertAfter: -1 的内容块（最前面）
  const headBlocks = standaloneData.filter(b => b.insertAfter === -1);
  headBlocks.forEach((block, blockIndex) => {
    const blockEl = createEditableStandaloneBlock(block, blockIndex, -1);
    container.appendChild(blockEl);
  });

  // 添加"在最前面添加内容"按钮
  const addHeadBtn = createAddStandaloneButton(-1);
  container.appendChild(addHeadBtn);

  // 渲染所有时间轴节点，并在节点之间插入独立内容块
  editingData.forEach((node, index) => {
    const nodeEl = createEditableNode(node, index);
    container.appendChild(nodeEl);

    // 添加"在此之后添加内容"按钮
    const addBtn = createAddStandaloneButton(index);
    container.appendChild(addBtn);

    // 查找并渲染在当前节点之后的独立内容块
    const afterBlocks = standaloneData.filter(b => b.insertAfter === index);
    afterBlocks.forEach((block, blockIndex) => {
      const blockEl = createEditableStandaloneBlock(block, blockIndex, index);
      container.appendChild(blockEl);
    });
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
 * Create "Add Standalone Block" button
 * 在指定节点后添加独立内容块的按钮
 */
function createAddStandaloneButton(insertAfterIndex) {
  const wrapper = document.createElement('div');
  wrapper.className = 'add-standalone-wrapper';
  wrapper.innerHTML = `
    <button class="add-standalone-btn" onclick="showAddStandaloneMenu(${insertAfterIndex})">
      <span>✨</span> 在此添加内容
    </button>
  `;
  return wrapper;
}

/**
 * Show menu to add standalone block
 */
function showAddStandaloneMenu(insertAfterIndex) {
  const choice = confirm(
    '选择要添加的内容类型：\n\n' +
    '点击「确定」添加文字\n' +
    '点击「取消」添加图片/视频'
  );

  if (choice) {
    // 添加文字
    addStandaloneBlock(insertAfterIndex, 'text');
  } else {
    // 添加图片/视频
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        handleStandaloneFileUpload(e.target.files[0], insertAfterIndex);
      }
    };
    input.click();
  }
}

/**
 * Add a new standalone block
 */
function addStandaloneBlock(insertAfterIndex, type, data = {}) {
  if (!editingStandaloneBlocks) {
    editingStandaloneBlocks = [];
  }

  const newBlock = {
    id: 'standalone_' + Date.now(),
    type: type,
    insertAfter: insertAfterIndex
  };

  if (type === 'text') {
    newBlock.content = '在这里写下你的心情...';
  } else if (type === 'image') {
    newBlock.src = data.src;
    newBlock.alt = data.alt || '';
    newBlock.caption = data.caption || '';
  } else if (type === 'video') {
    newBlock.src = data.src;
    newBlock.poster = data.poster || '';
  }

  editingStandaloneBlocks.push(newBlock);
  saveData();
  renderTimelineWithEditControls();
  showToast('已添加', 'success');
}

/**
 * Handle standalone block file upload
 */
function handleStandaloneFileUpload(file, insertAfterIndex) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    showToast('请选择图片或视频文件', 'error');
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  objectURLs.push(objectUrl);

  const data = {
    src: objectUrl
  };

  if (isImage) {
    data.alt = file.name;
    addStandaloneBlock(insertAfterIndex, 'image', data);
  } else {
    addStandaloneBlock(insertAfterIndex, 'video', data);
  }
}

/**
 * Create an editable standalone block
 */
function createEditableStandaloneBlock(block, blockIndex, insertAfterIndex) {
  const wrapper = document.createElement('div');
  wrapper.className = 'standalone-block editable';
  wrapper.dataset.blockId = block.id;

  // Control bar
  const controlBar = document.createElement('div');
  controlBar.className = 'standalone-controls';
  controlBar.innerHTML = `
    <button class="control-btn" onclick="moveStandaloneBlock('${block.id}', -1)" title="上移">↑</button>
    <button class="control-btn" onclick="moveStandaloneBlock('${block.id}', 1)" title="下移">↓</button>
    <button class="control-btn danger" onclick="deleteStandaloneBlock('${block.id}')" title="删除">🗑️</button>
  `;
  wrapper.appendChild(controlBar);

  if (block.type === 'text') {
    const textEl = document.createElement('div');
    textEl.className = 'standalone-text editable';
    textEl.innerHTML = `<textarea class="standalone-text-edit" rows="4"
      onchange="updateStandaloneBlock('${block.id}', 'content', this.value)"
      placeholder="在这里写下你的心情...">${escapeHtml(block.content || '')}</textarea>`;
    wrapper.appendChild(textEl);
  } else if (block.type === 'image') {
    wrapper.innerHTML += `
      <div class="standalone-media">
        <img src="${block.src}" alt="${escapeHtml(block.alt || '')}" class="standalone-image">
        <button class="replace-btn" onclick="replaceStandaloneMedia('${block.id}')">🔄 替换</button>
        <textarea class="standalone-caption-edit" rows="1" placeholder="添加说明文字..."
          onchange="updateStandaloneBlock('${block.id}', 'caption', this.value)">${escapeHtml(block.caption || '')}</textarea>
      </div>
    `;
  } else if (block.type === 'video') {
    wrapper.innerHTML += `
      <div class="standalone-media">
        <div class="video-wrapper">
          <video src="${block.src}" poster="${block.poster || ''}" class="timeline-video"></video>
          <div class="video-play-overlay"><span class="play-icon">▶</span></div>
        </div>
        <button class="replace-btn" onclick="replaceStandaloneMedia('${block.id}')">🔄 替换</button>
      </div>
    `;
  }

  return wrapper;
}

/**
 * Update standalone block field
 */
function updateStandaloneBlock(blockId, field, value) {
  const block = editingStandaloneBlocks.find(b => b.id === blockId);
  if (block) {
    block[field] = value;
    saveData();
  }
}

/**
 * Delete standalone block
 */
function deleteStandaloneBlock(blockId) {
  if (confirm('确定要删除这个内容吗？')) {
    const index = editingStandaloneBlocks.findIndex(b => b.id === blockId);
    if (index > -1) {
      editingStandaloneBlocks.splice(index, 1);
      saveData();
      renderTimelineWithEditControls();
      showToast('已删除', 'success');
    }
  }
}

/**
 * Move standalone block (change insertAfter position)
 */
function moveStandaloneBlock(blockId, direction) {
  const block = editingStandaloneBlocks.find(b => b.id === blockId);
  if (!block) return;

  const newPosition = block.insertAfter + direction;
  const maxPosition = editingData.length - 1;

  if (newPosition < -1 || newPosition > maxPosition) {
    showToast('已到边界', 'info');
    return;
  }

  block.insertAfter = newPosition;
  saveData();
  renderTimelineWithEditControls();
  showToast(direction < 0 ? '已上移' : '已下移', 'success');
}

/**
 * Replace standalone media
 */
function replaceStandaloneMedia(blockId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.onchange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith('image/');

      const objectUrl = URL.createObjectURL(file);
      objectURLs.push(objectUrl);

      const block = editingStandaloneBlocks.find(b => b.id === blockId);
      if (block) {
        if (isImage) {
          block.type = 'image';
          block.src = objectUrl;
          block.alt = file.name;
        } else {
          block.type = 'video';
          block.src = objectUrl;
          block.poster = '';
        }

        saveData();
        renderTimelineWithEditControls();
        showToast('已替换', 'success');
      }
    }
  };
  input.click();
}

/**
 * Create an editable timeline node
 * 新数据结构：支持 contents 数组，内容块可自由增删改排序
 */
function createEditableNode(node, index) {
  const article = document.createElement('article');
  article.className = `timeline-node${node.isHighlight ? ' highlight' : ''}`;
  article.dataset.index = index;

  // Floating edit toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'edit-toolbar';
  toolbar.innerHTML = `
    <button class="edit-toolbar-btn" onclick="addContentBlock(${index}, 'text')" title="添加文字">📝</button>
    <button class="edit-toolbar-btn" onclick="openFileUpload(${index})" title="添加图片/视频">📷</button>
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

  // Content container
  const contentEl = document.createElement('div');
  contentEl.className = 'timeline-content';

  // Title (editable, optional)
  const titleEl = document.createElement('h3');
  titleEl.className = 'timeline-title editable-field';
  titleEl.innerHTML = `<textarea class="timeline-title-edit" rows="1"
    onchange="updateNodeField(${index}, 'title', this.value)" placeholder="标题（可选）">${escapeHtml(node.title || '')}</textarea>`;
  contentEl.appendChild(titleEl);

  // Render all content blocks
  if (node.contents && node.contents.length > 0) {
    node.contents.forEach((contentBlock, contentIndex) => {
      const blockEl = createEditableContentBlock(contentBlock, index, contentIndex);
      contentEl.appendChild(blockEl);
    });
  }

  // Add content block buttons
  const addBlockSection = document.createElement('div');
  addBlockSection.className = 'add-block-section';
  addBlockSection.innerHTML = `
    <button class="add-block-btn" onclick="addContentBlock(${index}, 'text')">📝 文字</button>
    <button class="add-block-btn" onclick="openFileUpload(${index})">📷 图片/视频</button>
  `;
  contentEl.appendChild(addBlockSection);

  article.appendChild(contentEl);

  return article;
}

/**
 * Create an editable content block
 */
function createEditableContentBlock(contentBlock, nodeIndex, contentIndex) {
  const wrapper = document.createElement('div');
  wrapper.className = 'content-block-wrapper';
  wrapper.dataset.nodeIndex = nodeIndex;
  wrapper.dataset.contentIndex = contentIndex;

  // Control bar for this block
  const controlBar = document.createElement('div');
  controlBar.className = 'content-block-controls';
  controlBar.innerHTML = `
    <button class="control-btn" onclick="moveContentBlock(${nodeIndex}, ${contentIndex}, -1)" title="上移">↑</button>
    <button class="control-btn" onclick="moveContentBlock(${nodeIndex}, ${contentIndex}, 1)" title="下移">↓</button>
    <button class="control-btn danger" onclick="deleteContentBlock(${nodeIndex}, ${contentIndex})" title="删除">🗑️</button>
  `;
  wrapper.appendChild(controlBar);

  if (contentBlock.type === 'text') {
    const textEl = document.createElement('div');
    textEl.className = 'editable-text-block';
    textEl.innerHTML = `<textarea class="text-block-edit" rows="3"
      onchange="updateContentBlock(${nodeIndex}, ${contentIndex}, 'content', this.value)"
      placeholder="输入文字...">${escapeHtml(contentBlock.content || '')}</textarea>`;
    wrapper.appendChild(textEl);

  } else if (contentBlock.type === 'image') {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'editable-media-block';
    imgWrapper.innerHTML = `
      <img src="${contentBlock.src}" alt="${escapeHtml(contentBlock.alt || '')}" class="timeline-image">
      <button class="replace-btn" onclick="replaceMedia(${nodeIndex}, ${contentIndex})">🔄 替换</button>
    `;
    wrapper.appendChild(imgWrapper);

  } else if (contentBlock.type === 'video') {
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'editable-media-block';
    videoWrapper.innerHTML = `
      <div class="video-wrapper">
        <video src="${contentBlock.src}" poster="${contentBlock.poster || ''}" class="timeline-video"></video>
        <div class="video-play-overlay"><span class="play-icon">▶</span></div>
      </div>
      <button class="replace-btn" onclick="replaceMedia(${nodeIndex}, ${contentIndex})">🔄 替换</button>
    `;
    wrapper.appendChild(videoWrapper);
  }

  return wrapper;
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
 * 新数据结构：使用 contents 数组
 */
function addNewNode() {
  const newNode = {
    id: Date.now(),
    date: '新日期',
    title: '新标题',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '在这里添加你的故事...'
      }
    ]
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

// ========== Content Block Operations ==========
/**
 * Add a new content block to a node
 */
function addContentBlock(nodeIndex, type) {
  const node = editingData[nodeIndex];
  if (!node.contents) {
    node.contents = [];
  }

  if (type === 'text') {
    node.contents.push({
      type: 'text',
      content: ''
    });
  }

  saveData();
  renderTimelineWithEditControls();
  showToast('已添加' + (type === 'text' ? '文字' : '媒体'), 'success');
}

/**
 * Update a content block field
 */
function updateContentBlock(nodeIndex, contentIndex, field, value) {
  editingData[nodeIndex].contents[contentIndex][field] = value;
  saveData();
}

/**
 * Delete a content block
 */
function deleteContentBlock(nodeIndex, contentIndex) {
  if (confirm('确定要删除这个内容块吗？')) {
    editingData[nodeIndex].contents.splice(contentIndex, 1);
    saveData();
    renderTimelineWithEditControls();
    showToast('已删除', 'success');
  }
}

/**
 * Move a content block up or down
 */
function moveContentBlock(nodeIndex, contentIndex, direction) {
  const contents = editingData[nodeIndex].contents;
  const newIndex = contentIndex + direction;

  if (newIndex < 0 || newIndex >= contents.length) return;

  // Swap
  [contents[contentIndex], contents[newIndex]] = [contents[newIndex], contents[contentIndex]];
  saveData();
  renderTimelineWithEditControls();
  showToast(direction < 0 ? '已上移' : '已下移', 'success');
}

// ========== Media Operations ==========
/**
 * Open file upload dialog - 添加到 contents 数组
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
 * Replace existing media - 替换 contents 数组中的媒体
 */
function replaceMedia(nodeIndex, contentIndex) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.onchange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      objectURLs.push(objectUrl);

      const currentBlock = editingData[nodeIndex].contents[contentIndex];

      if (isImage) {
        editingData[nodeIndex].contents[contentIndex] = {
          type: 'image',
          src: objectUrl,
          alt: file.name
        };
      } else if (isVideo) {
        editingData[nodeIndex].contents[contentIndex] = {
          type: 'video',
          src: objectUrl,
          poster: currentBlock.poster || ''
        };
      }

      saveData();
      renderTimelineWithEditControls();
      showToast('已替换', 'success');
    }
  };
  input.click();
}

/**
 * Handle file upload using URL.createObjectURL - 添加到 contents 数组
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

  const node = editingData[nodeIndex];
  if (!node.contents) {
    node.contents = [];
  }

  if (isImage) {
    node.contents.push({
      type: 'image',
      src: objectUrl,
      alt: file.name
    });
  } else if (isVideo) {
    node.contents.push({
      type: 'video',
      src: objectUrl,
      poster: ''
    });
  }

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
 * 同时保存时间轴节点和独立内容块
 */
function saveData() {
  StorageManager.save(STORAGE_KEYS.TIMELINE_DATA, editingData);
  StorageManager.save(STORAGE_KEYS.STANDALONE_BLOCKS, editingStandaloneBlocks || []);

  // 更新全局 standaloneBlocks 变量
  if (typeof window !== 'undefined') {
    window.standaloneBlocks = editingStandaloneBlocks || [];
  }

  updateStorageIndicator();
}

/**
 * Export data
 * 包含独立内容块
 */
function exportData() {
  const data = {
    timeline: StorageManager.load(STORAGE_KEYS.TIMELINE_DATA),
    standaloneBlocks: StorageManager.load(STORAGE_KEYS.STANDALONE_BLOCKS),
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
 * 包含独立内容块
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
      if (data.standaloneBlocks) StorageManager.save(STORAGE_KEYS.STANDALONE_BLOCKS, data.standaloneBlocks);
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
