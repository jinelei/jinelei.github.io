---
title:  "IE8下无法创建automation对象"
date: 2018-11-08 09:00:00
categories:
  - JavaScript
tags:
  - 学习笔记
---

问题描述：使用```new ActiveXObject("Scripting.FileSystemObject");```创建对象时，抱错```automation服务器不能创建对象```

方法一：通过internet安全设置
1. 打开***工具***菜单，选择internet选项
2. 点击安全选项卡，选择自定义级别
3. 把下面几项设置为启用：
    1. ***对标记为可安全执行脚本的ActiveX控件执行脚本***
    1. ***对未标记为可安全执行脚本的ActiveX控件执行脚本***
    1. ***运行ActiveX控件和插件***
    1. ***仅允许经过批准的域在未经提示的情况下使用ActiveX***
4. 保存设置
