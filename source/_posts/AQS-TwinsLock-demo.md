---
title: 使用AQS构建的共享锁
date: 2018-12-04 09:00:00
categories:
  - Java
  - Concurrent
tags:
  - 学习笔记
---

共享锁的自定义同步组件：
```java
import java.util.concurrent.locks.*;
import java.util.concurrent.TimeUnit;
import java.lang.InterruptedException;
import java.lang.Thread;
import java.util.Random;

class TwinsLock implements Lock {
    private static class Sync extends AbstractQueuedSynchronizer{
        Sync(int count){
            if(count <= 0){
                throw new IllegalArgumentException("count must large than zero");
            }
            setState(count);
        }
        public int tryAcquireShared(int reduceCount){
            for(;;){
                int current = getState();
                int newCount = current - reduceCount;
                if(newCount < 0 || compareAndSetState(current, newCount)){
                    return newCount;
                }
            }
        }
        public boolean tryReleaseShared(int returnCount){
            for(;;){
                int current = getState();
                int newCount = current + returnCount;
                if(compareAndSetState(current, newCount)){
                    return true;
                }
            }
        }
        protected boolean isHeldExclusively(){
            return getState() == 1;
        }
        public boolean tryAcquire(int acquires){
            if(compareAndSetState(0, 1)){
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }
        protected boolean tryRelease(int releases){
            if(getState() == 0) throw new IllegalMonitorStateException();
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }
        Condition newCondition(){
            return new ConditionObject();
        }
    }
    private final Sync sync = new Sync(2);
    public void lock(){
        sync.acquireShared(1);
    }
    public boolean tryLock(){
        return sync.tryAcquire(1);
    }
    public void unlock(){
        sync.releaseShared(1);
    }
    public Condition newCondition(){
        return sync.newCondition();
    }
    public boolean isLocked(){
        return sync.isHeldExclusively();
    }
    public boolean hasQueuedThread(){
        return sync.hasQueuedThreads();
    }
    public void lockInterruptibly() throws InterruptedException{
        sync.acquireInterruptibly(1);
    }
    public boolean tryLock(long timeout, TimeUnit unit) throws InterruptedException{
        return sync.tryAcquireNanos(1, unit.toNanos(timeout));
    }
    public static void main(String[] args) throws Exception{
        final TwinsLock lockDemo = new TwinsLock();
        class ThreadDemo extends Thread{
            public void run(){
                System.out.println(Thread.currentThread().getName() + ": waiting");
                lockDemo.lock();
                System.out.println(Thread.currentThread().getName() + ": running");
                long count = new Random().nextInt(1000000000) + 1000000000;
                while(count-- > 0);
                System.out.println(Thread.currentThread().getName() + ": end");
                lockDemo.unlock();
            }
        }
        for(int i = 0; i < 10; i++){
            ThreadDemo thread = new ThreadDemo();
            thread.setName("thread " + i);
            thread.start();
        }
    }
}
```
