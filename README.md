# 时间轴爱情故事 💕

一个温馨的、可在微信中打开的 HTML 网页，用于展示你们的爱情故事时间轴。

## 功能特点

- **5个阶段的页面流程**：加载页 → 趣味选择页 → 过渡确认页 → 时间轴故事页 → 结尾总结页
- **数据驱动**：时间轴内容通过 `js/data.js` 独立管理，易于编辑和扩展
- **丰富的交互**：
  - 图片点击放大（灯箱效果）
  - 视频点击播放
  - 背景音乐控制
  - 滚动动画效果
- **响应式设计**：完美适配手机端，同时支持桌面端浏览
- **微信兼容**：针对微信浏览器优化，支持内联视频播放

## 文件结构

```
timeline_love_story/
├── index.html              # 主 HTML 入口
├── css/                    # 样式文件
│   ├── main.css           # 主样式（导入其他 CSS）
│   ├── normalize.css      # CSS 重置
│   ├── variables.css      # CSS 变量
│   ├── layout.css         # 布局样式
│   ├── components.css     # 组件样式
│   └── animations.css     # 动画定义
├── js/                     # JavaScript 文件
│   ├── data.js            # 时间轴数据（核心）
│   ├── timeline.js        # 时间轴渲染
│   ├── interactions.js    # 交互处理
│   ├── observer.js        # 滚动动画
│   └── main.js            # 主入口
└── js/assets/              # 资源文件
    ├── images/            # 图片资源
    │   └── placeholder/   # 占位图片目录
    ├── music/             # 背景音乐
    │   └── bg-music.mp3   # 背景音乐文件
    └── videos/            # 视频资源
```

## 快速开始

### 1. 编辑时间轴数据

打开 `js/data.js`，修改时间节点内容：

```javascript
const timelineData = [
  {
    id: 1,
    date: '2021.12.01',
    title: '我们加了微信',
    description: '故事从这一刻开始...',
    media: [
      {
        type: 'image',
        src: 'js/assets/images/photo.jpg',
        alt: '照片描述'
      }
    ],
    isHighlight: false  // 设为 true 会高亮显示
  },
  // 添加更多节点...
];
```

### 2. 编辑结尾信息

在 `js/data.js` 底部修改：

```javascript
const endingConfig = {
  message: '路还很长，但我会一直在你身边',
  signature: '永远爱你的',
  name: '[你的名字]',  // 修改这里
  date: '[她的生日]'   // 修改这里，例如 '2025.01.15'
};
```

### 3. 添加真实素材

- **图片**：放入 `js/assets/images/` 目录
- **视频**：放入 `js/assets/videos/` 目录
- **音乐**：替换 `js/assets/music/bg-music.mp3`

然后在 `data.js` 中更新对应路径。

### 4. 本地预览

直接用浏览器打开 `index.html` 即可预览。

**注意**：由于浏览器的 CORS 安全限制，直接双击打开 HTML 可能无法加载本地图片/视频。建议使用本地服务器：

```bash
# 使用 Python 3
python -m http.server 8000

# 使用 Node.js (需要安装 http-server)
npx http-server

# 使用 PHP
php -S localhost:8000
```

然后访问 `http://localhost:8000`

## 部署指南

### GitHub Pages

1. 创建 GitHub 仓库并上传所有文件
2. 进入仓库 **Settings** → **Pages**
3. 在 **Source** 中选择分支（通常是 `main`）
4. 点击 **Save**
5. 等待几分钟后，访问 `https://yourusername.github.io/repo-name`

### Vercel

1. 安装 Vercel CLI：`npm i -g vercel`
2. 在项目目录运行：`vercel`
3. 按提示操作
4. 部署完成后会获得一个 `https://` 开头的域名

### 微信中打开

1. 部署到 GitHub Pages 或 Vercel
2. 复制部署后的网址
3. 在微信中发送网址即可

## 添加新时间节点

只需在 `js/data.js` 的 `timelineData` 数组中添加新对象：

```javascript
{
  id: 12,  // 唯一 ID
  date: '2025.12.25',
  title: '新节点标题',
  description: '节点描述（1-2句话）',
  media: [
    {
      type: 'image',  // 或 'video'
      src: 'js/assets/images/new-photo.jpg',
      alt: '图片描述'
    }
  ],
  isHighlight: false  // true 为高亮节点
}
```

## 技术栈

- **纯原生 JavaScript**：无框架依赖，轻量高效
- **CSS3**：现代 CSS 特性，支持 CSS 变量
- **Intersection Observer API**：高性能滚动动画

## 浏览器兼容性

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- 微信内置浏览器
- iOS Safari 14+

## 常见问题

### Q: 音乐无法自动播放？
A: 现代浏览器（尤其是 iOS Safari 和微信）会阻止音频自动播放。用户第一次点击页面任意位置后，音乐会尝试开始播放。也可以点击右上角的音乐按钮手动控制。

### Q: 视频无法内联播放？
A: 代码已添加 `playsinline`、`webkit-playsinline` 等 iOS 专用属性。如果仍有问题，确保视频格式为 MP4 (H.264 编码)。

### Q: 图片点击无法放大？
A: 确保图片路径正确，并且是通过 HTTP 服务器访问的（直接打开 HTML 文件可能有 CORS 限制）。

## 许可

MIT License - 可自由使用和修改

---

祝你们幸福！💕
