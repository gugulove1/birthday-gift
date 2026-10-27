# 生日礼物 · 手势翻页相册

一个用「手势识别（MediaPipe）」翻看照片的网页。打开摄像头，举起手左右挥动，就能切换照片；每张照片都配一句寄语。

## 怎么运行

⚠️ 摄像头需要在「本地服务器」或「https」下才能使用（浏览器安全限制）。
直接双击 `index.html` 打开时，**手势无法启用**，但键盘 / 点击箭头 / 手指滑动仍然可用。

推荐做法（二选一）：

1. 用 Python 起一个本地服务器（最省事）：

   ```
   cd 生日礼物文件夹
   python -m http.server 8000
   ```

   然后浏览器打开 `http://localhost:8000`，点「开始」。

2. 用 VS Code 的 **Live Server** 插件打开 `index.html`。

3. 想直接发给朋友看：把它免费部署到 **GitHub Pages / Netlify / Vercel**（有 https），
   对方用手机点开链接就能玩。

## 换成你们的照片和寄语

打开 `config.js`，找到 `slides` 数组，每一项：

- `src`     —— 图片地址。把照片放进 `images` 文件夹，然后写 `src: "images/xxx.jpg"`。
- `caption` —— 这张照片的寄语。
- `sub`     —— 可选的小字（比如日期），不需要就写 `""`。

改完保存，刷新页面即可。

## 常见调整（都在 config.js）

- 挥动方向反了：把 `swipeInvert` 改成 `true`。
- 标题 / 副标题：改 `title`、`subtitle`。
- 想加 / 删照片：直接增删 `slides` 里的条目。
- 挥动太灵敏 / 不灵敏：在 `app.js` 里改 `evaluateSwipe` 中的 `0.22`（距离）和 `0.35`（速度）两个阈值。

## 需要联网

- 手势模型从 Google CDN 加载，字体从 Google Fonts 加载，首次打开需要联网。
- 手机 Safari / Chrome 都支持。

## 文件说明

- `index.html`  页面结构
- `style.css`   样式
- `config.js`   ⭐ 你主要改这里（照片 + 寄语）
- `app.js`      手势识别逻辑（一般不用动）
- `images/`     把你的照片放这里
