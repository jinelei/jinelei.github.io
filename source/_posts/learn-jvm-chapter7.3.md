---
title: 类加载的过程
date: 2017-08-02 09:00:00
categories:
  - Java
  - VirtualMachine
tags:
  - 学习笔记
---

#### 类加载的过程
类加载包括：加载、验证、准备、解析、初始化五个阶段。

#### 加载
加载阶段虚拟机要完成以下三件事情：
1. 通过一个类的全限定名类获取定义类的二进制字节流。
2. 将这个字节流所代表的静态存储结构转化为方法区的运行时数据结构。
3. 在java堆中生成一个代表这个类的Class对象，作为方法区这些数据的访问入口。

> java 并不对一个类的全限定名的取得作出具体的要求。 通常有以下几种常见方式：  
- 从ZIP包中读取，常见的JAR、WAR、EAR。  
- 从网络中获取，常见的Applet。  
- 运行时计算生成，常见于动态代理技术。  
- 由其他文件生成，常见于JSP应用。  
- 从数据库中读取，较少见在中间服务器分发程序代码。
- ......


#### 验证
验证是连接的第一步，目的是确保CLass文件流中包含的信息合法无害。
java虚拟机规范对于这个重要的步骤的指导和限制比较笼统，只有一句如果验证到输入的字节流不符合Class文件的存储格式，则抛出java.lang.VeriflyError异常或其子类异常。具体检查根据虚拟机不同实现有所差别，但是大致分为以下四个阶段：文件格式验证、元数据验证、字节码验证、符号验证。  

##### 文件格式验证
- 是否以魔数oxCAFEBABE开头。
- 主次版本号是否在当前虚拟机能够处理的范围内。
- 常量池的常量中是否有不被支持的常量类型。（检查常量tag标志）。
- 指向常量的各种索引值中是否有只想不存在的常量或不符合类型的常量。
- CONSTANT_Utf8-info型的常量中是否有不符合UTF8编码的数据。
- Class文件中的各个部分及文件本身是否有被删除的或附加的其他信息。
- ......  

##### 元数据验证
这一阶段是对字节码描述的信息进行语义分析，以保证其描述的信息符合Java语言规范，可能包含以下验证：
- 这个类是否有父类（除Object外）。
- 这个类的父类是否继承了不允许被继承的类（final类）。
- 如果这个类不是抽象类，是否是现在父类或接口中要求的所有方法。
- 类中的字段、方法是否与父类产生矛盾（覆盖final字段、不符合规则的重载等）。  

##### 字节码验证
这一阶段是整个验证过程中的最复杂的一个阶段。  
主要是对数据流和控制流分析，以保证被校验类的方法在运行时不会做出危害虚拟机安全的行为。保证不会出现例如以下的情况：  
- 保证在操作栈中放入了一个int类型的数据，使用时却以long类型来加载入本地变量表中。  
- 保证跳转指令不会跳到方法体以外的字节码指令上。  
- 保证方法体中的类型转换是有效的。
- ......

 > 在JDK1.6之后的javac编译器中进行了一项优化，给方法体的Code属性中添加了StackMapTree属性，这项属性描述了方法体中所有基本快开始是本地变量表和操作栈应有的状态，。  
 HotSpot中提供了-XX: -UseSplitVerifier来关闭优化，或者使用 -XX： +FailOverToOldVerifier要求在类型推到失败时退回到旧的类型推导方式进行校验。  
 在JDK 1.7之后，对于主版本号大于50的CLass文件，不允许退回旧的类型推导验证。

##### 符号引用验证
最后一个阶段时将符号引用转化为直接引用，这个转化动作将在连接的第三个阶段--解析阶段发生。符号引用验证可以看做是对类自身以外（常量池中的各种符号引用）的信息进行匹配性校验，通常包括以下内容：
- 符号引用中通过字符串描述的全限定名是否能找到对应的类。
- 在指定类中是否存在符合方法的字段描述符即简单名称所描述的方法和字段。
- 符号引用中的类、字段和方法的访问性是否可以被当前类所访问。
- ......
> 如果无法通过验证，将会抛出java.lang.IncompatibleClassChangeError异常的子类，如java.lang.IllegalAccessError、java.lang.NoSuchFieldError、java.lang.NoSuchMethodError等。

>验证阶段是非必要阶段，如果可以保证全部可信，可以使用-Xverify: none来跳过验证他。