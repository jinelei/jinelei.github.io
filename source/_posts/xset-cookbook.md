---
title:  "Linux实用工具 xset"
date: 2017-07-30 09:00:00
categories:
  - Linux
  - Memo
---

xset是linux中设置X-Window的实用工具。

---
-display display  
指定这个server用在哪个display上。

---
b  
指定开关机的提示音，使用[+/-]前缀，或者[on/off]后缀。
> xset +b  
> xset b on

---
bc  
调试兼容模式开关，使用[+/-]前缀。  

---
c  
按键声音开关，使用[+/-]前缀，或者[on/off]后缀。

---
dmps  
节能之星开关，使用[+/-]前缀。

dmps flags...
> force 强制进入某种状态。standby、suspend、off、on。
>> xset dmps force suspend

> 数值参数：[standby] [suspend] [off]
>> 设置0禁用。

---
fp=
字体路径。
> fp default   设置为服务器默认。

fp rehash
> 刷新font database。 

---
led  
设置键盘led，使用[+/-]前缀，数值参数1-32。支持XKB名称。
