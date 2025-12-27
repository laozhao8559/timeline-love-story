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
    title: '我们加上了微信',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '那天并不知道，\n这一句简单的"你好"，\n会成为我这一生\n最重要的一次点击。'
      }
    ]
  },

  {
    id: 2,
    date: '2022.03.30',
    title: '我们领了结婚证',
    isHighlight: true,
    contents: [
      {
        type: 'text',
        content: '原来真正的浪漫，\n不是誓言有多大声，\n而是从这一天起，\n世界上多了一个人\n和我一起对抗生活。'
      }
    ]
  },

  {
    id: 3,
    date: '2022.05.02',
    title: '我们的婚礼',
    isHighlight: true,
    contents: [
      {
        type: 'text',
        content: '那一天，我看着你走向我，\n忽然明白了一件事：\n\n从今以后，\n所有的"我"，\n都变成了"我们"。'
      }
    ]
  },

  {
    id: 4,
    date: '2022.09.04',
    title: '第一次一起旅行 · 三峡大坝 / 西陵峡',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '那是我们第一次真正走远，\n没有计划得多完美，\n但一路都有笑声。\n\n原来，\n只要和你在一起，\n去哪里都算远方。'
      }
    ]
  },

  {
    id: 5,
    date: '2023.01.31',
    title: '刘知意出生',
    isHighlight: true,
    contents: [
      {
        type: 'text',
        content: '谢谢你，\n用你的勇敢和温柔，\n把一个小生命\n带进了我们的世界。\n\n从那一刻起，\n我不再只是爱你，\n也开始学着\n成为一个父亲。'
      }
    ]
  },

  {
    id: 6,
    date: '2023',
    title: '那些一起走过的日子',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '惠州红花湖 18 公里骑行\n\n有风，有汗，有坚持，\n还有并肩前行的默契。'
      },
      {
        type: 'text',
        content: '岳麓山 / 罗浮山 / 梧桐山\n\n山很高，\n但你在身边，\n每一步都走得很安心。'
      },
      {
        type: 'text',
        content: '深圳天文台\n\n那天看见星空的时候，\n我突然觉得，\n我已经拥有了\n属于我的宇宙。'
      }
    ]
  },

  {
    id: 7,
    date: '2024',
    title: '和女儿一起的第一次们',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '武汉动物园 / 江滩 / 彩虹滑梯\n\n她的笑声，\n成了我们世界里\n最温柔的背景音。\n\n谢谢你，\n让我看见你成为母亲的样子。'
      }
    ]
  },

  {
    id: 8,
    date: '2025.11',
    title: '九寨沟 · 黄龙 · 成都',
    isHighlight: true,
    contents: [
      {
        type: 'text',
        content: '彩林、海子、人海，\n世界依旧很大。\n\n但我最庆幸的是，\n这些风景，\n你都在我身边。'
      }
    ]
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

// Make timelineData available globally for export functionality
window.timelineData = timelineData;
