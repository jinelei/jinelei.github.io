---
title:  "css伪类"
date: 2018-11-05 09:00:00
categories:
  - CSS
tags:
  - 学习笔记
---

js查看伪类的css样式

```js
document.defaultView.getComputedStyle(ele, ':before');
```
>  `document.defaultView`在浏览器中，该属性返回当前 document 对象所关联的 window 对象，如果没有，会返回 null。
>> 该属性只读.
>
>> 根据 [quirksmode](http://www.quirksmode.org/dom/w3c_html.html)，IE 9 以下版本不支持 defaultView。
>
> `Window.getComputedStyle(element, [pseudoElt])`方法返回一个对象，该对象在应用活动样式表并解析这些值可能包含的任何基本计算后报告元素的所有CSS属性的值。 私有的CSS属性值可以通过对象提供的API或通过简单地使用CSS属性名称进行索引来访问。
>> `element`用于获取计算样式的[Element](https://developer.mozilla.org/zh-CN/docs/Web/API/Element)
>
>> `pseudoElt`指定一个要匹配的[伪元素](https://drafts.csswg.org/css-content-3/#pseudo-elements)的字符串。必须对普通元素省略（或null）
>
>> 返回的style是一个实时的[CSSStyleDeclaration](https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleDeclaration)对象，当元素的样式更改时，它会自动更新本身。
>>> CSS属性值可以使用getPropertyValue(propName)API或直接索引到对象，如cs ['z-index']或cs.zIndex。


伪类的点击事件

> 通过禁用元素的点击，启用伪类的点击
```js
pre {
  text-indent: -1em;
  & > code {
    pointer-events: none;
    margin: 0 1em;
    &::before {
      text-indent: 0em;
      pointer-events: auto;
      width: 3em;
      position: absolute;
      border-radius: 5px;
      padding: 0.3em .5em;
      margin: 0.5em;
      content: 'copy';
      background-color: rgba(0, 0, 0, 0.3);
      color: rgba(255, 255, 255, 0.9);
    }
    &:hover::before {
      background-color: rgba(100, 100, 100, 0.7);
      color: rgba(0, 0, 0, 0.8);
    }
  }
}
```
