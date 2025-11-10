# PWA 图标设置指南

## 需要的图标文件

为了完整支持 PWA 功能,请在 `public` 目录下添加以下图标:

### 必需图标

1. **pwa-192x192.png** - 192x192 像素
   - 用于 Android 应用图标

2. **pwa-512x512.png** - 512x512 像素
   - 用于 Android 启动画面

3. **apple-touch-icon.png** - 180x180 像素
   - 用于 iOS 设备

4. **favicon.ico** - 32x32 像素
   - 浏览器标签图标

## 快速生成图标

### 方法 1: 使用在线工具

访问 [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)

1. 上传你的 logo(建议 512x512 PNG,透明背景)
2. 下载生成的所有图标
3. 将图标文件复制到 `client/public/` 目录

### 方法 2: 使用 CLI 工具

```bash
npm install -g pwa-asset-generator

# 从 logo 生成所有图标
pwa-asset-generator logo.png ./public -i ./public/index.html -m ./public/manifest.json
```

### 方法 3: 手动创建

使用图像编辑工具(如 Photoshop, GIMP, Figma)创建以下尺寸:

- 512x512 → pwa-512x512.png
- 192x192 → pwa-192x192.png
- 180x180 → apple-touch-icon.png
- 32x32 → favicon.ico

## 图标设计建议

1. **简洁明了** - 图标应该简单,易于识别
2. **高对比度** - 确保在各种背景下都清晰可见
3. **PNG 格式** - 支持透明背景
4. **安全区域** - 重要内容保持在中心 80% 区域内

## 临时解决方案

如果暂时没有设计好的图标,可以:

1. 使用 Vite 默认图标(当前配置)
2. 使用简单的纯色背景 + 文字
3. 使用在线图标生成器快速创建

## 验证 PWA 配置

1. 打开 Chrome DevTools
2. 进入 Application 标签
3. 检查 Manifest 和 Service Worker
4. 确认图标正确加载

## 相关资源

- [PWA Builder](https://www.pwabuilder.com/)
- [Maskable.app](https://maskable.app/) - 测试可遮罩图标
- [Favicon Generator](https://realfavicongenerator.net/)
