---
title:  "xrandr调整亮度"
date: 2018-11-05 09:00:00
categories:
  - Linux
  - Memo
---

```
#!/bin/bash
#default eDP1
DEV="eDP-1"
NUM=1
while getopts "o:n:" arg
do
    case $arg in
        o)
            DEV=$OPTARG
            ;;
        n)
            tmp=`echo "scale=1;$OPTARG/10"| bc`
            NUM=$tmp
            ;;
        ?)
            ;;
    esac
done

if [ $# -ge 1 ]
then
    xrandr --output $DEV --brightness $NUM
else
    xrandr | grep -v "disconnected" |  grep "connected"  
fi
```
