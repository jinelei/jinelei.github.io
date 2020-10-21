---
title:  "ssh加密问题"
date: 2018-11-12 09:00:00
---

mac升级后出现git不可用问题的解决方案,
```
Unable to negotiate with 183.230.198.192 port 23424: no matching cipher found. Their offer: aes128-cbc,3des-cbc,blowfish-cbc,cast128-cbc,arcfour,aes192-cbc,aes256-cbc,rijndael-cbc@lysator.liu.se
```

- 编辑修改ssh配置，```sudo vim /etc/ssh/ssh_config```，取消这一行注释
```
#   Ciphers aes128-ctr,aes192-ctr,aes256-ctr,aes128-cbc,3des-cbc
Ciphers aes128-ctr,aes192-ctr,aes256-ctr,aes128-cbc,3des-cbc,aes192-cbc,aes256-cbc
```

- 编辑.ssh/config配置, ```vim ~/.ssh/config```，添加Port、HostKeyAlgorithms
```
Host test
    HostName cqkct.top
    User jinelei
    Port 23424
    HostKeyAlgorithms +ssh-dss
```

