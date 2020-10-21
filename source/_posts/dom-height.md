---
title:  "javascript 获取页面、窗口大小"
date: 2018-05-15 09:00:00
---

#### 获取窗口尺寸
```
var windowWidth = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth
);

var windowHeight = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight
);
```




#### 获取页面尺寸
```
var pageWidth = Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
);

var pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
);
```

详细解释：

| 描述               | 代码                                      |
| :-                 | :-                                        |
| 网页可见区域宽     | document.body.clientWidth                 |
| 网页可见区域高     | document.body.clientHeight                |
| 网页可见区域宽     | document.body.offsetWidth (包括边线的宽)  |
| 网页可见区域高     | document.body.offsetHeight (包括边线的高) |
| 网页正文全文宽     | document.body.scrollWidth                 |
| 网页正文全文高     | document.body.scrollHeight                |
| 网页被卷去的高     | document.body.scrollTop                   |
| 网页被卷去的左     | document.body.scrollLeft                  |
| 网页正文部分上     | window.screenTop                          |
| 网页正文部分左     | window.screenLeft                         |
| 屏幕分辨率的高     | window.screen.height                      |
| 屏幕分辨率的宽     | window.screen.width                       |
| 屏幕可用工作区高度 | window.screen.availHeight                 |
| 屏幕可用工作区宽度 | window.screen.availWidth                  |
| 网页可见区域宽     | document.body.clientWidth                 |
| 网页可见区域高     | document.body.clientHeight                |
| 网页可见区域宽     | document.body.offsetWidth (包括边线的宽)  |
| 网页可见区域高     | document.body.offsetHeight (包括边线的高) |
| 网页正文全文宽     | document.body.scrollWidth                 |
| 网页正文全文高     | document.body.scrollHeight                |
| 网页被卷去的高     | document.body.scrollTop                   |
| 网页被卷去的左     | document.body.scrollLeft                  |
| 网页正文部分上     | window.screenTop                          |
| 网页正文部分左     | window.screenLeft                         |
| 屏幕分辨率的高     | window.screen.height                      |
| 屏幕分辨率的宽     | window.screen.width                       |
| 屏幕可用工作区高度 | window.screen.availHeight                 |
| 屏幕可用工作区宽度 | window.screen.availWidth                  |
| 网页可见区域宽     | document.body.clientWidth                 |
| 网页可见区域高     | document.body.clientHeight                |
| 网页可见区域宽     | document.body.offsetWidth (包括边线的宽)  |
| 网页可见区域高     | document.body.offsetHeight (包括边线的高) |
| 网页正文全文宽     | document.body.scrollWidth                 |
| 网页正文全文高     | document.body.scrollHeight                |
| 网页被卷去的高     | document.body.scrollTop                   |
| 网页被卷去的左     | document.body.scrollLeft                  |
| 网页正文部分上     | window.screenTop                          |
| 网页正文部分左     | window.screenLeft                         |
| 屏幕分辨率的高     | window.screen.height                      |
| 屏幕分辨率的宽     | window.screen.width                       |
| 屏幕可用工作区高度 | window.screen.availHeight                 |
| 屏幕可用工作区宽度 | window.screen.availWidth                  |
