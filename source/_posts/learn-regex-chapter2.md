---
title:  "正则表达式基础 元字符"
date: 2017-07-26 09:00:00
---

* #### 元字符: ***$()*+.?[\^{|***
  元字符：`$()*+.?[\^{|`共12个。
  >字符]只有出现在未转义的[之后才是元字符。同理}也是。  

* #### 块转义（Perl、PCRE和Java都支持 ***<\Q>*** 和 ***<\E>***）
  > <\Q>和<\E>，在此之间的所有元字符都作为普通字符使用。  
  `\Q!@#$%^&*()_+\E`
* #### 忽略大小写 ***<(?i)>***
  > `(?i)asdf`
* #### 匹配不可打印字符
  > 包括：*振铃符（bell）、转义符（escape）、换页符（formfeed）、换行符（line feed）、回车符（carriage return）、水平制表符（horizontal tab）和垂直制表符（vertical tab）*。对应的ASCII编码是：07、1B、0C、0A、0D、09、0B。
  >> 不可打印字符变体：Ctrl+字符键对应表示为 **<\cA>到<\cZ>**，其中c字符必须为小写。

  |表示|含义|十六进制表示|正则流派|
  |---|---|---|---|
  |<\a>|振铃|0x07|.NET、Java、PCRE、Perl、Python、Ruby|
  |<\e>|转义|0x1B|.NET、Java、PCRE、Perl、Ruby|
  |<\f>|换页|0x0C|.NET、Java、JavaScript、PCRE、Perl、Python、Ruby|
  |<\n>|换行|0x0A|.NET、Java、JavaScript、PCRE、Perl、Python、Ruby|
  |<\r>|回车|0x0D|.NET、Java、JavaScript、PCRE、Perl、Python、Ruby|
  |<\t>|水平制表符|0x09|.NET、Java、JavaScript、PCRE、Perl、Python、Ruby|
  |<\v>|垂直制表符|0x0B|.NET、Java、JavaScript、PCRE、Perl、Python、Ruby|
