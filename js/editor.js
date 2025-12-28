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
      console.log('StorageManager.save called:', { key, dataType: typeof data, dataLength: data?.length });
      const json = JSON.stringify(data);
      console.log('Data stringified, length:', json.length);
      localStorage.setItem(key, json);
      console.log('Data saved to localStorage successfully');
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
    localStorage.removeItem(STORAGE_KEYS.EDITOR_MODE); // Clear editor mode state
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
  // 检查 savedData 是否为有效数组（不是 null 且不是空数组）
  editingData = (savedData && savedData.length > 0) ? savedData : cloneTimelineData();

  // Load saved standalone blocks
  const savedBlocks = StorageManager.load(STORAGE_KEYS.STANDALONE_BLOCKS);
  editingStandaloneBlocks = savedBlocks || [];

  // 更新音乐显示信息
  updateMusicDisplay();

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

  console.log('[exitEditMode] 准备退出编辑模式，当前 editingData:', editingData);
  console.log('[exitEditMode] 第一个节点 contents:', editingData[0]?.contents);

  // 确保数据已保存
  saveData();

  console.log('[exitEditMode] 数据已保存到 localStorage');

  // 验证 localStorage 中的数据
  const savedData = StorageManager.load(STORAGE_KEYS.TIMELINE_DATA);
  console.log('[exitEditMode] 从 localStorage 读取的数据:', savedData);
  console.log('[exitEditMode] 第一个节点 contents:', savedData?.[0]?.contents);

  // 使用 initTimeline 重新渲染（它会读取 standaloneBlocks 和 ending）
  initTimeline();

  // 注意：不清理 object URLs，因为阅读模式还需要它们
  // Blob URLs 在刷新页面后会自动失效
  // cleanupObjectURLs();
}

/**
 * Clone timeline data
 */
function cloneTimelineData() {
  return JSON.parse(JSON.stringify(window.timelineData || []));
}

// ========== Render with Edit Controls ==========
/**
 * Render timeline with edit controls
 * 只渲染节点和节点内部的内容块
 */
