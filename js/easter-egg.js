/**
 * 时间轴彩蛋动画
 * 触发时机：最后一个节点80%可见 + 停留3秒
 */

// ========== 配置 ==========
const EASTER_EGG_CONFIG = {
  // 触发阈值（最后一个节点可见比例）
  triggerThreshold: 0.8,

  // 需要停留的时间（毫秒）
  stayDuration: 3000,

  // 方案选择：'photos' | 'text'
  stage2Mode: 'photos',

  // 照片数据（使用 IndexedDB 引用或直接 URL）
  photos: [
    // 示例：'indexeddb:img_xxx' 或直接 URL
    // TODO: 替换为你的照片
  ],

  // 文字数据（当 stage2Mode = 'text' 时使用）
  texts: [
    '是你，让日子有了重量',
    '是你，让时间变得温柔',
    '是你，让我有了家'
  ],

  // 每张照片显示时长（毫秒）
  photoDuration: 600,

  // 打字速度（每字毫秒）
  typingSpeed: 100
};

// 状态管理
let easterEggTriggered = false;
let easterEggTimer = null;
let lastNodeStayTimer = null;

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

  // 观察最后一个节点（timeline-ending 或最后一个 timeline-node）
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
 * 触发彩蛋动画
 */
function triggerEasterEgg() {
  if (easterEggTriggered) return;
  easterEggTriggered = true;

  console.log('[EasterEgg] 🎉 触发彩蛋动画！');

  // 开始四阶段动画序列
  runStage1_CalmDown();
}

/**
 * 阶段1：世界安静下来（1.5秒）
 */
function runStage1_CalmDown() {
  console.log('[EasterEgg] 阶段1：世界安静下来');

  // 1. 背景变暗
  document.body.classList.add('easter-egg-dim');

  // 2. 时间轴缩小
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.add('easter-egg-scale');
  }

  // 3. 音乐降至彩蛋开始音量 (40%)
  if (typeof setSceneVolume === 'function') {
    setSceneVolume('easterEggStart', 1500);
  }

  // 4. 显示"故事还没有结束"
  const overlay = document.createElement('div');
  overlay.className = 'easter-egg-overlay stage-1';
  overlay.innerHTML = '<div class="easter-egg-message">故事还没有结束。</div>';
  document.body.appendChild(overlay);

  // 淡入动画
  setTimeout(() => overlay.classList.add('visible'), 50);

  // 1.5秒后进入阶段2
  setTimeout(() => {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.remove();
      runStage2_Flashback();
    }, 500);
  }, 1500);
}

/**
 * 阶段2：回忆闪回（3-5秒）
 */
function runStage2_Flashback() {
  console.log('[EasterEgg] 阶段2：回忆闪回');

  if (EASTER_EGG_CONFIG.stage2Mode === 'photos') {
    runPhotoFlashback();
  } else {
    runTextFlashback();
  }
}

/**
 * 照片闪回模式
 */
function runPhotoFlashback() {
  const photos = EASTER_EGG_CONFIG.photos;

  // 如果没有配置照片，使用文字模式
  if (!photos || photos.length === 0) {
    console.log('[EasterEgg] 未配置照片，使用文字模式');
    runTextFlashback();
    return;
  }

  const container = document.createElement('div');
  container.className = 'easter-egg-flashback';
  document.body.appendChild(container);

  let currentIndex = 0;

  function showNextPhoto() {
    if (currentIndex >= photos.length) {
      // 所有照片显示完毕，进入阶段3
      container.classList.add('fade-out');
      setTimeout(() => container.remove(), 500);
      setTimeout(() => runStage3_FinalWords(), 300);
      return;
    }

    const photoSrc = photos[currentIndex];
    const img = document.createElement('img');
    img.className = 'flashback-photo';
    img.src = photoSrc;

    // 清空之前的内容
    container.innerHTML = '';
    container.appendChild(img);

    // 淡入
    setTimeout(() => img.classList.add('visible'), 50);

    currentIndex++;

    // 下一张
    setTimeout(showNextPhoto, EASTER_EGG_CONFIG.photoDuration);
  }

  showNextPhoto();
}

/**
 * 文字闪回模式
 */
