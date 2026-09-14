# dsh-client-ui-mc-skin

给 DeepSeek Harness Web 客户端用的 **Minecraft 风格主题**：像素立体按钮、MC GUI 调色板、on/off 开关图、十六色聊天字体。

素材已内联进 bundle（5 张 PNG / 2552 字节），**本包没有 Host 侧行为，也不依赖任何外部目录**——解压即用。

---

## 安装

前提：你已经跑起来过 `dsh web`，也就是 `~/.dsh/profiles/web/` 存在（Windows 是 `C:\Users\<你>\.dsh\profiles\web\`）。

**1. 解压**到你喜欢的任意目录，例如 `D:\plugins\dsh-client-ui-mc-skin`。

**2. 装进 profile**

```bash
dsh plugin --profile web add link:D:\plugins\dsh-client-ui-mc-skin
```

这条命令把参数转发给 profile 目录里的 pnpm，等价于在 `~/.dsh/profiles/web/` 下执行 `pnpm add <你解压的路径>`。

用 `link:` 前缀会把 profile 的 `node_modules` 指向你解压的目录本身——之后 `node build.mjs` 重新构建，重启即生效。想装成独立副本就去掉 `link:`（走 `file:` 语义，会拷一份）。

**3. 登记进 bundles —— 已自动，无需手工**

本包 `package.json` 里声明了：

```json
"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
```

并自带 `cordis.patch.yml`（一行 `insert`）。`dsh plugin add` 结束时会按"已装状态"重算 `dsh.profile.bundles`，看到这个声明就自动把包名追加进去，所以**不用再手工编辑 `package.json`**。

> 如果第 2 步没带 `link:`／没装成功，或者你手动把包解压到别处而不是走 `dsh plugin add`，那就还得自己把它加进 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles`。profile 的 `cordis.yml` 是空数组，整棵插件树是由 `bundles` 里每一项逐层叠加出来的——只装上而不登记，插件不会被加载。

**4. 重启 `dsh web`。**

bundle 层是启动时读取的，所以第一次装完必须重启；之后改代码才走热重载。

---

## 验证装好了

重启后：

- 侧边栏左上角的标志变成 24×24 的像素图（`minecraft24x.png`）
- 整个界面变成 MC 深色：工作区 `#313233`、对话区 `#6B6B6B`、按钮是 `#C6C6C6` 立体斜角、分页是绿板
- 设置 → 通用里多出两行：**MC 主题**（on/off 开关）和 **MC 字体颜色**（十六色）

---

## 卸载

```bash
dsh plugin --profile web remove dsh-client-ui-mc-skin
```

这一步会顺带把它从 `bundles` 里摘掉（同样是自动 reconcile）。重启生效。

或者不卸载，直接去 设置 → 通用 → MC 主题 点开关关掉——会把配色、字体、标志图全部还原成原生。

---

## 分享给别人

本包**没有任何构建期依赖**，`lib/` 是提交进仓库的成品，所以别人拿到就能装，不需要在他们机器上跑构建。

### 方式一：发 zip

对方解压后（路径随意，比如 `D:\plugins\dsh-client-ui-mc-skin`）：

```bash
dsh plugin --profile web add D:\plugins\dsh-client-ui-mc-skin
```

这里有个**要提前说清楚的差别**（两种写法实测行为不同）：

| 写法 | pnpm 实际记录 | 解压目录删掉/挪走后 |
|---|---|---|
| `add <目录>` | `link:`（SymbolicLink 指向解压目录） | **插件失效** |
| `add file:<目录>` | 真实副本（拷进 profile） | 仍然可用 |

- 想**让对方自己改图重构建**：用第一种（`link:`），解压目录就是生效的源，改完 `node build.mjs` 重启即生效。
- 想**发出去就不管了**：用 `add file:<目录>`，装完对方可以把解压目录删掉。

两种写法都**不需要联网**，也都不需要对方装构建工具。装完**重启 `dsh web`**（bundle 层是启动时读的）。

### 方式二：GitHub

仓库**根目录就是包根目录**（`package.json` / `cordis.patch.yml` / `lib/` 都在根上），然后：

```bash
dsh plugin --profile web add github:<用户>/<仓库>
```

生产上建议**钉到 tag 或 commit**，否则别人拿到的是默认分支的浮动最新版：

