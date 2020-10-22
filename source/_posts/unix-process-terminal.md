---
title:  "Unix 进程终止 wait waitpid"
date: 2017-07-27 09:00:00
categories:
  - Linux
tags:
  - 学习笔记
---

#### 概要
进程终止共有8种方式，其中5种为正常终止。



- 正常终止：
1. 从main返回。
2. 调用exit。
3. 调用_exit或_Exit。
4. 最后一个线程从其启动例程返回。
5. 最后一个线程调用pthread_exit。
- 异常终止：
6. 调用abort。
7. 接收到一个新号并终止。
7. 最后一个线程对取消请求做出响应。

---
#### exit()、_exit()和_Exit()

```
#include <stdlib.h>
void exit(int status);
void _Exit(int status);
#include <unistd.h>
void _exit(int status);
```

> - 使用不同的头文件的原因是：exit和_Exit是有ISO C说明的，而_exit则是由POSIX.1说明的。  
> - _exit和_Exit立即进入内核，而exit则先执行一些清理处理后(包括执行各种终止处理程序，关闭所有标准I/O流等)进入内核。
>> main执行到最后一条语句时返回（隐式返回），那么该进程的终止状态是0(ISO C 1999版引入的，之前的返回值是未定义的，任意值).

##### 正常终止：

- 在main函数中执行return语句，等效调用exit。
- 调用exit函数（ISO C定义），exit函数将会调用各种终止处理程序（atexit函数登记的），然后关闭标准I/O流等。由于ISO C并不处理文件描述符、多进程以及作业控制，所以对于UNIX来说是不完整的。
- 调用_exit或_Exit函数（ISO C），目的是为晋城提供一种无序运行终止处理程序或信号处理程序而终止的方法。是否对标准I/O流进程冲洗，取决于具体的实现。（Unix中，_exit和_Exit是同义的，不冲洗标准I/O流）。
- 进程的最后一个线程从其启动例程中执行返回语句。但是该返回值不会被作为进程的返回值。其返回值为0.
- 进程的最后一个县城嗲聘用pthrea_exit函数，同前一项已知，终止状态始终为0。

##### 异常终止：
- 调用abort，它将会产生SIGABRT信号。
- 当进程接收到某些信号时，信号可有进程自身（如调用abort函数）、其他进程或内核产生。
- 最后一个线程对“取消”请求做出相应。按系统默认，“取消”一延迟方式发生。即，被要求取消的线程将会等待一段时间才会终止。

---

### atexit()函数
标准ISO C规定，一个进程可以登记多达32个函数，这些函数将由exit自动调用，我们称这些函数为终止处理程序（exit handler），并调用atexit函数来登记这些函数，执行顺序与登记顺序相反。

```
#include <stdlib.h>
int atexit(void (*func)(void));     //返回值：成功返回0，出错非0值
```
> 调用顺序与登记顺序相反，同一函数多次登记也会被多次调用。

---

#### 父进程在子进程之前终止（孤儿进程领养）
内核在一个进程终止时，内核逐个检查所有活动进程的父进程是否为将要终止的进程，如果是，则将该进程的父进程更改为1（init进程）。

#### 子进程在父进程之前终止
内核为每个终止的子进程保存了一定量的信息，所以当终止进程的父进程调用wait或waitpid时，可以得到这些信息。其中至少包括：进程ID、进程终止状态、进程使用的CPU时间总量。内核可以释放终止进程所使用的所有存储区，关闭其打开的所有文件。在Unix术语中，称一个已经终止的、但是其父进程尚未对其进行善后处理（获取终止子进程的有关信息，释放它仍占用的资源）的进程为***僵死进程***（zombie）。ps(1)打印状态为Z。
> init进程将会调用其wait函数以避免产生僵死进程。

#### wait、waitpid

对于任意一种终止情形，内核产生一个指示其异常终止原因的终止状态，在任意情况下，该终止的父进程都能调用wait或waitpid获取其终止状态。
> 退出状态（_exit、_Exit或main的返回值），在最后调用_Exit时，内核将退出状态转换成终止状态。

当一个进程正常或异常终止时，内核就会向其父进程发送SIGCHLD信号。因为子进程终止是一个异步事件，所以这种信号也是异步通知，父进程可以选择忽略，或是处理该信号（信号处理程序）。系统默认动作是忽略它。

父进程调用wait或watipid可能出现以下3种情况：
- 如果子进程还在运行，则阻塞。
- 如果一个子进程已终止，正等待的父进程获取其终止状态，则取得该子进程的终止状态后立刻返回。
- 如果没有任何子进程，则立即出错返回。

```
#include <sys/wait.h>
pid_t wait(int *statloc);
pid_t waitpid(pid_t pid, int *statloc, int options);
//返回值：成功返回进程ID，0,，出错返回-1
```

这两个函数的区别如下：
- 在一个子进程终止前，wait使其调用者阻塞，而waitpif有一个选项，可以使得调用者不阻塞。
- waitpid并不等待在其调用之后的第一个终止子进程，它有若干个选项，可以控制它所等待的进程。

这两个函数均使用参数statloc这个整形指针作为返回值，如果statloc不是空指针，则将返回值存储在指针指向的单元内，如果不关心终止状态，则可将此参数设置为空指针。
返回状态由<sys/wait.h>中提供的各个宏来查看。

|宏|说明|
|---|---|
|WIFEXITED(status)|如果为正常终止则为真，接下来可用WEXITSTATUS(status)，取得进程传给exit、_exit或_Exit参数的低8位|
|WIFSIGNALED(status)|如果为异常终止子进程返回的状态则为真。接下来可可以用WTERMSIG(status)，取得子进程终止的信号编号。某些系统定义了WCOREDUMP(status)来检查进程产生的core文件，有则返回真。|
|WIFSTOPED(status)|如果为当前暂停的子进程的返回状态，则为真，接下来可以用WSTOPSIG(status)来取得子进程的信号编号。|
|WIFCONTINUED(status)| 如果是在作业控制暂停后已经继续的子进程返回了状态，则为真。（POSIX.1的XSI扩展，仅用于waitpid )|

```
#include <sys/wait>
void pr_exit(int status)
{
    if(WIFEXITED(status))
        printf("normal termination, exit status = %d\n", WEXITSTATUS(status));
    else if(WIFSIGNALED(status))
        PRINTF("abnormal termination, signal number = %d\n",
        WTERMSIG(status));
    #ifdef WCOREDUMP
        WCOREDUMP(status) ? " (core file generated)" : "");
    #else
        "")
    #endif
    else if(WIFSTOPPED(status))
        printf("child stopped, signal number = %d\n", WSTOPSIG(status));
}
```
> 信号编号可以查<signal.h>头文件。

未完待续...
