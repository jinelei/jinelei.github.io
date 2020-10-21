---
title:  "java中的原子类"
date: 2018-12-05 09:00:00
categories:
  - Java
  - Concurrent
---

从java5开始提供了```java.util.concurrnet.atomic```包，这个包中的院子操作类提供了简单、高效、线程安全的更新变量的方式。
这个包中提供了13个类，属于4种原子更新方式：原子更新基本类型、原子更新数组、原子更新引用、原子更新属性。他们共同的特点是使用Unsafe实现的包装类。

- ### 原子更新基本类型
主要包括```AtomicBoolean、AtomicInteger、AtomicLong```，他们提供的方法大同小异。
下面是AtomicInteger的主要方法：
    - int addAndGet(int delta)：原子添加delta，返回新值
    - boolean compareAndSet(int except, int update)：比较并更新，返回新值
    - int getAndIncrement()：以原子的方式加1，返回之前的值
    - void lazySet(int newValue)：更新后一点时间内，其他线程可能拿到旧值
    - int getAndSet(int newValue)：原子方式更新newValue，返回旧值

- ### 原子更新数组
主要包括```AtomicIntegerArray、AtomicLongArray、AtomicReferenceArray、```
常用方法：
    - int addAndGet(int i, int delta)：原子将输入值和数组索引i的元素相加
    - boolean compareAndSet(int i, int expect, int update)：原子更新

- ### 原子更新引用
主要包括```AtomicReference（原子更新引用类型）、AtomicReferenceFieldUpdater（原子更新引用类型的字段）、AtomicMarkableReference（原子更新带有标记位的引用类型）```
> AtomicMarkableReference(V initialRef, boolean initalMark)

- ### 原子更新字段
主要包括```AtomicIntegerFieldUpdater（原子更新整型字段）、AtomicLongFieldUpdater（原子更新长整型字段）、AtomicStampedReference（原子更新带有版本号的引用类型，可以用来解决ABA问题）```

