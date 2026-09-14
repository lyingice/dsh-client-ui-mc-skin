# dsh-client-ui-mc-skin

给 DeepSeek Harness Web 客户端用的 **Minecraft 风格主题**：像素立体按钮、MC GUI 调色板、on/off 开关图、十六色聊天字体，以及**可选的 Minecraft AE 像素字体**。

PNG 素材已内联进 bundle（5 张 / 2552 字节）；**字体不内联**——16 MB 的 `assets/MinecraftAE-Pixel.ttf` 由本包的 Host 半边按需发货，只在开关打开时才下载。所以本包现在两半都有：`lib/index.js`（Host，一条字体路由）+ `lib/client.js`（浏览器）。

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

> 这次重启**不只是**为了 bundle 层：字体路由是 Host 半边注册的，而 Host 半边的模块只在进程启动时 import 一次。**1.1.0 起本包有了 Host 半边，所以从旧版升级上来也必须重启一次**，否则浏览器那边一切正常、字体开关却会显示"加载失败"。

---

## 验证装好了

重启后：

- 侧边栏左上角的标志变成 24×24 的像素图（`minecraft24x.png`），右边的 `MINECRAFT` 也是像素字体
- 整个界面变成 MC 深色：工作区 `#313233`、对话区 `#6B6B6B`、按钮是 `#C6C6C6` 立体斜角、分页是绿板
- 界面文字变成 Minecraft AE 像素字体
- 设置 → 通用里多出三行：**MC 主题** / **MC 像素字体** / **MC 字体颜色**
- 设置 → 模型 → 点「编辑」展开的面板是**黑底 + 亮边框**（见下文《浅色模式漏白底》）

想确认字体路由本身通了，可以直接打这条 URL：

```bash
curl -I http://127.0.0.1:3080/dsh-mc-skin/font.ttf
# 期望 200 + content-type: font/ttf + 一个 ETag
```

---

## 卸载

```bash
dsh plugin --profile web remove dsh-client-ui-mc-skin
```

这一步会顺带把它从 `bundles` 里摘掉（同样是自动 reconcile）。重启生效。

或者不卸载，直接去 设置 → 通用。两个开关**完全独立**：

- **MC 主题** 关掉 → 配色、标志图、主题样式表还原成原生；像素字体如果开着，仍然继续生效
- **MC 像素字体** 关掉 → 只还原字体，配色和标志图保持 MC 皮肤
- 两个都关掉 → `<style>` 元素整个移除，和没装一样

---

## 分享给别人

本包**没有任何构建期依赖**，`lib/` 是提交进仓库的成品，所以别人拿到就能装，不需要在他们机器上跑构建。

包体积主要是字体：`assets/MinecraftAE-Pixel.ttf` 16 MB，zip 压完大约 8 MB。不带字体也能跑（字体开关会显示"加载失败"，界面用系统字体）——只要把 `assets/MinecraftAE-Pixel.ttf` 删掉再打包即可，别的都不用改。

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

- [ ] `lib/client.js` **和 `lib/index.js` 都必须提交**，别写进 `.gitignore`——git 安装不会跑构建
- [ ] `assets/MinecraftAE-Pixel.ttf` 也是，别被 `*.ttf` 之类的规则误伤（本包 `.gitignore` 只忽略 `node_modules/` 和编辑器杂物）
- [ ] `cordis.patch.yml` 在仓库根，否则 `dsh` 不会把它登记进 `bundles`
- [ ] 不要加 `prepare` 脚本：pnpm 会把它当成需要审批的构建脚本（`allowBuilds`）拦下来。本包只有 `build` / `prepack`，git 安装时都不会触发
- [ ] `package.json` 里补上 `repository` / `homepage` / `bugs`（本包目前没有填）
- [ ] 发版时改 `version` 并打 tag

> GitHub 单文件上限是 100 MB，16 MB 的字体没问题；但注意 git 历史是不可变的，以后换字体会让仓库持续变大。

### 三个坑

- **npm registry 装不了。** 本包没有发布到 npm，`dsh plugin add dsh-client-ui-mc-skin` 这种裸包名会失败。只能用本地路径或 GitHub。
- **依赖 DSH 内部结构。** 槽位名、主题 token 名、CSS Module 局部类名都是跟着当前 DSH 版本走的，见下文《已知限制》。
- **升级到 1.1.0 要重启。** 1.1.0 新增了 Host 半边（字体路由），而 Host 模块只在进程启动时 import。

---

## 它改了什么

分五块，都通过 cordis 的标准接口，停止时会干净回滚：