function renderTimelineWithEditControls() {
  const container = document.getElementById('timeline-nodes');
  if (!container) {
    console.error('Container #timeline-nodes not found!');
    return;
  }

  container.innerHTML = '';

  // 只渲染时间轴节点
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
 * 使用 IndexedDB 存储图片，支持刷新后持久化
 */
async function handleStandaloneFileUpload(file, insertAfterIndex) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    showToast('请选择图片或视频文件', 'error');
    return;
  }

  // 视频仍使用 Blob URL
  if (isVideo) {
    const objectUrl = URL.createObjectURL(file);
    objectURLs.push(objectUrl);
    addStandaloneBlock(insertAfterIndex, 'video', { src: objectUrl });
    return;
  }

  // 图片使用 IndexedDB 存储
  try {
    if (!isIndexedDBAvailable()) {
      throw new Error('IndexedDB 不可用');
    }

    showToast('正在保存图片...', 'info');

    // 保存到 IndexedDB
    const imageId = await saveImageToIndexedDB(file, 'standalone');

    // 使用 IndexedDB 引用
    const data = {
      src: `indexeddb:${imageId}`,
      alt: file.name
    };

    addStandaloneBlock(insertAfterIndex, 'image', data);
    showToast('图片已保存', 'success');
    updateStorageIndicator();

  } catch (error) {
    console.error('保存图片失败:', error);

    // 降级方案
    showToast('IndexedDB 不可用，使用临时存储', 'warning');
    const objectUrl = URL.createObjectURL(file);
    objectURLs.push(objectUrl);
    addStandaloneBlock(insertAfterIndex, 'image', { src: objectUrl, alt: file.name });
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
 * 空白画布模式 - 只显示「➕ 添加内容」按钮
 */
function createEditableNode(node, index) {
  const article = document.createElement('article');
  article.className = `timeline-node${node.isHighlight ? ' highlight' : ''}`;
  article.dataset.index = index;

  // Floating edit toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'edit-toolbar';
  toolbar.innerHTML = `
    <button class="edit-toolbar-btn" onclick="moveNode(${index}, -1)" title="上移">↑</button>
    <button class="edit-toolbar-btn" onclick="moveNode(${index}, 1)" title="下移">↓</button>
    <button class="edit-toolbar-btn danger" onclick="deleteNode(${index})" title="删除节点">🗑️</button>
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

  // Title (optional, 简洁模式)
  if (node.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'timeline-title';
    titleEl.innerHTML = `<input type="text" class="title-edit-input" value="${escapeHtml(node.title)}"
      onchange="updateNodeField(${index}, 'title', this.value)" placeholder="标题（可选）">`;
    contentEl.appendChild(titleEl);
  }

  // 🎨 空白画布 - 只显示「➕ 添加内容」按钮和已有的内容块

  // 渲染已有的内容块（如果有的话）
  if (node.contents && node.contents.length > 0) {
    node.contents.forEach((contentBlock, contentIndex) => {
      const blockEl = createEditableContentBlock(contentBlock, index, contentIndex);
      contentEl.appendChild(blockEl);
    });
  }

  // 「➕ 添加内容」按钮 - 总是显示在最后
  const addBlockBtn = document.createElement('div');
  addBlockBtn.className = 'add-content-block-btn';
  addBlockBtn.innerHTML = `
    <button class="btn-add-block" onclick="showAddBlockMenu(${index})">
      <span class="add-icon">➕</span>
      <span class="add-text">添加内容</span>
    </button>
  `;
  contentEl.appendChild(addBlockBtn);

  article.appendChild(contentEl);

  return article;
}

/**
 * Show menu to add content block to a node
 * 在节点内添加内容块
 */
function showAddBlockMenu(nodeIndex) {
  // 创建选择菜单
  const menu = document.createElement('div');
  menu.className = 'block-type-menu';
  menu.innerHTML = `
    <div class="block-type-menu-content">
      <h4>选择内容类型</h4>
      <button class="block-type-option" data-type="text">
        <span class="type-icon">📝</span>
        <span class="type-name">文字</span>
      </button>
      <button class="block-type-option" data-type="image">
        <span class="type-icon">📷</span>
        <span class="type-name">图片</span>
      </button>
      <button class="block-type-option" data-type="video">
        <span class="type-icon">🎬</span>
        <span class="type-name">视频</span>
      </button>
      <button class="block-type-cancel">取消</button>
    </div>
  `;

  document.body.appendChild(menu);

  // 点击选项
  menu.querySelectorAll('.block-type-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      document.body.removeChild(menu);

      if (type === 'text') {
        addContentBlockToNode(nodeIndex, 'text');
      } else if (type === 'image' || type === 'video') {
        // 打开文件选择
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type === 'image' ? 'image/*' : 'video/*';
        input.onchange = (e) => {
          if (e.target.files.length > 0) {
            handleBlockFileUpload(e.target.files[0], nodeIndex, type);
          }
        };
        input.click();
      }
    });
  });

  // 点击取消或外部关闭菜单
  menu.querySelector('.block-type-cancel').addEventListener('click', () => {
    document.body.removeChild(menu);
  });

  menu.addEventListener('click', (e) => {
    if (e.target === menu) {
      document.body.removeChild(menu);
    }
  });
}

/**
 * Add a content block to a node
 */
function addContentBlockToNode(nodeIndex, type, data = {}) {
  console.log('addContentBlockToNode called:', { nodeIndex, type, data });

  const node = editingData[nodeIndex];
  if (!node.contents) {
    node.contents = [];
  }

  // 生成唯一的内容块 ID
  const contentIndex = node.contents.length;
  const contentId = `c_${node.id}_${contentIndex}`;

  const newBlock = {
    type: type,
    contentId: contentId  // 添加唯一 ID
  };

  if (type === 'text') {
    newBlock.content = data.content || '在这里写下你的故事...';
  } else if (type === 'image') {
    newBlock.src = data.src;
    newBlock.alt = data.alt || '';
    newBlock.caption = data.caption || '';
  } else if (type === 'video') {
    newBlock.src = data.src;
    newBlock.poster = data.poster || '';
  }

  console.log('Before push - node.contents:', node.contents);
  node.contents.push(newBlock);
  console.log('After push - node.contents:', node.contents);
  console.log('editingData after modification:', editingData);

  saveData();
  renderTimelineWithEditControls();
  showToast('已添加', 'success');
}

/**
 * Handle file upload for content block
 * 使用 IndexedDB 存储图片，支持刷新后持久化
 */
async function handleBlockFileUpload(file, nodeIndex, type) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (type === 'image' && !isImage) {
    showToast('请选择图片文件', 'error');
    return;
  }
  if (type === 'video' && !isVideo) {
    showToast('请选择视频文件', 'error');
    return;
  }

  // 视频仍使用 Blob URL（视频文件通常太大）
  if (isVideo) {
    const objectUrl = URL.createObjectURL(file);
    objectURLs.push(objectUrl);
    addContentBlockToNode(nodeIndex, 'video', { src: objectUrl });
    return;
  }

  // 图片使用 IndexedDB 存储
  try {
    if (!isIndexedDBAvailable()) {
      throw new Error('IndexedDB 不可用');
    }

    showToast('正在保存图片...', 'info');

    // 保存到 IndexedDB
    const imageId = await saveImageToIndexedDB(file, 'timeline');

    // 使用 IndexedDB 引用
    const data = {
      src: `indexeddb:${imageId}`,
      alt: file.name
    };

    addContentBlockToNode(nodeIndex, 'image', data);
    showToast('图片已保存', 'success');
    updateStorageIndicator();

  } catch (error) {
    console.error('保存图片失败:', error);

    // 降级方案：使用 Blob URL（临时）
    showToast('IndexedDB 不可用，使用临时存储', 'warning');
    const objectUrl = URL.createObjectURL(file);
    objectURLs.push(objectUrl);
    addContentBlockToNode(nodeIndex, 'image', { src: objectUrl, alt: file.name });
  }
}

/**
 * Create an editable content block
 * 独立内容块 - 卡片式设计
 */
function createEditableContentBlock(contentBlock, nodeIndex, contentIndex) {
  const wrapper = document.createElement('div');
  wrapper.className = 'content-block-card';
  wrapper.dataset.nodeIndex = nodeIndex;
  wrapper.dataset.contentIndex = contentIndex;

  // Block 类型标签
  const typeLabel = document.createElement('div');
  typeLabel.className = 'block-type-label';
  const typeLabels = {
    text: '📝 文字',
    image: '📷 图片',
    video: '🎬 视频'
  };
  typeLabel.textContent = typeLabels[contentBlock.type] || contentBlock.type;
  wrapper.appendChild(typeLabel);

  // 控制按钮（悬停显示）
  const controls = document.createElement('div');
  controls.className = 'block-card-controls';
  controls.innerHTML = `
    <button class="card-control-btn" onclick="moveContentBlock(${nodeIndex}, ${contentIndex}, -1)" title="上移">↑</button>
    <button class="card-control-btn" onclick="moveContentBlock(${nodeIndex}, ${contentIndex}, 1)" title="下移">↓</button>
    <button class="card-control-btn danger" onclick="deleteContentBlock(${nodeIndex}, ${contentIndex})" title="删除">🗑️</button>
  `;
  wrapper.appendChild(controls);

  // 内容区域
  const contentArea = document.createElement('div');
  contentArea.className = 'block-card-content';

  if (contentBlock.type === 'text') {
    contentArea.innerHTML = `<textarea class="block-text-edit" rows="4"
      onchange="updateContentBlock(${nodeIndex}, ${contentIndex}, 'content', this.value)"
      placeholder="在这里写下你的故事...">${escapeHtml(contentBlock.content || '')}</textarea>`;
  } else if (contentBlock.type === 'image') {
    // 检查是否为 IndexedDB 引用
    const isIdbRef = isIndexedDBRef(contentBlock.src);
    const displaySrc = isIdbRef ? '' : (contentBlock.src || '');
    const loadingText = isIdbRef ? '加载中...' : '';

    contentArea.innerHTML = `
      <div class="block-media-wrapper">
        <img src="${displaySrc}" data-idb-ref="${contentBlock.src || ''}" alt="${escapeHtml(contentBlock.alt || '')}" class="block-image">${loadingText}
        <button class="block-replace-btn" onclick="replaceBlockMedia(${nodeIndex}, ${contentIndex})">🔄 替换图片</button>
      </div>
      <textarea class="block-caption-edit" rows="1" placeholder="添加说明文字..."
        onchange="updateContentBlock(${nodeIndex}, ${contentIndex}, 'caption', this.value)">${escapeHtml(contentBlock.caption || '')}</textarea>
    `;

    // 如果是 IndexedDB 引用，异步加载图片
    if (isIdbRef) {
      const imgEl = contentArea.querySelector('img');
      const wrapper = contentArea.querySelector('.block-media-wrapper');
      loadImageFromIndexedDB(extractImageId(contentBlock.src))
        .then(base64 => {
          imgEl.src = base64;
          // 移除加载提示文字
          const textNode = wrapper.childNodes[wrapper.childNodes.length - 1];
          if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent.includes('加载中')) {
            wrapper.removeChild(textNode);
          }
        })
        .catch(err => {
          console.error('IndexedDB 加载图片失败:', err);
          imgEl.alt = '加载失败';
          imgEl.style.opacity = '0.5';
        });
    }
  } else if (contentBlock.type === 'video') {
    contentArea.innerHTML = `
      <div class="block-media-wrapper">
        <div class="video-wrapper">
          <video src="${contentBlock.src}" poster="${contentBlock.poster || ''}" class="timeline-video"></video>
          <div class="video-play-overlay"><span class="play-icon">▶</span></div>
        </div>
        <button class="block-replace-btn" onclick="replaceBlockMedia(${nodeIndex}, ${contentIndex})">🔄 替换视频</button>
      </div>
    `;
  }

  wrapper.appendChild(contentArea);

  return wrapper;
}

/**
 * Replace media in content block
 * 使用 IndexedDB 存储图片，支持刷新后持久化
 */
async function replaceBlockMedia(nodeIndex, contentIndex) {
  const currentBlock = editingData[nodeIndex].contents[contentIndex];
  const acceptType = currentBlock.type === 'image' ? 'image/*' : 'video/*';

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = acceptType;
  input.onchange = async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];

      if (currentBlock.type === 'video') {
        // 视频使用 Blob URL
        const objectUrl = URL.createObjectURL(file);
        objectURLs.push(objectUrl);
        currentBlock.src = objectUrl;

        saveData();
        renderTimelineWithEditControls();
        showToast('已替换', 'success');
      } else {
        // 图片使用 IndexedDB
        try {
          if (!isIndexedDBAvailable()) {
            throw new Error('IndexedDB 不可用');
          }

          showToast('正在保存图片...', 'info');

          // 如果旧图片也是 IndexedDB 引用，删除它
          if (isIndexedDBRef(currentBlock.src)) {
            const oldImageId = extractImageId(currentBlock.src);
            try {
              await deleteImageFromIndexedDB(oldImageId);
            } catch (err) {
              console.warn('删除旧图片失败:', err);
            }
          }

          const imageId = await saveImageToIndexedDB(file, 'timeline');
          currentBlock.src = `indexeddb:${imageId}`;
          currentBlock.alt = file.name;

          saveData();
          renderTimelineWithEditControls();
          showToast('已替换', 'success');
          updateStorageIndicator();

        } catch (error) {
          console.error('保存图片失败:', error);

          // 降级方案
          showToast('使用临时存储', 'warning');
          const objectUrl = URL.createObjectURL(file);
          objectURLs.push(objectUrl);
          currentBlock.src = objectUrl;
          currentBlock.alt = file.name;

          saveData();
          renderTimelineWithEditControls();
        }
      }
    }
  };
  input.click();
}

/**
 * Create editable ending
 */
function createEditableEnding() {
  const ending = document.createElement('section');
  ending.className = 'timeline-ending';

  // Get config with fallback to default
  const defaultConfig = {
    message: '路还很长，但我会一直在你身边！',
    signature: '永远爱你的老公',
    name: '[刘浩]',
    date: '[农历11月11]'
  };
  const savedConfig = StorageManager.load(STORAGE_KEYS.ENDING_CONFIG) || window.endingConfig || defaultConfig;

  ending.innerHTML = `
    <div class="ending-content">
      <div class="ending-icon">💕</div>
      <h2 class="ending-message editable-field">
        <textarea class="ending-message-edit" rows="2"
                  onchange="updateEndingField('message', this.value)">${escapeHtml(savedConfig.message || defaultConfig.message)}</textarea>
      </h2>
      <div class="ending-signature">
        <p>${escapeHtml(savedConfig.signature || defaultConfig.signature)}</p>
        <p class="ending-name editable-field">
          <textarea class="ending-name-edit" rows="1"
                    onchange="updateEndingField('name', this.value)">${escapeHtml(savedConfig.name || defaultConfig.name)}</textarea>
        </p>
        <p class="ending-date editable-field">
          <textarea class="ending-date-edit" rows="1"
                    onchange="updateEndingField('date', this.value)">${escapeHtml(savedConfig.date || defaultConfig.date)}</textarea>
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
 * 新数据结构：使用空的 contents 数组
 */
function addNewNode() {
  const newNode = {
    id: Date.now(),
    date: '新日期',
    title: '新标题',
    isHighlight: false,
    contents: []  // 空白画布 - 不预设任何内容
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
  if (confirm('确定要清除所有编辑数据吗？\n\n此操作将清除：\n- 时间轴内容\n- 独立内容块\n- 结尾配置\n- 编辑器模式状态\n\n但会保留：\n- IndexedDB 中的图片数据')) {
    StorageManager.clearAll();
    location.reload(); // Auto reload after clearing
  }
}

/**
 * Reset to default
 */
function resetToDefault() {
  if (confirm('确定要重置为默认数据吗？\n\n注意：\n- 时间轴内容将恢复默认\n- 已上传的图片会保留在 IndexedDB 中')) {
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
  } else {
    // 显示默认预置音乐信息
    if (musicInfo) musicInfo.textContent = 'One Summer\'s Day.mp3 (默认)';
    if (musicSize) musicSize.textContent = formatFileSize(3808744); // 3.6 MB
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
 * 显示 localStorage 和 IndexedDB 的使用情况
 */
async function updateStorageIndicator() {
  const indicator = document.querySelector('.storage-indicator');
  if (!indicator) return;

  // localStorage 使用情况
  const usage = StorageManager.getUsage();
  const lsText = `localStorage: ${formatFileSize(usage.used)} / ~5MB`;

  // IndexedDB 使用情况
  let idbText = '';
  if (isIndexedDBAvailable()) {
    try {
      const idbUsage = await getIndexedDBUsage();
      idbText = ` | IndexedDB: ${formatFileSize(idbUsage.used)} (${idbUsage.count}张)`;
    } catch (err) {
      console.error('获取 IndexedDB 使用情况失败:', err);
    }
  }

  indicator.textContent = lsText + idbText;

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

  // 更新音乐显示信息（包括默认音乐）
  updateMusicDisplay();

  return savedMusic;
}

// ========== Export Standalone HTML ==========
/**
 * 导出为独立HTML文件
 * 所有资源内嵌，移除编辑功能，生成只读阅读模式
 */
async function exportStandaloneHTML() {
  try {
    showToast('正在生成HTML文件...', 'info');

    // 1. 收集所有数据
    const exportData = await collectAllDataForExport();

    // 2. 检查文件大小
    const sizeCheck = await estimateTotalSize(exportData);
    if (!sizeCheck.canExport) {
      showToast(sizeCheck.message, 'error');
      return;
    }
    showToast(sizeCheck.message, 'info');

    // 3. 转换所有 blob URL 为 base64
    showToast('正在处理图片和视频...', 'info');
    const processedData = await convertBlobsToBase64(exportData);

    // 4. 合并所有 CSS 文件
    showToast('正在合并样式文件...', 'info');
    const combinedCSS = await combineCSSFiles();

    // 5. 生成精简的 JS
    showToast('正在生成脚本...', 'info');
    const standaloneJS = await generateStandaloneJS(processedData);

    // 6. 生成 HTML 结构
    showToast('正在组装HTML...', 'info');
    const htmlContent = generateHTML(processedData, combinedCSS, standaloneJS);

    // 7. 下载文件
    downloadHTML(htmlContent);

    showToast('HTML文件生成成功！', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('生成失败：' + error.message, 'error');
  }
}

/**
 * 收集所有需要导出的数据
 */
async function collectAllDataForExport() {
  try {
    console.log('[Export] 开始收集数据...');

    // 收集头像完整数据（位置、名字、照片等）
    const savedPhotos = StorageManager.load('avatar_photos') || {};
    const savedNames = StorageManager.load('avatar_names') || {};
    const savedRemarks = StorageManager.load('avatar_remarks') || {};
    const savedOffsets = StorageManager.load('avatar_offsets') || {};
    const savedScales = StorageManager.load('avatar_scales') || {};
    const savedEscapeMessages = StorageManager.load('avatar_escape_messages') || {};

    console.log('[Export] window.avatarData:', window.avatarData);

    // 从 window.avatarData 获取完整结构，然后合并保存的数据
    const defaultAvatarData = window.avatarData || [];
    const avatarData = Array.from(defaultAvatarData).map(avatar => ({
      ...avatar,
      photo: savedPhotos[avatar.id] || null,
      name: savedNames[avatar.id] || avatar.name,
      remark: savedRemarks[avatar.id] || avatar.remark,
      imageOffset: savedOffsets[avatar.id] || avatar.imageOffset,
      imageScale: savedScales[avatar.id] || avatar.imageScale,
      escapeMessage: savedEscapeMessages[avatar.id] || avatar.escapeMessage
    }));

    console.log('[Export] avatarData 处理完成:', avatarData);

    const result = {
      timelineData: StorageManager.load(STORAGE_KEYS.TIMELINE_DATA) || cloneTimelineData(),
      standaloneBlocks: StorageManager.load(STORAGE_KEYS.STANDALONE_BLOCKS) || [],
      endingConfig: StorageManager.load(STORAGE_KEYS.ENDING_CONFIG) || window.endingConfig,
      musicData: StorageManager.load(STORAGE_KEYS.MUSIC_DATA) || null,
      avatarData: avatarData,  // 完整的头像数据
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.1.1'
      }
    };

    console.log('[Export] 数据收集完成');
    return result;
  } catch (error) {
    console.error('[Export] 收集数据失败:', error);
    throw error;
  }
}

/**
 * 深拷贝默认时间轴数据
 */
function cloneTimelineData() {
  return JSON.parse(JSON.stringify(window.timelineData || []));
}

/**
 * 递归转换所有 blob URL 为 base64
 */
async function convertBlobsToBase64(data) {
  const processedData = JSON.parse(JSON.stringify(data));
  const blobs = [];

  // 收集所有 blob URL
  collectBlobsFromData(processedData.timelineData, blobs);
  collectBlobsFromStandalone(processedData.standaloneBlocks, blobs);
  collectBlobsFromAvatars(processedData.avatarData, blobs);

  if (blobs.length === 0) {
    return processedData;
  }

  // 并发转换
  showToast(`正在转换 ${blobs.length} 个文件...`, 'info');
  const base64Map = {};
  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    try {
      base64Map[blob.src] = await convertSingleBlob(blob.src);
      showToast(`转换进度: ${i + 1}/${blobs.length}`, 'info');
    } catch (e) {
      console.error('转换失败:', blob.src, e);
    }
  }

  // 替换所有 blob URL
  replaceBlobsInData(processedData.timelineData, base64Map);
  replaceBlobsInStandalone(processedData.standaloneBlocks, base64Map);
  replaceBlobsInAvatars(processedData.avatarData, base64Map);

  return processedData;
}

/**
 * 收集数据中的所有 blob URL 和 IndexedDB 图片引用
 */
function collectBlobsFromData(nodes, blobs) {
  nodes.forEach(node => {
    if (node.contents) {
      node.contents.forEach((content) => {
        if (content.type === 'image' && content.src) {
          // 收集 blob URL（用于临时上传的图片）
          if (content.src.startsWith('blob:')) {
            const contentId = content.contentId || `c_${node.id}_${node.contents.indexOf(content)}`;
            blobs.push({ src: content.src, path: `node_${node.id}_${contentId}`, contentId: contentId });
          }
          // 收集 IndexedDB 引用（用于已保存的图片）
          else if (content.src.startsWith('indexeddb:')) {
            const contentId = content.contentId || `c_${node.id}_${node.contents.indexOf(content)}`;
            blobs.push({ src: content.src, path: `node_${node.id}_${contentId}`, contentId: contentId, isIndexedDB: true });
          }
        }
        // 视频仍只处理 blob URL
        else if (content.type === 'video' && content.src && content.src.startsWith('blob:')) {
          const contentId = content.contentId || `c_${node.id}_${node.contents.indexOf(content)}`;
          blobs.push({ src: content.src, path: `node_${node.id}_${contentId}`, contentId: contentId });
        }
      });
    }
  });
}

function collectBlobsFromStandalone(blocks, blobs) {
  blocks.forEach(block => {
    if (block.type === 'image' && block.src) {
      // 收集 blob URL（用于临时上传的图片）
      if (block.src.startsWith('blob:')) {
        blobs.push({ src: block.src, path: `standalone_${block.id}` });
      }
      // 收集 IndexedDB 引用（用于已保存的图片）
      else if (block.src.startsWith('indexeddb:')) {
        blobs.push({ src: block.src, path: `standalone_${block.id}`, isIndexedDB: true });
      }
    }
    // 视频仍只处理 blob URL
    else if (block.type === 'video' && block.src && block.src.startsWith('blob:')) {
      blobs.push({ src: block.src, path: `standalone_${block.id}` });
    }
  });
}

function collectBlobsFromAvatars(avatars, blobs) {
  if (!Array.isArray(avatars)) return;
  avatars.forEach(avatar => {
    if (avatar.photo && avatar.photo.startsWith('blob:')) {
      blobs.push({ src: avatar.photo, path: `avatar_${avatar.id}` });
    }
  });
}

/**
 * 转换单个 blob 或 IndexedDB 图片为 base64
 */
async function convertSingleBlob(blobUrlOrIdbRef) {
  // 处理 IndexedDB 引用
  if (blobUrlOrIdbRef.startsWith('indexeddb:')) {
    const imageId = blobUrlOrIdbRef.replace('indexeddb:', '');
    try {
      // 使用现有的 IndexedDB 加载函数
      if (typeof loadImageFromIndexedDB === 'function') {
        const base64 = await loadImageFromIndexedDB(imageId);
        return base64;
      } else {
        throw new Error('IndexedDB 加载函数不可用');
      }
    } catch (error) {
      console.error('从 IndexedDB 加载图片失败:', imageId, error);
      throw error;
    }
  }

  // 处理 blob URL
  const response = await fetch(blobUrlOrIdbRef);
  if (!response.ok) throw new Error('Failed to fetch blob');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 替换数据中的 blob URL 和 IndexedDB 引用
 */
function replaceBlobsInData(nodes, urlToBase64) {
  nodes.forEach(node => {
    if (node.contents) {
      node.contents.forEach(content => {
        if (content.type === 'image' && content.src) {
          // 替换 blob URL
          if (content.src.startsWith('blob:') && urlToBase64[content.src]) {
            content.src = urlToBase64[content.src];
          }
          // 替换 IndexedDB 引用
          else if (content.src.startsWith('indexeddb:') && urlToBase64[content.src]) {
            content.src = urlToBase64[content.src];
          }
        }
        // 视频仍只处理 blob URL
        else if (content.type === 'video' && content.src &&
                 content.src.startsWith('blob:') && urlToBase64[content.src]) {
          content.src = urlToBase64[content.src];
        }
      });
    }
  });
}

function replaceBlobsInStandalone(blocks, urlToBase64) {
  blocks.forEach(block => {
    if (block.type === 'image' && block.src) {
      // 替换 blob URL
      if (block.src.startsWith('blob:') && urlToBase64[block.src]) {
        block.src = urlToBase64[block.src];
      }
      // 替换 IndexedDB 引用
      else if (block.src.startsWith('indexeddb:') && urlToBase64[block.src]) {
        block.src = urlToBase64[block.src];
      }
    }
    // 视频仍只处理 blob URL
    else if (block.type === 'video' && block.src &&
             block.src.startsWith('blob:') && urlToBase64[block.src]) {
      block.src = urlToBase64[block.src];
    }
  });
}

function replaceBlobsInAvatars(avatars, urlToBase64) {
  if (!Array.isArray(avatars)) return;
  avatars.forEach(avatar => {
    if (avatar.photo && avatar.photo.startsWith('blob:') && urlToBase64[avatar.photo]) {
      avatar.photo = urlToBase64[avatar.photo];
    }
  });
}

/**
 * 估算总文件大小
 */
async function estimateTotalSize(data) {
  let totalSize = 0;

  // 估算图片和视频
  const estimateContents = (contents) => {
    if (!contents) return 0;
    return contents.reduce((sum, content) => {
      if (content.src && content.src.startsWith('data:')) {
        return sum + content.src.length * 0.75;
      }
      return sum;
    }, 0);
  };

  data.timelineData.forEach(node => {
    totalSize += estimateContents(node.contents);
  });

  data.standaloneBlocks.forEach(block => {
    if (block.src && block.src.startsWith('data:')) {
      totalSize += block.src.length * 0.75;
    }
  });

  // 估算音乐
  if (data.musicData?.data) {
    totalSize += data.musicData.data.length * 0.75;
  }

  // 估算头像
  if (data.avatarData && Array.isArray(data.avatarData)) {
    for (const avatar of data.avatarData) {
      if (avatar.photo && avatar.photo.startsWith('data:')) {
        totalSize += avatar.photo.length * 0.75;
      }
    }
  }

  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);

  if (totalSize > 100 * 1024 * 1024) {
    return {
      canExport: false,
      message: `总大小约 ${sizeMB}MB，超过100MB限制，请删除一些视频或图片`
    };
  }

  return {
    canExport: true,
    size: sizeMB,
    message: `预计文件大小：约 ${sizeMB}MB`
  };
}

/**
 * 合并所有 CSS 文件
 * 使用 fetch 直接读取 CSS 文件内容
 */
async function combineCSSFiles() {
  try {
    console.log('[CSS Export] 开始读取 CSS 文件...');

    // 直接读取所有 CSS 文件
    const cssFiles = [
      'css/normalize.css',
      'css/variables.css',
      'css/layout.css',
      'css/components.css',
      'css/animations.css',
      'css/proposal.css',
      'css/main.css'
    ];

    // 并发读取所有 CSS 文件
    const cssPromises = cssFiles.map(async (file) => {
      try {
        const response = await fetch(file);
        if (!response.ok) {
          throw new Error(`Failed to load ${file}: ${response.statusText}`);
        }
        const content = await response.text();
        console.log(`[CSS Export] 读取 ${file}: ${content.length} 字符`);
        return content;
      } catch (error) {
        console.error(`[CSS Export] 读取 ${file} 失败:`, error);
        return `/* ${file} - 加载失败 */\n`;
      }
    });

    const cssContents = await Promise.all(cssPromises);

    // 合并所有 CSS
    let combined = cssContents.join('\n\n');

    // 移除编辑器相关的样式
    combined = removeEditorStyles(combined);

    console.log(`[CSS Export] 合并完成, 总字符数: ${combined.length}`);
    console.log('[CSS Export] 前 200 字符:', combined.substring(0, 200));

    return combined;
  } catch (error) {
    console.error('[CSS Export] CSS 合并失败:', error);
    throw new Error('无法加载样式文件: ' + error.message);
  }
}

/**
 * 移除编辑器相关的样式
 */
function removeEditorStyles(css) {
  const editorPatterns = [
    /\/\*\s*===+\s*Editor[\s\S]*?\*+\//g,
    /\.editor-mode\s*\{[^}]*\}/g,
    /\.editor-toolbar\s*\{[^}]*\}/g,
    /\.editor-nav-bar\s*\{[^}]*\}/g,
    /\.editor-nav-btn\s*\{[^}]*\}/g,
    /#editor-nav-bar\s*\{[^}]*\}/g,
    /\.editor-mode-toggle\s*\{[^}]*\}/g,
    /\.btn-editor-toggle\s*\{[^}]*\}/g,
    /\.editable\s*\{[^}]*\}/g,
    /\.content-block-card\s*\{[^}]*\}/g,
    /\.add-content-block[^{]*\{[^}]*\}/g,
    /\.block-type-menu[^{]*\{[^}]*\}/g,
    /\.music-upload-section\s*\{[^}]*\}/g
  ];

  let cleaned = css;
  editorPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  return cleaned;
}

