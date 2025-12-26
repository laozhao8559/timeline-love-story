/**
 * Scroll Observer
 * Handles intersection observer for scroll animations
 */

let scrollObserver = null;
let blockObserver = null;

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
          const contentBlocks = entry.target.querySelectorAll('.timeline-text-block, .timeline-image, .video-wrapper');
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

  // Observe all timeline nodes, standalone blocks, and ending
  const nodes = document.querySelectorAll('.timeline-node, .standalone-block, .timeline-ending');
  nodes.forEach(node => {
    scrollObserver.observe(node);
  });

  console.log('[initScrollAnimations] 已观察节点数:', nodes.length);
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
}
