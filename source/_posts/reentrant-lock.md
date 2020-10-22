---
title:  "锁"
date: 2018-12-01 09:00:00
categories:
  - Java
  - Concurrent
tags:
  - 学习笔记
---

锁的获取和释放和volatile是一致的。

- ### 锁内存语义的实现
```java
class ReentrantLockExample {
    int a = 0;
    ReentrantLock lock = new ReentrantLock();
    public void writer(){
        lock.lock();
        try{
            a++;
        }finally{
            lock.unlock();
        }
    }
    public void reader(){
        lock.lock();
        try{
            int i = a;
        }finally{
            lock.unlock();
        }
    }
}
```
> 在这里的代码中，使用```lock()```和```unlock()```方法来实现获取锁和释放锁。
> ```ReentrantLock```的实现依赖于java同步框架AbstractQueuedSynchronizer（AQS)。AQS中使用了一个整型的volatile变量（state）来维护同步状态。
