---
title: Unix 进程控制 fork、vfork
date: 2017-07-27 09:00:00
---

#### 概要
进程控制：创建新进程、执行程序和进程终止。
进程属性ID：实际、有效和保存的用户和组ID。
进程控制原语、解释器文件、system函数、进程会计机制。

##### 进程标识符
每个进程都有一个非负整数表示唯一的进程ID。进程ID是唯一的（常用来保证唯一性）、可重用的（系统通常采用延迟重用算法，以避免将新进程误认为使用同一ID的已终止的先前进程）。
> 特殊进程：  
> 调度进程（ID为0）：常常为成为交换进程（swapper）。作为内核的一部分，并不执行任何磁盘上的程序。因此称之为系统进程。  
> init进程（ID为1）：在自举过程中由内核调用（早期系统版本中是/etc/init，在较新版本中是/sbin/init）。此进程负责在自举内核后启动一个unix系统，init通常读取与系统相关的初始化文件（/etc/rc*、/etc/inittab、/etc/init.d），再将系统引导至一个（例如多用户）状态。  
>
>> |调度进程和init进程比较|终止|进程类别|
>> |:---|:---|:---|
>> |调度进程|会终止|内核进程|
>> |init进程|不会终止|用户进程（以超级用户特权运行）|
>
> 页守护进程（ID为2）：特殊系统实现，用来支持虚拟存储系统的分页操作。

```
#include <unistd.h>
pid_t getpid(void);     //返回值：调用进程的进程ID
pid_t getppid(void);    //返回值：调用进程的父进程ID
uid_t getuid(void);     //返回值：调用进程的实际用户ID
uid_t geteuid(void);    //返回值：调用进程的有效用户ID
gid_t getgid(void);     //返回值：调用进程的实际组ID
gid_t getegid(void);    //返回值：调用进程的有效组ID
以上函数均无出错返回。
```

##### fork函数
```
#include <unistd.h>
pid_t fork(void);       //返回值：子进程中返回0，父进程中返回子进程ID，出错返回-1
```
fork函数调用一次，返回两次，根据返回进程ID来区别父子进程。
> 子进程中调用`getppid`来获得父进程ID。  
> 父进程无法获取其所有的子进程ID。

父子进程继续执行forrk之后的指令，子进程是父进程的副本。子进程拥有父进程的数据空间、堆和栈的副本。这里拥有并不共享。父子进程只共享正文段。  
> 写时复制技术（Copy-On-Write）：由于很多实现子进程并不执行父进程的数据段、堆和栈，所以实现时内核只是将其访问权限改为只读，并不直接复制，当其中任意一个试图修改是，内核才会将修改区域的内存制作一个副本。即通常是虚拟存储器系统的一页。
>> fork函数变体。
>> Linux 2.4.22提供了新进程创建函数clone(2)系统调用，特点：允许控制父子进程共享段。  
>> FreeBSD 5.2.1提供了rfork(2)系统调用，类似于Linux的clone。  
>> Solaris 9提供了两个线程库，一个用于POSIX线程（pthread)，另一个用于Solaris线程。

```
#include <stdio.h>
#include <unistd.h>

int glob = 6;
char buf[] = "a write to stdout\n";

int main(int argc, char* argv[])
{

    int var;
    pid_t pid;

    var = 88;
    if(write(STDOUT_FILENO, buf, sizeof(buf)-1) != sizeof(buf)-1)
    {
        printf("write error\n");
    }
    printf("before fork\n");

    if((pid = fork()) < 0)
    {
        printf("fork error\n");
    }
    else if( pid == 0 )
    {
        printf("children process\t\t");
        glob++;
        var++;
    }
    else{
        printf("father process  \t\t");
        sleep(2);
    }

    printf("pid = %d, blob = %d, var = %d\n", getpid(), glob, var);

    exit(0);
}  
```
输出结果：
```
a write to stdout
before fork
children process                pid = 25767, blob = 7, var = 89
father process                  pid = 25766, blob = 6, var = 88
```

