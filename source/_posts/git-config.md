---
title:  "git config配置"
date: 2018-12-04 09:00:00
---

#####  git config有下列四个级别

| 级别| 解释|
| :-: | :- |
| ```--system``` | 系统级 |
| ```--global``` | 全局级 |
| ```--local``` | 本地仓库级 |
| ```--file <filename>``` | 本文件级 |

##### - 别名配置
```
git config --global alias.st status
git config --global alias.br branch
git config --global alias.ci commit
收藏网友的丧心病狂的log
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative"
```

##### - 查看配置列表
```
git config --global --list
```

#### git rm

##### - 删除已经提交了的文件
```
git rm -r --cached node_modules/
git add -A 
git ci -m 'remove node_modules'
git push
```
