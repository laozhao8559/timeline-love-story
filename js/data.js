/**
 * Timeline Data
 * Edit this file to add, remove, or modify timeline events
 */

const timelineData = [
  {
    id: 1,
    date: '2021.12.01',
    title: '我们加了微信',
    description: '故事从这一刻开始，一句"你好"开启了我们的篇章',
    media: [
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2021-12-01-wechat.jpg',
        alt: '微信聊天截图'
      }
    ],
    isHighlight: false
  },

  {
    id: 2,
    date: '2022.03.30',
    title: '领结婚证',
    description: '法律承认了我们的关系，从此我们合法了',
    media: [
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
    ],
    isHighlight: true
  },

  {
    id: 3,
    date: '2022.05.02',
    title: '婚礼',
    description: '那天，我正式成为你的丈夫，你成为我的妻子',
    media: [
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2022-05-02-wedding-1.jpg',
        alt: '婚礼现场'
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
    ],
    isHighlight: true
  },

  {
    id: 4,
    date: '2022.09.04',
    title: '第一次一起旅行',
    description: '三峡大坝、西陵峡，我们第一次一起出远门',
    media: [
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
    ],
    isHighlight: false
  },

  {
    id: 5,
    date: '2023.01.31',
    title: '刘知意出生',
    description: '谢谢你，给了我一个完整的家。欢迎我们的宝贝女儿',
    media: [
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2023-01-31-baby-1.jpg',
        alt: '宝宝的第一张照片'
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
    ],
    isHighlight: true
  },

  {
    id: 6,
    date: '2023.06',
    title: '红花湖18km骑行',
    description: '一起骑行，一起流汗，一起看夕阳',
    media: [
      {
        type: 'image',
        src: 'js/assets/images/placeholder/2023-06-cycling.jpg',
        alt: '红花湖骑行'
      }
    ],
    isHighlight: false
  },

  {
    id: 7,
    date: '2023.08',
    title: '岳麓山、罗浮山',
    description: '爬过的山，看过的风景，都有你在身边',
    media: [
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
    ],
    isHighlight: false
  },

  {
    id: 8,
    date: '2023.10',
    title: '梧桐山、深圳天文台',
    description: '深圳最高峰，看城市夜景，数星星',
    media: [
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
    ],
    isHighlight: false
  },

  {
    id: 9,
    date: '2024.01',
    title: '防城港、北海银滩',
    description: '海边吹风，踩沙滩，这就是简单的幸福',
    media: [
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
    ],
    isHighlight: false
  },

  {
    id: 10,
    date: '2024.05',
    title: '带女儿去武汉',
    description: '动物园、江滩、彩虹滑梯，知意第一次长途旅行',
    media: [
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
    ],
    isHighlight: false
  },

  {
    id: 11,
    date: '2025.11',
    title: '九寨沟 & 黄龙',
    description: '彩林、海子、雪景，还有成都的火锅和夜景',
    media: [
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
    ],
    isHighlight: true
  }
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
