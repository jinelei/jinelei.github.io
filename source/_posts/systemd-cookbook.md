---
title:  "systemd备忘"
date: 2017-10-19 09:00:00
categories:
  - Linux
tags:
  - 备忘录
---


####  结构
Systemd服务分为三个部分，控制单元(unit)的定义、服务(service)的定义、安装部分。

####  控制单元

启动Shadowsocks单元

```
[Unit]
Description=Shadowsocks

[Service]
Type=forking
ExecStart=/usr/bin/sslocal -c /etc/shadowsocks.json -d start
ExecStop=/usr/bin/sslocal -c /etc/shadowsocks.json -d stop
StandardError=null

[Install]
WantedBy=multi-user.target
```
