/**
 * Main Entry Point
 * Coordinates page transitions and initialization
 */

// Page elements
const pages = {
  loading: document.getElementById('loading-page'),
  choice: document.getElementById('choice-page'),
  confirm: document.getElementById('confirm-page'),
  timeline: document.getElementById('timeline-page')
};

let countdownTimer = null;

/**
 * Transition to a specific page
 */
function transitionToPage(pageName) {
  const pageKey = pageName.replace('-page', '');
  const targetPage = pages[pageKey];

  if (!targetPage) {
    console.error(`Page not found: ${pageName}`);
    return;
  }

  // Clear any running countdown
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  // Hide all pages
  Object.values(pages).forEach(page => {
    if (page && page.classList.contains('active')) {
      page.classList.remove('active');
      setTimeout(() => {
        if (!page.classList.contains('active')) {
          page.classList.add('hidden');
        }
      }, 500);
    }
  });

  // Show target page
  targetPage.classList.remove('hidden');
  targetPage.offsetHeight; // Force reflow
  targetPage.classList.add('active');

  // Page-specific initialization
  handlePageInit(pageKey);
}

/**
 * Handle page-specific initialization
 */
function handlePageInit(pageKey) {
  switch (pageKey) {
    case 'timeline':
      initTimeline();
      initScrollAnimations();
      initMusic();
      break;
    case 'confirm':
      initCountdown();
      break;
  }
}

/**
 * Initialize countdown on confirm page
 */
function initCountdown() {
  const countdownEl = document.querySelector('.countdown');
  if (!countdownEl) return;

  let count = 3;

  countdownTimer = setInterval(() => {
    count--;
    countdownEl.textContent = count;

    if (count <= 0) {
      clearInterval(countdownTimer);
      transitionToPage('timeline');
    }
  }, 1000);
}

/**
 * Initialize the app
 */
function init() {
  // Initialize choice buttons
  initChoiceButtons();

  // Start with loading page, then transition to choice
  setTimeout(() => {
    transitionToPage('choice');
  }, 1500);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
