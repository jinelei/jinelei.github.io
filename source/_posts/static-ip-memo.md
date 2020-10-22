---
title:  "centos7设置静态IP"
date: 2018-05-10 09:00:00
categories:
  - Linux
tags:
  - 备忘录
---

##### 1. 修改配置文件
原始dhcp配置例子```cat /etc/sysconfig/network-scripts/ifcfg-XXX```：

```
TYPE="Ethernet"
PROXY_METHOD="none"
BROWSER_ONLY="no"
BOOTPROTO="dhcp"
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
IPV6INIT="yes"
IPV6_AUTOCONF="yes"
IPV6_DEFROUTE="yes"
IPV6_FAILURE_FATAL="no"
IPV6_ADDR_GEN_MODE="stable-privacy"
NAME="ens192"
UUID="9c7f61e1-4671-4dd0-9bd2-ece2ecfd722e"
DEVICE="ens192"
ONBOOT="yes"
IPADDR="192.168.1.155"
PREFIX="24"
IPV6_PRIVACY="no"
```
修改后的配置文件：
```
TYPE="Ethernet"
PROXY_METHOD="none"
BROWSER_ONLY="no"
BOOTPROTO="static" #修改为static
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
IPV6INIT="yes"
IPV6_AUTOCONF="yes"
IPV6_DEFROUTE="yes"
IPV6_FAILURE_FATAL="no"
IPV6_ADDR_GEN_MODE="stable-privacy"
NAME="ens192"
UUID="66e324e0-daa8-4b31-a837-1f2f412be9d8"
DEVICE="ens192"
ONBOOT="yes"
IPADDR=192.168.1.150 #静态IP
GATEWAY=192.168.1.1 #默认网关
NETMASK=255.255.255.0 #子网掩码
DNS1=192.168.1.1 #DNS
```

##### 2. 重启network服务

执行命令: ```service network restart```

##### 3. 检查ip

执行命令: ```ifconfig -a```
