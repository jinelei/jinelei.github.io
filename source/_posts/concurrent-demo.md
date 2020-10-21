---
title: java并发编程实例
date: 2018-12-03 09:00:00
---

### 背景知识
> java从诞生开始就内置对多线程的支持，线程作为操作系统调度的最小单元，多个线程能同时执行，这将显著提升程序性能，在多核环境中表现的更加明显。
>> 现代操作系统在运行一个程序是，会为其创建一个进程。现代操作系统调度的最小单元是线程，也叫轻量级进程，字啊一个进程里可以创建多个线程，这些线程都拥有各自的计数器、对战和局部变量的那个属性，并且能够访问共享内存变量。处理器在说这些线程上高速切换，让使用者感觉这些线程在同时执行。

```java
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;

public class scratch_1 {
    public static void main(String[] args) {
        ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
        ThreadInfo[] threadInfos = threadMXBean.dumpAllThreads(false, false);
        for (ThreadInfo threadInfo : threadInfos) {
            System.out.println("[" + threadInfo.getThreadId() + "] " + threadInfo.getThreadName());
        }
    }
}
```
> 运行结果：
> ```
> [5] Monitor Ctrl-Break
> [4] Signal Dispatcher
> [3] Finalizer
> [2] Reference Handler
> [1] main
> ```

- ### 线程的优先级
现代操作系统基本采用时分的形式调度运行的进程，操作系统会分出一个个时间片，线程会分配若干时间片，当线程的时间片用完了就会发生线程调度，并等待下次分配。线程分配到时间片多少也决定了线程使用处理器资源的多少，儿线程的优先级决定线程需要多或者少扥配一些处理器资源的线程属性。

在java线程中，通过一个整型成员变量priority来控制优先级，优先级的范围从1~10，在新汉城构建的时候通过setProority(int)方法来修改优先级，默认优先级是5，优先级搞得线程分配的时间片的数量要多于优先级地的线程。设置线程优先级是，针对频繁阻塞的线程需要设计较高的优先级，儿片中计算的线程设计交底的优先级，确保处理器不会被独占，在不同的JVM及操作系统上，线程规划会存在差异，有些操作西永甚至会忽略线程优先级的设定。

- ### 线程的状态  

| 状态名称 | 说明 |
| :---: | :---: |
|NEW | 初始状态：线程已经被构建，但是还没有调用start()方法|
|RUNNABLE|运行状态，java线程将操作系统中的就绪和运行两种状态笼统的称作为"运行中"|
|BLOCKED|阻塞状态，表示线程阻塞于锁|
|WAITING|等待状态，表示线程进入等待状态，进图该状态表示当前线程需要等待其他线程做出一些特定操作（通知或者中断）|
|TIME_WAITING|超时等待状态，该状态不同于WAITING，他是可以在指定时间自行返回的|
|TERMINATED|种植状态，表示当前线程已经执行完毕|


- ### Daemon线程
Daemon线程是一种支持性线程，因为它主要被用于程序中后台调度以及支持性工作，这意味着，当一个java虚拟机中不存在飞Daemon线程的时候，java虚拟机将会退出，使用```Thread.setDaemon(true)```将线程设置为Daemon线程。
> Daemon属性需要在启动线程之前设置，不能再启动线程之后设置。
>> 在购将Daemon线程时，不能依靠finally块中的内容来确保执行关闭或者清理资源。

- ### 线程的启动和终止
使用```start()```来启动，随着```run()```执行完毕也随之终止。

- #### 线程的启动
在调用```start()```方法之后，只要java虚拟机认为：线程规划器空闲，就会立刻启动start()

- #### 理解中断
中断可以理解为线程的一个标识位属性，它表示一个运行中的线程是否被其他线程进行了中断操作。中断好比其他线程对该线程打了个招呼，其他线程通过调用该线程的interrupt()方法对其进行中断操作。

线程通过检查自身是否被中断来进行相应，线程通过方法```isInterrupted()```来进行判断是够被中断，也可以调用静态方法```Thread.interrupt()```对当前线程的中断表示进行复位。如果该线程已经处于终结状态，即使该线程被中断过，在电泳该线程对象的```isInterrupted()```时依旧会返回false。

java API中有很多声明抛出InterruptedException的方法。这些方法在抛出INterruptedException之前，java虚拟机会先将该线程中断标识位清除，然后抛出InterruptedException，此时调用isInterrupted()方法会返回false。

- #### 安全的终止线程
通过```thread.interrupt()```和```thread.cancel()```方法均可以。通过标识位或者中断操作的方法能够使线程在终止时后机会去清理资源。

- ### 线线程间通信
    1. synchronized  
    使用了monitorenter和monitorexit指令来实现，monitorenter失败的线程会进入SynchronizedQueue队列进行等待。
    2. 等待/通知机制  
    使用生产者/消费者模式，等待通知机制是内置在Object对象上的。  
    
    |方法名称|描述|
    | :---: | :---: |
    |notify()| 通知一个在对象上等待的线程，使其wait()方法返回，前提是改线程获取到了锁|
    |notifyAll()|通知所有等待在该对象上的线程|
    |wait()| 调用该方法进图WAITTING状态，只有等待另外线程的通知或者被中断才会返回，调用该方法后释放锁|
    |wait(long)| 超时等待，没有在规定时间内得到通知就返回|
    |wait(long, int)|对超时时间更加精细，可以达到纳秒|
    
    3. 管道输入/输出流  
    管道输入输出流和普通文件输入输出流或者网络输入输出流不同的是，它主要用于线程之间的数据传输，而传输的媒介是内存。
    管道输入输出流包含了下面四种实现：PipiedOuputStream、PipedInputStream、PipedReader、PipedWriter，前两种面向字节，后两种面向字符。
    
    4. Thread.join()的使用  
    使用thread.join()可以等待调用该方法线程结束再执行后面代码。
    
    5. ThreadLocal的使用  
    ThreadLocal，即线程变量，是一个以ThreadLocal对象未见、任意对象为值得存储结构。这个结构被附带在线程上，也就是一个线程可以根据一个ThreadLocal对象查询到值。  
    ```java
    class Scratch {
        private static final ThreadLocal<Long> TIME_THREADLOCAL = new ThreadLocal<>();

        public static final void begin() {
            TIME_THREADLOCAL.set(System.currentTimeMillis());
        }

        public static final long end() {
            return System.currentTimeMillis() - TIME_THREADLOCAL.get();
        }

        public static void main(String[] args) {
            Scratch scratch = new Scratch();
            scratch.begin();
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("cost time: " + scratch.end());
        }
    }
    ```
    > ```java cost time: 1001 ```
    
- ### 等待超时模式  
这里的伪代码是：
```java
public synchronized Object get(long mills) throws InterruptedException { // mills 作为超时等待时间
    long future = System.currentTimeMillis() + mills; // 计算最终的返回时间
    long remaining = mills; 
    while((result == null) && remaining > 0){
        wait(remaining); // 这里使用Object.wait(long)进行等待，如果超过等待时间，再去对比future，超出则返回默认值。
        remaining = future - System.currentTimeMillis();
    }
    retrun result;
}
```
