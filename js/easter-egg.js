/**
 * 时间轴彩蛋动画 - 终版（四阶段情绪曲线）
 * 触发时机：最后一个节点80%可见 + 停留2秒
 * 总时长：8-12秒
 */

// ========== 配置 ==========
const EASTER_EGG_CONFIG = {
  // 触发阈值（最后一个节点可见比例）
  triggerThreshold: 0.8,

  // 需要停留的时间（毫秒）
  stayDuration: 2000,

  // 阶段1时长（毫秒）
  stage1Duration: 1500,

  // 阶段1开场文案
  stage1IntroText: '故事还没有结束……',

  // 阶段2：图片每张显示时长（毫秒）- 约0.6秒淡入淡出
  photoDuration: 600,

  // 阶段2总时长（毫秒）- 4-5秒
  stage2Duration: 4500,

  // 阶段2：三句文字内容（逐句淡入，保留在屏幕）
  stage2Words: [
    '亲爱的老婆：',
    '是你，让平淡日子有了分量……',
    '是你，让流逝的时间变得温柔……',
    '是你，让我从此有了安稳的家……'
  ],

  // 阶段2：每句文字间隔（毫秒）- 0.6～0.8秒
  stage2WordInterval: 700,

  // 阶段3：文字逐行显示间隔（毫秒）
  line1Delay: 800,
  line2Delay: 1000,

  // 终极文字内容（3行，克制表达）
  finalWords: [
    '这不是一个网页！',
    '这是我想陪你走完的这一生……',
    '❤生日快乐，我的爱人❤'
  ]
};

// 状态管理
let easterEggTriggered = false;
let lastNodeStayTimer = null;
let easterEggOverlay = null;
let backgroundSlideshowInterval = null;
let isScrollLocked = false;

/**
 * 初始化彩蛋检测
 */
function initEasterEgg() {
  console.log('[EasterEgg] 初始化彩蛋检测');

  // 创建专用的 observer 用于检测最后一个节点
  const endingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= EASTER_EGG_CONFIG.triggerThreshold) {
        if (!easterEggTriggered) {
          startStayTimer();
        }
      } else {
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

  // 1. 锁定滚动
  lockScroll();

  // 2. 音乐降至彩蛋音量
  if (typeof setSceneVolume === 'function') {
    setSceneVolume('easterEggStart', 1500);
  }

  // 3. 开始四阶段动画
  runStage1();
}

/**
 * 锁定滚动
 */
function lockScroll() {
  isScrollLocked = true;
  document.body.style.overflow = 'hidden';
  console.log('[EasterEgg] 滚动已锁定');
}

/**
 * 解锁滚动
 */
function unlockScroll() {
  isScrollLocked = false;
  document.body.style.overflow = '';
  console.log('[EasterEgg] 滚动已解锁');
}

/**
 * 🌑 阶段 1：世界安静下来（1.5 秒）
 */
function runStage1() {
  console.log('[EasterEgg] 阶段1：世界安静下来');

  // 1. 背景整体变暗
  // 2. 时间轴整体 scale(0.98) + opacity: 0.6
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.add('easter-egg-stage1');
  }

  // 3. 创建全屏 Overlay，显示开场文案
  easterEggOverlay = document.createElement('div');
  easterEggOverlay.className = 'easter-egg-overlay';
  easterEggOverlay.innerHTML = `
    <div class="easter-egg-background" id="easter-egg-background"></div>
    <div class="easter-egg-content">
      <div class="easter-egg-text-container" id="easter-egg-text-container"></div>
      <button class="easter-egg-continue-btn" id="easter-continue-btn">
        <span class="btn-text">继续写下去</span>
        <span class="btn-sparkle">✨</span>
      </button>
    </div>
  `;
  document.body.appendChild(easterEggOverlay);

  // 淡入 Overlay
  setTimeout(() => easterEggOverlay.classList.add('visible'), 50);

  // 显示开场文案："故事还没有结束……"
  const textContainer = document.getElementById('easter-egg-text-container');
  if (textContainer) {
    const introEl = document.createElement('div');
    introEl.className = 'easter-egg-intro-text';

    // 将文字拆分成单个字符，以便添加跳跃动画
    const text = EASTER_EGG_CONFIG.stage1IntroText;
    const chars = text.split('');
    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.className = 'intro-char';
      introEl.appendChild(span);
    });

    textContainer.appendChild(introEl);

    // 淡入开场文案
    setTimeout(() => introEl.classList.add('visible'), 100);

    // 淡入完成后（1秒），添加从左到右跳跃动画
    setTimeout(() => {
      const charSpans = introEl.querySelectorAll('.intro-char');
      charSpans.forEach((span, i) => {
        setTimeout(() => {
          span.classList.add('jump-wave');
        }, i * 200); // 每个字延迟200ms（慢2倍）
      });
    }, 1000);

    // 停留2秒后，淡出开场文案
    setTimeout(() => {
      introEl.classList.remove('visible'); // 移除 visible 类触发淡出
      introEl.classList.add('fading-out'); // 添加淡出状态

      // 淡出完成后（1秒），清空文字并进入阶段2
      setTimeout(() => {
        textContainer.innerHTML = '';
        runStage2();
      }, 1000);
    }, 2000);
  }
}

