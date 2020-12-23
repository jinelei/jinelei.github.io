---
title:  "vimrc 配置示例"
date: 2018-11-08 09:00:00
categories:
  - Linux
tags:
  - 备忘录
---

1. 安装Vbundle
```git clone https://github.com/gmarik/Vundle.vim.git  ~/.vim/bundle/Vundle.vim```

2. 使用vimrc
{% raw %}
```
"{{{ 一般设置
set nu
set nocompatible                    " be iMproved, required
set autoindent
set tabstop=4
set shiftwidth=4
set softtabstop=4
set expandtab
"}}}

"{{{语法检测设定
filetype    on                      " 检测打开文件的类型
syntax      on                      " 开启语法高亮
syntax      enable                  " 激活语法高亮
filetype    plugin on               " 允许特定的文件类型载入插件文件
filetype    indent on               " 允许特定的文件类型载入缩进文件
"}}}

"{{{ 搜索和匹配
set showmatch                       " 高亮显示匹配的括号
set matchtime=5                     " 匹配括号高亮的时间(单位是十分之一秒)
set ignorecase                      " 搜索时忽略大小写
set smartcase                       " 如果搜索模式包含大写字符，不使用'ignorecase'选项
set hlsearch                        " 高亮被搜索的内容
set incsearch                       " 增量搜索
"}}}

"{{{ 缩进/换行/空白/行号/折叠/滚动
set autoindent                      " 开启新行时，自动缩进
set smartindent                     " 开启新行时，智能缩进
set cindent                         " C程序自动缩进
"}}}

"{{{ 编码及存储
set fileencodings=utf-8             " 文件编码，强制UTF-8
set encoding=utf-8                  " vim内部编码
set nobomb                          " 不使用bom编码
set nobackup                        " 不使用备份文件
set noswapfile                      " 不产生交换文件
set autoread                        " 自动同步外部修改
set autowrite                       " 自动把内容写回文件
"}}}

"{{{ 快捷键设置
map <F5> :call CompileRunGcc()<CR>  " C
func! CompileRunGcc()
exec "w"
exec "!gcc % -o %<"
exec "! ./%<"
endfunc
" C++
map <F6> :call CompileRunGpp()<CR>
func! CompileRunGpp()
exec "w"
exec "!g++ % -o %<"
exec "! ./%<"
endfunc
"}}}

"{{{ CtrlP 设置
set runtimepath^=~/.vim/bundle/ctrlp.vim
"}}}

"{{{ 主题设置
let g:airline#extensions#tabline#enabled = 1 " 显示tabline
"}}}

"{{{ 自动符号匹配
inoremap ( ()<Esc>:let leavechar=")"<CR>i
inoremap [ []<Esc>:let leavechar="]"<CR>i
inoremap { {}<Esc>:let leavechar="}"<CR>i
"inoremap < <><Esc>:let leavechar=">"<CR>i
"inoremap ” “”<Esc>:let leavechar="""<CR>i
"inoremap ' ''<Esc>:let leavechar="'"<CR>i
"}}}

"{{{ 彩虹符号
let g:rainbow_active = 1
let g:rainbow_operators=2
let g:rainbow_conf = {
            \   'guifgs': ['royalblue3', 'darkorange3', 'seagreen3', 'firebrick'],
            \   'ctermfgs': ['lightgray', 'lightblue', 'lightmagenta', 'lightcyan'],
            \   'operators': '_,_',
            \   'parentheses': ['start=/(/ end=/)/ fold', 'start=/\[/ end=/\]/ fold', 'start=/{/ end=/}/ fold'],
            \   'separately': {
            \       '*': {},
            \       'lisp': {
            \           'guifgs': ['royalblue3', 'darkorange3', 'seagreen3', 'firebrick', 'darkorchid3'],
            \           'ctermfgs': ['darkgray', 'darkblue', 'darkmagenta', 'darkcyan', 'darkred', 'darkgreen'],
            \       },
            \       'vim': {
            \           'parentheses': [['fu\w* \s*.*)','endfu\w*'], ['for','endfor'], ['while', 'endwhile'], ['if','_elseif\|else_','endif'], ['(',')'], ['\[','\]'], ['{','}']],
            \       },
            \       'tex': {
            \           'parentheses': [['(',')'], ['\[','\]'], ['\\begin{.*}','\\end{.*}']],
            \       },
            \       'css': 0,
            \       'stylus': 0,
            \   }
            \}
"}}}

"{{{ NERDTree设置
""将F2设置为开关NERDTree的快捷键
map <f2> :NERDTreeToggle<cr>
""修改树的显示图标
let g:NERDTreeDirArrowExpandable = '+'
let g:NERDTreeDirArrowCollapsible = '-'
""窗口位置
let g:NERDTreeWinPos='right'
""窗口尺寸
let g:NERDTreeSize=30
""窗口是否显示行号
let g:NERDTreeShowLineNumbers=1
""不显示隐藏文件
let g:NERDTreeHidden=1
""打开vim时如果没有文件自动打开NERDTree
autocmd vimenter * if !argc()|NERDTree|endif
""当NERDTree为剩下的唯一窗口时自动关闭
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif
""打开vim时自动打开NERDTree
"autocmd vimenter * NERDTree
let g:NERDTreeIndicatorMapCustom = {
            \ "Modified" : "✹",
            \ "Staged" : "✚",
            \ "Untracked" : "✭",
            \ "Renamed" : "➜",
            \ "Unmerged" : "═",
            \ "Deleted" : "✖",
            \ "Dirty" : "✗",
            \ "Clean" : "✔︎",
            \ "Unknown" : "?"
            \ }
"}}}

"{{{ Plugin设置
filetype off                  " required
" VBundle配置
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
Plugin 'VundleVim/Vundle.vim'
" 主题
Plugin 'vim-airline/vim-airline'
Plugin 'vim-airline/vim-airline-themes'
" NERDTree
Plugin 'git://git.wincent.com/command-t.git'
Plugin 'git://github.com/scrooloose/nerdtree.git'
Plugin 'git://github.com/Xuyuanp/nerdtree-git-plugin.git'
" 彩虹括号
Plugin 'luochen1990/rainbow'
" markdown插件
Plugin 'tpope/vim-markdown'
" 围绕
Plugin 'tpope/vim-surround'
" 重复
Plugin 'tpope/vim-repeat'
" git
Plugin 'airblade/vim-gitgutter'
"
call vundle#end()            " required
filetype plugin indent on    " required
"}}}
```
{% endraw %}


3. 安装Bundle
进入vim，进入安装```BundleInstall```