/**
 * 获取单个 CSS 文件内容
 */
async function fetchCSSFile(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return await response.text();
}

/**
 * 生成精简的只读模式 JS
 */
async function generateStandaloneJS(data) {
  // 滚动动画代码（直接内嵌，无需 fetch）
  const observerCode = `
let scrollObserver = null;

function initScrollAnimations() {
  if (!scrollObserver) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          if (entry.target.classList.contains('standalone-block')) {
            entry.target.classList.add('visible');
          }

          const contentBlocks = entry.target.querySelectorAll('.timeline-text-block, .timeline-image, .video-wrapper');
          contentBlocks.forEach((block, index) => {
            setTimeout(() => {
              block.classList.add('visible');
            }, index * 150);
          });
        }
      });
    }, observerOptions);
  }

  const nodes = document.querySelectorAll('.timeline-node, .standalone-block, .timeline-ending');
  nodes.forEach(node => {
    scrollObserver.observe(node);
  });
}`;

  const hasMusic = data.musicData && data.musicData.data;

  // 生成内嵌数据
  return `
// ========== 内嵌数据 ==========
const TIMELINE_DATA = ${JSON.stringify(data.timelineData)};
const STANDALONE_BLOCKS = ${JSON.stringify(data.standaloneBlocks)};
const ENDING_CONFIG = ${JSON.stringify(data.endingConfig)};
const AVATAR_DATA = ${JSON.stringify(data.avatarData)};
${hasMusic ? `const MUSIC_DATA = ${JSON.stringify(data.musicData)};` : 'const MUSIC_DATA = null;'}

// ========== 工具函数 ==========
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== 时间轴渲染 ==========
function createTimelineNode(node, index) {
  const article = document.createElement('article');
  article.className = 'timeline-node' + (node.isHighlight ? ' highlight' : '');
  article.dataset.nodeId = node.id;
  article.dataset.index = index;

  const dateEl = document.createElement('div');
  dateEl.className = 'timeline-date';
  dateEl.textContent = node.date;

  const contentEl = document.createElement('div');
  contentEl.className = 'timeline-content';

  if (node.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'timeline-title';
    titleEl.textContent = node.title;
    contentEl.appendChild(titleEl);
  }

  if (node.contents && node.contents.length > 0) {
    node.contents.forEach((contentBlock, contentIndex) => {
      const blockEl = createContentBlock(contentBlock, node.id, contentIndex);
      if (blockEl) {
        contentEl.appendChild(blockEl);
      }
    });
  }

  article.appendChild(dateEl);
  article.appendChild(contentEl);
  return article;
}

function createContentBlock(contentBlock, nodeId, contentIndex) {
  const animations = ['animate-fadeIn', 'animate-slideUp', 'animate-slideDown',
                      'animate-slideInLeft', 'animate-slideInRight', 'animate-zoomIn',
                      'animate-rotateIn', 'animate-bounceIn', 'animate-flipInX'];
  const randomAnimation = animations[Math.floor(Math.random() * animations.length)];

  if (contentBlock.type === 'text') {
    const textEl = document.createElement('p');
    textEl.className = 'timeline-text-block';
    textEl.textContent = contentBlock.content;
    textEl.classList.add(randomAnimation);
    textEl.dataset.animate = randomAnimation;
    textEl.dataset.blockIndex = contentIndex;
    return textEl;
  } else if (contentBlock.type === 'image') {
    const img = document.createElement('img');
    img.src = contentBlock.src;
    img.alt = contentBlock.alt || '';
    img.className = 'timeline-image';
    img.addEventListener('click', () => openLightbox(contentBlock.src, contentBlock.alt));
    img.classList.add(randomAnimation);
    img.dataset.animate = randomAnimation;
    img.dataset.blockIndex = contentIndex;
    return img;
  } else if (contentBlock.type === 'video') {
    const videoEl = createVideoElement(contentBlock);
    videoEl.classList.add(randomAnimation);
    videoEl.dataset.animate = randomAnimation;
    videoEl.dataset.blockIndex = contentIndex;
    return videoEl;
  }
  return null;
}

function createVideoElement(media) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';

  const video = document.createElement('video');
  video.src = media.src;
  video.poster = media.poster || '';
  video.className = 'timeline-video';
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('x5-video-player-type', 'h5');
  video.setAttribute('x5-video-player-fullscreen', 'false');
  video.muted = true; // 默认静音
  video.controls = false;

  const playOverlay = document.createElement('div');
  playOverlay.className = 'video-play-overlay';
  playOverlay.innerHTML = '<span class="play-icon">▶</span><span class="sound-icon">🔇</span>';

  const playHandler = () => {
    video.play();
    playOverlay.style.display = 'none';
    video.controls = true;
  };

  playOverlay.addEventListener('click', playHandler);
  video.addEventListener('click', () => {
    if (video.paused) {
      playHandler();
    } else {
      video.pause();
      playOverlay.style.display = 'flex';
      video.controls = false;
    }
  });
  video.addEventListener('ended', () => {
    playOverlay.style.display = 'flex';
    video.controls = false;
  });

  // 全局音乐控制按钮控制视频声音
  const musicToggle = document.getElementById('music-toggle');
  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      setTimeout(() => {
        const isMusicPlaying = musicToggle.querySelector('.music-icon').textContent === '🔊';
        video.muted = !isMusicPlaying;
        updateSoundIcon();
      }, 100);
    });
  }

  function updateSoundIcon() {
    const soundIcon = playOverlay.querySelector('.sound-icon');
    if (soundIcon) {
      soundIcon.textContent = video.muted ? '🔇' : '🔊';
    }
  }

  const soundIcon = playOverlay.querySelector('.sound-icon');
  if (soundIcon) {
    soundIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      updateSoundIcon();
    });
  }

  wrapper.appendChild(video);
  wrapper.appendChild(playOverlay);
  return wrapper;
}

function createStandaloneBlock(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'standalone-block';
  wrapper.dataset.blockId = block.id;

  if (block.type === 'text') {
    wrapper.innerHTML = '<div class="standalone-text">' + escapeHtml(block.content) + '</div>';
  } else if (block.type === 'image') {
    wrapper.innerHTML = '<div class="standalone-media"><img src="' + block.src +
      '" alt="' + escapeHtml(block.alt || '') + '" class="standalone-image">' +
      (block.caption ? '<p class="standalone-caption">' + escapeHtml(block.caption) + '</p>' : '') +
      '</div>';
    wrapper.querySelector('img').addEventListener('click', () => openLightbox(block.src, block.alt));
  } else if (block.type === 'video') {
    const videoWrapper = createVideoElement(block);
    wrapper.appendChild(videoWrapper);
  }
  return wrapper;
}

function createTimelineEnding() {
  const ending = document.createElement('section');
  ending.className = 'timeline-ending';
  ending.innerHTML = '<div class="ending-content">' +
    '<div class="ending-icon">💕</div>' +
    '<h2 class="ending-message">' + escapeHtml(ENDING_CONFIG.message) + '</h2>' +
    '<div class="ending-signature">' +
    '<p>' + escapeHtml(ENDING_CONFIG.signature) + '</p>' +
    '<p class="ending-name">' + escapeHtml(ENDING_CONFIG.name) + '</p>' +
    '<p class="ending-date">' + escapeHtml(ENDING_CONFIG.date) + '</p>' +
    '<div class="ending-hearts"><span>❤</span><span>❤</span><span>❤</span></div>' +
    '</div></div>';
  return ending;
}

function initTimeline() {
  const container = document.getElementById('timeline-nodes');
  if (!container) return;
  container.innerHTML = '';

  const headBlocks = STANDALONE_BLOCKS.filter(b => b.insertAfter === -1);
  headBlocks.forEach(block => {
    container.appendChild(createStandaloneBlock(block));
  });

  TIMELINE_DATA.forEach((node, index) => {
    container.appendChild(createTimelineNode(node, index));
    const afterBlocks = STANDALONE_BLOCKS.filter(b => b.insertAfter === index);
    afterBlocks.forEach(block => {
      container.appendChild(createStandaloneBlock(block));
    });
  });

  container.appendChild(createTimelineEnding());
  initScrollAnimations();
}

// ========== Lightbox ==========
function openLightbox(src, alt) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  lightboxImg.src = src;
  lightboxCaption.textContent = alt || '';
  lightbox.classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') closeLightbox();
  if (e.target.classList.contains('lightbox-close')) closeLightbox();
});

// ========== 音乐播放器 ==========
// 使用 var 声明全局变量（允许重复声明）
var bgMusic = null;
var isMusicPlaying = false;
var isMuted = true; // 默认静音
var currentVolume = 0;
var targetVolume = 0;
var volumeFadeInterval = null;

// ========== 场景音量配置 ==========
const SCENE_VOLUMES = {
  normal: 0.50,        // 普通时间轴滚动
  daughter: 0.30,      // 女儿出生节点
  easterEggStart: 0.40, // 彩蛋开始
  finalWords: 0.65,    // 终极文字
  easterEggEnd: 0.45,  // 彩蛋结束
  unmuted: 0.60        // 用户开启声音时的音量
};

// 当前场景
let currentScene = 'normal';

function initMusicController() {
  ${hasMusic ? `
  bgMusic = document.getElementById('bg-music');
  if (!bgMusic) return;
  bgMusic.volume = 0; // 初始音量为0（静音播放）
  bgMusic.preload = 'auto';
  bgMusic.muted = true; // 先设置为静音，绕过自动播放限制
  ` : 'return;'}

  const toggleBtn = document.getElementById('music-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleMusic);
  }

  // 初始化UI状态
  updateMusicUI();

  // 尝试自动播放（静音）
  attemptAutoplay();

  console.log('[Music] 音乐控制器已初始化');
}

function attemptAutoplay() {
  if (!bgMusic) return;

  const playPromise = bgMusic.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      bgMusic.muted = false;
      isMusicPlaying = true;
      console.log('[Music] 自动播放成功（音量0）');
    }).catch(err => {
      console.log('[Music] 自动播放被阻止，等待用户交互');

      const handleFirstInteraction = () => {
        bgMusic.muted = false;
        bgMusic.play().then(() => {
          isMusicPlaying = true;
          console.log('[Music] 用户交互后播放成功');
        }).catch(e => {
          console.warn('[Music] 播放失败:', e);
        });

        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };

      document.addEventListener('click', handleFirstInteraction, { once: true });
      document.addEventListener('touchstart', handleFirstInteraction, { once: true });
      document.addEventListener('keydown', handleFirstInteraction, { once: true });
    });
  }
}

function toggleMusic() {
  if (!bgMusic) return;

  if (isMuted) {
    // 开启声音：渐入到当前场景音量
    isMuted = false;
    const targetVol = SCENE_VOLUMES[currentScene] || SCENE_VOLUMES.normal;
    console.log('[Music] 开启声音，渐入到', targetVol);
    fadeInMusic(targetVol, 1000);
  } else {
    // 关闭声音：渐出到0
    isMuted = true;
    console.log('[Music] 关闭声音，渐出');
    fadeOutMusic(800);
  }

  updateMusicUI();
}

function fadeInMusic(targetVol, duration = 1000) {
  if (!bgMusic) return;

  targetVolume = Math.min(targetVol, 1);
  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  // 清除之前的渐变
  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(\`[Music] 渐入: \${startVolume.toFixed(2)} → \${targetVolume.toFixed(2)} (\${duration}ms)\`);

  volumeFadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用 easeOutCubic 缓动
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    currentVolume = startVolume + (targetVolume - startVolume) * easedProgress;

    bgMusic.volume = currentVolume;

    if (progress >= 1) {
      clearInterval(volumeFadeInterval);
      volumeFadeInterval = null;
    }
  }, 16); // 60fps
}

function fadeOutMusic(duration = 800, callback) {
  if (!bgMusic) return;

  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(\`[Music] 渐出: \${startVolume.toFixed(2)} → 0 (\${duration}ms)\`);

  volumeFadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    currentVolume = startVolume * (1 - progress);
    bgMusic.volume = currentVolume;

    if (progress >= 1) {
      clearInterval(volumeFadeInterval);
      volumeFadeInterval = null;
      if (callback) callback();
    }
  }, 16);
}

/**
 * 设置场景音量（平滑过渡）
 */
function setSceneVolume(scene, duration = 1000) {
  if (!bgMusic) return;

  // 更新当前场景
  currentScene = scene;

  // 如果静音状态，只记录场景，不改变音量
  if (isMuted) {
    console.log(\`[Music] 静音中，仅更新场景: \${scene}\`);
    return;
  }

  const targetVol = SCENE_VOLUMES[scene] || SCENE_VOLUMES.normal;
  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(\`[Music] 场景音量: \${startVolume.toFixed(2)} → \${targetVol.toFixed(2)} (\${scene})\`);

  volumeFadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // easeInOut
    const easedProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    currentVolume = startVolume + (targetVol - startVolume) * easedProgress;
    bgMusic.volume = currentVolume;

    if (progress >= 1) {
      clearInterval(volumeFadeInterval);
      volumeFadeInterval = null;
    }
  }, 16);
}

/**
 * 直接设置音量（绕过场景配置，用于精细控制）
 */
function setVolumeDirect(volume, duration = 1000) {
  if (!bgMusic) return;

  const targetVol = Math.min(Math.max(volume, 0), 1);
  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(\`[Music] 直接音量: \${startVolume.toFixed(2)} → \${targetVol.toFixed(2)} (\${duration}ms)\`);

  volumeFadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // easeInOut
    const easedProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    currentVolume = startVolume + (targetVol - startVolume) * easedProgress;
    bgMusic.volume = currentVolume;

    if (progress >= 1) {
      clearInterval(volumeFadeInterval);
      volumeFadeInterval = null;
    }
  }, 16);
}

/**
 * 检测"女儿出生"节点并降低音量
 */
function initDaughterNodeVolumeControl() {
  // 查找标题包含"出生"的节点
  const nodes = document.querySelectorAll('.timeline-node');

  nodes.forEach(node => {
    const title = node.querySelector('.timeline-title');
    if (title && title.textContent.includes('出生')) {
      console.log('[Music] 检测到"女儿出生"节点');

      // 创建 observer 检测节点进入视口
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            console.log('[Music] 女儿出生节点进入视口，降低音量');
            setSceneVolume('daughter', 1500);
          } else {
            // 离开后恢复正常
            if (currentScene === 'daughter') {
              console.log('[Music] 离开女儿节点，恢复正常音量');
              setSceneVolume('normal', 1500);
            }
          }
        });
      }, { threshold: 0.6 });

      observer.observe(node);
    }
  });
}

function updateMusicUI() {
  const toggleBtn = document.getElementById('music-toggle');
  const icon = toggleBtn?.querySelector('.music-icon');

  if (!toggleBtn || !icon) return;

  if (isMuted) {
    // 静音状态：显示🎵
    toggleBtn.classList.remove('playing');
    icon.textContent = '🎵';
  } else {
    // 播放状态：显示🔊
    toggleBtn.classList.add('playing');
    icon.textContent = '🔊';
  }
}

// ========== 滚动动画 ==========
${observerCode}

// ========== 页面导航 ==========
function transitionToPage(pageKey) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

  const targetPage = document.getElementById(pageKey + '-page');
  if (targetPage) {
    targetPage.classList.remove('hidden');
    setTimeout(() => targetPage.classList.add('active'), 50);
  }
}

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

// ========== 求婚页 ==========
function initProposalPage() {
  const grid = document.getElementById('avatar-grid');
  if (!grid) return;

  const avatars = AVATAR_DATA;
  const correctAnswer = avatars.find(a => a.isMe);

  avatars.forEach(avatar => {
    const card = document.createElement('div');

    // 添加位置类名
    const positionClass = avatar.position === 'center' ? 'center' : 'corner ' + avatar.position;
    card.className = 'avatar-card ' + positionClass;
    card.dataset.avatarId = avatar.id;

    // 显示图片或 emoji
    let avatarContent;
    if (avatar.photo) {
      // 应用保存的图片偏移量和缩放
      const offsetX = avatar.imageOffset?.x || 0;
      const offsetY = avatar.imageOffset?.y || 0;
      const scale = avatar.imageScale || 1;
      avatarContent = '<div class="avatar-image-wrapper"><img src="' + avatar.photo + '" alt="' + escapeHtml(avatar.name) + '" style="transform: translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')"></div>';
    } else {
      avatarContent = '<div class="avatar-image-wrapper"><span class="avatar-emoji">' + avatar.emoji + '</span></div>';
    }

    // 名字显示
    const nameHtml = '<div class="avatar-name">' + escapeHtml(avatar.name) + '</div>';

    card.innerHTML = avatarContent + nameHtml;

    // 点击事件
    card.addEventListener('click', () => {
      if (avatar.isMe) {
        showSuccess();
        setTimeout(() => transitionToPage('timeline'), 2000);
      } else {
        // 点击周围图片：让图片飞走并显示留言
        makeAvatarEscape(card, avatar);
      }
    });

    grid.appendChild(card);
  });
}

/**
 * 让头像飞走并显示留言
 */
function makeAvatarEscape(card, avatar) {
  if (card.classList.contains('escaping')) return;

  // 添加 escaping 类，触发飞走动画
  card.classList.add('escaping');

  // 动画结束后显示留言
  setTimeout(() => {
    if (avatar && avatar.escapeMessage) {
      showEscapeMessage(card, avatar.escapeMessage, avatar.name);
    }
  }, 800);
}

/**
 * 显示逃跑后的留言
 */
function showEscapeMessage(card, message, name) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'avatar-escape-message';

  // 根据卡片位置添加对应的类名
  if (card.classList.contains('top-left')) {
    messageDiv.classList.add('position-top-left');
  } else if (card.classList.contains('top-right')) {
    messageDiv.classList.add('position-top-right');
  } else if (card.classList.contains('bottom-left')) {
    messageDiv.classList.add('position-bottom-left');
  } else if (card.classList.contains('bottom-right')) {
    messageDiv.classList.add('position-bottom-right');
  }

  // 创建文字元素，添加 data-text 属性用于扫光效果
  const textDiv = document.createElement('div');
  textDiv.className = 'escape-message-text';
  textDiv.textContent = message;
  textDiv.setAttribute('data-text', message);

  const nameDiv = document.createElement('div');
  nameDiv.className = 'escape-message-name';
  nameDiv.textContent = '--- ' + name;

  messageDiv.appendChild(textDiv);
  messageDiv.appendChild(nameDiv);

  // 插入到 avatar-grid 中
  const grid = document.getElementById('avatar-grid');
  if (grid) {
    grid.appendChild(messageDiv);
    // 触发淡入动画
    setTimeout(() => messageDiv.classList.add('visible'), 50);
  }
}

function showSuccess() {
  const overlay = document.getElementById('success-overlay');
  const messageEl = document.getElementById('success-message');

  if (!overlay || !messageEl) return;

  // Show overlay
  overlay.classList.add('active');

  // Typewriter effect
  const message = '这才是属于我们的故事...';
  typewriterEffect(messageEl, message, () => {
    // After typewriter completes, wait 1.5s then confetti
    setTimeout(() => {
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
  }
}

// ========== 彩蛋 ==========
const EASTER_EGG_CONFIG = {
  stayDuration: 2000,
  stage1Duration: 1500,
  stage1IntroText: '故事还没有结束……',
  line1Delay: 800,
  line2Delay: 1000,
  finalWords: [
    '这不是一个网页！',
    '这是我想陪你走完的这一生……',
    '❤生日快乐，我的爱人❤'
  ]
};

let easterEggTriggered = false;
let bottomStayTimer = null;
let easterEggOverlay = null;

function initEasterEgg() {
  console.log('[EasterEgg] 初始化彩蛋检测 - 监听页面滚动');

  // 记录初始页面尺寸，用于调试
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const distanceToBottom = documentHeight - (scrollTop + windowHeight);

  console.log('[EasterEgg] 页面初始状态:', {
    scrollTop,
    windowHeight,
    documentHeight,
    distanceToBottom,
    isScrollable: distanceToBottom > 0,
    isAlreadyAtBottom: distanceToBottom < 50
  });

  // 监测页面滚动，判断是否到达底部
  window.addEventListener('scroll', checkScrollToBottom, { passive: true });
  console.log('[EasterEgg] ✅ 滚动监听已添加');

  // 如果页面已经在底部（没有滚动空间），直接触发检测
  setTimeout(() => {
    const currentDistance = document.documentElement.scrollHeight - (window.pageYOffset + window.innerHeight);
    if (currentDistance < 50) {
      console.log('[EasterEgg] 页面初始已在底部，手动触发检测');
      checkScrollToBottom();
    }
  }, 100);
}

function checkScrollToBottom() {
  if (easterEggTriggered) return;

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const distanceToBottom = documentHeight - (scrollTop + windowHeight);

  // 每次滚动都输出日志，方便调试
  console.log('[EasterEgg] 滚动检测:', {
    scrollTop,
    windowHeight,
    documentHeight,
    distanceToBottom,
    isAtBottom: distanceToBottom < 50
  });

  // 判断是否到达底部（剩余小于50px就算到底）
  const isAtBottom = distanceToBottom < 50;

  if (isAtBottom) {
    if (!bottomStayTimer) {
      console.log('[EasterEgg] ✅ 到达页面底部，开始计时 2 秒...');
      bottomStayTimer = setTimeout(() => {
        console.log('[EasterEgg] 🎉 停留时间达标，准备触发彩蛋');
        triggerEasterEgg();
      }, EASTER_EGG_CONFIG.stayDuration);
    }
  } else {
    if (bottomStayTimer) {
      clearTimeout(bottomStayTimer);
      bottomStayTimer = null;
      console.log('[EasterEgg] 离开底部，取消计时');
    }
  }
}

function triggerEasterEgg() {
  if (easterEggTriggered) return;
  easterEggTriggered = true;

  console.log('[EasterEgg] 🎉 触发彩蛋动画！');

  // 移除滚动监听
  window.removeEventListener('scroll', checkScrollToBottom);

  // 1. 锁定滚动
  document.body.style.overflow = 'hidden';

  // 2. 音乐降至彩蛋音量
  if (typeof setSceneVolume === 'function') {
    setSceneVolume('easterEggStart', 1500);
  }

  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.add('easter-egg-stage1');
  }

  easterEggOverlay = document.createElement('div');
  easterEggOverlay.className = 'easter-egg-overlay';
  easterEggOverlay.innerHTML = \`
    <div class="easter-egg-content">
      <div class="easter-egg-text-container" id="easter-egg-text-container"></div>
      <button class="easter-egg-continue-btn" id="easter-continue-btn">
        <span class="btn-text">继续写下去</span>
        <span class="btn-sparkle">✨</span>
      </button>
    </div>
  \`;
  document.body.appendChild(easterEggOverlay);
  setTimeout(() => easterEggOverlay.classList.add('visible'), 50);

  setTimeout(() => runStage1Intro(), 100);
}

function runStage1Intro() {
  const textContainer = document.getElementById('easter-egg-text-container');
  if (!textContainer) return;

  const introEl = document.createElement('div');
  introEl.className = 'easter-egg-intro-text';
  const text = EASTER_EGG_CONFIG.stage1IntroText;
  const chars = text.split('');
  chars.forEach((char, i) => {
    const span = document.createElement('span');
    span.textContent = char;
    span.className = 'intro-char';
    introEl.appendChild(span);
  });

  textContainer.appendChild(introEl);
  setTimeout(() => introEl.classList.add('visible'), 100);

  setTimeout(() => {
    const charSpans = introEl.querySelectorAll('.intro-char');
    charSpans.forEach((span, i) => {
      setTimeout(() => {
        span.classList.add('jump-wave');
      }, i * 200);
    });
  }, 1000);

  setTimeout(() => {
    introEl.classList.remove('visible');
    introEl.classList.add('fading-out');
    setTimeout(() => {
      textContainer.innerHTML = '';
      runStage2();
    }, 1000);
  }, 2000);
}

function runStage2() {
  const textContainer = document.getElementById('easter-egg-text-container');
  if (!textContainer) return;
  textContainer.innerHTML = '';

  // 彩蛋文字内容
  const words = [
    '亲爱的老婆：',
    '是你，让平淡日子有了分量……',
    '是你，让流逝的时间变得温柔……',
    '是你，让我从此有了安稳的家……'
  ];

  function typeWriterFixed(element, text, speed = 300) {
    const chars = text.split('');
    const charSpans = [];
    element.innerHTML = '';
    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.className = 'char-fixed';
      span.style.opacity = '0';
      element.appendChild(span);
      charSpans.push(span);
    });

    return new Promise((resolve) => {
      let i = 0;
      function showChar() {
        if (i < charSpans.length) {
          charSpans[i].style.opacity = '1';
          charSpans[i].classList.add('char-visible');
          i++;
          setTimeout(showChar, speed);
        } else {
          resolve();
        }
      }
      showChar();
    });
  }

  async function showStage2Line(index) {
    if (index >= words.length) {
      setTimeout(() => {
        runStage3();
      }, 2000);
      return;
    }

    const lineEl = document.createElement('div');
    lineEl.className = 'easter-egg-stage2-text-line';
    lineEl.classList.add('visible');
    textContainer.appendChild(lineEl);

    await typeWriterFixed(lineEl, words[index], 200);

    setTimeout(() => {
      showStage2Line(index + 1);
    }, 600);
  }

  showStage2Line(0);
}

function runStage3() {
  const textContainer = document.getElementById('easter-egg-text-container');
  if (!textContainer) return;
  textContainer.innerHTML = '';

  function typeWriter(element, text, speed = 300) {
    let i = 0;
    return new Promise((resolve) => {
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          resolve();
        }
      }
      type();
    });
  }

  const words = EASTER_EGG_CONFIG.finalWords;

  async function showLine(index) {
    if (index >= words.length) {
      setTimeout(() => {
        runStage4();
      }, 2000);
      return;
    }

    const lineEl = document.createElement('div');
    lineEl.className = 'easter-egg-text-line';
    lineEl.classList.add('visible');
    textContainer.appendChild(lineEl);

    let speed = 300;
    if (index === 1) speed = 250;
    if (index === 2) speed = 350;

    await typeWriter(lineEl, words[index], speed);

    if (index === 2) {
      const text = lineEl.textContent;
      lineEl.textContent = '';
      const chars = text.split('');
      chars.forEach((char, i) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'jump-char';
        span.style.animationDelay = \`\${i * 0.15}s\`;
        lineEl.appendChild(span);
      });
    }

    const nextDelay = index === 0 ? EASTER_EGG_CONFIG.line1Delay : EASTER_EGG_CONFIG.line2Delay;
    setTimeout(() => {
      showLine(index + 1);
    }, nextDelay);
  }

  showLine(0);
}

function runStage4() {
  const continueBtn = document.getElementById('easter-continue-btn');
  if (continueBtn) {
    continueBtn.classList.add('visible');
    continueBtn.addEventListener('click', handleContinueClick);
  }

  showBackToTimelineButton();
}

function handleContinueClick() {
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.remove('easter-egg-stage1');
    timelineContainer.classList.add('future-node-mode');
  }

  const textContainer = document.getElementById('easter-egg-text-container');
  const continueBtn = document.getElementById('easter-continue-btn');
  if (textContainer) textContainer.style.display = 'none';
  if (continueBtn) continueBtn.style.display = 'none';

  document.body.style.overflow = '';

  setTimeout(() => addFutureNode(), 300);

  setTimeout(() => {
    if (easterEggOverlay) {
      easterEggOverlay.classList.remove('visible');
      setTimeout(() => {
        if (easterEggOverlay) {
          easterEggOverlay.remove();
          easterEggOverlay = null;
        }
      }, 1000);
    }
  }, 2000);
}

function addFutureNode() {
  const container = document.getElementById('timeline-nodes');
  if (!container) return;

  const ending = container.querySelector('.timeline-ending');
  if (ending) {
    ending.style.display = 'none';
  }

  const newNode = document.createElement('article');
  newNode.className = 'timeline-node future-node future-node-enter';
  newNode.innerHTML = \`
    <div class="timeline-date">未来</div>
    <div class="timeline-content">
      <h3 class="timeline-title">未完待续…</h3>
      <div class="future-node-placeholder">
        <span class="placeholder-icon">💌</span>
        <div class="future-poem">
          <p>这三年，</p>
          <p>没有惊天动地，</p>
          <p>却一步一步走得很真。</p>
          <p class="poem-spacer"></p>
          <p>谢谢你选择了我，</p>
          <p>也让我有机会，</p>
          <p>一直选择你。</p>
          <p class="poem-spacer"></p>
          <p>未来的时间轴，</p>
          <p>我希望，</p>
          <p>还可以陪你写很久……<span class="heart-decor">❤</span></p>
        </div>
      </div>
    </div>
  \`;

  container.appendChild(newNode);

  setTimeout(() => {
    newNode.classList.add('future-node-visible');
  }, 100);

  setTimeout(() => {
    newNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
}

function showBackToTimelineButton() {
  let backBtn = document.getElementById('back-to-timeline-btn');

  if (!backBtn) {
    backBtn = document.createElement('button');
    backBtn.id = 'back-to-timeline-btn';
    backBtn.className = 'back-to-timeline-btn';
    backBtn.innerHTML = '<span class="btn-icon">↩</span><span class="btn-text">回到时间轴</span>';

    const musicController = document.querySelector('.music-controller');
    if (musicController) {
      musicController.insertBefore(backBtn, musicController.firstChild);
    }

    backBtn.addEventListener('click', handleBackToTimelineClick);
  }

  setTimeout(() => {
    backBtn.classList.add('visible');
  }, 500);
}

function handleBackToTimelineClick() {
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.remove('easter-egg-stage1');
    timelineContainer.classList.remove('future-node-mode');
  }

  if (easterEggOverlay) {
    easterEggOverlay.classList.remove('visible');
    setTimeout(() => {
      if (easterEggOverlay) {
        easterEggOverlay.remove();
        easterEggOverlay = null;
      }
    }, 500);
  }

  const backBtn = document.getElementById('back-to-timeline-btn');
  if (backBtn) {
    backBtn.classList.remove('visible');
    setTimeout(() => {
      if (backBtn && backBtn.parentNode) {
        backBtn.remove();
      }
    }, 300);
  }

  document.body.style.overflow = '';

  const timelineNodes = document.getElementById('timeline-nodes');
  if (timelineNodes) {
    timelineNodes.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ========== 初始化 ==========
function init() {
  initProposalPage();
  initChoiceButtons();
  initMusicController();
  initTimeline();
  initEasterEgg();
  initDaughterNodeVolumeControl();

  setTimeout(() => {
    transitionToPage('choice');
  }, 1500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
  `.trim();
}