```bash
dsh plugin --profile web add github:<用户>/<仓库>#v1.0.0
```

上 GitHub 前的检查清单：

- [ ] `lib/client.js` **必须提交**，别写进 `.gitignore`——git 安装不会跑构建
- [ ] `cordis.patch.yml` 在仓库根，否则 `dsh` 不会把它登记进 `bundles`
- [ ] 不要加 `prepare` 脚本：pnpm 会把它当成需要审批的构建脚本（`allowBuilds`）拦下来。本包只有 `build` / `prepack`，git 安装时都不会触发
- [ ] `package.json` 里补上 `repository` / `homepage` / `bugs`（本包目前没有填）
- [ ] 发版时改 `version` 并打 tag

### 两个坑

- **npm registry 装不了。** 本包没有发布到 npm，`dsh plugin add dsh-client-ui-mc-skin` 这种裸包名会失败。只能用本地路径或 GitHub。
- **依赖 DSH 内部结构。** 槽位名、主题 token 名、CSS Module 局部类名都是跟着当前 DSH 版本走的，见下文《已知限制》。

---

## 它改了什么

分四块，都通过 cordis 的标准接口，停止时会干净回滚：

| 动作 | 机制 |
|---|---|
| 覆盖主题颜色 | `theme.overrideTokens(包名, tokens)`，返回 disposer |
| 注入样式表 | `document.head` 插一个带 `data-plugin-css` 的 `<style>`，卸载时移除 |
| 三个槽位 | `slots.register({ name, priority: -1 }, 组件)` 到 `sidebar.brand.mark` / `sidebar.brand.name` / `conversation.hero.brand.mark` |
| 两行设置 | `slots.register` 到 `settings.general.item`（列表槽位，`order` 13 / 14） |

### 为什么品牌槽位必须写 `priority: -1`

`sidebar.brand.mark` / `sidebar.brand.name` 是 **single 槽位**：同一优先级只允许一条注册，
官方品牌插件（`dsh-client-ui-brand-official`）已经占在 `priority: 0` 上。规则是**最低者渲染**
（lowest renders），所以要么用更低的优先级遮蔽它，要么就直接抛错：

```
Error: single slot "sidebar.brand.mark" already has a registration at priority 0
       (registered by Ba) — register at a different priority to shadow it (lowest renders)
```

这个错误**只出现在浏览器控制台**，Host 侧毫无反应（插件照常加载、主题色照常生效），
表现为"主题变了但左上角还是鲸鱼"。删掉 `priority: -1` 就会复现。

调色板来自一组 16×16 的模板图（`button_template` / `page_template` / `text_template` / `background_template_left` / `background_template_right` / `滑轮模板`），全部按像素复刻成 CSS。

---

## 改图重新构建

`assets/` 里放的就是内联进包的素材：

| 文件 | 用途 | 尺寸 |
|---|---|---|
| `minecraft24x.png` | 侧边栏标志 | 24×24（1:1 渲染） |
| `minecraft34x.png` | 新会话首屏标志 | 34×34（1:1 渲染） |
| `on.png` / `off.png` | 主题开关两态 | 30×16 |
| `close.png` | 关闭按钮 | 15×15 |

换掉图之后：

```bash
node build.mjs
```

会把 `assets/*.png` 转成 data URL 注入 `src/client.js`，产出新的 `lib/client.js`。**不需要任何依赖**，只用 Node 内置模块。

渲染端会读 `naturalWidth`，取不大于目标尺寸的最大整数倍——所以 32×32 的图放进 34 的框里会按 32 渲染（1:1），而不是拉伸。

---

## 已知限制

- **字体颜色设置不持久。** 存在内存里，重启回到默认 `§f` 白。要做持久化得接 `settings` 服务。
- **主题是深色单套。** 浅色/深色模式目前是同一组值，切换不改变外观——因为模板图本身就是深色体系。
- **依赖内部类名后缀。** 按钮/分页/卡片等规则按 `[class*="_xxx"]` 匹配 DSH 的 CSS Module 局部名。DSH 若把这些名字改掉，对应规则会静默失效（不会报错，只是那部分回到原生样式）。

---

## 许可

MIT。素材（`assets/*.png`）由使用者提供。