| 动作 | 机制 |
|---|---|
| 覆盖主题颜色 | `theme.overrideTokens(包名, tokens)`，返回 disposer |
| 注入样式表 | `document.head` 插一个带 `data-plugin-css` 的 `<style>`，卸载时移除 |
| 三个槽位 | `slots.register({ name, priority: -1 }, 组件)` 到 `sidebar.brand.mark` / `sidebar.brand.name` / `conversation.hero.brand.mark` |
| 三行设置 | `slots.register` 到 `settings.general.item`（列表槽位，`order` 13 / 14 / 15） |
| 字体路由 | Host 半边 `webServer.register({ kind: 'exact', path: '/dsh-mc-skin/font.ttf', ... })` |

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

### 为什么字体走 Host 半边，而不是像 PNG 那样内联

因为客户端插件**没有静态资源路由**——`dsh-client-modules` 只发 `/plugins/<包名>/client.js`（和它的 `.map`）。
要把字体送进浏览器只有两条路：

| 方案 | 代价 |
|---|---|
| base64 内联进 `lib/client.js` | 产物从 30 KB 变成 **22 MB**，每次打开界面都要下载并解析这 22 MB |
| Host 半边注册一条路由 | 字体留在磁盘上，**只在开关打开时才下载**，之后走 ETag 复验 |

所以选了后者。实测数据（loopback，Chrome headless）：

| 项目 | 值 |
|---|---|
| 字体文件 | 16 162 252 字节（63 449 个字形，覆盖整个 BMP，含中日韩） |
| 首次传输（走了 webServer 的 gzip） | **3 853 326 字节**，约 0.43 s |
| 第二次打开（`If-None-Match`） | **304**，0 字节 |
| `lib/client.js` 产物 | 35 936 字节（和加字体前同一量级） |

`@font-face` 的 `src` 指向 `/dsh-mc-skin/font.ttf`，这个常量在 `src/index.js` 和 `src/client.js`
里各有一份（两个 bundle 共享不了模块），**改一处必须改另一处**。

配套的 CSS 细节：

- `font-synthesis-weight:none` —— 像素字体不能合成粗体，伪粗体会把 1px 笔画糊成 2px
- `html body,html body button,...{ font-family:"Minecraft AE",... !important }` —— 这是给
  那些**自己不声明 font-family** 的元素用的（下面这条说明它为什么不够）

### 行内 `font-family` 盖不住，加 `!important` 也没用

品牌名（`MINECRAFT`）一开始漏掉了像素字体，原因值得单独记一笔：

`BrandName` 这个 span 自带行内 `font-family:"Courier New",...`。样式表里那条
`html body{font-family:"Minecraft AE" !important}` 的**主体是 body**，span 只是
**继承**了 body 的值 —— 而继承是层叠里的最后一名，永远输给元素自己的任何声明，
**哪怕那条声明不带 `!important`，也哪怕继承过来的那条带 `!important`**。
两边根本不是同一条声明在竞争，所以堆多少个 `!important` 都没用。

要覆盖它只有两条路：让规则**直接匹配到这个 span**（如 `html body span{...!important}`），
或者让组件自己知道该用哪套字体。这里选了后者 —— `BrandName` 订阅字体开关，自己算 font stack。

### 字体要覆写变量，不是给元素设字体

同一个坑后来以更大的规模又踩了一次：品牌名修好之后，**输入框里打的字、对话里的字**
仍然不是像素字体。原因还是"元素自己的声明赢过继承"，但这次没法靠匹配元素解决：

```css
/* 应用自己的规则 */
body       {font-family:var(--dsw-font-family, -apple-system, …)}
.xxx_input {font-family:var(--dsw-font-family)}   /* ← 输入区，一个 contenteditable 的 div */
```

`.xxx_input` 是**元素自己的声明**，而 `html body input{font-family:…!important}` 匹配的是
`html` 和 `body`，对这个 div 只是**继承** —— 继承永远输，`!important` 也救不了。
更要命的是输入区根本不是 `<input>`/`<textarea>`，是 `contenteditable` 的 `<div>`
（打字后里面才生成 `<p>`），所以连 `input` 这个类型选择器都命中不了。

正确的做法是**覆写变量本身**，让应用自己那条声明去解析：

```css
html:root body{--dsw-font-family:"Minecraft AE",… !important;
               --ds-font-family-code:"Minecraft AE",… !important;}
```

- `--dsw-font-family` 被整套排版 token 引用（`--dsw-font-base-16`、`--dsw-font-markdown-*`、
  `--dsw-font-s-14` …共 40 多处），所以这**一条**就能把界面文字整体换掉。
- `--ds-font-family-code` 是行内代码和代码块单独走的那条，不改的话代码区仍是 SF Mono。
- 选择器用 `html:root body` 而不是 `body`：应用把 token 定义在 `body` 上，
  而 `html[data-ds-dark-theme] body` 这类选择器比 `html body` 更具体，得抬一级才稳。

