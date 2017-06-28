# 这里是readme文档
## pgc-fe-generater
> 是前端模块开发的目录模板生成器，在自己的devspace目录下，执行generate或者gen 即可启动模板生成器，跟着命令一步一步
即可生成一个基本目录

## 模块提供的目录结构简介
### index.js
> 开发的入口文件
### index.less
> 开发的入口样式文件
### demo 
> 测试页面：在该页面可以调用测试编写的模块
### dist
> 编译打包后的js和css的目录
### src
> 开发目录，modules各个模块的文件都放在这里，样式和js都以模块形式封装，例如需要一个排行榜的模块，可以在modules里面新建立一个rank模块，包含index.js和rank.less文件。在入口的index.js文件中引用该模块即可。
### test
> 测试目录

###例子
> 可以参考
git@git.pandatv.com:panda-pgc/pgc-quiz.git