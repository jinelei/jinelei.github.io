---
title:  "vSphere hypervisor 6.5安装"
date: 2018-12-29 09:00:00
categories:
  - Linux
tags:
  - 学习笔记
---

1. #### 前置安装环境：
win7最好。

1. #### 制作安装盘的准备工作：
    2. 下载需要的软件包和镜像。

    2. 在[vmware官网](https://www.vmware.com/cn.html)注册账号
    ![download](/img/post/linux/vsphere_download.webp)
    > 请记住这里的许可证密钥，安装完成后在web控制台需要。
    > 点击下方的下载按钮，下载镜像文件i(VMware vSphere Hypervisor (ESXi ISO) image (Includes VMware Tools))。

    2. [检查](https://vibsdepot.v-front.de/wiki/index.php/List_of_currently_available_ESXi_packages)自己的机器硬件，下载对应的驱动程序。

    2. 下载[ESXi定制工具](https://www.v-front.de/p/esxi-customizer.html)，不支持win10。[如果硬件驱动均在官方镜像包中，则不需要定制镜像]
        3. 解压ESXi定制工具。
        3. 进入解压目录，双击执行脚本(ESXi-Customizer.cmd)。
        3. Select the original VMware ESXi ISO: 选择官方的原始ISO。
        3. Select an OEM.tgz file, a VIB file or an Offline Bundle: 选择自己机器需要添加的驱动程序。
        3. select work directory: 选择输出目录。
        3. 点击run按钮。
        3. 忽略中途出现的警告，直至完成。




1. #### 制作ESXi安装盘
安装系统有很多种选择。
- 例如大白菜等安装工具，选择安装自定义ISO。
- 使用dd命令、UISO工具制作启动盘安装。

1. #### 安装ESXi
选择磁盘安装即可。无脑接受下一步，注意设置账户名和密码。
安装完成后开机，显示器上会显示本机ip地址。

1. #### 安装虚拟机（我这里使用ISO创建虚拟机）
- 在浏览器中打开上一步得到的ip地址，进入web管理页面：
- 输入账户、密码（安装时提示输入的）。
- 点击左侧虚拟机，右键选择选择 创建/注册虚拟机。
- 在弹出中选择 创建虚拟机。点击下一页。
- 添加名称和操作系统系列和操作系统版本。点击下一页。
- 选择存储类型和数据存储，选择需要的磁盘。点击下一页。
- 创建自定义设置。磁盘、内存、在CD/DVD驱动中选择数据储存ISO文件。选择自己上传的ISO镜像即可（如果之前没有上传，在这里也可以执行上传操作）。点击下一页。
- 确认配置后点击完成。
- 在虚拟机中打开刚才自己创建的虚拟机。执行常规安装系统操作。

1. #### 添加许可证。
- 点击左侧主机下管理。选择许可tab页。
- 点击分配许可证，在弹出框中输入自己账户的许可证，点击检查许可证。
- 完成操作后，在许可tab页中会出现键信息。

1. #### [可选的]设置静态ip。
具体操作方法请参考相应系统设置。[centos7设置静态IP](https://jinelei.github.io/linux/2018/05/10/static-ip)

