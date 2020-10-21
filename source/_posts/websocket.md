---
title:  "websocket API"
date: 2018-05-10 09:00:00
---

- 创建websocket
```
var ws = new WebSocket('ws://localhost:8888/ws');
```

- websocket相关属性
    - readyState 属性返回当前实例的状态。一共四种：

    | 状态       | 值  | 描述                 |
    | :-:        | :-: | :-                   |
    | CONNECTING | 0   | 正在连接中           |
    | OPEN       | 1   | 连接成功，可以通信了 |
    | CLOSING    | 2   | 正在关闭中           |
    | CLOSED     | 3   | 已经关闭             |


    > example:
    ```
    switch (ws.readyState) {
        case WebSocket.CONNECTING:
            // do something
            break;
        case WebSocket.OPEN:
            // do something
            break;
        case WebSocket.CLOSING:
            // do something
            break;
        case WebSocket.CLOSED:
            // do something
            break;
        default:
            // do something
            break;
    }
    ```

    - onopen 属性指定开启后的回调函数

    > example:
    ```
    ws.onopen = function(evt) {
        console.log('Connection open ...');
    };
    ```

    - onclose 属性指定关闭后的回调函数

    > example:
    ```
    ws.onclose = function(evt) {
        console.log('Connection closed.');
    };
    ```

    - onerror 属性指定关闭后的回调函数

    > example:
    ```
    ws.onerror = function(evt) {
        console.log('Connection error.');
    };
    ```

    - onmessage 属性指定收到消息后的回调函数

    > example:
    ```
    ws.onmessage = function(evt) {
        console.log( 'Received Message: ' + evt.data);
    };
    ```

- websocket的相关方法
    - send() 方法用于向服务器发送消息。
    发送文本

    > ```ws.send('your message');```

    发送Blob

    > ```
        var file = document
          .querySelector('input[type="file"]')
          .files[0];
        ws.send(file);
    ```
