---
title:  "javascript检测是否存在属性"
date: 2018-05-14 09:00:00
---

- in运算符
```
let obj = {"name": "asdf","age": "123"}
alert('name' in obj); // --> ture
alert('toString' in obj); // --> ture
```



> in能检测到原型链的属性，但for in却不行。
>> ```
    for(x in obj)
        console.log(x)
        // name
        // age
    ```

- hasOwnProperty方法
```
let obj = {"name": "asdf","age": "123"}
obj.hasOwnProperty('name'); // --> true
obj.hasOwnProperty('toString'); // --> false
```

> 原型链上继承过来的属性(如：toString)无法通过hasOwnProperty检测到，返回false。