/**
 * 读取文本文件
 */
async function fetchTextFile(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return await response.text();
}

/**
 * 生成完整的 HTML 文档
 */
function generateHTML(data, css, js) {
  const hasMusic = data.musicData && data.musicData.data;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="description" content="我们的爱情故事">
  <meta name="theme-color" content="#FF6B9D">
  <title>我们的故事</title>
  <style>
${css}
  </style>
</head>
<body>
  <!-- Loading Page -->
  <div id="loading-page" class="page active">
    <div class="loading-content">
      <div class="heart-pulse">❤</div>
      <p class="loading-text">正在准备惊喜...</p>
      <div class="loading-bar"><div class="loading-progress"></div></div>
    </div>
  </div>

  <!-- Choice Page -->
  <div id="choice-page" class="page hidden">
    <div class="choice-container">
      <h2 class="choice-title">我有一个问题想问你...</h2>
      <p class="choice-subtitle">你愿意看看我们的故事吗？</p>
      <div class="choice-buttons">
        <button id="btn-yes" class="btn-choice btn-primary">
          <span class="btn-icon">❤</span> 愿意
        </button>
        <button id="btn-no" class="btn-choice btn-secondary">再想想</button>
      </div>
    </div>
  </div>

  <!-- Proposal Page -->
  <div id="proposal-page" class="page hidden">
    <div class="proposal-container">
      <h2 class="proposal-title">
        👉「假如下面几个人同时向你求婚，<br>你会选择嫁给谁？」
      </h2>
      <div class="avatar-grid" id="avatar-grid"></div>
    </div>
    <div class="success-overlay" id="success-overlay">
      <div class="success-content">
        <div class="success-icon">💕</div>
        <p class="success-message" id="success-message"></p>
      </div>
    </div>
    <div class="confetti-container" id="confetti-container"></div>
  </div>

  <!-- Timeline Page -->
  <div id="timeline-page" class="page hidden">
    ${hasMusic ? `
    <div id="music-controller" class="music-controller">
      <button id="music-toggle" class="music-toggle" aria-label="音乐开关">
        <span class="music-icon">🎵</span>
      </button>
    </div>` : ''}

    <div class="timeline-container">
      <header class="timeline-header">
        <h1>我们的故事</h1>
        <p class="timeline-subtitle">一路有你</p>
      </header>

      <main class="timeline">
        <div class="timeline-line"></div>
        <div id="timeline-nodes" class="timeline-nodes"></div>
      </main>

      <footer class="timeline-footer">
        <p>💕 爱你每一天 💕</p>
      </footer>
    </div>

    <!-- Lightbox -->
    <div id="lightbox" class="lightbox">
      <span class="lightbox-close">&times;</span>
      <img class="lightbox-content" id="lightbox-img">
      <p class="lightbox-caption" id="lightbox-caption"></p>
    </div>
  </div>

  ${hasMusic ? `<audio id="bg-music" src="${data.musicData.data}" loop></audio>` : ''}

  <script>
${js}
  </script>
</body>
</html>`;
}

/**
 * 下载 HTML 文件
 */
function downloadHTML(htmlContent) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `我们的故事-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * 固化图片到代码文件
 * 将当前上传的图片生成为 image-preload.js 文件供下载
 */
async function saveImagesToCode() {
  console.log('[saveImagesToCode] 开始执行...');

  try {
    showToast('正在收集图片数据...', 'info');

    // 收集的图片数据
    const imagesData = {
      avatars: {},
      timeline: {}
    };

    // 1. 收集求婚页头像（从 localStorage）
    const avatarPhotos = localStorage.getItem('avatar_photos');
    if (avatarPhotos) {
      try {
        imagesData.avatars = JSON.parse(avatarPhotos);
        console.log('[saveImagesToCode] 收集到头像:', Object.keys(imagesData.avatars).length, '个');
      } catch (e) {
        console.error('[saveImagesToCode] 解析头像数据失败:', e);
      }
    }

    // 2. 收集时间轴图片（从 IndexedDB）
    if (typeof getAllImagesFromIndexedDB === 'function') {
      console.log('[saveImagesToCode] 开始从 IndexedDB 收集图片...');
      const allIndexedDBImages = await getAllImagesFromIndexedDB();
      console.log('[saveImagesToCode] IndexedDB 中有', Object.keys(allIndexedDBImages).length, '张图片');

      // 从 timeline_data 中提取引用的图片
      const timelineData = localStorage.getItem('timeline_data');
      if (timelineData) {
        try {
          const nodes = JSON.parse(timelineData);
          nodes.forEach((node, nodeIndex) => {
            if (node.contents) {
              node.contents.forEach((content) => {
                if (content.type === 'image' && content.src && content.src.startsWith('indexeddb:')) {
                  const imageId = content.src.replace('indexeddb:', '');
                  const base64 = allIndexedDBImages[imageId];
                  if (base64) {
                    // 使用 content.contentId 生成稳定的 key
                    const contentId = content.contentId || `c_${node.id}_${node.contents.indexOf(content)}`;
                    const key = `node_${node.id}_${contentId}`;
                    imagesData.timeline[key] = base64;
                  }
                }
              });
            }
          });
          console.log('[saveImagesToCode] 收集到时间轴图片:', Object.keys(imagesData.timeline).length, '张');
        } catch (e) {
          console.error('[saveImagesToCode] 解析时间轴数据失败:', e);
        }
      }

      // 从 standalone_blocks 中提取引用的图片
      const standaloneBlocks = localStorage.getItem('standalone_blocks');
      if (standaloneBlocks) {
        try {
          const blocks = JSON.parse(standaloneBlocks);
          blocks.forEach((block) => {
            if (block.type === 'image' && block.src && block.src.startsWith('indexeddb:')) {
              const imageId = block.src.replace('indexeddb:', '');
              const base64 = allIndexedDBImages[imageId];
              if (base64) {
                // 使用 block.id 而非索引，确保稳定性
                const key = `standalone_${block.id}`;
                imagesData.timeline[key] = base64;
              }
            }
          });
          console.log('[saveImagesToCode] 收集到独立内容块图片:', Object.keys(blocks).filter(b => b.type === 'image').length, '张');
        } catch (e) {
          console.error('[saveImagesToCode] 解析独立内容块数据失败:', e);
        }
      }
    }

    // 3. 生成 JS 文件内容
    const jsContent = generateImagePreloadJS(imagesData);

    // 4. 下载文件
    const blob = new Blob([jsContent], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'image-preload.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    // 5. 显示成功信息
    const avatarCount = Object.keys(imagesData.avatars).length;
    const timelineCount = Object.keys(imagesData.timeline).length;

    console.log('[saveImagesToCode] 固化完成:', {
      avatars: avatarCount,
      timeline: timelineCount
    });

    showToast(`✅ 已下载 image-preload.js！包含 ${avatarCount} 个头像 + ${timelineCount} 张图片`, 'success');

    // 6. 提示用户下一步操作
    setTimeout(() => {
      const userConfirm = confirm(
        '文件已下载！\n\n' +
        `包含 ${avatarCount} 个头像 + ${timelineCount} 张时间轴图片\n\n` +
        '接下来请：\n' +
        '1. 在浏览器下载文件夹找到 image-preload.js\n' +
        '2. 复制到项目的 js/ 目录\n' +
        '3. 覆盖现有文件\n\n' +
        '要现在查看文件内容吗？'
      );
      if (userConfirm) {
        // 在新窗口显示文件内容
        const win = window.open('', '_blank');
        win.document.write('<pre style="word-wrap: break-word; white-space: pre-wrap; padding: 20px;">' + jsContent + '</pre>');
        win.document.close();
      }
    }, 500);

  } catch (error) {
    console.error('[saveImagesToCode] 固化失败:', error);
    showToast('固化图片失败: ' + error.message, 'error');
  }
}

/**
 * 生成 image-preload.js 文件内容
 */
function generateImagePreloadJS(imagesData) {
  // 格式化数据为 JS 代码
  const avatarsCode = JSON.stringify(imagesData.avatars || {}, null, 2);
  const timelineCode = JSON.stringify(imagesData.timeline || {}, null, 2);

  return `/**
 * 图片预置数据
 *
 * 此文件存储默认的图片数据（Base64 格式）
 * 当用户没有上传图片时，使用这些预置图片
 *
 * 生成时间: ${new Date().toISOString()}
 * 生成方式: 编辑器「固化图片到代码」功能
 *
 * 优先级: 用户上传 > 预置图片 > 默认占位符
 */

const PRELOADED_IMAGES = {
  // 求婚页头像
  avatars: ${avatarsCode},

  // 时间轴图片（key 格式: node_{节点索引}_img_{内容索引} 或 standalone_{索引}）
  timeline: ${timelineCode}
};

// 将预置数据暴露到全局
if (typeof window !== 'undefined') {
  window.PRELOADED_IMAGES = PRELOADED_IMAGES;
}
`;
}

/**
 * 检查是否为 IndexedDB 引用
 */
function isIndexedDBRef(src) {
  return src && typeof src === 'string' && src.startsWith('indexeddb:');
}
