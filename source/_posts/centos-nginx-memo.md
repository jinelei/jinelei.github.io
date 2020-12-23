---
title:  "centos7下编译nginx"
date: 2017-12-06 09:00:00
categories:
  - Linux
  - Nginx
tags:
  - 备忘录
---

- centos7下编译nginx遇到的问题
```
./configure: error: the HTTP rewrite module requires the PCRE library.
You can either disable the module by using --without-http_rewrite_module
option, or install the PCRE library into the system, or build the PCRE library
statically from the source with nginx by using --with-pcre=<path> option.
```

解决办法
```
yum -y install pcre-devel
```

```
./configure: error: the HTTP gzip module requires the zlib library.
You can either disable the module by using --without-http_gzip_module
option, or install the zlib library into the system, or build the zlib library
statically from the source with nginx by using --with-zlib=<path> option.
```
解决办法
```
yum install -y zlib-devel
```

- nginx设置代理转发，解决微信头像跨域问题
```
location ^~ /wechat_image/ {
  add_header 'Access-Control-Allow-Origin' "$http_origin" always;
  add_header 'Access-Control-Allow-Credentials' 'true' always;
  add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
  add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-   Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
  proxy_pass http://wx.qlogo.cn/;
}
```
> 访问的时候将http://wx.qlogo.cn/XXX/XXX.XXX替换成http://${nginx_name}/wechat_image/XXX/XXX.XXX

```
./configure --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --http-client-body-temp-path=/var/cache/nginx/client_temp \
    --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
    --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
    --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
    --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
    --with-http_realip_module \
    --with-http_addition_module \
    --with-http_sub_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_mp4_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_random_index_module \
    --with-http_secure_link_module \
    --with-http_stub_status_module \
    --with-http_auth_request_module \
    --with-threads \
    --with-stream \
    --with-http_slice_module \
    --with-mail \
    --with-file-aio \
    --with-http_v2_module \
    --with-mail_ssl_module \
    --with-http_ssl_module \
    --with-stream_ssl_module \
    --with-openssl=/usr/local/openssl\
```
