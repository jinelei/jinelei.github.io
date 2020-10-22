---
title:  "javascript date format"
date: 2018-05-15 09:00:00
categories:
  - JavaScript
tags:
  - 学习笔记
---

- 使用prototype扩展
```
// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// new Date().Format("yyyy-MM-dd hh:mm:ss.S") ==> 2018-05-15 10:18:00.013
// new Date().Format("yyyy-M-d h:m:s.S")      ==> 2018-5-15 10:18:0.01
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
```




> 核心思想： 使用正则表达式（分组思想）测试格式格式字符串，用分组的长度(RegExp.$1.length：第一组的长度)来设置字符串长度(substr)。

- 带星期的日期格式化
```
// (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2018-05-15 二 10:18:00
// (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2018-05-15 周二 10:18:00
// (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2018-05-15 星期二 10:18:00
Date.prototype.pattern=function(fmt) {
    var o = {
    "M+" : this.getMonth()+1, //月份
    "d+" : this.getDate(), //日
    "h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时
    "H+" : this.getHours(), //小时
    "m+" : this.getMinutes(), //分
    "s+" : this.getSeconds(), //秒
    "q+" : Math.floor((this.getMonth()+3)/3), //季度
    "S" : this.getMilliseconds() //毫秒
    };
    var week = {
    "0" : "/u65e5",
    "1" : "/u4e00",
    "2" : "/u4e8c",
    "3" : "/u4e09",
    "4" : "/u56db",
    "5" : "/u4e94",
    "6" : "/u516d"
    };
    if(/(y+)/.test(fmt)){
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    if(/(E+)/.test(fmt)){
        fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[this.getDay()+""]);
    }
    for(var k in o){
        if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
    return fmt;
}
```
> 核心思想：基础同上；区别在于用了一个week保存星期一到星期日的unicode值，测试E的时候动态设置（二/周二/星期二）。

##### 通常时间格式化函数都是通过正则表达式(主要是分组测试取长度)测试格式字符串来动态设置显示格式的。
