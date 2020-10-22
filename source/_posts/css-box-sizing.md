---
title:  "css3 box-sizing说明"
date: 2018-11-04 09:00:00
categories:
  - CSS
---

box-sizing 属性用于更改用于计算元素宽度和高度的默认的 CSS 盒子模型。可以使用此属性来模拟不正确支持CSS盒子模型规范的浏览器的行为。

> content-box: ***默认值*** 任何边框和内边距的宽度都会被增加到最后绘制出来的元素宽度中 
>> 1. width = 内容的宽度
>> 1. height = 内容的高度。
>
> border-box: 边框和内边距的值是包含在width内
>> 1. width = border + padding + 内容的  width
>> 1. height = border + padding + 内容的 height
 
参考[MDN box-sizing](https://developer.mozilla.org/zh-CN/docs/Web/CSS/box-sizing)