原来的 `html body button,input,…{font-family:…}` 保留成兜底（万一某个组件把字体写成字面量
而不是 `var()`），但真正起作用的是上面这条变量覆写。

### 透明度做层次，在浅底上会糊

文字层次原来是用**半透明白**递降做的：`primary #FFFFFF` / `secondary .74` / `tertiary .56` /
`caption .44`。在侧边栏 `#313233` 上勉强能看，但对话区的底是 `#6B6B6B` 这种中灰，
半透明白压上去会直接糊掉：

| 层级 | 侧边栏 `#313233` | 对话区 `#6B6B6B` |
|---|---|---|
| `secondary .74` | 8.5:1 | **3.5:1** |
| `tertiary .56` | 5.2:1 | **2.4:1** |
| `caption .44` | 3.6:1 | **1.8:1** |

数字上"及格"不等于看着清楚 —— 用户报的「黑背景地方字体变灰看不清」就是这个。
现在已经整体抬高：`.88 / .82 / .68`，侧边栏上分别是 10.3 / 9.2 / 6.9，中灰底上 4.6 / 4.2 / 3.4。
**层次感要靠字号和字重，不能靠把字调到快看不见。**

### 浅色模式漏白底

DSH 的设计 token 分两套：`body{...}` 是浅色值，`body[data-ds-dark-theme]{...}` 是深色值。
本主题用 `theme.overrideTokens` 把值写成 **body 的行内样式**，所以两种模式下都是同一个值 ——
但前提是**这个 token 得在覆盖表里**。

一旦漏掉，浅色模式下那个 token 就还是近白色，而文字早被主题染成浅色 ⇒ **白底白字**。
设置 → 模型 →「编辑」展开的面板踩的就是这个：组件写的是
`.editor{background:var(--dsw-alias-bg-module-platform)}`，而 `bg-module-platform`
浅色值是 `#f9fafb`。

排查办法：把 DSH 的设计表整个解出来，逐 token 比对**浅色值**和**深色值**——凡是"浅色近白、
深色才深"的面板 token 就是可疑的。按用户实际报过的位置，目前钉了 10 个：

| token | 浅色时是 | 现在 | 用户在哪看到的 |
|---|---|---|---|
| `--dsw-alias-bg-module-platform` | `#f9fafb` | `#1B1C1D`（黑底） | 设置 → 模型 →「编辑」展开的面板 |
| `--dsw-specific-tip` | `#f5f6f7` | `#353638` | 任务面板（展开的待办列表） |
| `--dsw-alias-bg-multi-select` | `#f9fafb` | `#2A2B2C` | |
| `--dsw-alias-bg-mask-drop` | `#ffffffb3` | `#000000B3` | |
| `--dsw-alias-button-elevated-fill` | `#fff` | `#3A3B3C` | |
| `--dsw-alias-button-floating-fill` | `#fff` | `#3A3B3C` | |
| `--dsw-alias-button-ghost-active-fill` | `#ebeef2` | `#3A3B3C` | |
| `--dsw-alias-interactive-bg-hover-solid` | `#f1f3f5` | `#3A3B3C` | |
| `--dsw-alias-scrollbar-bg-l1` | `#e5e5e5` | `#313233` | |
| `--dsw-alias-scrollbar-bg-l2` | `#e5e5e5` | `#474848` | |

`--dsw-specific-tip` 的深色值是 `#353638`，正好等于本主题的 `--dsw-alias-bg-layer-3`，
所以这不是自己配色，是把这个面钉回设计系统里它本该有的深色。

> **⚠ 范围纪律（踩过的坑）。** 上面这个"逐 token 比对"的办法一旦用过头就会出事：
> 全套设计表里"浅色近白、深色才深"的 token 有 **44 个**。曾经照单全钉了 29 个，
> 结果把菜单、用户气泡、侧边栏选中态等**用户根本没提过**的颜色一起重刷了。
>
> 判定一个面要不要改，得同时满足三条：
> 1. 它在浅色模式下确实近白；
> 2. 它**承载文字**（纯装饰的底色改了也白改）；
> 3. **用户明确报过**这个位置。
>
> 只满足第 1 条的，一律不动。枚举工具留在 `.dsh-tools/token-leak-truth.mjs`。
>
> 顺带一个反例：`token 浅色近白 ≠ 就该深色化`。有些 token 的语义是"反色文字"
> （`--dsw-alias-label-primary-foreground` 配 `button-primary-fill`、
> `--dsw-alias-label-primary-inverted` 配 `button-contrast-fill`），它们的浅色值就是 `#fff`，
> 深色化会让"深底配深字"，正好反过来。

