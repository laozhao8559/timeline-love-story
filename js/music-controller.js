/**
 * 音乐控制器
 * 统一管理音乐播放、音量渐变、场景音量调节
 *
 * 行为：
 * - 页面加载自动播放（音量为0，静音播放）
 * - 按钮只控制音量开关（🎵 关闭 🔊 开启）
 * - 不是暂停/播放，音乐一直播放
 */

// ========== 音乐状态 ==========
// 使用 var 声明全局变量（允许重复声明）
var bgMusic = null;
var isMusicPlaying = false;
var isMuted = true; // 默认静音
var currentVolume = 0;
var targetVolume = 0;
var volumeFadeInterval = null;

// ========== 场景音量配置 ==========
const SCENE_VOLUMES = {
  normal: 0.50,        // 普通时间轴滚动
  daughter: 0.30,      // 女儿出生节点
  easterEggStart: 0.40, // 彩蛋开始
  finalWords: 0.65,    // 终极文字
  easterEggEnd: 0.45,  // 彩蛋结束
  unmuted: 0.60        // 用户开启声音时的音量
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
  bgMusic.volume = 0; // 初始音量为0（静音播放）
  bgMusic.preload = 'auto';
  bgMusic.muted = true; // 先设置为静音，绕过自动播放限制

  // 绑定切换按钮
  const toggleBtn = document.getElementById('music-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleMusic);
  }

  // 初始化UI状态
  updateMusicUI();

  // 等待音频元数据加载后尝试播放
  bgMusic.addEventListener('canplaythrough', () => {
    console.log('[Music] 音频加载完成，尝试播放');
    attemptAutoplay();
  }, { once: true });

  // 如果已经加载完成，直接尝试播放
  if (bgMusic.readyState >= 4) {
    attemptAutoplay();
  }

  console.log('[Music] 音乐控制器已初始化，文件:', musicSrc);
}

/**
 * 尝试自动播放
 * 使用 muted 属性绕过浏览器限制，播放后立即取消静音
 */
function attemptAutoplay() {
  if (!bgMusic) return;

  const playPromise = bgMusic.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      // 播放成功，取消静音但保持音量为0
      bgMusic.muted = false;
      isMusicPlaying = true;
      console.log('[Music] 自动播放成功（静音）');
    }).catch(err => {
      console.log('[Music] 自动播放被阻止，等待用户交互');

      // 监听第一次用户交互
      const handleFirstInteraction = () => {
        bgMusic.muted = false;
        bgMusic.play().then(() => {
          isMusicPlaying = true;
          console.log('[Music] 用户交互后播放成功（静音）');
        }).catch(e => {
          console.warn('[Music] 播放失败:', e);
        });

        // 移除监听
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };

      // 监听各种用户交互
      document.addEventListener('click', handleFirstInteraction, { once: true });
      document.addEventListener('touchstart', handleFirstInteraction, { once: true });
      document.addEventListener('keydown', handleFirstInteraction, { once: true });
    });
  }
}

/**
 * 切换声音开关
 * 🎵 → 🔊 (渐入到当前场景音量)
 * 🔊 → 🎵 (渐出到0)
 * 音乐一直在播放，不暂停
 */
function toggleMusic() {
  if (!bgMusic) return;

  if (isMuted) {
    // 开启声音：渐入到当前场景音量
    isMuted = false;
    const targetVol = SCENE_VOLUMES[currentScene] || SCENE_VOLUMES.normal;
    console.log('[Music] 开启声音，渐入到', targetVol);
    fadeInMusic(targetVol, 1000);
  } else {
    // 关闭声音：渐出到0
    isMuted = true;
    console.log('[Music] 关闭声音，渐出');
    fadeOutMusic(800);
  }

  updateMusicUI();
}

/**
 * 开启声音（渐入）- 只改变音量，音乐一直在播放
 */
