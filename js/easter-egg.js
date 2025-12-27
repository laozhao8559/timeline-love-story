/**
 * 时间轴彩蛋动画 - 全屏覆盖层版本
 * 触发时机：最后一个节点80%可见 + 停留2秒
 */

// ========== 配置 ==========
const EASTER_EGG_CONFIG = {
  // 触发阈值（最后一个节点可见比例）
  triggerThreshold: 0.8,

  // 需要停留的时间（毫秒）- 改为2秒
  stayDuration: 2000,

  // 前景文字（2-3行）
  texts: [
    '这不是一个网页。',
    '这是我想陪你走完的这一生。',
    '生日快乐，我的爱人。'
  ],

  // 背景图片每张显示时长（毫秒）
  photoDuration: 3000,

  // 背景图片切换动画时长
  transitionDuration: 1500
};

// 状态管理
let easterEggTriggered = false;
let lastNodeStayTimer = null;
let backgroundSlideshowInterval = null;
let easterEggOverlay = null;

/**
 * 初始化彩蛋检测
 */
function initEasterEgg() {
  console.log('[EasterEgg] 初始化彩蛋检测');

  // 创建专用的 observer 用于检测最后一个节点
  const endingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= EASTER_EGG_CONFIG.triggerThreshold) {
        // 最后一个节点达到触发阈值
        if (!easterEggTriggered) {
          startStayTimer();
        }
      } else {
        // 节点离开视口，取消计时
        cancelStayTimer();
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: EASTER_EGG_CONFIG.triggerThreshold
  });

  // 观察最后一个节点
  const nodes = document.querySelectorAll('.timeline-node');
  if (nodes.length > 0) {
    const lastNode = nodes[nodes.length - 1];
    endingObserver.observe(lastNode);
    console.log('[EasterEgg] 已设置观察最后节点');
  }

  // 同时也观察 ending 元素
  const ending = document.querySelector('.timeline-ending');
  if (ending) {
    endingObserver.observe(ending);
  }
}

/**
 * 开始停留计时
 */
function startStayTimer() {
  if (lastNodeStayTimer) return;

  console.log('[EasterEgg] 开始停留计时...');
  lastNodeStayTimer = setTimeout(() => {
    console.log('[EasterEgg] 停留时间达标，准备触发彩蛋');
    triggerEasterEgg();
  }, EASTER_EGG_CONFIG.stayDuration);
}

/**
 * 取消停留计时
 */
function cancelStayTimer() {
  if (lastNodeStayTimer) {
    clearTimeout(lastNodeStayTimer);
    lastNodeStayTimer = null;
    console.log('[EasterEgg] 取消停留计时');
  }
}

/**
 * 获取时间轴中的所有图片
 */
function getTimelineImages() {
  const images = [];
  const nodes = document.querySelectorAll('.timeline-node');

  nodes.forEach(node => {
    const imgElements = node.querySelectorAll('.timeline-image img');
    imgElements.forEach(img => {
      if (img.src) {
        images.push(img.src);
      }
    });
  });

  console.log(`[EasterEgg] 找到 ${images.length} 张图片用于背景播放`);
  return images;
}

/**
 * 触发彩蛋动画
 */
function triggerEasterEgg() {
  if (easterEggTriggered) return;
  easterEggTriggered = true;

  console.log('[EasterEgg] 🎉 触发彩蛋动画！');

  // 1. 音乐降至彩蛋音量
  if (typeof setSceneVolume === 'function') {
    setSceneVolume('easterEggStart', 1500);
  }

  // 2. 创建全屏覆盖层
  createEasterEggOverlay();

  // 3. 原时间轴降低透明度并模糊
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.add('easter-egg-blur');
  }
}

/**
 * 创建彩蛋全屏覆盖层
 */