顺带扫了前端自带的 CSS：整个 dist 里只有**一个**浅色字面量
（`body{background:var(--dsw-alias-bg-base,#fff)}`，而 `bg-base` 本来就被覆盖），
所以这类漏底**只会来自 alias token，不会来自字面量**。

那块面板另外加了一条规则补亮边框（就是"白框黑底"）：

```css
[class*="_rowCard"] > [class*="_editor"]{border:1px solid #C6C6C6 !important;}
```

限定在 `_rowCard` 里那一层是有原因的：组件在 `addCard` / `setupCard` 里复用了同一个
`_editor` 类，但故意写成 `background:0 0`。不加限定的话，那些地方也会被套上一圈框，出现双重边框。

调色板来自一组 16×16 的模板图（`button_template` / `page_template` / `text_template` / `background_template_left` / `background_template_right` / `滑轮模板`），全部按像素复刻成 CSS。

---

## 换字体

字体放在 `assets/MinecraftAE-Pixel.ttf`，**直接替换这个文件即可**，不用重新构建——Host 半边按
`大小 + mtime` 算 ETag，换了文件下次请求就是新的。

要注意的是 CSS 里写的族名是 `"Minecraft AE"`（`src/client.js` 的 `FONT_FAMILY`），
所以换的字体要么内部 family 就叫这个，要么同步改 `FONT_FAMILY` 后 `node build.mjs`。

想换成别的路径、或者不打包字体而是用用户自己的文件，改 `src/index.js` 里的 `FONT_PATH`。

---

## 改图 / 改代码重新构建

`assets/` 里放两类东西，处理方式不同：

| 文件 | 用途 | 是否内联 |
|---|---|---|
| `minecraft24x.png` | 侧边栏标志，24×24（1:1 渲染） | 是 |
| `minecraft34x.png` | 新会话首屏标志，34×34（1:1 渲染） | 是 |
| `on.png` / `off.png` | 开关两态，30×16 | 是 |
| `close.png` | 关闭按钮，15×15 | 是 |
| `MinecraftAE-Pixel.ttf` | 像素字体，16 MB | **否**，走 Host 路由 |

换掉图之后：

```bash
node build.mjs
```

`lib/` 是**纯产物目录**，两个半边都由这一步生成：

- `src/client.js` → `lib/client.js`：把 `assets/*.png` 转成 data URL 注入 `__ASSETS__` 占位符
- `src/index.js` → `lib/index.js`：Host 半边原样搬运（只加一条"勿手改"横幅）

**不需要任何依赖**，只用 Node 内置模块，也不联网。

渲染端会读 `naturalWidth`，取不大于目标尺寸的最大整数倍——所以 32×32 的图放进 34 的框里会按 32 渲染（1:1），而不是拉伸。

---

## 已知限制

- **开关状态不持久。** 主题开关、像素字体开关、字体颜色都存在内存里，重启回到默认（前两个默认开，颜色默认 `§f` 白）。要做持久化得接 `settings` 服务。
- **主题是深色单套。** 浅色/深色模式目前是同一组值，切换不改变外观——因为模板图本身就是深色体系。本主题会把上表那 10 个面板 token 也钉成深色，所以即使应用处于**浅色模式**也不会漏白底（**只限用户报过的那几个面**，见《浅色模式漏白底》里的范围纪律）。
- **第三方插件的自绘界面不在覆盖范围内。** 本主题只负责 DSH 自己的 token 和类名；别的插件如果写死了浅色背景，那部分仍是它自己的样子。
- **字体文件 16 MB。** 首次开启要下 3.85 MB（gzip 后）。本机 loopback 无感，但如果哪天把 DSH 挂到网络上，这就是一笔真实流量。想变小只能做字体子集化——实测 ASCII+拉丁 602 个字形只占 60 KB，但中日韩统一表意区就要 6.2 MB，所以"只留常用字"可以做到 ~1 MB，代价是生僻字回落到系统字体。
- **像素字体在小字号下是设计尺寸。** 这份字体是 16×16 点阵风格，12–15 px 下最锐利；界面缩放（Ctrl +/-）到非整数倍时笔画会糊。
- **依赖内部类名后缀。** 按钮/分页/卡片等规则按 `[class*="_xxx"]` 匹配 DSH 的 CSS Module 局部名。DSH 若把这些名字改掉，对应规则会静默失效（不会报错，只是那部分回到原生样式）。
- **依赖内部槽位名。** `sidebar.brand.mark` / `sidebar.brand.name` / `conversation.hero.brand.mark` / `settings.general.item` 同理，改了就少渲染一部分。

---

## 许可

MIT。素材（`assets/*.png`）与字体（`assets/MinecraftAE-Pixel.ttf`）由使用者提供，字体版权归其原作者，本仓库只做打包与接线。
