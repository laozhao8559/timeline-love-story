/**
 * Scroll Observer
 * Handles intersection observer for scroll animations
 */

let scrollObserver = null;

/**
 * Initialize scroll animations
 */
function initScrollAnimations() {
  // Create observer if it doesn't exist
  if (!scrollObserver) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);
  }

  // Observe all timeline nodes and ending
  const nodes = document.querySelectorAll('.timeline-node, .timeline-ending');
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