function unmuteMusic() {
  if (!bgMusic) return;

  isMuted = false;
  const targetVol = SCENE_VOLUMES[currentScene] || SCENE_VOLUMES.normal;
  console.log('[Music] 开启声音，渐入到', targetVol);
  fadeInMusic(targetVol, 1000);
  updateMusicUI();
}

/**
 * 关闭声音（渐出）- 只改变音量，音乐一直在播放
 */
function muteMusic() {
  if (!bgMusic) return;

  isMuted = true;
  console.log('[Music] 关闭声音，渐出');
  fadeOutMusic(800);
  updateMusicUI();
}

/**
 * 音乐渐入效果（只调节音量，不改变播放状态）
 * @param {number} targetVol - 目标音量 (0-1)
 * @param {number} duration - 渐入时长（毫秒）
 */
function fadeInMusic(targetVol, duration = 1000) {
  if (!bgMusic) return;

  targetVolume = Math.min(targetVol, 1);
  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  // 清除之前的渐变
  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(`[Music] 渐入: ${startVolume.toFixed(2)} → ${targetVolume.toFixed(2)} (${duration}ms)`);

  volumeFadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用 easeOutCubic 缓动
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    currentVolume = startVolume + (targetVolume - startVolume) * easedProgress;

    bgMusic.volume = currentVolume;

    if (progress >= 1) {
      clearInterval(volumeFadeInterval);
      volumeFadeInterval = null;
    }
  }, 16); // 60fps
}

/**
 * 音乐渐出效果（只调节音量，不暂停播放）
 * @param {number} duration - 渐出时长（毫秒）
 * @param {Function} callback - 完成后的回调
 */
function fadeOutMusic(duration = 800, callback) {
  if (!bgMusic) return;

  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(`[Music] 渐出: ${startVolume.toFixed(2)} → 0 (${duration}ms)`);

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
 * 如果当前静音，只记录目标场景，不改变音量
 * @param {string} scene - 场景名称
 * @param {number} duration - 过渡时长（毫秒）
 */
function setSceneVolume(scene, duration = 1000) {
  if (!bgMusic) return;

  // 更新当前场景
  currentScene = scene;

  // 如果静音状态，只记录场景，不改变音量
  if (isMuted) {
    console.log(`[Music] 静音中，仅更新场景: ${scene}`);
    return;
  }

  const targetVol = SCENE_VOLUMES[scene] || SCENE_VOLUMES.normal;
  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(`[Music] 场景音量: ${startVolume.toFixed(2)} → ${targetVol.toFixed(2)} (${scene})`);

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
 * 直接设置音量（绕过场景配置，用于精细控制）
 * @param {number} volume - 目标音量 (0-1)
 * @param {number} duration - 过渡时长（毫秒）
 */
function setVolumeDirect(volume, duration = 1000) {
  if (!bgMusic) return;

  const targetVol = Math.min(Math.max(volume, 0), 1);
  const startVolume = bgMusic.volume;
  const startTime = Date.now();

  if (volumeFadeInterval) {
    clearInterval(volumeFadeInterval);
  }

  console.log(`[Music] 直接音量: ${startVolume.toFixed(2)} → ${targetVol.toFixed(2)} (${duration}ms)`);

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

  if (isMuted) {
    // 静音状态：显示🎵，灰色
    toggleBtn.classList.remove('playing');
    icon.textContent = '🎵';
  } else {
    // 播放状态：显示🔊，动画
    toggleBtn.classList.add('playing');
    icon.textContent = '🔊';
  }
}

// ========== 导出全局函数（兼容旧代码） ==========
if (typeof window !== 'undefined') {
  window.toggleMusic = toggleMusic;
  window.setSceneVolume = setSceneVolume;
  window.setVolumeDirect = setVolumeDirect;
  window.initDaughterNodeVolumeControl = initDaughterNodeVolumeControl;
  window.muteMusic = muteMusic;
  window.unmuteMusic = unmuteMusic;
  window.updateMusicUI = updateMusicUI;
}

