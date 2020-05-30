<h1 align="center"> Remote - Github </h1>

<h2 align="center" margin="auto 0">
  <img src="https://pic4.zhimg.com/80/v2-5fb9e9776207d111993e3460f3bf6b11.png" alt="vscode-zhihu logo" width="200px" /></a>
</h2>
 
<h2 align="center">
<a href="https://github.com/niudai/VSCode-Zhihu"> 无需 Clone，即刻浏览</a>
</h2> 

- [什么是 Remote - Github](#什么是-remote-github)
- [怎么用 Remote - Github](#怎么用-remote-github)
  - [认证](#认证)
    - [提供 keystore path （可选）](#提供-keystore-path-可选)
  - [准备工作区](#准备工作区)
  - [打开远程仓库](#打开远程仓库)
  - [保存至本地](#保存至本地)
  - [名字空间](#名字空间)
  - [分支和标签](#分支和标签)
  - [不足](#不足)
  - [设计哲学](#设计哲学)
- [Configurations](#configurations)

## 什么是 Remote - Github

如果我们要在本地浏览一个 Github 仓库，我们常常需要将整个仓库克隆下来，而很多时候，你只是希望浏览一个子文件夹而已，或者获取某个文件，这时，将整个 Git 仓库 clone 到本地就显得十分笨重，更何况，Git 仓库不仅包含了源码，还包含了所有的源码修改记录。

*Remote - Github* 彻底解决了上述的问题，它让 **浏览远程的 Github 仓库就和浏览本地文件夹一样轻松**, 无需将任何东西载到本地，但却可以像本地文件一样编辑，同样也可按需下载至本地。

![Image](https://pic4.zhimg.com/80/v2-a572ecb81ceac64d1308e500faa88099.gif)

## 怎么用 Remote - Github 

使用 *Remote - Github* 非常容易，只需简单的登录验证，即可浏览无数 Github 仓库。

### 认证

通过 `Ctrl + Shift + p` 唤醒命令行面板，搜索 `Remote - Github: Sign In` 命令, 按回车，输入 Github 用户名：

![Image](https://pic4.zhimg.com/80/v2-6b66d4a91b7eb9479f78ccb79044ff49.png)

你有两种验证方式: *密码* 和 [*Personal Access Token*](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)，后者比前者有更好的权限控制和更高的安全性。

>怎样获取 [*Personal Acces Token*](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)

在第二个窗口中输入你的密码或 Personal Access Token：

![Image](https://pic4.zhimg.com/80/v2-3cfaa40f4582f28e91e524fa3684f965.png)

登录成功后，你可以在底部状态栏看到你的 Github 用户名：

![Image](https://pic4.zhimg.com/80/v2-1af49126e8bb1b7784655bccc0bf5168.png)

#### 提供 keystore path （可选）

如果你想要更高的安全性，你可以按照格式 \<username\>:\<password\> 或 \<username\>:\<personal access token\> 写一个文件 :

![Image](https://pic4.zhimg.com/80/v2-3c190af9c839f3e15da5ad1cfb3c71c3.png)

然后将这个文件的绝对路径输入到 `Remote - Github: Keystore Path` 配置项中:

![Image](https://pic4.zhimg.com/80/v2-3c1f45a586ffcda859ae65aaf32abfbd.png)

>你必须登录才能获得每小时 5000 次请求配额，如果不登陆，只有 60 次，会很快用尽。

### 准备工作区

唤醒 `Remote - Github: Setup Workspace` 命令，你会看到 `Github` 文件夹出现在你的工作区:

![Image](https://pic4.zhimg.com/80/v2-c41502d51fbadd80aa98c8246c87d8ca.png)

### 打开远程仓库

唤醒 `Remote - Github: Open Github Repository`:

![Image](https://pic4.zhimg.com/80/v2-fd6c64208c0573df47a3de445a642e1c.png)

输入仓库对应的 https 链接：`https://github.com/golang/go`, 或者更简单的，输入仓库路径: `golang/go`, 点击回车，你会看到：

![Image](https://pic4.zhimg.com/80/v2-00ea9607a239544199f4122fb9485e54.png)

你可以像浏览本地文件夹一样浏览这个打开的仓库，选择 `"."` 打开当前文件夹, 选择 `".."` 返回上一级文件夹，你可以在仓库的文件夹中任意导航，选择任意一个子文件夹、文件，打开，无需打开整个仓库。

当然，如果你非要想打开整个仓库，只需要在根目录中选择 `"."` 即可。

![Image](https://pic4.zhimg.com/80/v2-e4e57af53c454614b6f963aadbd6306c.gif)

打开项目后，你会看到：

![Image](https://pic4.zhimg.com/80/v2-1e327a7e4b6542252f9acee9b7080ef6.png)

注意这个文件夹 **存储在内存中**，是动态构建出的虚拟内存文件系统，如果关闭 VSCode，项目就会被销毁，这也是该插件的设计哲学之一。

虽然存储在内存中，但是你仍然可以像本地文件那样，编辑，修改，复制，粘贴，与你的本地项目进行无缝协同。

很多时候，一个仓库中含有几十个教学实例代码，每个教学实例都是一个独立的子文件夹，这时候我们可以只打开我们需要打开的那个子文件夹即可：

![Image](https://pic4.zhimg.com/80/v2-90375d5eb8374cb177171e0e0f3bd010.png)

打开之后，我们可以看到：

![Image](https://pic4.zhimg.com/80/v2-4b40f17454f3ca8155ddf77038a770ab.png)

### 保存至本地

虽然代码在内存中，但是你仍然可以右键点击你想要保存的文件（夹），点击 **Download** 即可下载至本地:

![Image](https://pic4.zhimg.com/80/v2-944e5e04d40d3fe865326aeb8e88b65f.png)

### 名字空间

你可以同时打开很多仓库的很多子文件夹，路径不会相互冲突：

![Image](https://pic4.zhimg.com/80/v2-c1ed0895e72e589a9f53338290654e2e.png)

看起来就像是我们把整个 Github 当作了我们的一个磁盘分区！

### 分支和标签

*Remote - Github* 默认打开的 master 分支，但是也可以打开其它分支或标签：

如果你想打开 `golang/go` 仓库的 `dev.link` 分支，输入:

```
golang/go -b dev.link
```

![Image](https://pic4.zhimg.com/80/v2-845c4c30d1f9d97766129ca9794dd4ec.png)

如果想打开 `torvalds/linux` 的 `v5.6` 标签 :

```
torvalds/linux -t v5.6
```

### 不足

从根目录打开大型项目，比如 `torvalds/linux`, `microsoft/vscode` 可以会遇到网络&性能问题，该问题将在未来逐步解决。最佳实践是只打开你想打开的那个文件(夹), 而不是所有。

### 设计哲学

1. 只加载源码，而不是整个 Git 历史。
2. 先加载到内存，而不是本地的文件系统。
3. 打开你想打开的，而不是所有。
4. 下载你需要的部分。
5. 惯例优于配置。

## Configurations

| Config        | Effect           | 
| :-------------: |:-------------:| 
| Remote - Github: Max Request Times Per Open  | 每次开启项目最多的请求次数，默认为 1000，设置过大会遇到网络 & 性能问题。|
|Github: Use Sync Load    | 异步加载更快，但也有更大概率被检测为机器人，使用同步加载用更慢的加载速度换取更稳定的加载。    | 
| Remote - Github: Keystore Path | 存储有 \<username\>:\<password\> or \<username\>:\<private access token\> 的绝对路径，提供之后无需手动登录。
