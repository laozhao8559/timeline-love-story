/**
 * 音乐控制器
 * 统一管理音乐播放、音量渐变、场景音量调节
 */

// ========== 音乐状态 ==========
let bgMusic = null;
let isMusicPlaying = false;
let currentVolume = 0;
let targetVolume = 0;
let volumeFadeInterval = null;
let userClosedMusic = false; // 记住用户是否主动关闭

// ========== 场景音量配置 ==========
const SCENE_VOLUMES = {
  normal: 0.50,        // 普通时间轴滚动
  daughter: 0.30,      // 女儿出生节点
  easterEggStart: 0.40, // 彩蛋开始
  finalWords: 0.65,    // 终极文字
  easterEggEnd: 0.45,  // 彩蛋结束
  userPlay: 0.60       // 用户首次点击播放
};

// 当前场景
let currentScene = 'normal';

/**
 * 初始化音乐
 * @param {string} musicSrc - 音乐文件路径
 */
function initMusicController(musicSrc) {
  if (!musicSrc) {
    console.warn('[Music] 没有提供音乐文件');
    return;
  }

  bgMusic = document.createElement('audio');
  bgMusic.src = musicSrc;
  bgMusic.loop = true;
  bgMusic.volume = 0; // 初始静音
  bgMusic.preload = 'auto';

  // 监听播放状态
  bgMusic.addEventListener('play', () => {
    isMusicPlaying = true;
    updateMusicUI();
  });

  bgMusic.addEventListener('pause', () => {
    isMusicPlaying = false;
    updateMusicUI();
  });

  // 绑定切换按钮
  const toggleBtn = document.getElementById('music-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleMusic);
  }

  // 初始化UI状态
  updateMusicUI();

  console.log('[Music] 音乐控制器已初始化');
}

/**
 * 切换音乐播放/暂停
 */
function toggleMusic() {
  if (!bgMusic) return;

  if (isMusicPlaying) {
    // 用户主动关闭
    pauseMusic();
    userClosedMusic = true;
    console.log('[Music] 用户主动关闭音乐');
  } else {
    // 用户点击播放
    if (userClosedMusic) {
      // 之前被用户关闭过，需要明确再次播放
      playMusic();
      userClosedMusic = false;
    } else {
      // 首次播放：渐入效果
      fadeInMusic(SCENE_VOLUMES.userPlay, 1500);
    }
  }
}

/**
 * 播放音乐（立即）
 */
function playMusic() {
  if (!bgMusic) return;
  bgMusic.play().catch(err => {
    console.warn('[Music] 播放失败:', err);
  });
}

/**
 * 暂停音乐
 */
function pauseMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
}

/**
 * 音乐渐入效果
 * @param {number} targetVol - 目标音量 (0-1)
 * @param {number} duration - 渐入时长（毫秒）
 */
function fadeInMusic(targetVol, duration = 1500) {
  if (!bgMusic) return;

  targetVolume = Math.min(targetVol, 1);
  currentVolume = bgMusic.volume;
  const startTime = Date.now();
  const startVolume = currentVolume;

  // 清除之前的渐变
  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(`[Music] 渐入: ${startVolume} → ${targetVolume} (${duration}ms)`);

  volumeFadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用 easeOutCubic 缓动
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    currentVolume = startVolume + (targetVolume - startVolume) * easedProgress;

    bgMusic.volume = currentVolume;

    // 开始播放（如果是首次）
    if (progress === 0 && !isMusicPlaying) {
      bgMusic.play().catch(err => console.warn('[Music] 播放失败:', err));
    }

    if (progress >= 1) {
      clearInterval(volumeFadeInterval);
      volumeFadeInterval = null;
    }
  }, 16); // 60fps
}

/**
 * 音乐渐出效果
 * @param {number} duration - 渐出时长（毫秒）
 * @param {Function} callback - 完成后的回调
 */
function fadeOutMusic(duration = 1000, callback) {
  if (!bgMusic) return;

  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(`[Music] 渐出: ${startVolume} → 0 (${duration}ms)`);

  volumeFadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    currentVolume = startVolume * (1 - progress);
    bgMusic.volume = currentVolume;

    if (progress >= 1) {
      clearInterval(volumeFadeInterval);
      volumeFadeInterval = null;
      if (callback) callback();
    }
  }, 16);
}

/**
 * 设置场景音量（平滑过渡）
 * @param {string} scene - 场景名称
 * @param {number} duration - 过渡时长（毫秒）
 */
function setSceneVolume(scene, duration = 1000) {
  if (!bgMusic || !isMusicPlaying) return;

  const targetVol = SCENE_VOLUMES[scene] || SCENE_VOLUMES.normal;
  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(`[Music] 场景音量: ${currentScene}(${startVolume.toFixed(2)}) → ${scene}(${targetVol.toFixed(2)})`);
  currentScene = scene;

  volumeFadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // easeInOut
    const easedProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    currentVolume = startVolume + (targetVol - startVolume) * easedProgress;
    bgMusic.volume = currentVolume;

    if (progress >= 1) {
      clearInterval(volumeFadeInterval);
      volumeFadeInterval = null;
    }
  }, 16);
}

/**
 * 检测"女儿出生"节点并降低音量
 */
function initDaughterNodeVolumeControl() {
  // 查找标题包含"出生"的节点
  const nodes = document.querySelectorAll('.timeline-node');

  nodes.forEach(node => {
    const title = node.querySelector('.timeline-title');
    if (title && title.textContent.includes('出生')) {
      console.log('[Music] 检测到"女儿出生"节点');

      // 创建 observer 检测节点进入视口
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            console.log('[Music] 女儿出生节点进入视口，降低音量');
            setSceneVolume('daughter', 1500);
          } else {
            // 离开后恢复正常
            if (currentScene === 'daughter') {
              console.log('[Music] 离开女儿节点，恢复正常音量');
              setSceneVolume('normal', 1500);
            }
          }
        });
      }, { threshold: 0.6 });

      observer.observe(node);
    }
  });
}

/**
 * 更新音乐UI状态
 */
function updateMusicUI() {
  const toggleBtn = document.getElementById('music-toggle');
  const icon = toggleBtn?.querySelector('.music-icon');

  if (!toggleBtn || !icon) return;

  if (isMusicPlaying) {
    toggleBtn.classList.add('playing');
    icon.textContent = '🔊';
  } else {
    toggleBtn.classList.remove('playing');
    icon.textContent = '🎵';
  }
}

// ========== 导出全局变量（兼容旧代码） ==========
if (typeof window !== 'undefined') {
  window.bgMusic = bgMusic;
  window.isMusicPlaying = isMusicPlaying;
  window.toggleMusic = toggleMusic;
  window.setSceneVolume = setSceneVolume;
  window.initDaughterNodeVolumeControl = initDaughterNodeVolumeControl;
}
