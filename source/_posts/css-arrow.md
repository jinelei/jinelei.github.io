---
title:  "css3伪类实现箭头"
date: 2018-11-08 09:00:00
categories:
  - CSS
tags:
  - 学习笔记
---

话不多说，直接看代码

```less
.article-title {
    position: relative;
    color: rgba(0, 0, 0, .55);
    display: inline-block;
    text-align: left;
    border: 1px solid #eee9dc;
    border-radius: 8px;
    &:before {
        content: '';
        position: absolute;
        left: calc(-1em + 1px);
        top: 0.5em;
        border: 0.5em solid transparent;
        border-right-color: #eee9dc;
    }
}
```

> 1. 在父级元素设置伪类。
> 2. 在伪类中设置```content: '';```
> 3. 设置边框
> ```css
> border: 0.5em solid transparent; 
> border-right-color: #eee9dc;
> ```