function createEasterEggOverlay() {
  // 获取时间轴中的图片
  const timelineImages = getTimelineImages();

  // 创建覆盖层
  easterEggOverlay = document.createElement('div');
  easterEggOverlay.className = 'easter-egg-fullscreen-overlay';
  easterEggOverlay.innerHTML = `
    <div class="easter-egg-background" id="easter-egg-background"></div>
    <div class="easter-egg-foreground">
      <div class="easter-egg-text-container">
        ${EASTER_EGG_CONFIG.texts.map((text, index) =>
          `<div class="easter-egg-text-line" id="easter-text-${index}" style="animation-delay: ${index * 0.8}s">${text}</div>`
        ).join('')}
      </div>
      <button class="easter-egg-continue-btn" id="easter-continue-btn">
        <span class="btn-text">继续写下去</span>
        <span class="btn-sparkle">✨</span>
      </button>
    </div>
  `;

  document.body.appendChild(easterEggOverlay);

  // 淡入覆盖层
  setTimeout(() => easterEggOverlay.classList.add('visible'), 50);

  // 启动背景图片轮播
  if (timelineImages.length > 0) {
    startBackgroundSlideshow(timelineImages);
  } else {
    console.log('[EasterEgg] 没有找到图片，使用纯色背景');
  }

  // 绑定按钮事件
  const continueBtn = document.getElementById('easter-continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', handleContinueClick);
  }

  // 音乐升到终极文字音量
  setTimeout(() => {
    if (typeof setSceneVolume === 'function') {
      setSceneVolume('finalWords', 1500);
    }
  }, 1000);
}

/**
 * 启动背景图片轮播
 */
function startBackgroundSlideshow(images) {
  const backgroundEl = document.getElementById('easter-egg-background');
  if (!backgroundEl) return;

  let currentIndex = 0;
  const animations = ['fade-in', 'zoom-in', 'slide-in'];

  function showNextImage() {
    // 随机选择动画效果
    const animation = animations[Math.floor(Math.random() * animations.length)];

    // 创建新图片元素
    const newImg = document.createElement('img');
    newImg.src = images[currentIndex];
    newImg.className = `background-image ${animation}`;

    // 清空并添加新图片
    backgroundEl.innerHTML = '';
    backgroundEl.appendChild(newImg);

    // 下一张索引
    currentIndex = (currentIndex + 1) % images.length;
  }

  // 显示第一张
  showNextImage();

  // 定时切换
  backgroundSlideshowInterval = setInterval(showNextImage, EASTER_EGG_CONFIG.photoDuration);
}

/**
 * 处理"继续写下去"按钮点击
 */
function handleContinueClick() {
  console.log('[EasterEgg] 点击继续写下去');

  // 1. 停止背景轮播
  if (backgroundSlideshowInterval) {
    clearInterval(backgroundSlideshowInterval);
    backgroundSlideshowInterval = null;
  }

  // 2. 恢复时间轴样式
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.remove('easter-egg-blur');
  }

  // 3. 恢复音乐到彩蛋结束音量
  if (typeof setSceneVolume === 'function') {
    setSceneVolume('easterEggEnd', 1500);
  }

  // 4. 淡出覆盖层
  easterEggOverlay.classList.remove('visible');
  setTimeout(() => {
    if (easterEggOverlay) {
      easterEggOverlay.remove();
      easterEggOverlay = null;
    }
  }, 500);

  // 5. 添加未来节点
  setTimeout(() => addFutureNode(), 300);
}

/**
 * 添加未来空白节点
 */
function addFutureNode() {
  const container = document.getElementById('timeline-nodes');
  if (!container) return;

  // 移除 ending（暂时）
  const ending = container.querySelector('.timeline-ending');
  if (ending) {
    ending.style.display = 'none';
  }

  // 创建新节点
  const newNode = document.createElement('article');
  newNode.className = 'timeline-node future-node';
  newNode.innerHTML = `
    <div class="timeline-date">未来</div>
    <div class="timeline-content">
      <h3 class="timeline-title">未完待续…</h3>
      <div class="future-node-placeholder">
        <span class="placeholder-icon">📝</span>
        <p>我们的故事，还在继续...</p>
      </div>
    </div>
  `;

  container.appendChild(newNode);

  // 淡入动画
  setTimeout(() => newNode.classList.add('animate-in'), 50);

  // 滚动到新节点
  setTimeout(() => {
    newNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);

  showToast('故事还在继续…', 'success');
}

/**
 * 重置彩蛋状态（用于测试）
 */
function resetEasterEgg() {
  easterEggTriggered = false;
  cancelStayTimer();

  // 清理覆盖层
  if (easterEggOverlay) {
    easterEggOverlay.remove();
    easterEggOverlay = null;
  }

  // 停止轮播
  if (backgroundSlideshowInterval) {
    clearInterval(backgroundSlideshowInterval);
    backgroundSlideshowInterval = null;
  }

  // 恢复时间轴样式
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.remove('easter-egg-blur');
  }

  console.log('[EasterEgg] 已重置彩蛋状态');
}

// 将配置暴露到全局，方便编辑
if (typeof window !== 'undefined') {
  window.EASTER_EGG_CONFIG = EASTER_EGG_CONFIG;
  window.resetEasterEgg = resetEasterEgg;
}
