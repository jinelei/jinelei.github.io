---
title:  "eclipse备忘录"
date: 2017-12-07 09:00:00
---

1. #### eclipse添加mybatis generator插件

点击 help -> marketplace -> 搜索mybatis generator -> 点击安装。

2. #### eclipse添加spring插件

打开网站 http://spring.io/tools/sts/all，找到Update Sites(在线安装)或者Update Site Archives(离线安装)，选择自己的版本的url，将其添加到eclipse的在线安装，并安装。

##### mybatis genertor 配置

1. 添加maven插件
```
<plugin>  
    <groupId>org.mybatis.generator</groupId>  
    <artifactId>mybatis-generator-maven-plugin</artifactId>  
    <version>1.3.2</version>  
    <configuration>  
        <verbose>true</verbose>  
        <overwrite>true</overwrite>  
    </configuration>  
</plugin> 
```

2. 添加generatorConfig.properties文件
```
drive.class.path=/home/jinelei/.m2/repository/mysql/mysql-connector-java/5.1.44/mysql-connector-java-5.1.44.jar
   
jdbc.driver=com.mysql.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/catfish?useUnicode=true&characterEncoding=utf-8
jdbc.username=testname
jdbc.password=testpassword

model.package=cn.jinelei.catfish.model
dao.package=cn.jinelei.catfish.dao
xml.mapper.package=/mybatis/mappers
target.project=src/main/java
resources.target.project=src/main/resources
```



3. 添加generatorConfig.xml文件
```
<?xml version="1.0" encoding="UTF-8"?>  
<!DOCTYPE generatorConfiguration  
PUBLIC "-//mybatis.org//DTD MyBatis Generator Configuration 1.0//EN"  
"http://mybatis.org/dtd/mybatis-generator-config_1_0.dtd">

<generatorConfiguration>
	<!-- 配置文件路径 -->
	<properties resource="generatorConfig.properties" />
	<!--数据库驱动包路径 -->
	<classPathEntry location="${drive.class.path}" />

	<context id="MySQLTables" targetRuntime="MyBatis3">
		<!--关闭注释 -->
		<commentGenerator>
			<property name="suppressDate" value="true" />
			<property name="suppressAllComments" value="true" />
		</commentGenerator>

		<!--数据库连接信息 -->
		<jdbcConnection driverClass="${jdbc.driver}"
			connectionURL="${jdbc.url}" userId="${jdbc.username}" password="${jdbc.password}">
		</jdbcConnection>

		<!--生成的model 包路径 -->
		<javaModelGenerator targetPackage="${model.package}"
			targetProject="${target.project}">
			<property name="enableSubPackages" value="ture" />
			<property name="trimStrings" value="true" />
		</javaModelGenerator>

		<!--生成xml mapper文件 路径 -->
		<sqlMapGenerator targetPackage="${xml.mapper.package}"
			targetProject="${resources.target.project}">
			<property name="enableSubPackages" value="ture" />
		</sqlMapGenerator>

		<!-- 生成的Dao接口 的包路径 -->
		<javaClientGenerator type="XMLMAPPER"
			targetPackage="${dao.package}" targetProject="${target.project}">
			<property name="enableSubPackages" value="ture" />
		</javaClientGenerator>

		<!--对应数据库表名 -->
		<table tableName="t_account" domainObjectName="Account"
			enableCountByExample="false" enableDeleteByExample="false"
			enableSelectByExample="false" enableUpdateByExample="false">

		</table>
	</context>
</generatorConfiguration>
```

3. 添加Run Configurations, Goals中填写：
```
mybatis-generator:generate
```
