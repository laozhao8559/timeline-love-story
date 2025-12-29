/**
 * Scroll Observer
 * Handles intersection observer for scroll animations
 * 媒体延迟加载管理器：限制同屏并发加载数量，防止 iOS Safari 资源争抢
 */

let scrollObserver = null;
let blockObserver = null;
let mediaLoadObserver = null;

// 媒体加载队列管理
const MEDIA_LOAD_CONFIG = {
  maxConcurrentLoads: 5,  // 最大并发加载数量（iOS Safari 安全值）
  loadingCount: 0,        // 当前正在加载的媒体数量
  loadQueue: []           // 等待加载的媒体队列
};

/**
 * Initialize scroll animations
 * 支持独立内容块动画
 */
function initScrollAnimations() {
  // Create observer for timeline nodes if it doesn't exist
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

          // 节点进入视口后，开始观察其内部的内容块
          const contentBlocks = entry.target.querySelectorAll('.timeline-text-block, .timeline-image-container, .standalone-media, .video-wrapper');
          contentBlocks.forEach((block, index) => {
            // 添加延迟，让内容块依次出现
            setTimeout(() => {
              block.classList.add('visible');
            }, index * 150); // 每个内容块延迟 150ms
          });
        }
      });
    }, observerOptions);
  }

  // 初始化媒体延迟加载观察器
  initMediaLazyLoader();

  // Observe all timeline nodes, standalone blocks, and ending
  const nodes = document.querySelectorAll('.timeline-node, .standalone-block, .timeline-ending');
  nodes.forEach(node => {
    scrollObserver.observe(node);
  });

  console.log('[initScrollAnimations] 已观察节点数:', nodes.length);
}

/**
 * 初始化媒体延迟加载器
 * 限制同屏并发加载数量，防止 iOS Safari 资源争抢
 */
function initMediaLazyLoader() {
  if (mediaLoadObserver) return;

  const observerOptions = {
    root: null,
    rootMargin: '50px',  // 提前 50px 开始加载
    threshold: 0
  };

  mediaLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 媒体进入视口，加入加载队列
        queueMediaLoad(entry.target);
        // 停止观察已加载的媒体
        mediaLoadObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 观察所有带有 data-src 的媒体元素
  const mediaElements = document.querySelectorAll('img[data-src], video[data-src]');
  mediaElements.forEach(el => {
    mediaLoadObserver.observe(el);
  });

  console.log('[initMediaLazyLoader] 已观察媒体数量:', mediaElements.length);
}

/**
 * 将媒体加入加载队列，控制并发数量
 */
function queueMediaLoad(mediaElement) {
  // 检查是否已经加载过
  if (mediaElement.dataset.loaded === 'true') {
    return;
  }

  MEDIA_LOAD_CONFIG.loadQueue.push(() => loadMedia(mediaElement));
  processLoadQueue();
}

/**
 * 处理加载队列
 */
function processLoadQueue() {
  // 如果已达到最大并发数，等待
  if (MEDIA_LOAD_CONFIG.loadingCount >= MEDIA_LOAD_CONFIG.maxConcurrentLoads) {
    return;
  }

  // 从队列中取出任务
  const loadTask = MEDIA_LOAD_CONFIG.loadQueue.shift();
  if (loadTask) {
    MEDIA_LOAD_CONFIG.loadingCount++;
    loadTask().finally(() => {
      MEDIA_LOAD_CONFIG.loadingCount--;
      // 继续处理队列
      processLoadQueue();
    });
  }
}

/**
 * 加载媒体资源
 */
function loadMedia(mediaElement) {
  return new Promise((resolve, reject) => {
    const src = mediaElement.dataset.src;
    if (!src) {
      resolve();
      return;
    }

    console.log('[loadMedia] 开始加载:', src);

    // 设置真正的 src
    mediaElement.src = src;
    mediaElement.dataset.loaded = 'true';

    // 监听加载完成
    const onLoad = () => {
      mediaElement.removeEventListener('load', onLoad);
      mediaElement.removeEventListener('error', onError);
      console.log('[loadMedia] 加载成功:', src);
      resolve();
    };

    const onError = () => {
      mediaElement.removeEventListener('load', onLoad);
      mediaElement.removeEventListener('error', onError);
      console.error('[loadMedia] 加载失败:', src);
      reject(new Error('Media load failed'));
    };

    mediaElement.addEventListener('load', onLoad);
    mediaElement.addEventListener('error', onError);

    // 如果已经加载完成（缓存情况）
    if (mediaElement.complete && mediaElement.naturalWidth > 0) {
      onLoad();
    }
  });
}

/**
 * Disconnect scroll observer
 */
function disconnectScrollObserver() {
  if (scrollObserver) {
    scrollObserver.disconnect();
  }
  if (blockObserver) {
    blockObserver.disconnect();
  }
  if (mediaLoadObserver) {
    mediaLoadObserver.disconnect();
  }
}
