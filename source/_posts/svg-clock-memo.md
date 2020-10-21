---
title: js制作svg时钟
date: 2018-11-07 09:00:00
---

1. 声明创建表盘函数
```js
function createDialPlate(attr, attrBackground, point1, point2, parentEle) {
    let dialPlate = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    let dialPalteBackground = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    for (let k in attr)
        dialPlate.setAttribute(k, attr[k]);
    for (let k in attrBackground)
        dialPalteBackground.setAttribute(k, attrBackground[k]);
    parentEle.appendChild(dialPalteBackground);
    parentEle.appendChild(dialPlate);
    for (let i = 0; i < 360; i += 6) {
        let point = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        if (i % 30 == 0) {
            for (let k in point1)
                point.setAttribute(k, point1[k]);
        } else {
            for (let k in point2)
                point.setAttribute(k, point2[k]);
        }
        point.setAttribute('transform', 'rotate(' + i + ', ' + attr['cx'] + ', ' + attr['cx'] + ')');
        parentEle.appendChild(point);
    }
}
```

2. 声明创建指针函数
```js
function createClockPoint(plate, attr, dur, nowDeg, parentEle) {
    let point = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    for (let k in attr) {
        point.setAttribute(k, attr[k]);
    }
    let pointAnimateTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    pointAnimateTransform.setAttribute('attributeName', 'transform');
    pointAnimateTransform.setAttribute('type', 'rotate');
    pointAnimateTransform.setAttribute('begin', '0s');
    pointAnimateTransform.setAttribute('dur', dur);
    pointAnimateTransform.setAttribute('from', nowDeg + ' ' + plate['cx'] + ' ' + plate['cy']);
    pointAnimateTransform.setAttribute('to', (nowDeg + 360) + ' ' + plate['cx'] + ' ' + plate['cy']);
    pointAnimateTransform.setAttribute('repeatCount', 'indefinite');
    point.appendChild(pointAnimateTransform);
    parentEle.appendChild(point);
}
```
3. 初始化表盘
```js
function initDialPlate() {
    let dialPlateRadius = 70;
    let dialPlateBgRadius = dialPlateRadius * 1.2;
    let svgStyle = {
        id: 'main',
        version: '1.1',
        height: dialPlateBgRadius * 2,
        width: dialPlateBgRadius * 2
    };
    let svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    for (k in svgStyle)
        svg.setAttribute(k, svgStyle[k]);
    let dialPlateStyle = {
        'r': dialPlateRadius,
        'class': 'fancy',
        'cx': dialPlateBgRadius,
        'cy': dialPlateBgRadius,
        'style': 'fill: #2A3039'
    };
    let dialPlateBgStyle = {
        'r': dialPlateBgRadius,
        'class': 'fancy',
        'cx': dialPlateBgRadius,
        'cy': dialPlateBgRadius,
        'style': 'fill: #1D2126'
    };
    let dialDot1Style = {
        'width': Math.ceil(dialPlateRadius / 30),
        'height': Math.ceil(dialPlateRadius / 8),
        'x': dialPlateBgRadius,
        'y': dialPlateBgRadius - dialPlateRadius,
        'rx': '3',
        'ry': '3',
        'style': 'stroke: #cccccc; fill: #cccccc',
    };
    let dialDot2Style = {
        'width': Math.ceil(dialPlateRadius / 30),
        'height': Math.ceil(dialPlateRadius / 20),
        'x': dialPlateBgRadius,
        'y': dialPlateBgRadius - dialPlateRadius,
        'rx': '3',
        'ry': '3',
        'style': 'stroke: #cccccc; fill: #cccccc',
    };
    let secondPointStyle = {
        x: dialPlateBgRadius,
        y: dialPlateBgRadius * 0.6,
        width: '1',
        height: dialPlateRadius * 1.4,
        rx: '2',
        ry: '2',
        style: "fill: #EA5432; stroke: #EA5432; stroke-width: " + Math.ceil(dialPlateRadius / 35),
    };
    let minutePointStyle = {
        x: dialPlateBgRadius,
        y: dialPlateBgRadius,
        width: '1',
        height: dialPlateRadius * 0.8,
        rx: '2',
        ry: '2',
        style: "fill: #cccccc; stroke: #cccccc; stroke-width: " + Math.ceil(dialPlateRadius / 25),
    };
    let hourPointStyle = {
        x: dialPlateBgRadius,
        y: dialPlateBgRadius,
        width: '1',
        height: dialPlateRadius * 0.6,
        rx: '2',
        ry: '2',
        style: "fill: #cccccc; stroke: #cccccc; stroke-width: " + Math.ceil(dialPlateRadius / 20),
    };
    createDialPlate(dialPlateStyle, dialPlateBgStyle, dialDot1Style, dialDot2Style, svg);
    let date = new Date();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    let milli = date.getMilliseconds();
    createClockPoint(dialPlateBgStyle, hourPointStyle, '259200s', 30 * hour + 30 / 60 * minute - 180, svg);
    createClockPoint(dialPlateBgStyle, minutePointStyle, '3600s', 6 * minute + 6 * second / 60 - 180, svg);
    createClockPoint(dialPlateBgStyle, secondPointStyle, '60s', 6 * second + 6 * milli / 1000 - 180, svg);
    let dialPlateDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dialPlateDot.setAttribute('cx', dialPlateBgStyle['cx']);
    dialPlateDot.setAttribute('cy', dialPlateBgStyle['cy']);
    dialPlateDot.setAttribute('r', dialPlateRadius / 20);
    dialPlateDot.setAttribute('style', 'fill: #EA5432; stroke: #EA5432; stroke-width: ' + Math.ceil(dialPlateRadius / 20));
    svg.appendChild(dialPlateDot);
    document.body.appendChild(svg);
};
```
4. 添加到window.load中去
```js
window.addEventListener('load', initDialPlate);
```

> 创建元素时要使用  
> ```document.createElementNS(''http://www.w3.org/2000/svg', 'circle');```
> 添加元素要使用  
> ```ele.setAttribute('width', '100');```
> 动画使用  
> ```animateTransform```
