---
title:  "探测远程ip"
date: 2018-11-07 09:00:00
---

```
#!/bin/sh

IP_ADDR=192.168.1.150									#目标IP地址
DETAIL_LOG=/var/log/ping_remote_detail_log.log			#详细日志文件
LOG=/var/log/ping_remote_log.log						#日志简报
DATE=`date  "+%F %H:%m:%S"`								#时间
PING_COUNT=9											#ping的次数
BLACK_ROW=`expr $PING_COUNT + 2`						#要删除的空行的行数
COUNT_INFO_ROW=`expr $PING_COUNT + 4`					#简报要统计的信息所在行

ping -c $PING_COUNT "$IP_ADDR" \
	|awk 'BEGIN{print "--------------------", "'"$DATE"'", "---------------------"} NR != "'"$BLACK_ROW"'" {print} END{print "--------------------------------------------------------------\n"}' \
	|tee -a "$DETAIL_LOG" \
	|awk -F'[, ]' 'NR == "'"$COUNT_INFO_ROW"'" {print "'"$DATE"'", $1, $5, $8}' OFS='\t' \
	|tee -a "$LOG" \
	&> /dev/null
  ```
