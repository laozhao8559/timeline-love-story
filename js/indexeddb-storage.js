/**
 * IndexedDB 图片存储模块
 * 用于解决 localStorage 容量限制问题，支持大量图片持久化存储
 */

// ========== 数据库配置 ==========
const DB_CONFIG = {
  dbName: 'timeline_love_story_db',
  version: 1,
  storeName: 'images'
};

// ========== 数据库初始化 ==========

/**
 * 初始化 IndexedDB 数据库
 * @returns {Promise<IDBDatabase>}
 */
async function initImageDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.dbName, DB_CONFIG.version);

    request.onerror = () => {
      console.error('[IndexedDB] 打开数据库失败:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[IndexedDB] 数据库打开成功');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log('[IndexedDB] 数据库升级中...');
      const db = event.target.result;

      if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
        const objectStore = db.createObjectStore(DB_CONFIG.storeName, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('type', 'type', { unique: false });
        console.log('[IndexedDB] 创建 Object Store: images');
      }
    };
  });
}

// ========== 图片存储 ==========

/**
 * 保存图片到 IndexedDB
 * @param {File} file - 图片文件
 * @param {string} type - 'timeline' 或 'standalone'
 * @returns {Promise<string>} - 返回图片 ID
 */
async function saveImageToIndexedDB(file, type = 'timeline') {
  try {
    // 转换为 base64
    const base64Data = await fileToBase64(file);

    // 生成唯一 ID
    const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // 构建记录
    const record = {
      id: id,
      base64Data: base64Data,
      timestamp: Date.now(),
      type: type,
      originalName: file.name,
      size: file.size
    };

    // 存入 IndexedDB
    const db = await initImageDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
      const objectStore = transaction.objectStore(DB_CONFIG.storeName);
      const request = objectStore.add(record);

      request.onsuccess = () => {
        console.log('[IndexedDB] 图片保存成功:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('[IndexedDB] 图片保存失败:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] 保存图片异常:', error);
    throw error;
  }
}

/**
 * 从 IndexedDB 读取图片
 * @param {string} imageId - 图片 ID
 * @returns {Promise<string>} - 返回 base64 数据
 */
async function loadImageFromIndexedDB(imageId) {
  try {
    const db = await initImageDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readonly');
      const objectStore = transaction.objectStore(DB_CONFIG.storeName);
      const request = objectStore.get(imageId);

      request.onsuccess = () => {
        if (request.result) {
          console.log('[IndexedDB] 图片读取成功:', imageId);
          resolve(request.result.base64Data);
        } else {
          console.error('[IndexedDB] 图片不存在:', imageId);
          reject(new Error('Image not found: ' + imageId));
        }
      };

      request.onerror = () => {
        console.error('[IndexedDB] 图片读取失败:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] 读取图片异常:', error);
    throw error;
  }
}

/**
 * 删除图片
 * @param {string} imageId
 * @returns {Promise<void>}
 */
async function deleteImageFromIndexedDB(imageId) {
  try {
    const db = await initImageDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
      const objectStore = transaction.objectStore(DB_CONFIG.storeName);
      const request = objectStore.delete(imageId);

      request.onsuccess = () => {
        console.log('[IndexedDB] 图片删除成功:', imageId);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] 图片删除失败:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] 删除图片异常:', error);
    throw error;
  }
}

// ========== 存储管理 ==========

/**
 * 获取存储使用情况
 * @returns {Promise<{used: number, count: number}>}
 */
async function getIndexedDBUsage() {
  try {
    const db = await initImageDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readonly');
      const objectStore = transaction.objectStore(DB_CONFIG.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const records = request.result;
        const totalSize = records.reduce((sum, record) => sum + record.size, 0);
        console.log('[IndexedDB] 存储使用情况:', {
          count: records.length,
          totalSize: totalSize
        });
        resolve({
          used: totalSize,
          count: records.length
        });
      };

      request.onerror = () => {
        console.error('[IndexedDB] 获取存储信息失败:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] 获取存储信息异常:', error);
    return { used: 0, count: 0 };
  }
}

/**
 * 清理所有图片（慎用）
 * @returns {Promise<number>} - 返回删除数量
 */
async function clearAllImages() {
  try {
    const db = await initImageDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
      const objectStore = transaction.objectStore(DB_CONFIG.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('[IndexedDB] 已清空所有图片');
        resolve(0);
      };

      request.onerror = () => {
        console.error('[IndexedDB] 清空失败:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] 清空异常:', error);
    throw error;
  }
}

// ========== 工具函数 ==========

/**
 * 文件转 base64
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * 检查是否为 IndexedDB 引用
 * @param {string} src
 * @returns {boolean}
 */
function isIndexedDBRef(src) {
  return src && typeof src === 'string' && src.startsWith('indexeddb:');
}

/**
 * 从 IndexedDB 引用中提取 ID
 * @param {string} src
 * @returns {string}
 */
function extractImageId(src) {
  if (!src) return '';
  return src.replace('indexeddb:', '');
}

/**
 * 检查 IndexedDB 是否可用
 * @returns {boolean}
 */
function isIndexedDBAvailable() {
  try {
    return 'indexedDB' in window && window.indexedDB !== null;
  } catch (e) {
    console.error('[IndexedDB] 检测失败:', e);
    return false;
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ========== 初始化检查 ==========

/**
 * 应用启动时初始化数据库
 */
async function initializeIndexedDB() {
  if (isIndexedDBAvailable()) {
    try {
      await initImageDatabase();
      console.log('[IndexedDB] 初始化成功');

      // 显示存储使用情况
      const usage = await getIndexedDBUsage();
      console.log('[IndexedDB] 当前存储:', formatFileSize(usage.used), usage.count, '张图片');
    } catch (error) {
      console.error('[IndexedDB] 初始化失败:', error);
    }
  } else {
    console.warn('[IndexedDB] 浏览器不支持 IndexedDB');
  }
}

// 页面加载时自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeIndexedDB);
} else {
  initializeIndexedDB();
}
