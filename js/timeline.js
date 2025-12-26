/**
 * Timeline Renderer
 * Handles rendering of timeline nodes and media elements
 */

/**
 * Initialize the timeline
 */
function initTimeline() {
  const container = document.getElementById('timeline-nodes');
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Render all timeline nodes
  timelineData.forEach((node, index) => {
    const nodeEl = createTimelineNode(node, index);
    container.appendChild(nodeEl);
  });

  // Render the ending
  const endingEl = createTimelineEnding();
  container.appendChild(endingEl);
}

/**
 * Create a timeline node element
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

  // Create media elements (if any)
  if (node.media && node.media.length > 0) {
    const mediaEl = createMediaContainer(node.media);
    contentEl.appendChild(mediaEl);
  }

  // Create title
  const titleEl = document.createElement('h3');
  titleEl.className = 'timeline-title';
  titleEl.textContent = node.title;
  contentEl.appendChild(titleEl);

  // Create description
  const descEl = document.createElement('p');
  descEl.className = 'timeline-description';
  descEl.textContent = node.description;
  contentEl.appendChild(descEl);

  // Assemble the node
  article.appendChild(dateEl);
  article.appendChild(contentEl);

  return article;
}

/**
 * Create media container with images and videos
 */
function createMediaContainer(mediaItems) {
  const container = document.createElement('div');
  container.className = 'timeline-media';

  mediaItems.forEach(media => {
    let mediaEl;

    if (media.type === 'image') {
      mediaEl = createImageElement(media);
    } else if (media.type === 'video') {
      mediaEl = createVideoElement(media);
    }

    if (mediaEl) {
      container.appendChild(mediaEl);
    }
  });

  return container;
}

/**
 * Create an image element with click handler
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
  video.playsInline = true;
  video.webkit-playsinline = true;
  video.x5VideoPlayerType = 'h5';
  video.x5VideoPlayerFullscreen = 'false';
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
