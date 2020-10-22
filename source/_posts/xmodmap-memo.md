---
title:  "linux修改按键映射"
date: 2017-10-13 09:00:00
categories:
  - Linux
tags:
  - 备忘录
---

1. xmodmap

参考[archlinux wiki](https://wiki.archlinux.org/index.php/Xmodmap)

将CapsLock映射为Ctrl

xmodmap脚本样例:

```
clear lock
clear control
add control = Caps_Lock Control_L Control_R
keycode 66 = Control_L Caps_Lock NoSymbol NoSymbol
```

2. xorg 参数

XKbOptions参数参考/usr/share/X11/xkb/rulesbase.lst

新建/etc/X11/xorg.conf.d/00-keyboard.conf

```
# Read and parsed by systemd-localed. It's probably wise not to edit this file
# manually too freely.
#Option "XKbOptions" "grp:alt_caps_toggle,ctrl:swapcap"
#Option "XKbOptions" "caps:ctrl_modifier"
Section "InputClass"
    Identifier "system-keyboard"
    Option "XKbOptions" "ctrl:nocaps"
    MatchIsKeyboard "on"
EndSection
```
