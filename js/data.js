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
    contents: [
      {
        type: 'text',
        content: '故事从这一刻开始，一句"你好"开启了我们的篇章。那时候我们还很青涩，每天聊到深夜，有说不完的话。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2021-12-01-wechat.jpg',
        alt: '微信聊天截图'
      }
    ]
  },

  {
    id: 2,
    date: '2022.03.30',
    title: '领结婚证',
    isHighlight: true,
    contents: [
      {
        type: 'text',
        content: '法律承认了我们的关系，从此我们合法了！'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2022-03-30-certificate.jpg',
        alt: '结婚证照片'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2022-03-30-selfie.jpg',
        alt: '领证自拍'
      }
    ]
  },

  {
    id: 3,
    date: '2022.05.02',
    title: '婚礼',
    isHighlight: true,
    contents: [
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2022-05-02-wedding-1.jpg',
        alt: '婚礼现场'
      },
      {
        type: 'text',
        content: '那天，我正式成为你的丈夫，你成为我的妻子。亲朋好友见证，我们许下永远的承诺。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2022-05-02-wedding-2.jpg',
        alt: '婚礼瞬间'
      },
      {
        type: 'video',
        src: 'js/assets/videos/wedding.mp4',
        poster: 'js/assets/images/placeholder/2022-05-02-wedding-poster.jpg',
        alt: '婚礼视频'
      }
    ]
  },

  {
    id: 4,
    date: '2022.09.04',
    title: '第一次一起旅行',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '三峡大坝、西陵峡，我们第一次一起出远门。看大坝壮观，游峡江秀美，你在我身边就是最美的风景。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2022-09-04-travel-1.jpg',
        alt: '三峡大坝'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2022-09-04-travel-2.jpg',
        alt: '西陵峡风景'
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
        content: '谢谢你，给了我一个完整的家。欢迎我们的宝贝女儿来到这个世界！'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2023-01-31-baby-1.jpg',
        alt: '宝宝的第一张照片'
      },
      {
        type: 'text',
        content: '你的到来让我们的小家更加完整，看着你一天天长大，是我们最大的幸福。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2023-01-31-baby-2.jpg',
        alt: '一家三口'
      },
      {
        type: 'video',
        src: 'js/assets/videos/baby.mp4',
        poster: 'js/assets/images/placeholder/2023-01-31-baby-poster.jpg',
        alt: '宝宝视频'
      }
    ]
  },

  {
    id: 6,
    date: '2023.06',
    title: '红花湖18km骑行',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '一起骑行，一起流汗，一起看夕阳。红花湖的18公里，是我们并肩走过的路。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2023-06-cycling.jpg',
        alt: '红花湖骑行'
      }
    ]
  },

  {
    id: 7,
    date: '2023.08',
    title: '岳麓山、罗浮山',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '爬过的山，看过的风景，都有你在身边。累的时候互相扶持，到顶的时候一起欢呼。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2023-08-yuelu.jpg',
        alt: '岳麓山'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2023-08-luofu.jpg',
        alt: '罗浮山'
      }
    ]
  },

  {
    id: 8,
    date: '2023.10',
    title: '梧桐山、深圳天文台',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '深圳最高峰，看城市夜景，数星星。天文台的银河，是你我最美的见证。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2023-10-wutong.jpg',
        alt: '梧桐山顶'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2023-10-observatory.jpg',
        alt: '深圳天文台'
      }
    ]
  },

  {
    id: 9,
    date: '2024.01',
    title: '防城港、北海银滩',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '海边吹风，踩沙滩，这就是简单的幸福。看日出日落，吃海鲜大餐，和你一起就是度假。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2024-01-beach-1.jpg',
        alt: '北海银滩'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2024-01-beach-2.jpg',
        alt: '海边日落'
      }
    ]
  },

  {
    id: 10,
    date: '2024.05',
    title: '带女儿去武汉',
    isHighlight: false,
    contents: [
      {
        type: 'text',
        content: '动物园、江滩、彩虹滑梯，知意第一次长途旅行。看她好奇的小眼神，就像看到了小时候的自己。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2024-05-wuhan-zoo.jpg',
        alt: '武汉动物园'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2024-05-jiangtan.jpg',
        alt: '江滩公园'
      },
      {
        type: 'video',
        src: 'js/assets/videos/slide.mp4',
        poster: 'js/assets/images/placeholder/2024-05-slide-poster.jpg',
        alt: '彩虹滑梯'
      }
    ]
  },

  {
    id: 11,
    date: '2025.11',
    title: '九寨沟 & 黄龙',
    isHighlight: true,
    contents: [
      {
        type: 'text',
        content: '彩林、海子、雪景，九寨沟的水是地球上最美的。黄龙的五彩池，是大自然的调色盘。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2025-11-jiuzhai-1.jpg',
        alt: '九寨沟海子'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2025-11-jiuzhai-2.jpg',
        alt: '黄龙五彩池'
      },
      {
        type: 'text',
        content: '成都的火锅辣得过瘾，夜景美得让人流连。每次旅行都是我们最好的回忆。'
      },
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2025-11-chengdu.jpg',
        alt: '成都夜景'
      },
      {
        type: 'video',
        src: 'js/assets/videos/jiuzhai.mp4',
        poster: 'js/assets/images/placeholder/2025-11-trip-poster.jpg',
        alt: '旅行视频'
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
