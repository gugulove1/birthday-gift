
// 生成一张好看的渐变占位图（用不到真实照片时可以拿它顶替）
function makePlaceholder(text, c1, c2) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + c1 + '"/>' +
    '<stop offset="1" stop-color="' + c2 + '"/>' +
    '</linearGradient></defs>' +
    '<rect width="1200" height="800" fill="url(#g)"/>' +
    '<text x="600" y="380" font-family="serif" font-size="80" fill="rgba(255,255,255,0.92)" text-anchor="middle">' + text + '</text>' +
    '<text x="600" y="470" font-family="serif" font-size="28" fill="rgba(255,255,255,0.7)" text-anchor="middle">把这里替换成你们的合照</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

window.GIFT_CONFIG = {
  title: "萱萱生日快乐",
  subtitle: "给最可爱的你 · 挥挥手翻页",

  // 挥动方向反了的话，把它改成 true
  swipeInvert: false,

  
  slides: [
    {
      src: "images/1.jpg",
      caption: "第 1 张 · 什么睡衣派对，大姐姐我还以为你在奶孩子。",
      sub: ""
    },
    {
      src: "images/2.jpg",
      caption: "第 2 张 · 死嘴憋住。",
      sub: ""
    },
    {
      src: "images/3.jpg",
      caption: "第 3 张 · 已严肃睡着zzz。",
      sub: ""
    },
    {
      src: "images/4.jpg",
      caption: "第 4 张 · 谁家氏族大小姐。",
      sub: ""
    },
    {
      src: "images/5.jpg",
      caption: "第 5 张 · 美女比个耶✌。",
      sub: ""
    },
    {
      src: "images/6.jpg",
      caption: "第 6 张 · 这谁偷拍的。",
      sub: ""
    },
    {
      src: "images/7.jpg",
      caption: "第 7 张 · 小姐姐你有点美丽。",
      sub: ""
    },
    {
      src: "images/8.jpg",
      caption: "第 8 张 · 这么看眼睛也没比我大多少。",
      sub: ""
    },
    {
      src: "images/9.jpg",
      caption: "第 9 张 · 生日快乐 🎂 不止今天，要一直一直开心。",
      sub: ""
    }
  ]
};
