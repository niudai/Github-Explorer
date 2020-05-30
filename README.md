<h1 align="center"> Github Explorer </h1>

<h2 align="center" margin="auto 0">
  <img src="https://pic4.zhimg.com/80/v2-5fb9e9776207d111993e3460f3bf6b11.png" alt="vscode-zhihu logo" width="200px" /></a>
</h2>
 
<h2 align="center">
<a href="https://github.com/niudai/VSCode-Zhihu"> Browse Github Repositories Instantly Without Cloning</a>
</h2> 

- [Why Github Explorer](#why-github-explorer)
- [How to use Github Explorer](#how-to-use-github-explorer)
  - [Authentication](#authentication)
    - [Provide your own keystore path](#provide-your-own-keystore-path)
  - [Setup Github To Workspace](#setup-github-to-workspace)
  - [Open Repository](#open-repository)
  - [Namespaces](#namespaces)
  - [Save As Local Files](#save-as-local-files)
  - [Open Different Snapshot](#open-different-snapshot)
  - [Limits](#limits)
  - [Design Philosophy](#design-philosophy)
- [Configurations](#configurations)

## Why Github Explorer

How to browse github repository in VSCode?

Usually we need to `git clone` the whole git repo to our local file systems, even if we only want source code, or even a single subfolder.

That's really a waste of time and resource, especially when network is slow and the repo contains so many git big binary objects.

*Github Explorer* made **opening a remote github repo as easy as open a local folder**, you don't have to download anything to your local file system.

## How to use Github Explorer

Using Github Explorer cannot be easier, all you need is to sign in, and browse.

### Authentication

Invoke command `Github Explorer: Sign In` through command palette, type in your github username first:

![Image](https://pic4.zhimg.com/80/v2-6b66d4a91b7eb9479f78ccb79044ff49.png)

To authenticate yourself, you have two choice: *Password Authetication* and [*Personal Access Token*](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line).

>How to get github [*Personal Acces Token*](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)

In the second popup window, type in your password or personal access token:

![Image](https://pic4.zhimg.com/80/v2-3cfaa40f4582f28e91e524fa3684f965.png)

After login success, you would see a cute github icon with your username on the right bottom bar:

![Image](https://pic4.zhimg.com/80/v2-1af49126e8bb1b7784655bccc0bf5168.png)

#### Provide your own keystore path

If you want **higher security level**, you could provide your own path of file which contains your authentication string in \<username\>:\<password\> or \<username\>:\<personal access token\>. For example:

![Image](https://pic4.zhimg.com/80/v2-3c190af9c839f3e15da5ad1cfb3c71c3.png)

And paste absolute path to `Github Explorer: Keystore Path` in VSCode Settings UI:

![Image](https://pic4.zhimg.com/80/v2-3c1f45a586ffcda859ae65aaf32abfbd.png)

>You must sign in to get more request times to `api.github.com` per hour. According to github official doc, authenticated user can make up to 5000 core requests to `api.github.com` every hour. Anonymous user could only make 60 requests per hour.

### Setup Github To Workspace

Invoke `Github Explorer: Setup Workspace` to mount github folder to your workspace, after which you would see a folder named `Github` appeared in your workspace:

![Image](https://pic4.zhimg.com/80/v2-c41502d51fbadd80aa98c8246c87d8ca.png)

### Open Repository

Invoke `Github Explorer: Open Github Repository`, you would see this popup:

![Image](https://pic4.zhimg.com/80/v2-fd6c64208c0573df47a3de445a642e1c.png)

Just type in the url of your github repository, for example, `https://github.com/golang/go`, or just repo path: `golang/go`, and hit enter:

![Image](https://pic4.zhimg.com/80/v2-00ea9607a239544199f4122fb9485e54.png)

you can navigate through this repository just like navigate your local folder, `..` gets you to the parent folder, select `.`  would open current folder. If you select a file, you would just open this file.

Let's try to navigate through `golang/go` repository:

![Image](https://pic4.zhimg.com/80/v2-e4e57af53c454614b6f963aadbd6306c.gif)

Of course you can open the whole repository, all you need is select `"."` in the first entry, and the repository would appear magically in your Github Folder:

![Image](https://pic4.zhimg.com/80/v2-1e327a7e4b6542252f9acee9b7080ef6.png)

Note that the folder **resides in memory**, not stored persistently, if you close the window, all loaded files are gone.

Many times, a git repository contains many independent tutorial samples, typically `microsoft/vscode-extension-samples`, so you could open only the sample you want:

![Image](https://pic4.zhimg.com/80/v2-90375d5eb8374cb177171e0e0f3bd010.png)

Instead of cloning the whole big git repository, you could just open one subfolder:

![Image](https://pic4.zhimg.com/80/v2-4b40f17454f3ca8155ddf77038a770ab.png)

Open one file is also ok. You can try it out.

### Namespaces

The namespaces of file are dealt with gracefully, open mutiple repos would not conflict with each other:

![Image](https://pic4.zhimg.com/80/v2-c1ed0895e72e589a9f53338290654e2e.png)

It seems we **mount the whole Github as our local disk partition!**

### Save As Local Files

Although the repo resides in memory, but you could **download** it to your local file system:

![Image](https://pic4.zhimg.com/80/v2-944e5e04d40d3fe865326aeb8e88b65f.png)

Just right click any folder or files, and click download.

### Open Different Snapshot

*Github Explorer* seems ignore the "git things": branches, commits, tags...

But it's not.

You can specify which branch, or which tag you want to browse, and the syntax is pretty straghtforward:

If you want to open `dev.link` branch of `golang/go`, just type in:

```
golang/go -b dev.link
```

![Image](https://pic4.zhimg.com/80/v2-845c4c30d1f9d97766129ca9794dd4ec.png)

If you want to open `v5.6` tag of `torvalds/linux`:

```
torvalds/linux -t v5.6
```

### Limits

Open big repository like `torvalds/linux`, `microsoft/vscode` from root folder would cause some network & performance issue. The best practice is only open what you need, not whole repo.

### Design Philosophy

1. load only source code, not whole git history.
2. load to memory first, not to local environment.
3. open only what you need, not everything.
4. download as you need.
5. convention over configuration.

## Configurations

| Config        | Effect           | 
| :-------------: |:-------------:| 
| Github Explorer: Max Request Times Per Open  | The max number of request time every repo opening. If set too large, nework & performance issues may occur. |
|Github: Use Sync Load    | Asynchronous https requesting would make repo loading faster, but prone to be detected as robot. Set this true makes loading synchronous, which would slower loading process, but makes it more robust to robot detection.     | 
| Github Explorer: Keystore Path | Instead of type in username and authentication string manually, you can provide the absolute path of your own file which contains \<username\>:\<password\> or \<username\>:\<private access token\>.
