---
title: AQS介绍
date: 2018-12-03 09:00:00
categories:
  - Java
  - Concurrent
tags:
  - 学习笔记
---

- ### 队列同步器
队列同步器AbstractQueuedSynchronizer，是用来构建锁或者其他同步组件的基础框架，它使用了一个int成员变量来表示同步状态，通过内置的FIFO队列来完成资源获取线程的排队工作。
同步器的主要使用方式是继承，子类通过继承同步器并实现它的抽象方法类管理同步状态，在抽象方法实现过程中免不了要对同步状态进行更改，这还少就需要使用同步器中提供的3个方法(getState()、setState(int newState）、compareAndSetState(int except, int update))来进行操作，因为他们能够保证状态的改变是安全的。自雷推荐被定义为自定义同步组件的静态内部类，同步器吱声没有实现任何同步接口，它仅仅是定义了若干同步状态获取和释放的方法来供自定义同步组件使用，同步器既可以支持度独占式的获取同步状态，也可以支持共享式的获取，这样就可以实现不同类型的同步组件（ReentrantLock、ReentrantReadWriteLock和CountDownLatch等）。  
同步器是实现锁的关键，在锁的实现中聚合了同步器，利用同步器实现锁的语义，可以这样理解：锁是面向使用者的，他定义了使用者与锁的交互接口，隐藏了实现细节；同步器是面向锁的实现者，它简化了锁的实现方式，屏蔽了同步状态管理、线程的排队、等待与唤醒等底层操作。锁和同步器很好的隔离了使用者和实现者所关注的领域。  
1. 队列同步器的接口与示例
同步器的设计师基于模板方法模式的，也就是说使用者需要继承同步器并重写指定的方法，随后将同步器组合在自定义的同步组件的实现中，并调用同步器提供的模板方法，而这些模板方法将会调用使用者重写的方法。

重写同步器指定方法时，需要使用同步器提供如下方法。  
    1. getState()：获取当前同步状态
    2. setState(int newState)：设置当前同步器状态
    3. compareAndSetState(int expect, int update)：使用CAS设置当前状态，该方法能够保证设置的原子性
    
    同步器可重写的方法与描述：
   
|方法名称|描述|
|:--- |:---|
|protected boolean tryAcquire(int arg)|独占式获取同步状态，实现该方法需要查询当前状态并判断同步状态是否符合预期，然后在进行CAS设置同步状态|
|protected boolean tryRelease(int arg)|独占式释放同步状态，等待同步状态的线程将有机会获取同步状态|
|protected int tryAcquireShared(int arg)|共享式获取同步状态，返回大于等于0的值，表示获取成功，反之失败|
|protected int tryReleaseShared(int arg)|共享式释放同步状态|
|protected boolean isHeldExclusively()|当前同步器是否在独占模式下被线程占用，一般该方法表示是否被当前线程占用|

同步器提供的模板方法基本上分为3类：独占式的获取与释放同步状态、共享式的获取与释放同步状态和查询同步队列中的等待线程情况。自定义同步组件将会使用同步器提供的模板方法来实现自己的同步语义。


> 这里实现的同步组件只允许一个线程占有锁，Mutex中定义了一个静态内部类，该内部类继承了同步器并实现了独占式后驱和释放同步状态。在tryAcquire(int acquires)中，如果经过CAS设置成功（同步状态设置为1），则代表获取了同步状态，而在tryRelease(int releases)方法中只是将同步状态设置为0。用户使用Mutex时不会直接和内部同步器的实现大脚到，而是直接调用Mutex中提供的方法。

- #### 队列同步器实现分析
这里重点分析同步器是如何完成线程同步的，主要包括：同步队列、苏展示同步状态的获取与释放、共享式同步状态获取与释放以及超市获取同步状态等同步器的核心数据结构与模板方法。  

1. ##### 同步队列
同步器依赖内部的同步队列来完成同步状态的管理，当前线程获取同步状态失败时，同步器将会对当前线程以及等待状态等信息构成一个节点并将其加入同步队列，同时将会阻塞当前线程，当同步状态释放时，会把首节点中的线程唤醒，时期再次尝试获取同步状态。  
同步队列中的节点Node用来保存获取同步状态失败的线程引用、等待状态以及前驱和后继节点，节点的属性类型及名称以及描述如下：  

|属性类型以及名称|描述|
|:---|:---|
|int waitStatus| 等待状态，包含以下状态：  |
|  |1. CANCELLED，值为1，由于在永不队列中等待的线程鞥带超时或者被中断，需要从同步队列中取消等待，节点进入该状态将不会变化|
|  |2. SIGNAL，值为-1，后继节点的线程处于等待状态，而当前节点的线程如果释放了同步状态或者被取消，将会通知后继结点，是后继节点的线程继续运行|
|  |3. CONDITION，值为-2，节点在等待队列中，节点线程等待在Condition上，当其他线程对Condition调用了signal()后该节点将会从等待队列中转移到同步队列中，加入到同步状态的获取中|
|  |4. PROPAGATE，值为-3，表示下一次共享式同步状态获取将会无条件的传播下去|
|  |4. INITIAL，值为0，初始状态|
|Node prev|前驱节点，当节点加入同步队列时被设置（尾部添加）|
|Node next|后继节点|
|Node nextWaiter|等待队列中的后继节点。如果当前节点是共享的，那么这个字段将是一个常量，也就是说节点类型（独占或共享）和等待队列中的后继节点共用同一个字段|
|Thread thread|获取同步状态的线程|

> 节点是构成同步队列的基础，同步器将拥有首节点和尾节点，没有成功获取同步状态的线程将会成为节点加入到同步队列的尾部。
>> - 同步器提供了一个机遇CAS的设置尾节点的方法：compareAndSetTail(Node expect, Node update)，它需要传递当前线程"认为"的尾节点和当前节点，只有设置成功后，当前节点才正式与之前的尾节点建立关联。  
>> - 同步队列遵守FIFO，首节点是获取同步状态成功的节点，首节点的线程在释放同步状态时，将会唤醒后继节点，而后继节点将会在获取同步状态成功时将自己设置为首节点。PS：首节点的设置是通过获取同步状态成功的线程设置的，因此线程安全。  

2. ##### 独占式同步状态的获取与释放
通过调用同步器的acquire(int arg)方法可以获取同步状态，该方法对中断不敏感，也就是由于线程获取同步状态失败后进图同步队列中，后继对线程进行中断操作时，线程不会从同步队列中移除。
- 同步器的acquire方法（同步状态的获取）：
```java
public final void acquire(int arg) {
    if(!tryAcquire(arg) && 
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```
> - 这里先使用!tryAcquire尝试获取同步状态，失败后加入同步队列中
> - 构造同步节点（独占式：Node.EXCLUSIVE）并通过addWaiter加入到同步队列尾部，最后调用acquireQueued(Node node, int arg)方法，该节点以死循环的方式获取同步状态。如果获取不到阻塞节点中的线程，而被阻塞线程的唤醒主要依靠前驱节点的出队或者阻塞线程被中断来实现。
下面是构建Node以及添加入同步队列的实现：
```java
private Node addWaiter(Node mode){
    Node node = new Node(Thread.currentThread(), mode); //这里构建节点，并使用参数的模式
    Node pred = tail; // 获取尾节点
    if(pred != null){ // 这里尝试了快速在尾部添加节点
        node.prev = pred;
        if(compareAndSetTail(pred, node)){
            pred.next = node;
            return node;
        }
    }
    enq(node); // 这里同步器使用死循环来保证节点添加
    return node;
}
private Node enq(final Node node){
    for(;;){
        Node t = tail;
        if(t == null){ // 尾节点为空，将尾节点指向头结点
            if(compareAndSetHead(new Node()))
                tail = head;
        }else{ // 将需要添加的节点的前驱节点指向tail，并将node添加到队尾
            node.prev = t;
            if(compareAndSetTail(t, node)){
                t.next = node;
                return t;
            }
        }
    }
}
```
> 这里enq方法将添加节点变得串行化了。（自旋）
接下来我们看acquireQueue(final Node node, int arg)，当前线程在"死循环"中尝试获取同步状态，只有同步队列头结点才能尝试获取同步状态：
1. 头结点是成功获取到同步状态的节点，而头结点的线程释放了同步状态之后，将会唤醒其后继节点，后继节点被唤醒之后需要检查自己的前驱节点是否是头结点（即同步队列头）。
2. 维护同步队列的FIFO原则，该方法中，节点自旋获取同步状态。

- 同步器的release方法（同步状态的释放）：
```java
public final boolean release(int arg){
    if(tryRelease(arg)){ // 尝试释放
        Node h = head;
        if(h != null && h.waitStatus != 0) 
            unparkSuccessor(h); // 这里使用LockSupport来唤醒处于等待状态的线程
        return true;
    }else{
        return false;
    }
}
```

3. ##### 共享式同步状态的获取与释放
共享式获取与独占式获取主要的区别在于同一时间能否有多个线程同时获取到同步状态。以为内件的读写为例，如果一个程序正在对文件进行读操作，那么这一时刻对于该文件的写操作均被阻塞，而读操作能够同时进行。写操作要求对资源的独占式访问，而读操作可以是共享式访问。
获取同步状态代码如下
```java
public final void acquireShared(int arg){
    if(tryAcquireShared(arg) < 0){ // 1
        doAcquireShared(arg);
    }
}
private void doAcquireShared(int arg){
    final Node node = addWaiter(Node.SHARED); // 2
    boolean failed = true;
    try{
        boolean interrupted = false;
        for(;;){ // 3
            final Node p = node.predecessor();
            if(p == head){
                int r = tryAcquireShared(arg);
                if(r >= 0){
                    setHeadAndPropagate(node, r);
                    p.next = null;
                    if(interrupted){
                        selfInterrupt();
                    }
                    failed = false;
                    return;
                }
            }
            if(shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    }finally{
        if(failed)
            cancelAcquire(node);
    }
}
```
> 1: 同步器先尝试调用tryAcquireShared(int arg)方法尝试获取同步状态，返回值大于等于0时成功获取状态。因此，在共享式获取的自旋过程中，成功获取到的同步状态并退出自旋的田间就是tryAcquireShared(int arg)返回值大于等于0。可以看到，在doAcquireShared(int arg)方法的自旋过程中吐过当前节点的前去为头结点是，尝试获取去同步状态，如果返回值大于等于0，表示盖茨获取同步状态成功并从自旋过程中退出。  
与独占式一样，共享式获取也需要释放同步状态，通过调用releaseShared(int arg)方法可以释放同步状态，
```java
public final boolean releaseShared（int arg）{
    if(tryReleaseShared(arg)){
        doReleaseShared();
        return true;
    }
    return false;
}
```
> 该方法在释放同步状态后，将会唤醒后续处于等待状态的节点。对于呢能够支持多个线程同时访问的并发组件，他和独占式的主要区别在于tryReleaseShared(int arg)方法必须确保同步状态线程安全释放，一般是通过循环和CAS来保证的。因为释放同步状态的操作会同时来自多个线程。

4. ##### 独占式超时获取同步状态
通过调用同步器的doAcquireNanos(int arg, long nanosTimeout)方法可以超时获取同步状态，记载指定的时间段内获取同步状态，如果获取到同步状态则返回true，否则返回false。该方法提供传统java同步操作所不具备的特性。
> 背景知识：  
> 响应中断的同步状态获取的过程。在java5之前，当一个线程获取不到锁而被阻塞在synchronized之外时，对该线程进行中断操作，此时该线程的终端标志位会被修改，但是线程依旧会阻塞在synchronized上，等待获取锁。在java5中，同步器提供了acquireInterruptibly(int arg)方法，这个方法在等待获取同步状态时，如果当前线程被中断，会立刻返回，并抛出InterruptedException。  

超时后去同步状态过程可以视作响应中断获取同步状态的加强版，doAcquireNanos(int arg, long nanosTimeout)方法在支持响应中断的基础上，增加了超时获取的特性，针对超时获取，主要需要计算出需要睡眠的时间间隔nanosTimeout，为了防止过早通知，nanosTimeous的计算公式为：nanosTimeout -= now - lastTime，其中now为当前唤醒时间，lastTime为上次唤醒时间，如果nanosTimeout大于0则表示超时时间未到，需要继续睡眠nanosTimeout纳秒，反之表示已经超时。
```java
private boolean doAcquireNanos(int arg, long nanosTimeout) throws InterruptedException{
    long lastTime = System.nanoTime();
    final Node node = addWaiter(node.EXCLUSIVE);
    boolean failed = true;
    try{
        for(;;){
            final Node p = node.predecessor();
            if(p == head && tryAcquire(arg)){
                setHead(node);
                p.next = null;
                failed = false;
                return true;
            }
            if(nanosTimeout <= 0)
                return false;
            if(shouldParkAfterFailedAcquire(p, node)
                && nanosTimeout > spinForTimeoutThreshold)
                LockSupport.parkNanos(this, nanosTimeout);
            long now = System.nanoTime();
            nanoTimeout -= now - lastTime;
            lastTime = now;
            if(Thread.interrupted()){
                throw new InterruptException();
            }
        }
    }finally{
        if(failed)
            return false;
    }
}
```

> 该方法自旋的时候会重新计算超时时间

- ### 示例：自定义同步组件-- TwinsLock
这里设计一个同步工具：该工具在同一时刻，只允许之多两个线程同时访问，超过两个线程访问江北阻塞，我们将其称之为TwinsLock。
1. 首先，确定访问模式，TwinsLock能够在同一时刻允许多个线程访问，显然是共享式访问，因此，需要使用同步器提供的acquireShared(int arg)和Shared相关方法，这就必须要重写tryAcquireShared(int arg)和tryReleaseShared(int arg)方法。
2. 其次，定义资源数。TwinsLock在同一时刻之多允许两个线程同时访问，表明同步资源数为2，这样可以设置初始状态status为2，当一个线程进行获取后status减1，该线程释放，则加1。合法的status状态范围为0、1、2。使用compareAndSet(int expect, int arg)做原子保障。
3. 最后，组合同步器完成功能。


5. ### 可重入锁
可重入锁的主要在获取锁的时候添加了是否是当前线程的判断，并且把重入的次数写入，在释放锁的时候钱N-1次释放不重置当前线程，最后一次将当前线程置null，并且设置state。
> 可重入锁中分为公平锁和非公平锁两种，其中公平锁保证了线程不饥饿，但是会增加上下文切换。非公平锁不保证线程饥饿，但是因为其极少的线程切换，保证了更大的吞吐量。

6. ### 读写锁
之前提到的锁基本上都是拍他锁，这些锁在同一时刻只允许一个线程访问，而读写锁允许多个读线程，但是在写线程访问时只允许一个写线程，其他线程不管读写军备阻塞。通过读写锁是的并发性有了很大提升。  
> 读写锁内部使用一个32位的变量，将其拆分为高低两个16位，高16位表示读状态，低16位表示写状态，内部使用位运算判断同步状态。  

7. ### LockSupport工具
LockSupport定义了一组已park开头的方法用来阻塞当前线程，以及unpark(Thread thread)的方法用来唤醒线程。

| 方法名称                      | 描述                                                                      |
| :---                          | :---                                                                      |
| void park()                   | 阻塞当前线程，如果调用unpark(Thread thread)方法或者当前线程被中断才能返回 |
| void parkNanos(long nanos)    | 阻塞当前线程直到超时                                                      |
| void parkUntil(long deadline) | 阻塞当前线程，直到deadline(form UTC)                                      |
| void unpark(Thread thread)    | 唤醒处于阻塞状态的thread                                                  |

8. ### Condition接口
任意一个java对象都拥有一组监视器方法（在java.lang.Object上），主要包括（wait()、wait(long timeout)、notify()、notifyAll()）方法，这些方法与synchronized配合，可以实现等待/通知模式，但是两个使用方法和功能还是有差别的。
通过对比Object的监视器方法和Condition接口，可以更详细的了解Condition特性:

| 对比项                                               | Object Monitor Methods | Condition                                                       |
| :---                                                 | :---                   | :---                                                            |
| 前置条件                                             | 获取对象的锁           | 调用Lock.lock()获取锁，调用Lock.newCondition()获取Condition对象 |
| 调用方式                                             | 直接调用               | 直接调用                                                        |
| 等待队列个数                                         | 一个                   | 多个                                                            |
| 当前线程释放锁并进入等待状态                         | 支持                   | 支持                                                            |
| 当前线程释放锁并进入等待状态，在等待状态不能响应中断 | 不支持                 | 支持                                                            |
| 当前线程释放锁并进入超时等待状态                     | 支持                   | 支持                                                            |
| 当前线程释放锁并进图等待状态到将来某个时间           | 不支持                 | 支持                                                            |
| 唤醒等待队列的一个线程                               | 支持                   | 支持                                                            |
| 唤醒等待队列中的全部线程                             | 支持                   | 支持                                                            |

1. 示例
Condition定义了等待/通知两种类型的方法，当前线程调用这些方法时，需要提前将获取到的Condition对象关联的锁。Condition对象是由Lock对象（调用Lock对象的newCondition()方法创建，换句话说Condition对象依赖于Lock对象的。  
```java
Lock lock = new ReentrantLock();
Condition condition = lock.newCondition();
public void conditionWait() throws InterruptedException{
    lock.lock();
    try{
        condition.await(); // 1
    }finally{
        lock.unlock();
    }
}
public void conditionSignal() throws InterruptedException{
    lock.lock();
    try{
        condition.signal(); // 2
    }finally{
        lock.unlock();
    }
}
```
> 线程运行到1处是会释放自己已经得到的锁，在其他线程运行到2处时，当前线程才会从await()返回，并且返回前已经获取了锁。

Condition实现队列的添加和删除
```java
public class BoundedQueue<T>{
    private Object[] items;
    private addIndex, removeIndex, count;
    private Lock lock = new ReentrantLock();
    private Condition notEmpty = lock.newCondition();
    private Condition notFull = lock.newCondition();
    public Bounded(int size){
        items = new Object[size];
    }
    public void add(T t) throws InterruptedException{
        lock.lock();
        try{
            while(count == items.length)
                notFull.await();
            items[addIndex] = t;
            if(++addIndex == items.length)
                addIndex = 0;
            ++count;
            notEmpty.singal();
        }finally{
            lock.unlock();
        }
    }
    public T remove() throws InterruptedException{
        lock.lock();
        try{
            while(count == 0)
                notEmpty.singal();
            Object object = items[removeIndex];
            if(++removeIndex == items.length)
                removeIndex = 0;
            --count;
            notFull.await();
            return (T) object;
        }finally{
            lock.unlock();
        }
    }
}
```

> 该队列遵循FIFO，使用count变量表示队列实际长度，当count等于数组长时等待notFull的通知，当count等于0时等待数组不为空的通知。使用removeIndex和addIndex可以实现循环添加。
