/**
 * 图片预置数据
 *
 * 此文件存储默认的图片数据（Base64 格式）
 * 当用户没有上传图片时，使用这些预置图片
 *
 * 生成方式：在编辑器中点击「固化图片到代码」按钮
 *
 * 优先级：用户上传 > 预置图片 > 默认占位符
 */

const PRELOADED_IMAGES = {
  // 求婚页头像
  avatars: {
    center: null,    // 主角头像
    topLeft: null,   // 左上角头像
    topRight: null,  // 右上角头像
    bottomLeft: null,  // 左下角头像
    bottomRight: null  // 右下角头像
  },

  // 时间轴图片（key 格式: node_{节点索引}_img_{内容索引}）
  timeline: {
    // 示例：
    // "node_0_img_0": "data:image/jpeg;base64,...",
    // "node_1_img_0": "data:image/jpeg;base64,...",
  }
};

// 将预置数据暴露到全局
if (typeof window !== 'undefined') {
  window.PRELOADED_IMAGES = PRELOADED_IMAGES;
}
