---
title:  "小程序点滴1"
date: 2018-11-15 09:00:00
categories:
  - Develop
tags:
  - 学习笔记
---

{% raw %}
- 去除小程序边框

```
button::after{
    border: none;
}
```

- 点击右侧图标展开盒子方案

1. wxml: 

```
<view wx:key='devices_{{index}}' class='device-info' wx:for='{{devices}}'>
  <view class='device_name_id' wx:key='device_name_id_{{index}}'>
    <text class='name' wx:key='name_{{index}}'>{{item.name}}:</text>
    <text class='deviceId' wx:key='deviceId_{{index}}'>{{item.deviceId}}</text>
  <button class="{{ !!item.showDetail ? 'toggle-btn-open' : 'toggle-btn-close' }}" wx:key='btn_{{index}}' data-device-id='{{item.deviceId}}' bindtap='toggleDetailInfo'></button>
  </view>
  <view wx:if='{{!!item.showDetail}}'>
    <view class='RSSI' wx:key='RSSI_{{index}}'>RSSI: {{item.RSSI}}</view>
    <view class='advertisServiceUUID' wx:key='advertisServiceUUID_{{index}}'>advertisServiceUUID: {{item.advertisServiceUUID}}</view>
    <view class='advertisData' wx:key='advertisData_{{index}}'>advertisData: {{item.advertisData}}</view>
    <view class='localName' wx:key='localName_{{index}}'>localName: {{item.localName}}</view>
    <view class='serviceData' wx:key='serviceData_{{index}}'>serviceData: {{item.serviceData}} </view>
  </view>
</view>
```

> 使用```wx:if='{!!item.showDetail}'```绑定展开开关
>
> 使用```class="{{ !!item.showDetail ? 'toggle-btn-open' : 'toggle-btn-close' }}"```切换class
> 使用```wx:if='{!!item.showDetail}'```绑定展开开关

2. wxss: 

```
.toggle-btn-close, .toggle-btn-open {
  pointer-events: none;
  width: 1rem;
  height: 1rem;
  background-color: transparent;
}

.toggle-btn-open::after, .toggle-btn-close::after {
  border: none;
}

.toggle-btn-close::before, .toggle-btn-open::before {
  content: '';
  position: absolute;
  pointer-events: auto;
  border: 0.5rem transparent solid;
}

.toggle-btn-open::before {
  border-left-color: red;
  top: 0rem;
  left: 0.6rem;
}

.toggle-btn-close::before {
  border-top-color: green;
  top: 0.3rem;
  left: 0.25rem;
}
```

> 使用在父元素上设置```pointer-events: none;```，伪类上设置```pointer-events: auto;```将父元素的点击移到伪类中
> 
> 使用```border: 0.5rem transparent solid;```和```border-left-color: red;```设置三角形的方向和颜色

3. js

```
toggleDetailInfo: function(e) {
  let newDevices = []
  for (let i = 0; i < this.data.devices.length; i++) {
    if (this.data.devices[i]['deviceId'] === e.target.dataset.deviceId) {
      let tmp = this.data.devices[i]
      tmp['showDetail'] = !!tmp['showDetail'] ? false : true;
      newDevices.push(tmp)
    } else {
      newDevices.push(this.data.devices[i])
    }
  }
  this.setData({
    devices: newDevices
  })
}
```

> 在data中数组要与原来地址不一致才会触发重新渲染
{% endraw %}