/**
 * 📸 阶段 2：回忆闪回（4-5 秒）
 */
function runStage2() {
  console.log('[EasterEgg] 阶段2：回忆闪回');

  // 获取时间轴中的图片
  const timelineImages = getTimelineImages();

  // 清空开场文案（阶段1的文字）
  const textContainer = document.getElementById('easter-egg-text-container');
  if (textContainer) {
    textContainer.innerHTML = '';
  }

  // 启动背景图片轮播（淡入淡出，每张0.6秒）
  if (timelineImages.length > 0) {
    startBackgroundSlideshow(timelineImages);
  }

  // 逐句显示三句文字（前一句不消失，最终同时存在）
  const words = EASTER_EGG_CONFIG.stage2Words;

  // 固定位置打字机效果 - 每个字有固定位置，从左到右均匀分布
  function typeWriterFixed(element, text, speed = 300) {
    const chars = text.split('');
    const charSpans = [];

    // 清空元素
    element.innerHTML = '';

    // 创建所有字符的 span，初始透明
    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.className = 'char-fixed';
      span.style.opacity = '0';
      element.appendChild(span);
      charSpans.push(span);
    });

    // 逐个显示字符
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
      // 四句都显示完毕，停留2秒后进入阶段3
      console.log('[EasterEgg] 阶段2四句文字显示完毕，停留2秒');
      setTimeout(() => {
        runStage3();
      }, 2000);
      return;
    }

    const lineEl = document.createElement('div');
    lineEl.className = 'easter-egg-stage2-text-line';
    lineEl.classList.add('visible'); // 打字机效果不需要淡入动画
    textContainer.appendChild(lineEl);

    // 固定位置打字机效果逐字显示
    await typeWriterFixed(lineEl, words[index], 200);

    // 等待一下再显示下一句
    setTimeout(() => {
      showStage2Line(index + 1);
    }, 600);
  }

  // 开始显示第一句
  showStage2Line(0);
}

/**
 * 启动背景图片轮播（淡入淡出，每张0.6秒）
 */
function startBackgroundSlideshow(images) {
  const backgroundEl = document.getElementById('easter-egg-background');
  if (!backgroundEl) return;

  // 随机打乱图片顺序
  const shuffledImages = [...images].sort(() => Math.random() - 0.5);
  console.log(`[EasterEgg] 图片轮播开始，共 ${shuffledImages.length} 张，每张 600ms`);

  let currentIndex = 0;

  function showNextImage() {
    if (currentIndex >= shuffledImages.length) {
      currentIndex = 0; // 循环播放
    }

    // 创建新图片元素（淡入淡出效果）
    const newImg = document.createElement('img');
    newImg.src = shuffledImages[currentIndex];
    newImg.className = 'background-image crossfade';

    // 清空并添加新图片
    backgroundEl.innerHTML = '';
    backgroundEl.appendChild(newImg);

    // 下一张索引
    currentIndex++;
  }

  // 显示第一张
  showNextImage();

  // 定时切换（600ms一张）
  backgroundSlideshowInterval = setInterval(showNextImage, EASTER_EGG_CONFIG.photoDuration);
}

/**
 * 💝 阶段 3：终极文字（核心）
 */
