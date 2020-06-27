<h1 align="center"> Remote - Github </h1>

[![](https://vsmarketplacebadge.apphb.com/version-short/niudai.remote-github.svg)](https://marketplace.visualstudio.com/items?itemName=niudai.remote-github)
[![](https://vsmarketplacebadge.apphb.com/downloads-short/niudai.remote-github.svg)](https://marketplace.visualstudio.com/items?itemName=niudai.remote-github)
[![](https://vsmarketplacebadge.apphb.com/rating-short/niudai.remote-github.svg)](https://marketplace.visualstudio.com/items?itemName=niudai.remote-github)

<h2 align="center" margin="auto 0">
  <img src="https://pic4.zhimg.com/80/v2-5fb9e9776207d111993e3460f3bf6b11.png" alt="vscode-zhihu logo" width="200px" /></a>
</h2>
 
<h2 align="center">
<a href="https://github.com/niudai/Github-Explorer"> Browse Github Repositories Instantly Without Cloning</a>
</h2> 

- [Why Remote - Github](#why-remote---github)
- [How to use Remote - Github](#how-to-use-remote---github)
  - [Authentication](#authentication)
    - [Provide your own keystore path](#provide-your-own-keystore-path)
  - [Setup Github To Workspace](#setup-github-to-workspace)
  - [Open Repository](#open-repository)
  - [Enable VS Code Full Feature Set By Providing Mount Point](#enable-vs-code-full-feature-set-by-providing-mount-point)
  - [Repository Searching](#repository-searching)
  - [Namespaces](#namespaces)
  - [Save As Local Files](#save-as-local-files)
  - [Open Different Snapshot](#open-different-snapshot)
  - [Create Remote Github Repository In VS Code](#create-remote-github-repository-in-vs-code)
  - [Limits](#limits)
  - [Design Philosophy](#design-philosophy)
- [Configurations](#configurations)

## Why Remote - Github

How to browse github repository in VSCode?

Usually we need to `git clone` the whole git repo to our local file systems, even if we only want source code, or even a single subfolder.

That's really a waste of time and resource, especially when network is slow and the repo contains so many git big binary objects.

*Remote - Github* made **opening a remote github repo as easy as open a local folder**, you don't have to download anything to your local file system.

## How to use Remote - Github

Using Remote - Github cannot be easier, all you need is to sign in, and browse.

### Authentication

Invoke command `Remote - Github: Sign In` through command palette, type in your github username first:

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

And paste absolute path to `Remote - Github: Keystore Path` in VSCode Settings UI:

![Image](https://pic4.zhimg.com/80/v2-3c1f45a586ffcda859ae65aaf32abfbd.png)

>You must sign in to get more request times to `api.github.com` per hour. According to github official doc, authenticated user can make up to 5000 core requests to `api.github.com` every hour. Anonymous user could only make 60 requests per hour.

### Setup Github To Workspace

Invoke `Remote - Github: Setup Workspace` to mount github folder to your workspace, after which you would see a folder named `Github` appeared in your workspace:

![Image](https://pic4.zhimg.com/80/v2-c41502d51fbadd80aa98c8246c87d8ca.png)

### Open Repository

Invoke `Remote - Github: Open Github Repository`, you would see this popup:

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

### Enable VS Code Full Feature Set By Providing Mount Point

VS Code supports **Intellisense**, **Code Navigation**, **File Searching**, etc. Browing code would be much easier with these amazing features, but people find they cannot do this with files loaded by *Remote - Github*. 

It is because *Remote - Github* stores them to memory, namely, virtual file system first, so the vscode could not analyze it, neither do other tools like `npm`, `maven`, etc.

*Remote - Github* now gives you a choice to enable all these features by writing loaded files to your local fs. It's really simple, all you need is provide a "mount point" (just an absolute path to store the whole *github* folder):

![Image](https://pic4.zhimg.com/80/v2-901592099811a0179a28df76710c29d8.png)

Once the mount point is provided, all loaded file would be written to a newly created `github` folder under your mount point, and everything works just like before except that vscode features are enabled.

After that, you could find anything in your local github folder, and you can compile it, modify and save it, and run it.

### Repository Searching

In 0.1, if you want to open `vscode` repo, you need to input `https://github.com/microsoft/vscode`. To do this, you have to open github and find this repo, paste link to *Remote-Github*.

With *Repository Searching*, all you have to do it provide a single keyword like "vscode", and *Remote-Github* would provide you several searching results for you to pick:

![Image](https://pic4.zhimg.com/80/v2-58de08328148776bbafe7c27939c03bb.png)

This would not break the old behavior, if you provide full link, everything works like in 0.1.


### Namespaces

The namespaces of file are dealt with gracefully, open mutiple repos would not conflict with each other:

![Image](https://pic4.zhimg.com/80/v2-c1ed0895e72e589a9f53338290654e2e.png)

It seems we **mount the whole Github as our local disk partition!**

### Save As Local Files

Although the repo resides in memory, but you could **download** it to your local file system:

![Image](https://pic4.zhimg.com/80/v2-944e5e04d40d3fe865326aeb8e88b65f.png)

Just right click any folder or files, and click download.

### Open Different Snapshot

*Remote - Github* seems ignore the "git things": branches, commits, tags...

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

### Create Remote Github Repository In VS Code

In order to set up a remote repo, usually we need to open browser and create a repo in github manually, and then push the local repo to it.

With *Remote - Github*, you can create remote github repo right in VS Code and sync with your local repo automatically.

Just invoke `Remote - Github: Create Remote Github Repository` command, and input the repo name and description:

![Image](https://pic4.zhimg.com/80/v2-65e114b72bb505de0e3b9bbd4bd602e0.png)

![Image](https://pic4.zhimg.com/80/v2-d845f3f85f5f2ff905532d836ad08b22.png)

select repo type, public or private:

![Image](https://pic4.zhimg.com/80/v2-fc62124249f61bfc1d74120ada1bfaa1.png)

Wait a sec, the repo would be created:

![Image](https://pic4.zhimg.com/80/v2-bb92fd4ff18b95f3c5040b02c400ae91.png)

click `see it` to see the repo in browser:

![Image](https://pic4.zhimg.com/80/v2-65ff536d710b9b585dd76262b25c4121.png)

Once repo is created, *Remote - Github* would open a new terminal, and run several commands to set up your local repo to sync with your remote repo:

```
git init
git remote add origin https://github.com/<username>/<reponame>
git push -u origin master
```

Notice that `git init` would have no effect if your local repo has already set up git. Just don't worry it.

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
| Remote - Github: Max Request Times Per Open  | The max number of request time every repo opening. If set too large, nework & performance issues may occur. |
|Github: Use Sync Load    | Asynchronous https requesting would make repo loading faster, but prone to be detected as robot. Set this true makes loading synchronous, which would slower loading process, but makes it more robust to robot detection.     | 
| Remote - Github: Keystore Path | Instead of type in username and authentication string manually, you can provide the absolute path of your own file which contains \<username\>:\<password\> or \<username\>:\<private access token\>. |
| Remote - Github: Mount Point | If provided, dynamically loaded repo would be written to here. (Please provide absolute path) |
