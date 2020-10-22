---
title:  "shell统计代码字数"
date: 2017-06-01 09:00:00
categories:
  - Linux
tags:
  - 备忘录
---

```
#!/bin/bash
dir="/home/jinelei/Projects/IdeaProjects/Web/JinLive/src"
tmp_dir=""

java_file=0
xml_file=0
ftl_file=0
properties_file=0

java_file_l=0
xml_file_l=0
ftl_file_l=0
properties_file_l=0

java_file_w=0
xml_file_w=0
ftl_file_w=0
properties_file_w=0

java_file_c=0
xml_file_c=0
ftl_file_c=0
properties_file_c=0

for file in `ls -R $dir`
do
    if [ -n "`echo $file|sed -n "/^.*:\$/p"`" ]; then 
        #echo -e $file;
        tmp_dir=${file%%:}
    elif [ -n "`echo $file|sed -n "/^.*\.java\$/p"`" ]; then
        tmp_w=`cat "$tmp_dir/$file" |wc -w`
        java_file_w=`expr $java_file_w + $tmp_w`
        tmp_c=`cat "$tmp_dir/$file" |wc -c`
        java_file_c=`expr $java_file_c + $tmp_c`
        tmp_l=`cat "$tmp_dir/$file" |wc -l`
        java_file_l=`expr $java_file_l + $tmp_l`
        java_file=`expr $java_file + 1`
        #echo -e  "linecount: $tmp\t\tfilename: $file\t\t\tdirectoryname: ${tmp_dir##${dir}}"
    elif [ -n "`echo $file|sed -n "/^.*\.xml\$/p"`" ]; then
        tmp_w=`cat "$tmp_dir/$file" |wc -w`
        xml_file_w=`expr $xml_file_w + $tmp_w`
        tmp_c=`cat "$tmp_dir/$file" |wc -c`
        xml_file_c=`expr $xml_file_c + $tmp_c`
        tmp_l=`cat "$tmp_dir/$file" |wc -l`
        xml_file_l=`expr $xml_file_l + $tmp_l`
        xml_file=`expr $xml_file + 1`
        #echo -e  "linecount: $tmp\t\tfilename: $file\t\t\tdirectoryname: ${tmp_dir##${dir}}"
    elif [ -n "`echo $file|sed -n "/^.*\.ftl\$/p"`" ]; then
        tmp_w=`cat "$tmp_dir/$file" |wc -w`
        ftl_file_w=`expr $ftl_file_w + $tmp_w`
        tmp_c=`cat "$tmp_dir/$file" |wc -c`
        ftl_file_c=`expr $ftl_file_c + $tmp_c`
        tmp_l=`cat "$tmp_dir/$file" |wc -l`
        ftl_file_l=`expr $ftl_file_l + $tmp_l`
        ftl_file=`expr $ftl_file + 1`
        #echo -e  "linecount: $tmp\t\tfilename: $file\t\t\tdirectoryname: ${tmp_dir##${dir}}"
    elif [ -n "`echo $file|sed -n "/^.*\.properties\$/p"`" ]; then
        tmp_w=`cat "$tmp_dir/$file" |wc -w`
        properties_file_w=`expr $properties_file_w + $tmp_w`
        tmp_c=`cat "$tmp_dir/$file" |wc -c`
        properties_file_c=`expr $properties_file_c + $tmp_c`
        tmp_l=`cat "$tmp_dir/$file" |wc -l`
        properties_file_l=`expr $properties_file_l + $tmp_l`
        properties_file=`expr $properties_file + 1`
        #echo -e  "linecount: $tmp\t\tfilename: $file\t\t\tdirectoryname: ${tmp_dir##${dir}}"
    fi
done

echo -e "result:" 
echo -e "java file:\t$java_file\t\tjava line:\t$java_file_l\t\tjava word:\t$java_file_w\t\tjava char:\t$java_file_c" 
echo -e "xml file:\t$xml_file\t\txml line:\t$xml_file_l\t\txml word:\t$xml_file_w\t\txml char:\t$xml_file_c" 
echo -e "ftl file:\t$ftl_file\t\tftl line:\t$ftl_file_l\t\tftl word:\t$ftl_file_w\t\tftl char:\t$ftl_file_c" 
echo -e "prop file:\t$properties_file\t\tprop line:\t$properties_file_l\t\tprop word:\t$properties_file_w\t\tprop char:\t$properties_file_c"
echo -e "total file:\t`expr $java_file + $xml_file + $ftl_file + $properties_file`\t\ttotal line:\t`expr $java_file_l + $xml_file_l + $ftl_file_l + $properties_file_l`\t\ttotal word:\t`expr $java_file_w + $xml_file_w + $ftl_file_w + $properties_file_w`\t\ttotal char:\t`expr $java_file_c + $xml_file_c + $ftl_file_c + $properties_file_c`"
```
