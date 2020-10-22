---
title: Spring Boot集成Flowable 备忘录
date: 2020-10-22 09:00:00
categories:
  - Java
  - Flowable
tags:
  - 学习笔记
---
@Bean
public ProcessEngineFactoryBean processEngine(SpringProcessEngineConfiguration springProcessEngineConfiguration) {
    ProcessEngineFactoryBean bean = new ProcessEngineFactoryBean();
    springProcessEngineConfiguration
            .setDataSource(flowableDataSource())
            .setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE)
            .setActivityFontName("宋体")
            .setLabelFontName("宋体")
            .setAnnotationFontName("宋体");
    bean.setProcessEngineConfiguration(springProcessEngineConfiguration);
    return bean;
}
```