> 可见父子进程变量并不共享。  
> 父子进程的调用顺序取决于内核所使用的调度算法。可以使用进程间通信保证父子进程同步。  
>> strlen和sizeof比较： strlen不包括终止null字节长度，sizeof包括终止null字节长度；strlen属于函数调用，sizeof属于编译时已知。  
> write函数：write函数不带缓冲，在fork之前调用write函数是为了保证缓冲区干净。  
>> 子进程会复制父进程缓冲区。  
>> 子进程复制父进程所有打开的文件描述符。
>>> fork之后处理文件描述符的两种常见情况：  
>>> 1. 父进程等待子进程完成。当子进程终止后，所有进行过读、写操作的任一文件描述符的文件偏移量都已执行了相应的更新。
>>> 2. 父子进程各自执行不同的程序段。在fork之后，父子进程各自关闭它们不需要的文件描述符，这样的不会干扰对方使用的文件描述符。通常在网络服务进程中使用此方法。  
>
>> 其他被子进程继承的属性：
>> * 实际用户ID、实际组ID、有效用户ID、有效组ID。
>> * 附加组ID。
>>* 进程组ID。
>>* 会话ID。
>>* 控制终端。
>>* 设置用户ID和设置组ID标志。
>>* 当前工作目录。
>>* 根目录。
>>* 文件模式创建屏蔽字。
>>* 信号屏蔽和安排。
>>* 针对任一打开文件描述符的在执行时关闭标志。
>>* 环境。
>>* 连接的共享存储段。
>>* 存储映射。
>>* 资源限制。
>
>> 父子进程之间的区别：
>>>* fork返回值。
>>>* 进程ID不同。
>>>* 进程父ID不同：子进程父ID是创建它的进程ID，父进程的父ID不变。
>>>* 子进程的tms_utime、tms_stime、tms_cutime以及tms_ustime均被设置为0。
>>>* 父进程设置的文件锁不被继承。
>>>* 子进程的未处理的闹钟被清除。
>>>* 子进程未处理的信号集被设置为空集。
>
>>fork失败的主要原因：系统有太多的进程，或者该实际用户ID的进程综述超过了系统限制。（PS：CHILD_MAX控制了每个实际用户ID在任意时刻可具有的最大进程数）。
>

##### vfork函数
vfork用于创建一个新进程，二该新进程的目的是exec一个新程序。
fork、vfork区别：vfork保证子进程现运行，在它调用exec或exit之后父进程才运行（可能导致死锁）；vfork并不完全复制父进程的地址空间。  

|fork、vfork比较|复制|执行顺序|
|:---|:---|:---|
|fork|完全复制|不保证|
|vfork|不完全复制（子进程会立刻调用exec或exit）|子进程先行，子进程exec或exit后，父进程再运行|

> 在子进程exec或exit之前，子进程运行在父进程的地址空间。  

```
#include <stdio.h>
#include <unistd.h>

int glob = 6;
char buf[] = "a write to stdout\n";

int main(int argc, char* argv[])
{

    int var;
    pid_t pid;

    var = 88;
    if(write(STDOUT_FILENO, buf, sizeof(buf)-1) != sizeof(buf)-1)
    {
        printf("write error\n");
    }
    printf("before fork\n");

    if((pid = vfork()) < 0)
    {
        printf("fork error\n");
    }
    else if( pid == 0 )
    {
        printf("children process\t\t");
        glob++;
        var++;
        printf("pid = %d, blob = %d, var = %d\n", getpid(), glob, var);
        _exit(0);
    }
    else{
        printf("father process  \t\t");
        printf("pid = %d, blob = %d, var = %d\n", getpid(), glob, var);
        //sleep(2);
    }


    exit(0);
}

```

执行结果

```
a write to stdout
before fork
children process                pid = 29968, blob = 7, var = 89
father process                  pid = 29967, blob = 7, var = 89
```
>可以看出在子进程执行_exit(0)之前，父子进程处于同一片地址空间。
>> exit和_exit(0)的区别: _exit(0)并不执行标准I/O缓冲的冲洗操作;exit实现了冲洗所有标准I/O流.也可能实现了关闭标准I/O流(取决于系统实现,大多数现代exit实现军不在关闭流,因为进程终止前,内核将关闭所有已打开的文件描述符.在库中关闭没有必要了).