function runTextFlashback() {
  const texts = EASTER_EGG_CONFIG.texts || [
    '是你，让日子有了重量',
    '是你，让时间变得温柔'
  ];

  const container = document.createElement('div');
  container.className = 'easter-egg-flashback text-mode';
  document.body.appendChild(container);

  let currentIndex = 0;

  function showNextText() {
    if (currentIndex >= texts.length) {
      // 所有文字显示完毕，进入阶段3
      container.classList.add('fade-out');
      setTimeout(() => container.remove(), 500);
      setTimeout(() => runStage3_FinalWords(), 300);
      return;
    }

    const text = texts[currentIndex];
    const textEl = document.createElement('div');
    textEl.className = 'flashback-text';
    container.innerHTML = '';
    container.appendChild(textEl);

    // 打字效果
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < text.length) {
        textEl.textContent += text.charAt(charIndex);
        charIndex++;
      } else {
        clearInterval(typingInterval);
        // 停留一下再显示下一条
        setTimeout(showNextText, 1500);
      }
    }, EASTER_EGG_CONFIG.typingSpeed);

    currentIndex++;
  }

  showNextText();
}

/**
 * 阶段3：终极文字（核心）
 */
function runStage3_FinalWords() {
  console.log('[EasterEgg] 阶段3：终极文字');

  // 音乐升至终极文字音量 (65%) - 最重要时刻
  if (typeof setSceneVolume === 'function') {
    setSceneVolume('finalWords', 1500);
  }

  const overlay = document.createElement('div');
  overlay.className = 'easter-egg-overlay stage-3';
  overlay.innerHTML = `
    <div class="final-words-container">
      <div class="final-word-line" id="final-line-1"></div>
      <div class="final-word-line" id="final-line-2"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => overlay.classList.add('visible'), 50);

  // 第一段文字
  typeWriter('final-line-1', '这不是一个网页。', 100, () => {
    typeWriter('final-line-1', '这不是一个网页。\n这是我想陪你走完的这一生。', 80, () => {
      // 1秒后显示第二段
      setTimeout(() => {
        typeWriter('final-line-2', '生日快乐，我的爱人。', 120, () => {
          // 显示停留后进入阶段4
          setTimeout(() => {
            runStage4_ContinueButton(overlay);
          }, 3000);
        });
      }, 1000);
    });
  });
}

/**
 * 打字机效果
 */
function typeWriter(elementId, text, speed = 100, callback) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = '';
  let i = 0;

  function type() {
    if (i < text.length) {
      const char = text.charAt(i);
      element.textContent += char;
      i++;
      setTimeout(type, speed);
    } else {
      if (callback) callback();
    }
  }

  type();
}

/**
 * 阶段4：收尾按钮
 */
function runStage4_ContinueButton(overlay) {
  console.log('[EasterEgg] 阶段4：收尾按钮');

  // 添加按钮
  const button = document.createElement('button');
  button.className = 'easter-egg-continue-btn';
  button.innerHTML = '<span class="btn-text">继续写下去</span><span class="btn-sparkle">✨</span>';

  button.addEventListener('click', () => {
    handleContinueClick(overlay, button);
  });

  overlay.appendChild(button);
  setTimeout(() => button.classList.add('visible'), 100);
}

/**
 * 处理"继续写下去"按钮点击
 */
function handleContinueClick(overlay, button) {
  console.log('[EasterEgg] 点击继续写下去');

  // 1. 页面恢复明亮
  document.body.classList.remove('easter-egg-dim');
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.remove('easter-egg-scale');
  }

  // 2. 恢复音乐到彩蛋结束音量 (45%)
  if (typeof setSceneVolume === 'function') {
    setSceneVolume('easterEggEnd', 1500);
  }

  // 3. 移除彩蛋覆盖层
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 500);

  // 4. 添加空白节点
  addFutureNode();
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
  console.log('[EasterEgg] 已重置彩蛋状态');
}

// 将配置暴露到全局，方便编辑
if (typeof window !== 'undefined') {
  window.EASTER_EGG_CONFIG = EASTER_EGG_CONFIG;
  window.resetEasterEgg = resetEasterEgg;
}
