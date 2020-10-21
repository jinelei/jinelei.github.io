---
title: NIO、AIO、BIO
date: 2018-12-06 09:00:00
categories:
  - Java
  - Concurrent
---

- ### 什么是BIO/AIO/NIO
    - BIO（Blocking I/O）同步阻塞IO：这是最基本最简单的IO，特点是任务按顺序依次进行。  
    - NIO（New I/O或者Non-Blocking I/O）同步非阻塞IO：NIO本身是基于事件驱动的，用来解决大并发问题。  
    - AIO（Asynchronous I/O）异步非阻塞IO：在JDK7中实现，和NIO的区别是，NIO还需要使用轮询的方式来确定数据是否已经准备好，而AIO直接在数据准备好后通知使用者。这里的异步还与系统相关，在Unix/Linux下，使用epoll IO模型，在window下使用IOCP模型。  


- ### NIO的组成
    - Channel（通道）： 基本上所有的IO在NIO中都从一个Channel开始，类似于Stream，不过Channel是双向的。Channel有以下实现：    		
        -  FileChannel（从文件中读写数据）  
        -  DatagramChannel（通过UDP读写网络中的数据）  
        -  SocketChannel（通过TCP读写网络中的数据）  
        -  ServerSocketChannel（监听新进来的TCP连接，像Web服务器那样。对每一个新进来的连接都会创建一个SocketChannel）  
		    
    - Buffer（缓冲区）： 使用Buffer读写数据一般遵循一下4个步骤：    
        - 写入数据到Buffer  
        - 调用flip()方法：切换模式（读写模式）  
        - 从Buffer中读取数据  
        - 调用clear()方法或者compact()方法：（clear()方法会清空整个缓冲区，compact()方法只会清除已经读过的数据，任何未读的数据都被移到缓冲区的起始处，新写入的数据将放到缓冲区未读数据的后面）  
    - Selector（多路复用器）：Selector允许单线程处理多个Channel。要使用Selector，先得向Selector注册Channel，然后调用它的select()方法。    
        - 创建Selector：```Selector selector = Selector.open();```
        - 注册Channel：```channel.configureBlocking(false);
SelectionKey key = channel.register(selector,  Selectionkey.OP_READ);```  
- ### FileChannel示例：

		```
		import java.io.*;
		import java.nio.*;
		import java.nio.channels.*;

		public class FileChannelDemo {
				public static void main(String[] args) throws Exception{
						RandomAccessFile file = new RandomAccessFile("./data.txt", "rw");
						FileChannel inChannel = file.getChannel();
						ByteBuffer buf = ByteBuffer.allocate(48);
						int bytesRead = inChannel.read(buf);
						while(bytesRead != -1){
								System.out.println("read: " + bytesRead);
								buf.flip();
								while(buf.hasRemaining()){
										System.out.print((char)buf.get());
								}
								System.out.println();
								buf.clear();
								bytesRead = inChannel.read(buf);
						}
						file.close();
				}
		}
		```
