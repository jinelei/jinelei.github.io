---
title:  "更换默认sh为zsh"
date: 2018-05-10 09:00:00
categories:
  - Linux
  - Memo
---
### 1. 检查是否安装zsh

执行命令: ```whereis zsh```
如果查找到代表已经安装，否则请先安装zsh，具体安装方法请查阅各自发行版

| 发行版| 安装命令|
| :-: | :-: |
| archlinux | ```pacman -S zsh``` |
| centos | ```yum -y install zsh``` |
| debain | ```apt install zsh``` |
| other | 请从源码安装 |

### 2. 更新sh

执行命令: ```chsh -s /bin/zsh jinelei```

### 3. 使用oh my zsh [Optional]

执行命令: ```sh -c "$(curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"```

> 更多请参考[oh my zsh](http://ohmyz.sh/)

### 快捷命令:
```sudo yum -y install zsh && chsh -s /bin/zsh jinelei && sh -c "$(curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"```
