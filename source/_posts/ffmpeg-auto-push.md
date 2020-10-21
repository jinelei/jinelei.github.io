---
title:  "ffmpeg自动推流到指定ip"
date: 2018-11-06 09:00:00
---

```
#!/bin/bash
video_dir="/home/jinelei/videos"
server_ip="192.168.31.169"
default_stream_name="video"
default_index="0"
flag=0
while getopts "d:f:s:i:Hh" arg
do
    case $arg in
        d)
            video_dir=$OPTARG
            ;;
        i)
            server_ip=$OPTARG
            ;;
        ?)
            echo "Usage jin-auto-ffmpeg [-d][dir_name] [-i][server_ip]"
            ;;
    esac
done

if [ -e $video_dir ]
then
    flag=`echo "$flag+1"|bc`
else
    echo "please input vaild dir name"
fi
if [ -n "`echo $server_ip|sed -n "/^.*\..*\..*\..*\$/p"`" ]
then
    flag=`echo "$flag+1"|bc`
else
    echo "please input vaild ip address"
fi

tmp_fifo_file="/tmp/$$.fifo"
mkfifo $tmp_fifo_file
exec 4<> $tmp_fifo_file
rm -rf $tmp_fifo_file

if [ $flag -eq 2 ] 
then
    for tmp_name in `ls $video_dir`
    do
        if [ -n "`echo $tmp_name|sed -n "/^.*\.mp4\$/p"`" ]
        then
            video_file_name=$tmp_name;
            #video_stream_name=${tmp_name%%.mp4}
            video_stream_name="$default_stream_name$default_index"
            default_index=`echo "$default_index+1"|bc`
            {
            ffmpeg -re -i "$video_dir/$video_file_name"  -codec:v libx264 -acodec aac -f flv -c copy "rtmp://$server_ip:1935/live/$video_stream_name" >> /dev/null
            }&
        fi
    done;
else
    echo "Usage jin-ffmpeg [-d][dir_name] [-i][server_ip]"
fi

wait
exec 4>&-
exit
```
