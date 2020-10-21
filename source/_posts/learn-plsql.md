---
title:  "plsql程序设计"
date: 2018-12-09 09:00:00
---

1. 基本程序块

```
CREATE OR REPLACE FUNCTION wordcount(str IN VARCHAR2)
    RETURN PLS_INTEGER
AS
    declare local variable here
BEGIN
    implement algorithm here
END;
/
```

运行一个脚本，将上面代码保存为wordcount.fun，执行前可以将回显打开。

```
set echo on
@wordcount.fun
```

