---
title: java中的Fork/Join框架
date: 2018-12-05 09:00:00
---

Fork/Join框架是Java7中新增的用于并行执行任务的框架，把一个大的任务分割成小任务，最后汇总得到运行结果。  

- ### 工作窃取算法
把大任务分割成小任务后，有些线程执行完成后，其他线程可能还没有执行完成，这时候，执行完成的线程可以帮助未执行完线程执行任务，这就是工作窃取。核心在与怎么样避免冲突，这时候双向阻塞队列就发挥了作用，正常工作的线程永远从队列头取任务，窃取线程从队列尾取任务。

- ### Fork/Join框架的设计
    - #### 任务分割
    首先我们要把大任务分割成小任务。有些可能要递归的分割，知道足够小。
    - #### 执行任务并合并结果
    分割的子任务放在双向队列的两端，然后启动几个线程从队列中取任务，子任务运行结果都放在一个队列里，再启动一个线程从结果队列中取数据和合并数据。
Fork/Join框架使用两个类来完成上面的事情：ForkJoinTask、ForkJoinPool。
    - ForkJoinTask：提供了两个子类来完成分割任务和合并任务的事情。RecursiveAction（用于没有任务返回结果）、RecursiveTask（用于有任务返回结果）。
    - ForkJoinPool：ForkJoinTask需要通过ForkJoinPool执行。

```java
import java.util.concurrent.*;

public class CountTask extends RecursiveTask<Integer> {
    private static final int THRESHOLD = 2; // 阈值
    private int start;
    private int end;
    public CountTask(int start, int end){
        this.start = start;
        this.end = end;
    }
    @Override
    protected Integer compute(){
        int sum = 0;
        boolean canCompute = (end - start) <= THRESHOLD;
        if(canCompute){
            for(int i = start; i <= end; i++){
                sum += i;
            }
        }else{
            int middle = (end + start) / 2;
            CountTask leftTask = new CountTask(start, middle);
            CountTask rightTask = new CountTask(middle + 1, end);
            leftTask.fork();
            rightTask.fork();
            int leftResult = leftTask.join();
            int rightResult = rightTask.join();
            sum = leftResult + rightResult;
        }
        return sum;
    }
    public static void main(String[] args){
        ForkJoinPool forkJoinPool = new ForkJoinPool();
        CountTask task = new CountTask(0, 100);
        Future<Integer> result = forkJoinPool.submit(task);
        try{
            System.out.println("result: " + result.get());
        } catch(InterruptedException | ExecutionException e){
            System.out.println(e.toString());
        }
    }
}
```

    - #### task在执行过程中可能会出现异常，这个异常我们在主线程中是不可能捕获到的，因此ForkJoinTask提供了isComputeAbnormally()方法来发现异常，通过getException()方法来获取异常
