---
title:  "react-native troubleshooting"
date: 2018-05-21 09:00:00
tags:
- react-native
---

- #### Common
    
    - ```error: bundling: NotFoundError: Cannot find entry file index.js in any of the roots: ["/Users/zhenlei/Projects/rn/FunGuard"]```
    > 高版本使用index.js代替了index.ios.js和index.android.js了，所以请检查项目根目录下是否存在index.js

	- ```Could not connect to development server```
	搭建环境后运行项目出现：```Could not connect to development server```。

	然而使用浏览器打开[http://localhost:8081/index.ios.bundle?platform=ios&dev=true](http://localhost:8081/index.ios.bundle?platform=ios&dev=true)发现```packager```成功运行，
浏览器中出现打包完成的内容，最后度娘告诉我，可能是机器对于localhost做了映射，于是将入口文件从```http://localhost:8081/index.ios.bundle?platform=ios&dev=true```改成```http://127.0.0.1:8081/index.ios.bundle?platform=ios&dev=true```解决问题。




- #### IOS

    -  运行```react-native run-ios```时，报错：```Print: Entry, ":CFBundleIdentifier", Does Not Exist```

    > 高版本的react-native依赖库问题。
    > 解决方法：使用低版本的react-native ```react-native init MyApp --version 0.44.3```

    - IOS不能使用http访问

    > 在ios子目录中的Info.plist中最后添加
    >```
    ><key>NSAppTransportSecurity</key>
    ><!--See http://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/ -->
    ><dict>
    >	<key>NSExceptionDomains</key>
    >	<dict>
    >		<key>localhost</key>
    >		<dict>
    >			<key>NSExceptionAllowsInsecureHTTPLoads</key>
    >			<true/>
    >		</dict>
    >	</dict>
    ></dict>
    >```


- #### Andorid

    - ```SDK location not found. Define location with sdk.dir in the local.properties file or with an ANDROID_HOME environment variable.```
    > 在环境变量中添加ANDROID_HOME，例如```export ANDROID_HOME=/Users/zhenlei/Library/Android/sdk```





