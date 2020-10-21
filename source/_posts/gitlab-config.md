---
title:  "gitlab修改端口和域名"
date: 2018-11-12 09:00:00
---

gitlab默认安装后配置文件在```/etc/gitlab/gitlab.rb```，gitlab内嵌的nginx配置在```/var/opt/gitlab/nginx/conf```

- 修改gitlab的端口```sudo vim /etc/gitlab/gitlab.rb```
```
external_url 'http://jinelei.cn:82'
nginx['listen_port'] = 82
```

- 修改nginx端口```sudo vim /var/opt/gitlab/nginx/conf/gitlab-http.conf```
```
server {
    listen *:82;
    server_name jinelei.cn 
}
```

- 执行```sudo gitlab-ctl reconfigure```

- 执行```sudo gitlab-ctl restart```
