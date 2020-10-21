---
title: 类加载概述及初始化条件
date: 2017-08-02 09:00:00
categories:
  - Java
  - VirtualMachine
---

####  概述
虚拟机把描述类的数据从Class文件加载到内存，并对数据进行校验、转焊接西和初始化，最终形成可以被虚拟机直接使用的Java类型，这就是虚拟机的类加载机制。  

在Java中，类型的加载和连接过程都是在程序运行期间完成的，这样虽然会增加一些性能开销，却能为Java应用程序提高灵活性。  

#### 类加载的时机  
类从被加载到虚拟机内存开始，到卸载出内存位置，它的整个生命周期包括了：加载（loading）、验证（verification）、准备（preparation）、解析（resolution）、初始化（initialization）、使用（using）和卸载（unloading）七个阶段。其中验证、准备和解析三个部分被称为链接（linking）。  
> 其中加载、验证、准备、初始化和卸载这五个阶段是顺序确定的。而解析阶段则是不确定的：它在某些情况下可以再初始化阶段之后在开始，这是为了支持Java语言的运行时绑定（动态绑定或晚期绑定）。 而且这些阶段通常是互相交叉的混合式进行的。

---

#### 类的初始化

虚拟机规范严格规定了有且只有四种情况必须对类进行初始化（而加载、验证、准备需要先开始）：
1. 遇到new、getstatic、putstatic或invokestatic这四条字节码指令时，如果类没有被初始化，则进行初始化。这4条指令的典型场景是：使用new实例化对象、读取或设置一个类的静态字段（被final修饰、已在编译期把结果放入常量池的静态字段除外）、已在调用一个类的静态方法的时候。
2. 使用java.lang.reflect包的方法进行类的反射调用时。
3. 适当初始化一个类的时候，如果发现其父类还没有进行过初始化。
4. 当虚拟机启动时用户指定要执行的主类（main方法所在类）。


```
//被动引用1，引用非直接定义的类的静态字段。
public class SuperClass{
	static{
		System.out.println("SuperClass init");
	}
	public static int value = 123;
}


public class SubClass extends SuperClass{
	static{
		System.out.println("SubClass init");
	}
}

public class NotInitialization{
	public static void main(String[] args){
		System.out.println(SubClass.value);
	}
}
```

> 结果只触发了父类的初始化，子类不会触发初始化，至于子类的加载和验证，取决于虚拟机的具体实现，sun hotspot可以使用-XX：+TraceClassLoading追踪查看。


```
//被动引用2，通过数组定义引用类。
public class NotInitialization1{
	public static void main(String[] args){
		SuperClass[] ca = new SuperClass[10];
	} 
}
```
> 输出为空，表明未初始化类。
> 对于数组，虚拟机自动生成了一个直接继承于java.lang.Object的子类，创建动作由字节码指令newarray触发。


```
//被动引用3，常量在编译阶段会存入调用类的常量池中，本质上没用直接引用到定义常量的类，所以不会被初始化。
public class ConstClass{
	static {
		System.out.println("ConstClass init");
	} 
	public static final String HELLOSTRING = "hello world"; 
}

public class NotInitialization2{ 
	public static void main(String[] args){
		System.out.println(ConstClass.HELLOSTRING);
	} 
}
```


#### 接口的初始化

接口的加载过程与类只有一点不同：类要求子类初始化之前，父类必须全部初始化。借口在初始化时并不要求其父接口全部都完成初始化。只有在真正调用父接口的时候才会进行初始化。  
接口中不能使用static{}来输出类加载信息，但是编译器会为接口生成<clinit>()的类构造器，用于初始化接口中所定义的成员变量。
