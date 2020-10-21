---
title:  "javascript积累"
date: 2018-05-10 09:00:00
---

- ### replace

```
replace(/(^\s*)|(\s*$)/g, "")
```
> example: trim()

```
function trim(){
    replace(/(^\s*)|(\s*$)/g, "")
}
```

- ### keycode

```
function forEnter(e){
    var keyCode = e.keyCode || e.which || e.charCode;
    var ctrlKey = e.ctrlKey || e.metaKey;
    if(ctrlKey && keyCode == 13) { //ctrl + enter || meta + enter
        //do something
    }
    return true;
}
```

- ### 添加监听，动态修改class

```
echoItem.addEventListener('mouseenter', function(event) {
    echoItem.classList.add('echo-item-mouseon');
}, true)
echoItem.addEventListener('mouseout', function(event) {
    echoItem.classList.remove('echo-item-mouseon');
}, true)
```

- ### css
    - #### 鼠标移入效果
    
    ```
    .echo-item-indicator-resend{
        display: -webkit-flex; /* Safari */
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0.3;
        background-image:url('./img/repeated.webp');
        background-repeat:no-repeat;
        background-position:center;
    }
    ```

    ```
    .echo-item-indicator-resend:hover {
        background: transparent;
        opacity: 1;
        background-image:url('./img/repeated.webp');
        background-repeat:no-repeat;
        background-position:center;
    }
    ```

    - #### css动画

    ```
    .echo-item-indicator-slidein {
        -moz-animation-duration: 0.5s;
        -webkit-animation-duration: 0.5s;
        animation-duration: 0.5s;
        -moz-animation-name: echo-item-indicator-slidein;
        -webkit-animation-name: echo-item-indicator-slidein;
        animation-name: echo-item-indicator-slidein;
        margin-left: 0%;
    }
    ```
    关键帧
    ```
    @-moz-keyframes echo-item-indicator-slidein {
        from {
            margin-left: 100%;
        }
        to {
            margin-left: 0%;
        }
    }

    @-webkit-keyframes echo-item-indicator-slidein {
        from {
            margin-left: 100%;
        }
        to {
            margin-left: 0%;
        }
    }

    @keyframes echo-item-indicator-slidein {
        from {
            margin-left: 100%;
        }
        to {
            margin-right: 0%;
        }
    }
```
