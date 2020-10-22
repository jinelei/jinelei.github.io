---
title:  "ie8 juqery bootstrap兼容性"
date: 2018-11-01 09:00:00
categories:
  - JavaScript
tags:
  - 学习笔记
---

如何使bootstrap兼容IE8.

1. 把[jquery.min.js](https://cdn.bootcss.com/jquery/1.12.0/jquery.min.js)下载下来，放在本地资源中，使用本地资源url，而不是用cdn加速，保证同一域名下，不跨域
2. 下载[html5shiv.js](https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js)，并在jquery之后引入
3. 下载[response.min.js](https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js)，并在jquery之后引入
4. 在</head>之前添加以下代码：

```
<!--[if lt IE 9]>
    <script src="js/html5shiv.js"/>
    <script src="js/respond.min.js"/>
<![endif]-->

```

