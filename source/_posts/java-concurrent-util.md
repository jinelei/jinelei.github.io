---
title: Java中的并发工具类
date: 2018-12-05 09:00:00
categories:
  - Java
  - Concurrent
---

JDK并发包中提供了几个非常有用的并发工具类。CountDownLatch、CyclicBarrier和Semaphore工具类提供了并发流程控制手段，Exchanger工具类则提供了线程间交换数据的一种手段。

- ### 等待多线程完成COuntDownLatch
```java
import java.util.concurrent.*;

public class CountDownLatchDemo {
    static CountDownLatch c = new CountDownLatch(2);
    public static void main(String[] args) throws Exception{
        new Thread(new Runnable(){
            @Override
            public void run(){
                System.out.println(1);
                c.countDown();
                System.out.println(2);
                c.countDown();
            }
        }).start();
        c.await();
        System.out.println(3);
    }
}
```

- ### 同步屏障CyclicBarrier
CyclicBarrier字面意思是可循环使用（Cyclic）的屏障（Barrier）。他要做的事情是，让一组线程到达一个屏障是被阻塞，直到最后一个线程到达屏障时，屏障才会开门，所有线程继续运行。
```java
import java.util.concurrent.*;

public class CyclicBarrierDemo {
    static CyclicBarrier c = new CyclicBarrier(2);
    public static void main(String[] args){
        new Thread(new Runnable(){
            @Override
            public void run(){
                try{
                    long count = 1000000000L;
                    while(count-- > 0);
                    c.await();
                }catch(Exception e){
                    System.out.println(e.toString());
                }
                System.out.println(1);
            }
        }).start();
        try{
            c.await();
        }catch(Exception e){
            System.out.println(e.toString());
        }
        System.out.println(2);
    }
}
```

CyclicBarrier提供了一个更高级的构造函数```CyclicBarrier(int parties, Runnable barrierAction)```，用于在线程到达屏障时，优先执行barrierAction。

- ### 控制并发线程数量的Semaphore
信号量（Semaphore）是用来控制同事访问待定资源的线程适量，它通过协调各个线程，以保证合理使用公共资源。

应用场景：  
Semaphore可以用来做流量控制，特别是公共资源有限的场景，比如数据库连接。假如有一个需求，尧都区几万个文件的数据，因为都是IO密集型任务，我们可以启动几十个线程并发的读取，但是如果读到内存后，还需要存储到数据库中，而数据库连接数只有10个，这时必须要控制只有10个线程同时获取到数据库连接保存数据。这是使用Semaphore来做流量控制。
