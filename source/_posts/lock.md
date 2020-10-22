---
title: java中的锁
date: 2018-12-03 09:00:00
categories:
  - Java
  - Concurrent
tags:
  - 学习笔记
---

- ### Lock接口
锁是由来控制多个线程访问共享资源的方式，一般来书哦，一个锁能够防止多个线程同时访问共享资源，在Lock接口出现之前，java程序是依靠synchronized关键字实现锁功能的，儿java5之后，并发包中新增了Lock接口用来实现锁功能。它提供了与synchronized关键字类似的同步功能，知识在使用时需要显示的获取和释放锁。虽然他缺少了饮食获取释放锁的便捷性，但是却拥有了锁获取与释放的可操作性、可中断性的说去锁以及超时锁获取等多种synchronized关键字多不具备的同步特性。  
使用synchronized关键字将会饮食的获取锁，但是他讲锁的获取和释放固话了。  
Lock接口提供的synchronized关键字所不具备的主要特性：  

| 特性| 描述|
| :--- | :--- |
|尝试非阻塞的获取锁|当前线程尝试获取锁，如果这一时刻没有被其他线程获取到，则成功获取并持有锁|
|能被中断的获取锁|与synchronized不同，获取到所得线程能够响应中断，当前获取到锁的想爱你城被中断时，中断异常将会被抛出，同时释放锁|
|超时获取锁|在制定上街区时间之前获取锁，如果截止时间到了仍旧无法获取锁，则返回|


Lock接口API：  

| 方法名称|描述|
|:---|:---|
|void lock() |获取锁，调用该方法当前线程将会获取锁，当锁获得后，从该方法返回|
|void lockInterruptibly() throws InterruptException|可中断的后驱锁，和lock()方法的不同之处在于该方法会响应中断，即在所的获取中可以中断该线程|
|void tryLock()|肠坏死非阻塞的获取锁，调用该方法后立刻返回，如果能够获取则返回true，不能则false|
|void tryLock(long time, TimeUnit unit) throws InterruptException|超时获取锁，下面三种情况会返回：  1. 当地安县城在超时间内获得了锁。2. 当前线程城在超时间内被中断。3. 超时时间结束，返回false|
|void unlock()|释放锁|
|Condition newCondition()|获取等待通知组件，该组件和当前的锁绑定，当前线程只有获取了锁，才能地阿偶用该组件的wait()方法，而调用后，当前线程将释放锁|
