---
title: Java中的阻塞队列
date: 2018-12-05 09:00:00
categories:
  - Java
  - Concurrent
---

- ### 什么是阻塞队列
阻塞队列是一个支持两个附加操作的队列。这两个附加的操作支持阻塞的插入和移除方法。
    1. 支持阻塞的插入方法：意思是当队列满时，队列会阻塞插入原色的线程，知道队列不满。
    2. 支持阻塞的移除方法：意思是在队列为空时，获取元素的线程会等待队列变为非空。  
阻塞队列常用于生产者消费值场景，生产者向队列添加元素，消费值取出元素。  
下面是插入和移除的4中处理方式

| 方法/处理方式 | 抛出异常   | 返回特殊值 | 一直阻塞 | 超时退出           |
| :---          | :---       | :---       | :---     | :---               |
| 插入方法      | add(e)     | offer(e)   | put(e)   | offer(e,time,unit) |
| 移除方法      | remove()   | poll()     | take()   | poll(time,unit)    |
| 检查方法      | element(e) | peek()     | 不可用   | 不可用             |

> - 抛出异常：当队列为满时抛出IllegalStateException("Queue full")异常，当队列为空时抛出NoSuchElementException异常。
> - 返回特殊值：插入元素时，会返回是否插入成功，移除时，返回取出的元素，没有则为null。
> - 一直阻塞：插入元素时，如果队列为满会一直阻塞到队列不为满，移除元素时，如果队列为空，会阻塞到队列不为空。
> - 超时退出：当发生插入移除阻塞时，达到最大阻塞时间后就会退出。
>> 便于记忆：一直阻塞带t，返回特殊值带o。
>>> 如果是无界阻塞队列，则put和take方法永不阻塞，offer方法永远为true。

- ### JDK7中的7种阻塞队列
    - ArrayBlockingQueue：一个由数组结构组成的有界阻塞队列
    - LinkedBlockingQueue：一个由链表结构组成的有界阻塞队列
    - PriorityBlockingQueue：一个支持优先级的无界阻塞队列
    - DelayQueue：一个由PriorityBlockQueue实现的无界阻塞队列
    - SynchronousQueue：一个不存储元素的阻塞队列
    - LinkedTransferQueue：一个由链表结构组成的无界阻塞队列
    - LinkedBlockingDuque：一个由链表结构组成的双向阻塞队列

- #### ArrayBlockingQueue
此队列按照FIFO原则对元素进行排序。默认情况下不保证所有线程公平访问队列，可以使用一下代码创建公平的阻塞队列```ArrayBlockingQueue fairQueue = new ArrayBlockingQueue(1000, true);```，因为公平性是由ReentrantLock实现的
```java
public ArrayBlockingQueue(int capacity, boolean fair){
    if(capacity < 0)
        throw new IllegalArgumentException();
    this.items = new Object[capacity];
    lock = new ReentrantLock(fair); // 此处设置公平性
    notEmpty = lock.newCondition();
    notFull = lock.newCondition();
}
```

- #### LinkedBlockingQueue
此阻塞队列最大长度和默认长度为Integer.MAX_VALUE，遵循FIFO。

- #### PriorityBlockingQueue
这是一个支持优先级的无界阻塞队列。默认情况下采取自然排序，也可以重写compareTo方法来指定排序规则。或者初始化时指定Comparator。需要注意的是不能保证同级别的排序。

- #### DelayQueue
这是一个支持延时获取元素的无界阻塞队列。使用PriorityBlockingQueue实现，队列元素必须实现Delayed接口，在创建元素是可以指定多长时间后才能获取元素，只有延时期满才能获取元素。
> 它有以下使用场景  
> 缓存系统：将元素存入延迟阻塞队列，使用一个线程来获取元素，当元素能够获取到，则说明该元素已经过期。  
> 定时任务：将任务存入延迟阻塞队列，使用一个线程来获取元素，获取到就去执行任务。

- #### SynchronousQueue
这是一个不存储元素的阻塞队列，每一个put操作鼻血等待take操作。因此它的吞吐量比其他的阻塞队列高

- #### LinkedTransferQueue
LinkedTransferQueue比LinkedBlockingQueue多了tryTransfer和transfer方法。
    - trnasfer方法会尝试把接收到的数据直接transfer给其他正在等待的线程，如果没有等待线程它会自旋一段时间，超时后出让CPU时间。
    - tryTransfer方法会立即返回，如果有消费者等待的话返回true，否则false。transfer则必须等待消费者消费了才能返回。

- #### LinkedBlockingDeque
这是一个双向队列，比LinkedBlockingQueue多了addFirst、addLast、offerFirst、offerLast、peekFirst、peekLast等方法。
在初始化LinkedBlockingDeque可以设置它的厨师容量以防止其过度膨胀，双向队列可以工作在“窃取模式”。

- ### 阻塞队列的实现原理
    - 使用通知模式实现：原理可见之前Lock和Condition部分。