function runStage3() {
  console.log('[EasterEgg] 阶段3：终极文字');

  // 停止背景图片切换（定格在当前图片）
  if (backgroundSlideshowInterval) {
    clearInterval(backgroundSlideshowInterval);
    backgroundSlideshowInterval = null;
  }

  // 阶段3开始时不改变音量，保持在40%（从阶段2延续）
  // 音量将在每句文字显示时精细控制

  // 获取文字容器
  const textContainer = document.getElementById('easter-egg-text-container');
  if (!textContainer) return;

  // 清空阶段2的文字
  textContainer.innerHTML = '';

  // 背景定格在当前图片（不淡出，不清空）
  // 文字叠加在背景图片之上

  // 打字机效果函数（阶段3使用更慢的速度）
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

  // 逐行显示文字（打字机效果）
  const words = EASTER_EGG_CONFIG.finalWords;

  async function showLine(index) {
    if (index >= words.length) {
      // 所有文字显示完毕，进入阶段4
      setTimeout(() => {
        runStage4();
      }, 2000);
      return;
    }

    // ===== 音乐音量精细控制 =====
    if (index === 1) {
      // 第二句开始显示时：音量从 40% 升到 55%（0.9秒过渡）
      if (typeof setVolumeDirect === 'function') {
        setVolumeDirect(0.55, 900);
      }
    }
    // 第一句（index === 0）：保持 40%，不操作
    // 第三句的音量提升在打字机完成后处理

    const lineEl = document.createElement('div');
    lineEl.className = 'easter-egg-text-line';
    lineEl.classList.add('visible'); // 打字机效果不需要淡入动画
    textContainer.appendChild(lineEl);

    // 根据不同的行使用不同的打字速度
    // 第一句：慢速（300ms/字）
    // 第二句：稍快（250ms/字）
    // 第三句：最慢（350ms/字，最温柔）
    let speed = 300;
    if (index === 1) speed = 250;
    if (index === 2) speed = 350;

    // 打字机效果逐字显示
    await typeWriter(lineEl, words[index], speed);

    // 如果是第三句（生日快乐，我的爱人。），打字完成后添加跳跃效果，并提升音量
    if (index === 2) {
      // 音量从 55% 升到 65%（1秒过渡）
      if (typeof setVolumeDirect === 'function') {
        setVolumeDirect(0.65, 1000);
      }

      // 将文字拆分成单个字的 span
      const text = lineEl.textContent;
      lineEl.textContent = '';
      const chars = text.split('');
      chars.forEach((char, i) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'jump-char';
        span.style.animationDelay = `${i * 0.15}s`; // 每个字延迟 150ms
        lineEl.appendChild(span);
      });
    }

    // 下一行的延迟
    const nextDelay = index === 0 ? EASTER_EGG_CONFIG.line1Delay : EASTER_EGG_CONFIG.line2Delay;
    setTimeout(() => {
      showLine(index + 1);
    }, nextDelay);
  }

  showLine(0);
}

/**
 * 🎁 阶段 4：收尾 & 记忆锚点
 */
function runStage4() {
  console.log('[EasterEgg] 阶段4：收尾按钮');

  // 显示"继续写下去"按钮
  const continueBtn = document.getElementById('easter-continue-btn');
  if (continueBtn) {
    continueBtn.classList.add('visible');
  }

  // 绑定按钮事件
  continueBtn?.addEventListener('click', handleContinueClick);

  // 显示"回到时间轴"按钮
  showBackToTimelineButton();
}

/**
 * 处理"继续写下去"按钮点击
 */
