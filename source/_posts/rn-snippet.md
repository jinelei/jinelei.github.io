---
title:  "react-native代码段"
date: 2018-05-24 09:00:00
tags:
- react-native
---

- ##### 引用图片

	-  普通方式

	```<Image source={require('../assets/functions/mod_addressbook.imageset/mod_addressbook.webp')} />```

	- 动态引用

	```
	var icon = this.props.active ? require('./my-icon-active.webp') : require('./my-icon-inactive.webp');
	<Image source={icon} />
	```





