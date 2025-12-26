/**
 * Scroll Observer
 * Handles intersection observer for scroll animations
 */

let scrollObserver = null;

/**
 * Initialize scroll animations
 * 支持独立内容块动画
 */
function initScrollAnimations() {
  // Create observer if it doesn't exist
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
        }
      });
    }, observerOptions);
  }

  // Observe all timeline nodes, standalone blocks, and ending
  const nodes = document.querySelectorAll('.timeline-node, .standalone-block, .timeline-ending');
  nodes.forEach(node => {
    scrollObserver.observe(node);
  });
}

/**
 * Disconnect scroll observer
 */
function disconnectScrollObserver() {
  if (scrollObserver) {
    scrollObserver.disconnect();
  }
}
