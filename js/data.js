/**
 * Timeline Data
 * 新数据结构：节点内支持多个内容块（文字/图片/视频可自由排序）
 *
 * 每个节点包含：
 * - id: 唯一标识
 * - date: 日期
 * - title: 标题（可选）
 * - isHighlight: 是否高亮
 * - contents: 内容块数组（type: 'text'|'image'|'video'）
 */

const timelineData = [
  {
    id: 1,
    date: '2021.12.01',
    title: '我们加了微信',
    isHighlight: false,
    contents: []  // 空白画布 - 不预设任何内容
  },

  {
    id: 2,
    date: '2022.03.30',
    title: '领结婚证',
    isHighlight: true,
    contents: []
  },

  {
    id: 3,
    date: '2022.05.02',
    title: '婚礼',
    isHighlight: true,
    contents: []
  },

  {
    id: 4,
    date: '2022.09.04',
    title: '第一次一起旅行',
    isHighlight: false,
    contents: []
  },

  {
    id: 5,
    date: '2023.01.31',
    title: '刘知意出生',
    isHighlight: true,
    contents: []
  },

  {
    id: 6,
    date: '2023.06',
    title: '红花湖18km骑行',
    isHighlight: false,
    contents: []
  },

  {
    id: 7,
    date: '2023.08',
    title: '岳麓山、罗浮山',
    isHighlight: false,
    contents: []
  },

  {
    id: 8,
    date: '2023.10',
    title: '梧桐山、深圳天文台',
    isHighlight: false,
    contents: []
  },

  {
    id: 9,
    date: '2024.01',
    title: '防城港、北海银滩',
    isHighlight: false,
    contents: []
  },

  {
    id: 10,
    date: '2024.05',
    title: '带女儿去武汉',
    isHighlight: false,
    contents: []
  },

  {
    id: 11,
    date: '2025.11',
    title: '九寨沟 & 黄龙',
    isHighlight: true,
    contents: []
  }
];

/**
 * 独立内容块 - 插入在节点之间的自由内容
 * 不依附于任何节点，可以独立添加文字/图片/视频
 *
 * insertAfter: 在第几个节点之后插入（0表示第1个节点后，-1表示最前面）
 */
const standaloneBlocks = [
  // 示例：在第1个节点后添加一段独立文字
  // {
  //   id: 'standalone_1',
  //   type: 'text',
  //   content: '那是一个寒冷的冬天，但我们聊得火热...',
  //   insertAfter: 0  // 在第1个节点(index=0)之后插入
  // },
  // 示例：在第2个节点后添加独立图片
  // {
  //   id: 'standalone_2',
  //   type: 'image',
  //   src: 'path/to/image.jpg',
  //   alt: '描述',
  //   insertAfter: 1
  // }
];

/**
 * Ending Configuration
 * Edit these values to customize the ending page
 */
const endingConfig = {
  message: '路还很长，但我会一直在你身边！',
  signature: '永远爱你的老公',
  name: '[刘浩]',  // TODO: Replace with your name
  date: '[农历11月11]'   // TODO: Replace with her birthday
};

// Make endingConfig available globally for editor.js
window.endingConfig = endingConfig;
