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
  const savedStandaloneBlocks = localStorage.getItem('standalone_blocks');
  console.log('[initTimeline] localStorage 中的 timeline_data:', savedTimelineData);
  console.log('[initTimeline] localStorage 中的 standalone_blocks:', savedStandaloneBlocks);

  // 使用 try-catch 处理可能的 JSON 解析错误
  let dataToRender = timelineData; // 默认使用 timelineData
  if (savedTimelineData) {
    try {
      dataToRender = JSON.parse(savedTimelineData);
    } catch (e) {
      console.error('[initTimeline] 解析 timeline_data 失败，使用默认数据:', e);
      dataToRender = timelineData;
    }
  }

  // 使用保存的独立内容块，如果没有则使用默认的
  let blocksToRender = standaloneBlocks || [];
  if (savedStandaloneBlocks) {
    try {
      blocksToRender = JSON.parse(savedStandaloneBlocks);
    } catch (e) {
      console.error('[initTimeline] 解析 standalone_blocks 失败，使用默认数据:', e);
      blocksToRender = standaloneBlocks || [];
    }
  }

  console.log('[initTimeline] 将要渲染的数据:', dataToRender);
  console.log('[initTimeline] 第一个节点完整数据:', dataToRender[0]);
  console.log('[initTimeline] 第一个节点 contents:', dataToRender[0]?.contents);
  console.log('[initTimeline] contents 长度:', dataToRender[0]?.contents?.length);

  // 先渲染 insertAfter: -1 的内容块（最前面）
  const headBlocks = blocksToRender.filter(b => b.insertAfter === -1);
  headBlocks.forEach((block, idx) => {
    const blockEl = createStandaloneBlock(block, idx);
    container.appendChild(blockEl);
  });

  // 渲染所有时间轴节点，并在节点之间插入独立内容块
  dataToRender.forEach((node, index) => {
    console.log(`[initTimeline] 渲染节点 ${index}:`, { id: node.id, title: node.title, contentsLength: node.contents?.length });
    const nodeEl = createTimelineNode(node, index);
    container.appendChild(nodeEl);

    // 查找并渲染在当前节点之后的独立内容块
    const afterBlocks = blocksToRender.filter(b => b.insertAfter === index);
    afterBlocks.forEach((block, idx) => {
      const blockEl = createStandaloneBlock(block, idx);
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
 * @param {Object} block - 独立内容块数据
 * @param {number} standaloneIndex - 独立内容块的索引（用于预置图片回退）
 */
function createStandaloneBlock(block, standaloneIndex = 0) {
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
    const mediaDiv = document.createElement('div');
    mediaDiv.className = 'standalone-media media-loading';

    const img = document.createElement('img');
    img.alt = escapeHtml(block.alt || '');
    img.className = 'standalone-image';
    // 延迟加载：存储在 data-src 中
    img.dataset.src = block.src;
    img.style.opacity = '0';

    // 错误处理
    img.addEventListener('error', () => {
      mediaDiv.classList.remove('media-loading');
      mediaDiv.classList.add('media-error');
      img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f5f5f5" width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14">图片加载失败</text></svg>');
      img.style.opacity = '1';
    });

    // 加载成功
    img.addEventListener('load', () => {
      mediaDiv.classList.remove('media-loading');
      mediaDiv.classList.add('media-loaded');
      img.style.opacity = '1';
    });

    // 点击事件
    img.addEventListener('click', () => {
      const actualSrc = img.src || block.src;
      openLightbox(actualSrc, block.alt);
    });

    mediaDiv.appendChild(img);

    if (block.caption) {
      const caption = document.createElement('p');
      caption.className = 'standalone-caption';
      caption.textContent = escapeHtml(block.caption);
      mediaDiv.appendChild(caption);
    }

    wrapper.appendChild(mediaDiv);
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

  // 可用的动画效果列表
  const animations = [
    'animate-fadeIn',
    'animate-slideUp',
    'animate-slideDown',
    'animate-slideInLeft',
    'animate-slideInRight',
    'animate-zoomIn',
    'animate-rotateIn',
    'animate-bounceIn',
    'animate-flipInX'
  ];

  // 随机选择一个动画
  const randomAnimation = animations[Math.floor(Math.random() * animations.length)];

  if (contentBlock.type === 'text') {
    const textEl = document.createElement('p');
    textEl.className = 'timeline-text-block';
    textEl.textContent = contentBlock.content;
    // 添加随机动画类和数据属性
    textEl.classList.add(randomAnimation);
    textEl.dataset.animate = randomAnimation;
    textEl.dataset.blockIndex = contentIndex;
    console.log('[createContentBlock] 创建文字元素，动画:', randomAnimation);
    return textEl;

  } else if (contentBlock.type === 'image') {
    // 创建图片容器，支持延迟加载
    const imgContainer = document.createElement('div');
    imgContainer.className = 'timeline-image-container media-loading';

    const img = document.createElement('img');
    img.alt = contentBlock.alt || '';
    img.className = 'timeline-image';
    // 不直接设置 src，而是存储在 data-src 中，等进入视口再加载
    img.dataset.src = contentBlock.src;
    img.style.opacity = '0';

    // 加载错误处理：显示兜底占位
    img.addEventListener('error', () => {
      console.error('[createContentBlock] 图片加载失败:', contentBlock.src);
      imgContainer.classList.remove('media-loading');
      imgContainer.classList.add('media-error');
      img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f5f5f5" width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14">图片加载失败</text></svg>');
      img.style.opacity = '1';
    });

    // 加载成功处理
    img.addEventListener('load', () => {
      imgContainer.classList.remove('media-loading');
      imgContainer.classList.add('media-loaded');
      img.style.opacity = '1';
    });

    // 点击事件
    img.addEventListener('click', () => {
      const actualSrc = img.src || contentBlock.src;
      openLightbox(actualSrc, contentBlock.alt);
    });

    // 添加随机动画类和数据属性
    img.classList.add(randomAnimation);
    img.dataset.animate = randomAnimation;
    img.dataset.blockIndex = contentIndex;
    imgContainer.dataset.animate = randomAnimation;

    imgContainer.appendChild(img);
    console.log('[createContentBlock] 创建图片元素（延迟加载）, data-src:', contentBlock.src, '动画:', randomAnimation);
    return imgContainer;

  } else if (contentBlock.type === 'video') {
    const videoEl = createVideoElement(contentBlock);
    // 添加随机动画类和数据属性
    videoEl.classList.add(randomAnimation);
    videoEl.dataset.animate = randomAnimation;
    videoEl.dataset.blockIndex = contentIndex;
    console.log('[createContentBlock] 创建视频元素，动画:', randomAnimation);
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
 * 视频延迟加载：点击后才加载视频源
 */
function createVideoElement(media) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper media-loading';

  const video = document.createElement('video');
  // 不直接设置 src，而是存储在 data-src 中，点击后才加载
  video.dataset.src = media.src;
  video.poster = media.poster || '';
  video.className = 'timeline-video';
  // 使用 setAttribute 设置布尔属性更可靠
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('x5-video-player-type', 'h5');
  video.setAttribute('x5-video-player-fullscreen', 'false');
  video.muted = true; // 默认静音
  video.controls = false;
  video.preload = 'none'; // 禁止预加载

  // Create play button overlay
  const playOverlay = document.createElement('div');
  playOverlay.className = 'video-play-overlay';
  playOverlay.innerHTML = '<span class="play-icon">▶</span><span class="sound-icon">🔇</span><span class="loading-hint">点击加载视频</span>';

  // 标记视频是否已加载
  let videoLoaded = false;

  // 加载视频的函数
  const loadVideo = () => {
    if (videoLoaded) return;
    videoLoaded = true;

    // 显示加载状态
    const loadingHint = playOverlay.querySelector('.loading-hint');
    if (loadingHint) loadingHint.textContent = '加载中...';
    wrapper.classList.add('video-loading');

    // 设置真正的 src
    video.src = media.src;

    // 等待视频可以播放
    video.addEventListener('canplay', () => {
      wrapper.classList.remove('video-loading');
      wrapper.classList.remove('media-loading');
      wrapper.classList.add('media-loaded');
      if (loadingHint) loadingHint.style.display = 'none';
    }, { once: true });

    // 加载失败处理
    video.addEventListener('error', () => {
      console.error('[createVideoElement] 视频加载失败:', media.src);
      wrapper.classList.remove('media-loading', 'video-loading');
      wrapper.classList.add('media-error');
      playOverlay.innerHTML = '<span class="error-hint">视频加载失败</span>';
    }, { once: true });
  };

  // Play handler
  const playHandler = () => {
    // 先加载视频
    loadVideo();

    // 等视频加载后再播放
    if (video.readyState >= 2) {
      video.play();
      playOverlay.style.display = 'none';
      video.controls = true;
    } else {
      video.addEventListener('canplay', () => {
        video.play();
        playOverlay.style.display = 'none';
        video.controls = true;
      }, { once: true });
    }
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

  // 重置当视频结束时
  video.addEventListener('ended', () => {
    playOverlay.style.display = 'flex';
    video.controls = false;
  });

  // 更新声音图标
  function updateSoundIcon() {
    const soundIcon = playOverlay.querySelector('.sound-icon');
    if (soundIcon) {
      soundIcon.textContent = video.muted ? '🔇' : '🔊';
    }
  }

  // 点击声音图标切换静音状态
  const soundIcon = playOverlay.querySelector('.sound-icon');
  if (soundIcon) {
    soundIcon.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止触发播放
      video.muted = !video.muted;
      updateSoundIcon();
    });
  }

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
