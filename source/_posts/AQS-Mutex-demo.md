---
title: 使用AQS构建的独占锁
date: 2018-12-04 09:00:00
categories:
  - Java
  - Concurrent
---

独占锁的自定义同步组件：
```java
import java.util.concurrent.locks.*;
import java.util.concurrent.TimeUnit;
import java.lang.InterruptedException;
import java.util.Random;

class Mutex implements Lock {
    private static class Sync extends AbstractQueuedSynchronizer{
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
    private final Sync sync = new Sync();
    public void lock(){
        sync.acquire(1);
    }
    public boolean tryLock(){
        return sync.tryAcquire(1);
    }
    public void unlock(){
        sync.release(1);
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
        final Mutex lockDemo = new Mutex();
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
