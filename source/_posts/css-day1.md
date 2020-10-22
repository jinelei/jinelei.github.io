---
title:  "css揭秘-第1天"
date: 2018-11-12 09:00:00
categories:
  - CSS
tags:
  - 学习笔记
---

- 如何时候半透明边框

![css-day1-1.webp](/assets/img/css-day1-1.webp)
```css
body {
    background-color: #ccc;
}
.main {
    border: 10px solid hsla(0, 0%, 100%, 0.5);
    width: 100px;
    height: 100px;
    background-color: #f00;
    background-clip: padding-box;
}
```
- 透明边框外再加边框效果

![css-day1-2.webp](/assets/img/css-day1-2.webp)
```css
body {
    background-color: #ccc;
}
.main {
    border: 10px solid transparent;
    width: 100px;
    height: 100px;
    background-color: #f00;
    background-clip: padding-box;
    box-shadow: 1px 1px 0px -1px #f00;
}
```
- 方格棋盘


![css-day1-3.webp](/assets/img/css-day1-3.webp)
```css
background-image: linear-gradient(45deg, #bbb 25%, transparent 0), 
					linear-gradient(45deg, transparent 75%, #bbb 0),
					linear-gradient(45deg, #bbb 25%, transparent 0), 
					linear-gradient(45deg, transparent 75%, #bbb 0);
background-size: 30px 30px;
background-position: 0 0, 15px 15px, 15px 15px, 30px 30px;
```
> svg的实现方式
```
background: #eee url('data:image/svg+xml,\
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill-opacity=".25" >\
            <rect x="50" width="50" height="50" />\
            <rect y="50" width="50" height="50" />\
            </svg>');
background-size: 100px 100px;
```
