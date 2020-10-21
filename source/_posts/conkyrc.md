---
title:  "conkyrc配置示例"
date: 2018-11-08 09:00:00
categories:
  - Linux
  - Conky
---

我的conkyrc配置

```
background 1
background yes
use_xft yes
#xftfont WenQuandwYi Micro Hei Light:size=17
xftfont Roboto:size=20
template1 ${font Roboto:size=20}
override_utf8_locale yes
update_interval 1
total_run_times 0
double_buffer yes
no_buffers yes
net_avg_samples 2
text_buffer_size 1024
own_window yes
own_window_transparent yes
own_window_type override
own_window_hints undecorated,below,sticky,skip_taskbar,skip_pager
draw_borders no
short_units yes
border_margin 1
default_color 33a3dc
draw_shades no
#minimum_size 1100 0
#color
#黄
color1 FFA300
#若绿
color2 7fb80e
#设置最大宽度
#maximum_width  600
#设置对齐方式:上右
alignment tr
#设置边距
gap_x 35
gap_y 35

#lua_load /home/jinelei/github/script/conkyrc/conky_widgets-v1.1.lua
#lua_draw_hook_pre widgets
#lua_load /home/jinelei/scripts/rings-v1.2.lua
#lua_draw_hook_pre ring_stats

TEXT
#显示时间
${color 2a5caa}$color1${font Source Han Sans CN Normal:size=50}${time %H:%M}
#显示秒
${voffset -110}${color 7fb80e}${alignr}${font Source Han Sans CN Normal:pixelsize=90}${time %S}
#显示日期星期
${voffset -160}
${color b2d235}${font Source Han Sans CN Normal:style=Bold:size=15}${time %b%d %a}
#显示内核
${voffset 20}${kernel}  ${machine}   ${sysname}
#绘制横线
${stippled_hr}
#监视CPU
$template1$color1 CPU: $color $alignr ${offset -220}${cpubar cpu}
#${cpugraph}
#监视硬盘
$template1$color1 /$color$alignr ${offset -220}${fs_bar /}
$template1$color1 /home$color$alignr ${offset -220}${fs_bar /home}
#$template1$color1 /opt$color$alignr ${offset -220}${fs_bar /opt}
#$template1$color1 /boot$color$alignr ${offset -220}${fs_bar /boot}
#硬盘读写
${voffset 8}$template1$color1 ${diskio} $alignr${voffset -8} $color ${offset -215}${diskiograph}
#监视网速
$color${downspeedgraph wlp2s0 32,150 ff0000 0000ff}${upspeedgraph wlp2s0 32,150 ff0000 0000ff}
$color1${offset 50}${voffset 20}$template1${downspeed wlp2s0}$alignr${offset -40}${upspeed wlp2s0}
#绘制横线
${stippled_hr}
#监视内存
$template1$color1 Men: ${offset 9}$color$alignr$mem / $memmax
#监视进程
$color1 Proc: $color$alignr${processes}
#监视温度
$color1$color1 Temp:  $alignr$color${acpitemp}
#监视IP
$color$template1$color1 IP: $alignr$color${addr wlp2s0}
#${image /home/jinelei/Picture/test.jpg  -s 300x700 }
#绘制横线
${stippled_hr}

${color1}RAM ${color1}${alignr}${mem}
${color1}${membar 5,}
${color1}$template1${top_mem name 1} $alignr ${color2} ${top_mem mem_res 1}
${color1}$template1${top_mem name 2} $alignr ${color2} ${top_mem mem_res 2}
${color1}$template1${top_mem name 3} $alignr ${color2} ${top_mem mem_res 3}
${color1}$template1${top_mem name 4} $alignr ${color2} ${top_mem mem_res 4}
${color1}$template1${top_mem name 5} $alignr ${color2} ${top_mem mem_res 5}
${color1}$template1${top_mem name 6} $alignr ${color2} ${top_mem mem_res 6}
${color1}$template1${top_mem name 7} $alignr ${color2} ${top_mem mem_res 7}
${color1}$template1${top_mem name 8} $alignr ${color2} ${top_mem mem_res 8}
${color1}$template1${top_mem name 9} $alignr ${color2} ${top_mem mem_res 9}
```
