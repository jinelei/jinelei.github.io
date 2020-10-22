---
title:  "IE8下trim()失效"
date: 2018-11-08 09:00:00
categories:
  - JavaScript
tags:
  - 学习笔记
---

经测试，IE8不支持trim()方法，先发现两种替代方案。

1. jquery：
```js
$.trim(str)
```
> 注意jquery版本
2. 原生方法 
 ```js
String.prototype.trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, "");
}
String.prototype.ltrim = function () {
    return this.replace(/(^\s*)/g, "");
}
String.prototype.rtrim = function () {
return this.replace(/(\s*$)/g, "");
}
```