function handleContinueClick() {
  console.log('[EasterEgg] 点击继续写下去');

  // 1. 停止背景轮播（如果还在运行）
  if (backgroundSlideshowInterval) {
    clearInterval(backgroundSlideshowInterval);
    backgroundSlideshowInterval = null;
  }

  // 2. 将时间轴切换到未来节点模式（保持虚化）
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.remove('easter-egg-stage1');
    timelineContainer.classList.add('future-node-mode');
  }

  // 3. 恢复音乐到彩蛋结束音量
  if (typeof setSceneVolume === 'function') {
    setSceneVolume('easterEggEnd', 1500);
  }

  // 4. 将 Overlay 改为纯色背景（去掉图片，保持虚化氛围）
  const backgroundEl = document.getElementById('easter-egg-background');
  if (backgroundEl) {
    backgroundEl.style.opacity = '0';
    backgroundEl.style.transition = 'opacity 1s ease-out';
  }

  // 隐藏文字容器和按钮
  const textContainer = document.getElementById('easter-egg-text-container');
  const continueBtn = document.getElementById('easter-continue-btn');
  if (textContainer) textContainer.style.display = 'none';
  if (continueBtn) continueBtn.style.display = 'none';

  // 5. 解锁滚动
  unlockScroll();

  // 6. 添加未来节点
  setTimeout(() => addFutureNode(), 300);

  // 7. 未来节点出现后，淡出 Overlay
  setTimeout(() => {
    if (easterEggOverlay) {
      easterEggOverlay.classList.remove('visible');
      setTimeout(() => {
        if (easterEggOverlay) {
          easterEggOverlay.remove();
          easterEggOverlay = null;
        }
        // 保持时间轴的虚化效果（不移除 future-node-mode）
        // 故事还在继续，氛围保持...
      }, 1000);
    }
  }, 2000);
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
  newNode.className = 'timeline-node future-node future-node-enter';
  newNode.innerHTML = `
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
  `;

  container.appendChild(newNode);

  // 触发进入动画
  setTimeout(() => {
    newNode.classList.add('future-node-visible');
  }, 100);

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
    timelineContainer.classList.remove('easter-egg-stage1');
  }

  // 解锁滚动
  unlockScroll();

  console.log('[EasterEgg] 已重置彩蛋状态');
}

/**
 * 显示"回到时间轴"按钮
 */
function showBackToTimelineButton() {
  // 检查按钮是否已存在
  let backBtn = document.getElementById('back-to-timeline-btn');

  if (!backBtn) {
    // 创建按钮
    backBtn = document.createElement('button');
    backBtn.id = 'back-to-timeline-btn';
    backBtn.className = 'back-to-timeline-btn';
    backBtn.innerHTML = '<span class="btn-icon">↩</span><span class="btn-text">回到时间轴</span>';

    // 添加到 music-controller 容器中
    const musicController = document.querySelector('.music-controller');
    if (musicController) {
      musicController.insertBefore(backBtn, musicController.firstChild);
    }

    // 绑定点击事件
    backBtn.addEventListener('click', handleBackToTimelineClick);
  }

  // 延迟显示，确保动画流畅
  setTimeout(() => {
    backBtn.classList.add('visible');
  }, 500);
}

/**
 * 处理"回到时间轴"按钮点击
 */
function handleBackToTimelineClick() {
  console.log('[EasterEgg] 点击回到时间轴');

  // 1. 停止背景轮播（如果还在运行）
  if (backgroundSlideshowInterval) {
    clearInterval(backgroundSlideshowInterval);
    backgroundSlideshowInterval = null;
  }

  // 2. 恢复音乐到普通时间轴音量
  if (typeof setSceneVolume === 'function') {
    setSceneVolume('normal', 1500);
  }

  // 3. 恢复时间轴样式
  const timelineContainer = document.querySelector('.timeline-container');
  if (timelineContainer) {
    timelineContainer.classList.remove('easter-egg-stage1');
    timelineContainer.classList.remove('future-node-mode');
  }

  // 4. 移除覆盖层
  if (easterEggOverlay) {
    easterEggOverlay.classList.remove('visible');
    setTimeout(() => {
      if (easterEggOverlay) {
        easterEggOverlay.remove();
        easterEggOverlay = null;
      }
    }, 500);
  }

  // 5. 隐藏"回到时间轴"按钮
  const backBtn = document.getElementById('back-to-timeline-btn');
  if (backBtn) {
    backBtn.classList.remove('visible');
    setTimeout(() => {
      if (backBtn && backBtn.parentNode) {
        backBtn.remove();
      }
    }, 300);
  }

  // 6. 解锁滚动
  unlockScroll();

  // 7. 滚动到时间轴顶部
  const timelineNodes = document.getElementById('timeline-nodes');
  if (timelineNodes) {
    timelineNodes.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 将配置暴露到全局，方便编辑
if (typeof window !== 'undefined') {
  window.EASTER_EGG_CONFIG = EASTER_EGG_CONFIG;
  window.resetEasterEgg = resetEasterEgg;
}
