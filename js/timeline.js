/**
 * Timeline Renderer
 * Handles rendering of timeline nodes and media elements
 */

/**
 * Initialize the timeline
 * 支持独立内容块插入
 */
function initTimeline() {
  const container = document.getElementById('timeline-nodes');
  if (!container) return;

  console.log('[initTimeline] 开始初始化时间轴');

  // Clear existing content
  container.innerHTML = '';

  // 优先使用 localStorage 中的编辑数据，如果没有则使用默认数据
  const savedTimelineData = localStorage.getItem('timeline_data');
  console.log('[initTimeline] localStorage 中的数据:', savedTimelineData);

  const dataToRender = savedTimelineData ? JSON.parse(savedTimelineData) : timelineData;

  console.log('[initTimeline] 将要渲染的数据:', dataToRender);
  console.log('[initTimeline] 第一个节点完整数据:', dataToRender[0]);
  console.log('[initTimeline] 第一个节点 contents:', dataToRender[0]?.contents);
  console.log('[initTimeline] contents 长度:', dataToRender[0]?.contents?.length);

  // 先渲染 insertAfter: -1 的内容块（最前面）
  const headBlocks = (standaloneBlocks || []).filter(b => b.insertAfter === -1);
  headBlocks.forEach(block => {
    const blockEl = createStandaloneBlock(block);
    container.appendChild(blockEl);
  });

  // 渲染所有时间轴节点，并在节点之间插入独立内容块
  dataToRender.forEach((node, index) => {
    console.log(`[initTimeline] 渲染节点 ${index}:`, { id: node.id, title: node.title, contentsLength: node.contents?.length });
    const nodeEl = createTimelineNode(node, index);
    container.appendChild(nodeEl);

    // 查找并渲染在当前节点之后的独立内容块
    const afterBlocks = (standaloneBlocks || []).filter(b => b.insertAfter === index);
    afterBlocks.forEach(block => {
      const blockEl = createStandaloneBlock(block);
      container.appendChild(blockEl);
    });
  });

  console.log('[initTimeline] 总共渲染的节点数:', container.children.length);

  // Render the ending
  const endingEl = createTimelineEnding();
  container.appendChild(endingEl);

  // 初始化滚动动画（添加 animate-in 类）
  if (typeof initScrollAnimations === 'function') {
    initScrollAnimations();
  }
}

/**
 * Create a standalone content block element
 * 独立内容块 - 不依附于任何节点
 */
function createStandaloneBlock(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'standalone-block';
  wrapper.dataset.blockId = block.id;

  if (block.type === 'text') {
    wrapper.innerHTML = `
      <div class="standalone-text">
        ${escapeHtml(block.content)}
      </div>
    `;
  } else if (block.type === 'image') {
    wrapper.innerHTML = `
      <div class="standalone-media">
        <img src="${block.src}" alt="${escapeHtml(block.alt || '')}" class="standalone-image" onclick="openLightbox('${block.src}', '${escapeHtml(block.alt || '')}')">
        ${block.caption ? `<p class="standalone-caption">${escapeHtml(block.caption)}</p>` : ''}
      </div>
    `;
  } else if (block.type === 'video') {
    const videoWrapper = createVideoElement(block);
    wrapper.appendChild(videoWrapper);
  }

  return wrapper;
}

/**
 * Create a timeline node element
 * 新数据结构：支持 contents 数组，内容块可自由排序
 */
function createTimelineNode(node, index) {
  const article = document.createElement('article');
  article.className = `timeline-node${node.isHighlight ? ' highlight' : ''}`;
  article.dataset.nodeId = node.id;
  article.dataset.index = index;

  // Create date element
  const dateEl = document.createElement('div');
  dateEl.className = 'timeline-date';
  dateEl.textContent = node.date;

  // Create content container
  const contentEl = document.createElement('div');
  contentEl.className = 'timeline-content';

  // Add title if exists
  if (node.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'timeline-title';
    titleEl.textContent = node.title;
    contentEl.appendChild(titleEl);
  }

  // Render all content blocks in order
  if (node.contents && node.contents.length > 0) {
    node.contents.forEach((contentBlock, contentIndex) => {
      const blockEl = createContentBlock(contentBlock, node.id, contentIndex);
      if (blockEl) {
        contentEl.appendChild(blockEl);
      }
    });
  }

  // Assemble the node
  article.appendChild(dateEl);
  article.appendChild(contentEl);

  return article;
}

/**
 * Create a content block element (text, image, or video)
 */
function createContentBlock(contentBlock, nodeId, contentIndex) {
  console.log('[createContentBlock] 创建内容块:', { type: contentBlock.type, contentBlock });

  if (contentBlock.type === 'text') {
    const textEl = document.createElement('p');
    textEl.className = 'timeline-text-block';
    textEl.textContent = contentBlock.content;
    console.log('[createContentBlock] 创建文字元素:', textEl);
    return textEl;

  } else if (contentBlock.type === 'image') {
    const img = document.createElement('img');
    img.src = contentBlock.src;
    img.alt = contentBlock.alt || '';
    img.className = 'timeline-image';
    // 移除 loading='lazy' 以确保图片立即加载
    img.addEventListener('click', () => openLightbox(contentBlock.src, contentBlock.alt));
    console.log('[createContentBlock] 创建图片元素，src:', contentBlock.src);
    return img;

  } else if (contentBlock.type === 'video') {
    const videoEl = createVideoElement(contentBlock);
    console.log('[createContentBlock] 创建视频元素');
    return videoEl;
  }

  console.log('[createContentBlock] 未知的内容块类型:', contentBlock.type);
  return null;
}

/**
 * Create an image element with click handler (legacy, for compatibility)
 */
function createImageElement(media) {
  const img = document.createElement('img');
  img.src = media.src;
  img.alt = media.alt || '';
  img.className = 'timeline-image';
  img.loading = 'lazy';
  img.addEventListener('click', () => openLightbox(media.src, media.alt));
  return img;
}

/**
 * Create a video element with custom controls
 */
function createVideoElement(media) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';

  const video = document.createElement('video');
  video.src = media.src;
  video.poster = media.poster || '';
  video.className = 'timeline-video';
  // 使用 setAttribute 设置布尔属性更可靠
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('x5-video-player-type', 'h5');
  video.setAttribute('x5-video-player-fullscreen', 'false');
  video.controls = false;

  // Create play button overlay
  const playOverlay = document.createElement('div');
  playOverlay.className = 'video-play-overlay';
  playOverlay.innerHTML = '<span class="play-icon">▶</span>';

  // Play handler
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

  // Reset when video ends
  video.addEventListener('ended', () => {
    playOverlay.style.display = 'flex';
    video.controls = false;
  });

  wrapper.appendChild(video);
  wrapper.appendChild(playOverlay);

  return wrapper;
}

/**
 * Create the ending section
 */
function createTimelineEnding() {
  const ending = document.createElement('section');
  ending.className = 'timeline-ending';

  ending.innerHTML = `
    <div class="ending-content">
      <div class="ending-icon">💕</div>
      <h2 class="ending-message">${escapeHtml(endingConfig.message)}</h2>
      <div class="ending-signature">
        <p>${escapeHtml(endingConfig.signature)}</p>
        <p class="ending-name">${escapeHtml(endingConfig.name)}</p>
        <p class="ending-date">${escapeHtml(endingConfig.date)}</p>
      </div>
      <div class="ending-hearts">
        <span>❤</span>
        <span>❤</span>
        <span>❤</span>
      </div>
    </div>
  `;

  return ending;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
