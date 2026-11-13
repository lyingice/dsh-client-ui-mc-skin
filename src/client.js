/**
 * MC Skin — Minecraft 风格的 DeepSeek Harness 客户端主题
 *
 * 源码形态。`__ASSETS__` 是构建时占位符，由 build.mjs 替换为内联的 data URL 表。
 * 产物写到 lib/client.js，也就是 package.json 里 exports["./client"] 指向的文件。
 *
 * 这个包只做五件事：
 *   1. 覆盖主题颜色 token（走 theme.overrideTokens，可逆）
 *   2. 注入一份样式表（document.head，带 data-plugin-css 标记，随插件卸载移除）
 *   3. 往三个槽位注册像素标志图（侧边栏标志 / 品牌名 / 首屏标志）
 *   4. 往设置通用区加三行：主题开关、像素字体开关、MC 十六色
 *   5. 按开关把界面字体换成 Minecraft AE —— @font-face 指向 Host 半边
 *      （src/index.js）注册的路由，16 MB 的字体文件不进本文件，只在开关
 *      打开时才由浏览器去下载。
 *
 * PNG 素材是内联的；字体不是。两边各司其职的原因见 src/index.js 开头。
 */

window.__ModuleLoader__.load({
  id: 'dsh-client-ui-mc-skin',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports

    var React = require('react')

    // ── 构建时注入：文件名 -> data URL ────────────────────────────────
    var ASSETS = __ASSETS__

    var PLUGIN_ID = 'dsh-client-ui-mc-skin'
    var CSS_TAG = PLUGIN_ID + '/theme.css'

    // 持久化命名空间与字段名。两边必须一致：
    //   Host 半边（src/index.js）用 SETTINGS_NAMESPACE 注册 schema；
    //   客户端半边用同一个名字 bind，字段名必须与 schema 的键对齐。
    // 改一处必须改另一处。
    var SETTINGS_NAMESPACE = 'ui-mc-skin'
    var SETTINGS_FIELD_THEME = 'themeEnabled'
    var SETTINGS_FIELD_FONT = 'pixelFontEnabled'

    // 设置行末尾那句持久化说明。只有真的连上 Host 设置文档时才这么说，
    // 否则等于对用户撒谎（memory 模式下重启就丢）。
    var SETTINGS_HINT = ''

    // 字体路由由 Host 半边（src/index.js）注册，两边必须是同一个路径。
    var FONT_ROUTE = '/dsh-mc-skin/font.ttf'
    // 用来匹配 @font-face 的族名。这里就是字体 name 表里的 family
    // （"Minecraft AE"），不是文件名 —— 虽然 @font-face 允许随便起名，
    // 用真名能让 DevTools 里一眼看懂。
    var FONT_FAMILY = 'Minecraft AE'
    var MONO_STACK = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'

    // ── Ore UI 调色板（照搬 ClastarStudio 的实现）────────────────────
    //
    // 来源：C:\Users\12501\Pictures\Screenshots\ClastarStudio\styles\shell.css
    // 它是本机现成的一份 Ore UI 实现，注释原文写着「Ore UI：深灰平板 + 直角 +
    // 2px 硬边；绿色主按钮」。既然要"照搬"，配色和形状就直接取它的变量值，
    // 不另做取舍 —— 它比从规范图里反推的更完整（含 hover/active/selected 全套）。
    //
    // 它的形状配方（三件套，整个 UI 一致）：
    //   border: 2px solid <近黑>                         ← 硬边
    //   box-shadow: inset 0 1px 0 #ffffff10              ← 顶部高光
    //               inset 0 -3px 0 #00000033             ← 底部内阴影
    //   :active { transform: translateY(1px) }           ← 按下去真的动一下
    // 选中态不用换背景色，而是 `inset 3px 0 0 accent`（左侧绿条）或
    // `inset 0 3px 0 accent`（标签页顶部绿条）。
    var ORE_ACCENT     = '#4c9a2a'   // 主色绿
    var ORE_ACCENT2    = '#6fc244'   // 绿·亮（hover / 图标）
    var ORE_ACCENTD    = '#2f6b1a'   // 绿·暗（底部唇边）
    var ORE_ACCENT_A   = '#4c9a2a55' // 绿·半透明（外发光）

    var ORE_DEEP       = '#0d0d0d'   // 画面最底
    var ORE_CANVAS     = '#161616'   // 应用底 / 侧栏 / 会话区
    var ORE_BG2        = '#1e1e1e'   // 次级底
    var ORE_BG3        = '#262626'   // 三级底 / 栏头
    var ORE_RAIL       = '#2a2a2a'   // 侧栏
    var ORE_CONTENT    = '#1a1a1a'   // 内容区
    var ORE_HEAD       = '#232323'   // 栏头
    var ORE_BANNER     = '#1d1d1d'   // 标签条底

    var ORE_PANEL      = '#4a4a4a'   // 按钮面
    var ORE_SURFACE    = '#3c3c3c'   // 卡片 / 气泡 / 列表行
    var ORE_SURFACE_HI = '#484848'   // 悬停
    var ORE_PANEL3     = '#585858'   // 选中
    var ORE_GROUP      = '#303030'   // 分区面板
    var ORE_GROUPH     = '#3a3a3a'   // 分区面板头
    var ORE_GROUPB     = '#2c2c2c'   // 分区面板体
    var ORE_NAV        = '#3b3b3b'   // 导航行 / 输入框面
    var ORE_NAVON      = '#535353'   // 导航行选中
    var ORE_INSET      = '#3a3a3a'   // 输入框 / 搜索框面
    var ORE_SURFACE2   = '#1e1e1e'
    var ORE_SURFACE3   = '#262626'

    var ORE_LINE       = '#0b0b0b'   // 硬边（2px 用这个）
    var ORE_EDGE       = '#6e6e6e'   // 浅边
    var ORE_EDGE2      = '#8a8a8a'   // 更浅的边
    var ORE_LINE_HI    = '#6e6e6e'
    var ORE_LINE_DK    = '#101010'   // 按钮/标签边框
    var ORE_BORD2      = '#141414'   // 导航行边框（Clastar .nav / .rail-group）
    var ORE_BORD3      = '#151515'   // 卡片边框
    var ORE_SEP        = '#1b1b1b'   // 分隔线

    var ORE_TEXT       = '#f2f2f2'   // 主文字
    var ORE_TEXT2      = '#c2c2c2'   // 次文字
    var ORE_TEXT3      = '#8d8d8d'   // 三级
    var ORE_TXT4       = '#7d7d7d'   // 四级 / 说明

    var ORE_LIGHT      = '#d6d6d6'   // 浅色按钮面（.btn.light）
    var ORE_LIGHT_HI   = '#e4e4e4'
    var ORE_LIGHT_LO   = '#a9a9a9'
    var ORE_GREEN      = ORE_ACCENT
    var ORE_GREEN_HI   = ORE_ACCENT2
    var ORE_GREEN_LO   = ORE_ACCENTD
    var ORE_BLUE       = '#3b7cd6'
    var ORE_RED        = '#b63a2f'
    var ORE_YELLOW     = '#f0d21b'

    // 兼容旧变量名：TOKENS 与部分规则里仍在引用
    var L_FILL = ORE_RAIL
    var L_EDGE = ORE_LINE
    var L_TOP = ORE_EDGE
    var L_BOTTOM = ORE_LINE
    var R_FILL = ORE_CONTENT
    var R_EDGE = ORE_LINE
    var R_TOP = ORE_EDGE
    var R_BOTTOM = ORE_LINE

    // 槽位候选：按顺序取第一个存在的
    var SIDEBAR_FILES = ['minecraft24x.png']
    var HERO_FILES = ['minecraft34x.png']

    // 主文字色
    var TEXT_PRIMARY = ORE_TEXT


    var TOKENS = {
      '--dsw-alias-bg-base':        { light: ORE_CANVAS, dark: ORE_CANVAS },
      '--dsw-alias-bg-layer-1':     { light: ORE_BG2, dark: ORE_BG2 },
      '--dsw-alias-bg-layer-2':     { light: ORE_SURFACE, dark: ORE_SURFACE },
      '--dsw-alias-bg-layer-3':     { light: ORE_BG3, dark: ORE_BG3 },
      // --dsw-alias-bg-layer-4 曾经在这里，但 design-platform.css 里没有这个
      // token（只有 layer-1..3），覆盖它等于写了个没人读的变量，已删除。
      '--dsw-alias-bg-overlay':     { light: ORE_SURFACE2, dark: ORE_SURFACE2 },

      // 代码块 / Diff / 终端 / Read 面板的底色。这三个面板（ui-primitives 的
      // CodeBlock、DiffBlock、ReadBlock/TerminalBlock）**只**从这一对 token
      // 取底色，所以钉死它们等于一次修好全部面板，不需要再猜类名。
      // 浅色模式下 markdown-code-block = bluish-50 = rgb(249,250,251)，近白，
      // 而标签文字已被本主题染成浅色 —— 就是用户截图里那块白底白字的 diff 面板。
      '--dsw-alias-markdown-code-block':        { light: '#141414', dark: '#141414' },
      '--dsw-alias-markdown-code-block-banner': { light: ORE_BANNER, dark: ORE_BANNER },

      // 下面这批属于「浅色模式下近白、深色模式下才深」的面板 token。
      // overrideTokens 是按当前模式取一个值写进 body 行内样式的，所以不钉死
      // 它们的话，浅色模式下就会从缝里漏出白底，而文字早被染成浅色 ——
      // 表现为白底白字。设置 → 模型 →「编辑」展开的面板踩的就是 bg-module-platform。
      // 取值统一回本主题自己的调色板，而不是照抄 DSH 的深色值。
      //
      // ⚠ 范围纪律：这里只收「用户明确报过」的面。一批 token 在浅色模式下
      // 近白 ≠ 就该改 —— 没被要求的面板一律不动，否则一次改掉菜单、气泡、
      // 侧边栏选中态，等于擅自重刷用户没提的颜色。
      //
      // 曾经有一次越界：把 29 个「浅色近白」的面板 token 一起钉死，结果重刷了
      // 菜单 / 用户气泡 / 侧边栏选中态等一堆没被要求的颜色，已全部撤回。
      // 判定要不要改，得看这个面有没有承载文字、以及用户是否要求改它，
      // 不能只看 token 的浅色/深色值差异。工具留在 .dsh-tools/token-leak-truth.mjs。

      // 任务面板（TodoPanel 的 .root）用的是 --dsw-specific-tip：
      // 浅色模式 #f5f6f7（近白，配上被染白的 label-primary 就是白底白字，
      // 用户截图报过），深色模式 #353638 —— 正好等于本主题的 bg-layer-3。
      // 所以这不是自己配色，是把这个面钉回设计系统里它本该有的深色。
      // 用户明确要求保留这个修复。
      '--dsw-specific-tip':         { light: ORE_GROUP, dark: ORE_GROUP },
      '--dsw-alias-bg-module-platform':         { light: ORE_DEEP, dark: ORE_DEEP },
      '--dsw-alias-bg-multi-select':            { light: ORE_NAVON, dark: ORE_NAVON },
      '--dsw-alias-bg-mask-drop':               { light: '#000000B3', dark: '#000000B3' },
      '--dsw-alias-button-elevated-fill':       { light: ORE_PANEL, dark: ORE_PANEL },
      '--dsw-alias-button-floating-fill':       { light: ORE_GROUPH, dark: ORE_GROUPH },
      '--dsw-alias-button-ghost-active-fill':   { light: ORE_SURFACE_HI, dark: ORE_SURFACE_HI },
      '--dsw-alias-interactive-bg-hover-solid': { light: ORE_SURFACE_HI, dark: ORE_SURFACE_HI },
      '--dsw-alias-scrollbar-bg-l1':            { light: ORE_CANVAS, dark: ORE_CANVAS },
      '--dsw-alias-scrollbar-bg-l2':            { light: ORE_SURFACE, dark: ORE_SURFACE },

      // 这里曾经有一批「浅色模式漏底封口」的 token，一次钉了 29 个
      // （--dsw-specific-menu / -bubble / -sidebar-nav-item-* 、markdown-* 、
      // state-*-tertiary 等）。已全部撤回，原因见上面的「范围纪律」。
      '--dsw-alias-border-l1':      { light: ORE_LINE, dark: ORE_LINE },
      '--dsw-alias-border-l2':      { light: ORE_EDGE, dark: ORE_EDGE },
      '--dsw-alias-border-l3':      { light: ORE_LINE_DK, dark: ORE_LINE_DK },
      '--dsw-alias-brand-primary':  { light: ORE_ACCENT2, dark: ORE_ACCENT2 },
      // ── 两个"蓝色漏网" token ──
      //
      // 这两个之前一直没覆盖，结果宿主自带的深蓝强调色漏在绿色主题里：
      //   --dsw-alias-markdown-tag: dark 模式是 neutral-bluish-850（带蓝的灰），
      //     ui-dockkit 的 .tabActive{background: var(--dsw-alias-markdown-tag)}
      //     直接拿它当选中标签的底色 —— 就是截图里那圈发蓝的底。
      //   --dsw-alias-state-business-primary: deepseek-400（蓝），
      //     被 focus.css 当作聚焦环颜色兜底，还被输入框光标、引用 chip 用。
      // 统一换成主题的绿 / 中性深色。
      '--dsw-alias-markdown-tag':   { light: '#E4E4E8', dark: ORE_BG2 },
      '--dsw-alias-state-business-primary': { light: ORE_ACCENT, dark: ORE_ACCENT2 },
      // 文件改动的增删配色：删除=Ore 红 #b63a2f、添加=Ore 绿 #6fc244。
      // DiffBlock 的 .del/.add 就走这两个 token；buildCss 里那份必须同值。
      '--dsw-alias-state-error-primary':   { light: ORE_RED, dark: ORE_RED },
      '--dsw-alias-state-success-primary': { light: ORE_GREEN_HI, dark: ORE_GREEN_HI },
      '--dsw-alias-state-warn-primary':    { light: ORE_YELLOW, dark: ORE_YELLOW },
      '--dsw-specific-sidebar-fill': { light: ORE_RAIL, dark: ORE_RAIL },
    }

    // ── 工具 ────────────────────────────────────────────────────────
    function hexToRgb(hex) {
      var n = parseInt(hex.slice(1), 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    function withAlpha(hex, a) {
      var c = hexToRgb(hex)
      return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'
    }
    function panelStyle(fill, top, bottom) {
      return {
        backgroundColor: fill,
        backgroundImage: 'linear-gradient(' + top + ',' + top + '),linear-gradient(' + bottom + ',' + bottom + ')',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center top,center bottom',
        backgroundSize: '100% 1px,100% 1px',
      }
    }
    function pickFile(candidates) {
      for (var i = 0; i < candidates.length; i++) {
        if (ASSETS[candidates[i]] !== undefined) return candidates[i]
      }
      return null
    }

    // ── 缺图时的洋红/黑棋盘格 ──────────────────────────────────────
    var MISSING = { a: '#ff00ff', b: '#000000' }
    function checker(cells) {
      var block = Math.max(1, Math.round(cells / 2))
      var grid = []
      for (var y = 0; y < cells; y++) {
        var row = ''
        for (var x = 0; x < cells; x++) {
          row += ((Math.floor(x / block) + Math.floor(y / block)) % 2 === 0) ? 'a' : 'b'
        }
        grid.push(row)
      }
      return grid
    }
    var CHECKER = checker(16)
    function Checker(props) {
      var rects = []
      for (var y = 0; y < 16; y++) {
        for (var x = 0; x < 16; x++) {
          rects.push(React.createElement('rect', {
            key: x + ':' + y, x: x, y: y, width: 1, height: 1,
            fill: CHECKER[y].charAt(x) === 'a' ? MISSING.a : MISSING.b,
          }))
        }
      }
      return React.createElement('svg', {
        className: props.className, width: props.size, height: props.size,
        viewBox: '0 0 16 16', shapeRendering: 'crispEdges',
        focusable: 'false', 'aria-hidden': 'true',
        style: { display: 'block', imageRendering: 'pixelated' },
      }, rects)
    }

    // ── 样式表：自己插 <style>，随 fiber 卸载移除 ──────────────────
    var styleEl = null
    function insertCss(css) {
      if (typeof document === 'undefined') return
      if (styleEl === null) {
        styleEl = document.createElement('style')
        styleEl.dataset.plugin = PLUGIN_ID
        styleEl.dataset.pluginCss = CSS_TAG
        document.head.appendChild(styleEl)
      }
      styleEl.textContent = css
    }
    function removeCss() {
      if (styleEl !== null && styleEl.parentNode !== null) styleEl.parentNode.removeChild(styleEl)
      styleEl = null
    }

    // ── 状态 ────────────────────────────────────────────────────────
    // 一个值 + 一组订阅者。开关、色号、字体加载状态都是这个形状，组件里用
    // .use() 订阅（内部就是 useState + useEffect 那套）。
    function createStore(initial) {
      var listeners = new Set()
      var value = initial
      return {
        get: function () { return value },
        set: function (next) {
          if (value === next) return
          value = next
          listeners.forEach(function (fn) { fn(next) })
        },
        use: function () {
          var pair = React.useState(value)
          var setLocal = pair[1]
          React.useEffect(function () {
            var fn = function (next) { setLocal(next) }
            listeners.add(fn)
            return function () { listeners.delete(fn) }
          }, [])
          return pair[0]
        },
      }
    }

    var themeStore = createStore(true)            // 主题总开关
    var fontStore = createStore(true)             // MC 像素字体开关
    // idle → 关着；loading → @font-face 已插入、正在下载字体；
    // ready → 已经生效；error → 拿不到字体（多半是 Host 路由还没上线）
    var fontStatusStore = createStore('idle')

    var themeService = null
    var slotsService = null
    var tokenDispose = null
    var slotHandles = []

    // 主题、字体、槽位三者互相独立：
    //   主题开关 → token 覆盖 + 主题样式表
    //   字体开关 → @font-face + 全局 font-family（主题关着也照样生效）
    //   槽位     → 跟随主题开关
    // 控制面本身（设置里那三行）永远挂载，否则关掉之后没法重新打开。
    function applySkin() {
      if (tokenDispose !== null) { tokenDispose(); tokenDispose = null }
      var themeOn = themeStore.get()
      var fontOn = fontStore.get()
      if (themeOn && themeService !== null) {
        tokenDispose = themeService.overrideTokens(PLUGIN_ID, TOKENS)
      }
      if (!themeOn && !fontOn) { removeCss(); return }
      // 字体样式表接在主题后面：两条同为 !important 时后写的赢，正好盖掉
      // 主题里那句等宽 font-family。
      insertCss(
        (themeOn ? buildCss() : '') +
        (fontOn ? buildFontCss() : '')
      )
    }

    function applySlots() {
      while (slotHandles.length > 0) {
        var dispose = slotHandles.pop()
        try { dispose() } catch (e) { /* 已卸载 */ }
      }
      if (!themeStore.get() || slotsService === null) return
      // 这三个都是 single 槽位，官方品牌插件已经占在 priority 0 上。
      // single 槽位禁止同优先级重复注册（会直接抛错），必须用更低的优先级遮蔽；
      // 规则是"最低者渲染"（lowest renders），所以用 -1。
      slotHandles.push(slotsService.inject('sidebar.brand.mark', function () {
        return slotsService.register({ name: 'sidebar.brand.mark', priority: -1 }, SidebarMark)
      }))
      slotHandles.push(slotsService.inject('sidebar.brand.name', function () {
        return slotsService.register({ name: 'sidebar.brand.name', priority: -1 }, BrandName)
      }))
      slotHandles.push(slotsService.inject('conversation.hero.brand.mark', function () {
        return slotsService.register({ name: 'conversation.hero.brand.mark', priority: -1 }, HeroMark)
      }))
    }

    // ── 开关的读写与持久化 ──────────────────────────────────────────
    //
    // 两个开关默认都开。持久化走 DSH 的 Host settings 服务：客户端半边拿到的是
    // ctx.settingsScope（ui-settings 提供），bind 出本插件自己的命名空间后
    // set(field, value) 就会写进 Host 的用户设置文档，重启后由 Host 回灌。
    //
    // 拿不到 settingsScope 时（比如连接处于 memory 模式、或 ui-settings 没装）
    // 自动退化成纯内存行为 —— 开关仍然能用，只是不跨会话保留。这比报错好：
    // 用户没要求持久化能力本身是必需的，界面不该因为这个变砖。
    var scope = null            // SettingsScope | null
    var scopeStatus = 'idle'    // idle | loading | ready | unavailable

    function setTheme(next) {
      themeStore.set(next)
      applySkin()
      applySlots()
      persist(SETTINGS_FIELD_THEME, next)
    }
    function setFont(next) {
      fontStore.set(next)
      applySkin()
      if (next) probeFont()
      else { fontProbe = null; fontStatusStore.set('idle') }
      persist(SETTINGS_FIELD_FONT, next)
    }

    /**
     * 把一个开关值写回 Host 设置文档。
     *
     * 刻意不 await、也不把错误抛给调用方：写失败（只读文档、断连、revision 冲突）
     * 不该让界面卡住或回滚用户刚点的那一下。失败只记一条日志，本次会话内开关
     * 仍然按用户点的样子生效，下次启动回到上一次成功落盘的值。
     */
    function persist(field, value) {
      if (scope === null) return
      var result = scope.set(field, value)
      if (result !== undefined && typeof result.catch === 'function') {
        result.catch(function (error) { console.error('[mc-skin] 设置写入失败:', error) })
      }
    }

    /**
     * 从 Host 设置文档回灌开关状态。
     *
     * 只在 status 变成 ready 时采纳一次；之后 Host 侧的变化（另一个标签页改了
     * 开关）也跟随，因为 scope 是响应式的。采纳时不回写，否则会自己触发一次
     * 无意义的写入 —— 这也是 ui-theme 里 adopt() 的做法。
     */
    function adoptSettings() {
      if (scope === null) return
      var snap = scope.getSnapshot()
      scopeStatus = snap.status
      if (snap.status !== 'ready' || snap.value === undefined) return
      var remoteTheme = snap.value[SETTINGS_FIELD_THEME]
      var remoteFont = snap.value[SETTINGS_FIELD_FONT]
      if (typeof remoteTheme === 'boolean' && remoteTheme !== themeStore.get()) {
        themeStore.set(remoteTheme)
        applySkin()
        applySlots()
      }
      if (typeof remoteFont === 'boolean' && remoteFont !== fontStore.get()) {
        fontStore.set(remoteFont)
        applySkin()
        if (remoteFont) probeFont()
        else { fontProbe = null; fontStatusStore.set('idle') }
      }
    }

    // ── 字体可用性探测 ──────────────────────────────────────────────
    // 插入 @font-face 之后用 FontFaceSet 探一次；这一步同时就是"开始下载"，
    // 所以不用另发一次请求。成功 → ready，404/网络失败 → error。
    var fontProbe = null
    function probeFont() {
      if (typeof document === 'undefined' || document.fonts === undefined
        || typeof document.fonts.load !== 'function') {
        // 没有 FontFaceSet 就没法探测，当作可用，交给 CSS 自己决定。
        fontStatusStore.set('ready')
        return
      }
      if (fontProbe !== null) return
      fontStatusStore.set('loading')
      fontProbe = document.fonts.load('16px "' + FONT_FAMILY + '"').then(function (faces) {
        fontStatusStore.set(faces.length > 0 ? 'ready' : 'error')
      }, function () {
        fontStatusStore.set('error')
        fontProbe = null   // 允许再试一次（比如 Host 刚重启上线）
      })
    }

    // ── 槽位组件 ────────────────────────────────────────────────────
    // 按源图的最大整数倍渲染，避开非整数缩放的锯齿。
    // 例：32 的图放进 34 的框 → k=1 → 按 32 画（1:1），居中留 1px。
    function Sprite(props) {
      var natPair = React.useState(0)
      var nat = natPair[0], setNat = natPair[1]
      var file = pickFile(props.files)
      if (file === null) return React.createElement(Checker, { size: props.size, className: props.className })
      var render = props.size
      if (nat > 0) {
        var k = Math.floor(props.size / nat)
        if (k >= 1 && nat * k >= props.size * 0.8) render = nat * k
      }
      return React.createElement('img', {
        src: ASSETS[file],
        alt: '', draggable: false,
        width: render, height: render, className: props.className,
        onLoad: function (e) {
          var w = e.currentTarget.naturalWidth
          if (w > 0 && w !== nat) setNat(w)
        },
        style: { display: 'block', width: render + 'px', height: render + 'px', imageRendering: 'pixelated' },
      })
    }
    function SidebarMark(props) {
      return React.createElement(Sprite, { files: SIDEBAR_FILES, size: props.size || 24, className: props.className })
    }
    function HeroMark(props) {
      return React.createElement(Sprite, { files: HERO_FILES, size: props.size || 34, className: props.className })
    }
    function BrandName() {
      // 这个 span 自带行内 font-family，所以必须自己看一眼字体开关。
      // 样式表里那条 !important 规则够不着它：规则的主体是 `html body`，
      // span 只是"继承"了 body 的值，而继承永远输给元素自己的声明——
      // 换成 !important 也没用，因为压根不是同一条声明在竞争。
      fontStore.use()
      return React.createElement('span', {
        style: {
          fontFamily: fontStore.get()
            ? '"' + FONT_FAMILY + '",' + MONO_STACK
            : '"Courier New", ui-monospace, monospace',
          fontWeight: 700, fontSize: 15, letterSpacing: '0.1em',
          textTransform: 'uppercase',
        },
      }, 'Minecraft')
    }

    // ── 控制面 ──────────────────────────────────────────────────────
    // 开关本体：on.png / off.png；图缺失时退化成文字按钮（仍带 data-mc-swatch，
    // 所以不会被主题的 MC 按钮皮肤盖成方块）。
    // Ore UI 的开关：一条细长凹槽 + 方形滑块，开启时槽变绿、滑块滑到右侧。
    // 不再用 on.png / off.png —— 那套是旧版像素开关图，和 Ore UI 的语言不符。
    // 自绘还有一个好处：颜色跟着 ORE_* 走，换肤色板就换开关。
    function Switch(props) {
      var on = props.on
      return React.createElement('button', {
        type: 'button',
        'data-mc-swatch': '1',
        role: 'switch',
        'aria-checked': on ? 'true' : 'false',
        'aria-label': on ? '已启用' : '已关闭',
        onClick: props.onToggle,
        style: {
          position: 'relative', display: 'block', flex: 'none',
          width: 46, height: 24, padding: 0, cursor: 'pointer',
          border: '2px solid ' + ORE_LINE_DK,
          backgroundColor: on ? ORE_ACCENT : ORE_PANEL,
          backgroundImage: 'none',
          boxShadow: on
            ? 'inset 0 -3px 0 ' + ORE_ACCENTD + ',inset 0 1px 0 #ffffff33'
            : 'inset 0 -3px 0 #00000033,inset 0 1px 0 #ffffff14',
        },
      }, React.createElement('span', {
        style: {
          position: 'absolute', top: 1, left: on ? 25 : 2,
          width: 14, height: 14,
          backgroundColor: ORE_LIGHT,
          border: '2px solid ' + ORE_LINE_DK,
          boxShadow: 'inset 0 1px 0 #ffffff44',
          pointerEvents: 'none',
        },
      }))
    }

    function SwitchRow(props) {
      return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        React.createElement(Switch, { on: props.on, onToggle: props.onToggle }),
        React.createElement('span', { style: { fontSize: 12 } }, props.caption))
    }

    var FONT_STATUS_TEXT = {
      idle: '已关闭',
      loading: '已启用 · 正在下载字体…',
      ready: '已启用 · 字体已生效',
      error: '已启用 · 字体加载失败（Host 路由还没上线？重启 dsh web 后刷新页面）',
    }

    function ThemeToggle() {
      var on = themeStore.use()
      return React.createElement(SwitchRow, {
        on: on,
        onToggle: function () { setTheme(!themeStore.get()) },
        caption: on ? '已启用' : '已关闭',
      })
    }

    function FontToggle() {
      var on = fontStore.use()
      var status = fontStatusStore.use()
      return React.createElement(SwitchRow, {
        on: on,
        onToggle: function () { setFont(!fontStore.get()) },
        caption: on ? (FONT_STATUS_TEXT[status] || FONT_STATUS_TEXT.ready) : FONT_STATUS_TEXT.idle,
      })
    }

    // MC 字体颜色（十六色调色板）已按用户要求移除：用不到，且它把「文字层次」
    // 这件事交给了用户去调，而默认值本身才是该做好的地方。现在文字色固定为
    // TEXT_PRIMARY 一套推导出的层次（见 buildCss）。

    function ToggleSettingsRow() {
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 600 } }, 'MC 主题'),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
          '开关控制配色与标志图；像素字体是下面那个独立开关。关闭即恢复原生外观。'
          + SETTINGS_HINT),
        React.createElement(ThemeToggle, null))
    }

    function FontSettingsRow() {
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 600 } }, 'MC 像素字体'),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
          '把界面文字换成 Minecraft AE 像素字体。字体文件约 16 MB，由插件的 Host 半边按需发货，'
          + '只在首次打开开关时下载一次，之后走浏览器缓存；关掉立即恢复系统字体。'
          + SETTINGS_HINT),
        React.createElement(FontToggle, null))
    }

    // ── 样式表内容 ──────────────────────────────────────────────────
    // 变量必须写在 html body 上：主题把变量定义在 body，写在 :root 的即使带
    // !important 也赢不了——自定义属性是继承的，而继承不看重要性。
    var BTN_SEL = 'button:not([data-mc-swatch]):not([class*="_tab"]):not([class*="_crumb"])'
      + ':not([class*="_brand"]):not([class*="_card"]):not([class*="_row"])'
      + ':not([class*="_bubble"]):not([class*="_mark"]):not([class*="_close"])'
    // 主要按钮：ui-primitives/Button.module.css 的 .primary → `_primary_<hash>`。
    // Ore UI 里主操作是绿色实心（PLAY 那颗），次要操作是浅灰实心。
    var PRIMARY_SEL = BTN_SEL + '[class*="_primary"]'
    var SB_SEL = 'html body [class*="_sidebarCol"]'
    var CONV_SEL = 'html body [data-phase][class*="_root"]'
    // 关闭按钮。真实类名是 ui-primitives/Modal.module.css 的 .close（全小写），
    // 编译成 `_close_<hash>`。原来那条 `[class*="Close"]` 是不存在的 ——
    // 大小写敏感，CSS Module 不会把类名首字母大写，所以一直是死规则。
    var CLOSE_SEL = 'button[class*="_close"]'
    var TAB_SEL = '[class*="_tabs"] > button[class*="_tab"]'

    function buildCss() {
      var textHex = TEXT_PRIMARY
      return [
        '*:not(svg){border-radius:0 !important;}',
        'img,canvas{image-rendering:pixelated;}',
        'body,button,input,textarea,select{font-family:"Courier New",ui-monospace,SFMono-Regular,Menlo,monospace !important;}',

        // ── 文字层级 + 全局底色 ──────────────────────────────────────
        //
        // 层级用实色灰阶，不用半透明度 —— 半透明白压在灰面上会随底色漂移，
        // 是「字体变灰看不清」的根源。取值对齐 ClastarStudio：
        //   txt #f2f2f2 / txt2 #c2c2c2 / txt3 #8d8d8d / 说明 #7d7d7d
        'html body{'
          + '--dsw-alias-label-primary:' + textHex + ' !important;'
          + '--dsw-alias-label-secondary:' + ORE_TEXT2 + ' !important;'
          + '--dsw-alias-label-tertiary:' + ORE_TEXT3 + ' !important;'
          + '--dsw-alias-label-caption:' + ORE_TXT4 + ' !important;'
          + '--dsw-alias-bg-base:' + ORE_CANVAS + ' !important;'
          + '--dsw-specific-sidebar-fill:' + ORE_RAIL + ' !important;'
          + '--dsw-alias-border-l3:' + ORE_LINE_DK + ' !important;'
          + '--dsh-scrollbar-thumb:' + ORE_PANEL + ' !important;'
          + '--dsh-scrollbar-thumb-hover:' + ORE_PANEL3 + ' !important;}',

        // 行内代码 / 代码块：最深内嵌 + 2px 硬边
        'code,pre,kbd,samp{background-color:#141414 !important;background-image:none !important;'
          + 'border:2px solid ' + ORE_LINE + ' !important;}',

        // ── Diff 增删行的语义色 ──
        //
        // 面板底色走 TOKENS 的 --dsw-alias-markdown-code-block(-banner)，
        // 这里只管 diff 增删色，取 Clastar 的语义色：红 #b63a2f / 绿 #6fc244。
        // 历史教训：这里曾经有 8 条 [class*="_codeViewer"] / "_diff" 之类的选择器，
        // 全是猜的类名（自检脚本 58 条里 37 条是死的），已改成走 token。
        'html:root body{'
          + '--dsw-alias-state-success-primary:' + ORE_GREEN_HI + ' !important;'
          + '--dsw-alias-state-error-primary:' + ORE_RED + ' !important;}',

        // ── 面：卡片 / 气泡 / 列表行 ────────────────────────────────
        // 照搬 Clastar 的 .card：
        //   background:#3c3c3c; border:2px solid #151515;
        //   box-shadow:inset 0 1px 0 #ffffff10
        '[class*="_bubble"]{background-color:' + ORE_SURFACE + ' !important;background-image:none !important;'
          + 'border:2px solid ' + ORE_BORD3 + ' !important;box-shadow:inset 0 1px 0 #ffffff10 !important;}',
        '[class*="_row"],[class*="_millerRow"],[class*="_rowSeat"]{background-color:' + ORE_SURFACE + ' !important;'
          + 'background-image:none !important;border:2px solid ' + ORE_BORD3 + ' !important;'
          + 'box-shadow:inset 0 1px 0 #ffffff10 !important;}',
        // 卡片内部的 row 必须还原成透明：消息卡片的工具行就是 _row，
        // 给它上色+加框会在卡片底部多出一条带框的条。
        '[data-composer-card] [class*="_row"]{background-color:transparent !important;border:0 !important;'
          + 'box-shadow:none !important;}',
        '[class*="_card"]{background-color:' + ORE_SURFACE + ' !important;border:2px solid ' + ORE_BORD3 + ' !important;'
          + 'box-shadow:inset 0 1px 0 #ffffff10 !important;}',
        // 选中卡片：照搬 .card.sel —— 边变绿 + 外圈半透明绿发光
        '[class*="_cardActive"]{background-color:' + ORE_SURFACE_HI + ' !important;'
          + 'border-color:' + ORE_ACCENT + ' !important;'
          + 'box-shadow:inset 0 1px 0 #ffffff10,0 0 0 2px ' + ORE_ACCENT_A + ' !important;}',
        // ── 侧边栏的列表行：照搬 Clastar 的 .nav ────────────────────
        //
        // 这些行是 CSS Module 的 .projectRow / .sessionRow / .searchResultRow /
        // .panelRow —— 注意是**大写 R**，所以上面那条 [class*="_row"] 匹配不到
        // （小写 r 只命中 .row / .millerRow / .rowSeat）。这是实测踩过的坑：
        // 不加这几条，侧边栏列表就是一片平铺，和 Clastar 的「抬起板子」差很远。
        //
        //   .nav    { background:#3b3b3b; border:2px solid #141414;
        //             box-shadow:inset 0 1px 0 #ffffff10 }
        //   .nav.on { background:#535353; box-shadow:inset 3px 0 0 var(--accent),
        //                                            inset 0 1px 0 #ffffff10 }
        '[class*="projectRow"],[class*="sessionRow"],[class*="searchResultRow"],[class*="panelRow"]{'
          + 'background-color:' + ORE_NAV + ' !important;'
          + 'border:2px solid ' + ORE_BORD2 + ' !important;border-radius:0 !important;'
          + 'box-shadow:inset 0 1px 0 #ffffff10 !important;}',
        '[class*="projectRow"]:hover,[class*="sessionRow"]:hover,[class*="searchResultRow"]:hover,'
          + '[class*="panelRow"]:hover{background-color:' + ORE_SURFACE_HI + ' !important;}',
        // 选中行：左侧一条绿 —— 不用换整块底色，这是 Clastar .nav.on 的做法
        '[class*="sessionRow"][class*="selected"],[class*="searchResultRow"][class*="selected"],'
          + '[class*="projectRow"][class*="active"],[class*="panelRow"][class*="on"]{'
          + 'background-color:' + ORE_NAVON + ' !important;'
          + 'box-shadow:inset 3px 0 0 ' + ORE_ACCENT + ',inset 0 1px 0 #ffffff10 !important;}',
        // 分区标题：照搬 .rail-title —— 小字号 + 大字距 + 大写
        '[class*="_sectionLabel"],[class*="_railTitle"],[class*="_sectionTitle"]{'
          + 'font-size:10px !important;letter-spacing:1.7px !important;'
          + 'text-transform:uppercase !important;color:#868686 !important;font-weight:600 !important;}',

        // 模型设置里「编辑」展开的面板：底色由 --dsw-alias-bg-module-platform
        // 钉成 ORE_DEEP，这里补一道浅边分层。只认 rowCard 里的那一层——
        // addCard / setupCard 里的同名组件自己写成透明，加边框会出现双重框。
        '[class*="_rowCard"] > [class*="_editor"]{border:2px solid ' + ORE_EDGE + ' !important;}',
        // 对话轮次标记轨
        '[class*="_mark"]{background:transparent !important;border:0 !important;box-shadow:none !important;}',
        // ── 标签：两套结构，别混为一谈 ──────────────────────────────
        //
        // 宿主的标签有两套：
        //   A) ui-primitives 的 SegmentedTabs —— 容器 .tabs，选中态是滑动的
        //      .indicator，.tab 自己 background:transparent
        //   B) ui-dockkit 的会话标签条 —— 容器 .tabStrip / .stripTabs，
        //      选中态是 .tabActive{background:var(--dsw-alias-markdown-tag)}
        //
        // ⚠ 踩过的两个坑：
        //   1. dockkit 的容器叫 `_stripTabs` / `_tabStrip`，**不含 `_tabs` 子串**
        //      （下划线后面是 s 不是 t），所以任何 [class*="_tabs"] 对它都无效。
        //   2. 裸的 [class*="_tab"] 会额外命中 `_tabLayout`（577×822 的布局容器，
        //      会盖住整个 pane）、`_tabTitle`（给标签文字套框）、`_tabClose`
        //      （给关闭叉加边框）。所以这里一律用 button 限定。
        //
        // 统一做法（照搬 Clastar .tab / .tab.on）：未选是 #3b3b3b 板子，
        // 选中是 #585858 + 顶部一条绿 + 白字。
        //
        // ⚠ 排除项必须包在 :where() 里。:not() 会**累加**特异性，写成
        //   `button[class*="_tab"]:not(A):not(B)` 权重就是 (0,3,1)，
        //   反而压过后面的 `button[class*="_tabActive"]`(0,1,1) ——
        //   结果选中标签根本没变亮（实测踩过）。:where() 权重恒为 0，
        //   基础规则就只有 (0,1,1)，后面的选中 / hover 才能正常覆盖。
        'button[class*="_tab"]:where(:not([class*="_tabLayout"]):not([class*="_tabClose"])),'
          + 'button[class*="_tabActive"]:where(:not([class*="_tabLayout"])){'
          + 'background-color:' + ORE_NAV + ' !important;background-image:none !important;'
          + 'border:2px solid ' + ORE_BORD2 + ' !important;'
          + 'color:' + ORE_TEXT2 + ' !important;'
          + 'box-shadow:inset 0 1px 0 #ffffff10 !important;}',
        'button[class*="_tab"]:not([class*="_tabActive"]):hover{'
          + 'background-color:' + ORE_SURFACE_HI + ' !important;color:' + ORE_TEXT + ' !important;}',
        'button[class*="_tabActive"]{'
          + 'background-color:' + ORE_PANEL3 + ' !important;color:#FFFFFF !important;'
          + 'box-shadow:inset 0 3px 0 ' + ORE_ACCENT + ',inset 0 1px 0 #ffffff10 !important;}',
        // dockkit 标签条本体：去掉宿主的底，换成一条硬边下沿
        '[class*="_tabStrip"]{background:transparent !important;border:0 !important;'
          + 'border-bottom:2px solid ' + ORE_LINE + ' !important;}',
        // 标签文字本来带一层右侧渐隐遮罩（.tabTitle 的 mask-image），
        // 半透明叠在深底上会显得"没字"，去掉。
        '[class*="_tabStrip"] [class*="_tabTitle"]{'
          + '-webkit-mask-image:none !important;mask-image:none !important;}',

        // ── 左：侧边栏 ───────────────────────────────────────────────
        // 照搬 .rail：background:#2a2a2a + border-right:2px solid #0b0b0b
        SB_SEL + '{background-color:' + ORE_RAIL + ' !important;border:0 !important;'
          + 'border-right:2px solid ' + ORE_LINE + ' !important;background-image:none !important;}',
        SB_SEL + ' > *{background-color:transparent !important;background-image:none !important;}',

        // ── 右：会话区 ───────────────────────────────────────────────
        // 照搬 .content：background:#1a1a1a，分层交给里面的卡片
        CONV_SEL + '{background-color:' + ORE_CONTENT + ' !important;border:0 !important;background-image:none !important;}',

        // ── 按钮：照搬 ClastarStudio 的 .btn ────────────────────────
        //
        // 它的按钮是**中灰面 + 浅色字**，不是浅灰面配深字：
        //   .btn { background:#4a4a4a; border:2px solid #101010; color:#eee;
        //          box-shadow:inset 0 -3px 0 #00000033, inset 0 1px 0 #ffffff14 }
        //   .btn:hover { background:#575757 }
        //   .btn:active{ transform:translateY(1px); box-shadow:inset 0 -1px 0 #00000033 }
        // 底部那条 -3px 内阴影 + 顶部 1px 高光 = 一块「抬起的板子」，
        // 按下时 translateY(1px) 让它真的陷下去。这是整套 UI 的手感来源。
        BTN_SEL + '{'
          + 'background-color:' + ORE_PANEL + ' !important;background-image:none !important;'
          + 'border:2px solid ' + ORE_LINE_DK + ' !important;border-radius:0 !important;'
          + 'color:' + ORE_TEXT + ' !important;text-shadow:none !important;'
          + 'box-shadow:inset 0 -3px 0 #00000033,inset 0 1px 0 #ffffff14 !important;}',
        BTN_SEL + ':hover{background-color:#575757 !important;}',
        BTN_SEL + ':active{transform:translateY(1px) !important;'
          + 'box-shadow:inset 0 -1px 0 #00000033,inset 0 1px 0 #ffffff10 !important;}',
        BTN_SEL + ':disabled{background-color:' + ORE_GROUP + ' !important;color:' + ORE_TXT4 + ' !important;'
          + 'border-color:' + ORE_LINE + ' !important;box-shadow:none !important;}',
        BTN_SEL + ':focus-visible{outline:2px solid ' + ORE_ACCENT2 + ' !important;outline-offset:-4px !important;}',

        // 主要按钮：照搬 .btn.pri
        //   background:var(--accent); color:#fff; font-weight:700; letter-spacing:.3px;
        //   box-shadow:inset 0 -3px 0 var(--accentd), inset 0 1px 0 #ffffff33;
        //   text-shadow:0 1px 0 #00000055      → hover: var(--accent2)
        PRIMARY_SEL + '{'
          + 'background-color:' + ORE_ACCENT + ' !important;background-image:none !important;'
          + 'border:2px solid ' + ORE_LINE_DK + ' !important;color:#FFFFFF !important;'
          + 'font-weight:700 !important;letter-spacing:.3px !important;'
          + 'box-shadow:inset 0 -3px 0 ' + ORE_ACCENTD + ',inset 0 1px 0 #ffffff33 !important;'
          + 'text-shadow:0 1px 0 #00000055 !important;}',
        PRIMARY_SEL + ':hover{background-color:' + ORE_ACCENT2 + ' !important;}',
        PRIMARY_SEL + ':active{transform:translateY(1px) !important;'
          + 'box-shadow:inset 0 -1px 0 ' + ORE_ACCENTD + ',inset 0 1px 0 #ffffff20 !important;}',
        PRIMARY_SEL + ':disabled{background-color:#2d3a26 !important;color:#7d8a76 !important;'
          + 'text-shadow:none !important;box-shadow:none !important;}',

        // 按钮面是中灰，所以按钮子树里的文字必须是**浅色**。
        // 这一条和上一版正好相反（上一版按钮是浅灰面，钉的是深字）——
        // 换成 Clastar 的中灰面后不翻过来，就会出现深字压中灰的低对比。
        // -inverted / -primary-inverted 不覆盖：那一对本来就是给深底配浅字的。
        BTN_SEL + ',' + BTN_SEL + ' *{'
          + '--dsw-alias-label-primary:' + ORE_TEXT + ' !important;'
          + '--dsw-alias-label-primary-foreground:' + ORE_TEXT + ' !important;'
          + '--dsw-alias-label-primary-dimmed:#d8d8d8 !important;'
          + '--dsw-alias-label-secondary:#d0d0d0 !important;'
          + '--dsw-alias-label-tertiary:#b4b4b4 !important;'
          + '--dsw-alias-label-caption:#9d9d9d !important;'
          + '--dsw-alias-label-dimmed:#b4b4b4 !important;}',
        // 主按钮：绿底上的字提到纯白
        PRIMARY_SEL + ',' + PRIMARY_SEL + ' *{'
          + '--dsw-alias-label-primary:#FFFFFF !important;'
          + '--dsw-alias-label-primary-foreground:#FFFFFF !important;'
          + '--dsw-alias-label-secondary:#EAF4E4 !important;'
          + '--dsw-alias-label-tertiary:#D6E8CC !important;'
          + '--dsw-alias-label-caption:#C4DCB8 !important;'
          + '--dsw-alias-label-dimmed:#D6E8CC !important;}',

        // ── close.png ──
        CLOSE_SEL + '{border:0 !important;border-radius:0 !important;background-color:transparent !important;'
          + 'background-image:url(' + ASSETS['close.png'] + ') !important;'
          + 'background-repeat:no-repeat !important;background-position:center !important;'
          + 'background-size:15px 15px !important;box-shadow:none !important;'
          + 'color:transparent !important;min-width:15px;min-height:15px;}',

        // ── 标签页：照搬 Clastar 的 .tab / .tab.on ──────────────────
        //   .tab    { background:#3a3a3a; border:2px solid #101010; color:#c8c8c8;
        //             box-shadow:inset 0 1px 0 #ffffff10 }
        //   .tab.on { background:#585858; color:#fff;
        //             box-shadow:inset 0 3px 0 var(--accent), inset 0 1px 0 #ffffff10 }
        // 选中态是**顶部一条绿条**，不是整块变绿 —— 这是这套 UI 的辨识点。
        TAB_SEL + '{border:2px solid ' + ORE_LINE_DK + ' !important;border-radius:0 !important;'
          + 'background:' + ORE_NAV + ' !important;background-image:none !important;'
          + 'color:#c8c8c8 !important;font-weight:600 !important;letter-spacing:.04em;'
          + 'text-shadow:none !important;box-shadow:inset 0 1px 0 #ffffff10 !important;}',
        TAB_SEL + ':after{display:none !important;}',
        '[class*="_tabs"] > button[class*="_tabActive"]{background:' + ORE_PANEL3 + ' !important;'
          + 'color:#FFFFFF !important;'
          + 'box-shadow:inset 0 3px 0 ' + ORE_ACCENT + ',inset 0 1px 0 #ffffff10 !important;}',
        '[class*="_tabs"] > button[class*="_tab"]:hover:not([class*="_tabActive"]){'
          + 'background:#454545 !important;color:#eee !important;}',
        '[class*="_tabs"]{gap:3px !important;background:transparent !important;padding:0 !important;}',
        // SegmentedTabs 的选中态本来是滑动的 .indicator；我们改成"标签自己成板子"，
        // 两者同时出现会变成双层，所以把指示条关掉。
        '[class*="_tabs"] [class*="_indicator"]{display:none !important;}',

        // ── 输入框 / 输入卡片：照搬 .search ─────────────────────────
        //   background:#3a3a3a; border:2px solid #101010;
        //   box-shadow:inset 0 -2px 0 #00000045     ← 内凹，方向和按钮相反
        'input,textarea{border:2px solid ' + ORE_LINE_DK + ' !important;border-radius:0 !important;'
          + 'background-color:' + ORE_NAV + ' !important;background-image:none !important;'
          + 'color:' + ORE_TEXT + ' !important;'
          + 'box-shadow:inset 0 -2px 0 #00000045 !important;}',
        'input:focus,textarea:focus{border-color:' + ORE_ACCENT + ' !important;outline:none !important;'
          + 'box-shadow:inset 0 -2px 0 #00000045,0 0 0 2px ' + ORE_ACCENT_A + ' !important;}',
        // 整张输入卡片
        '[data-composer-card]{border:2px solid ' + ORE_LINE_DK + ' !important;border-radius:0 !important;'
          + 'background-color:' + ORE_NAV + ' !important;background-image:none !important;'
          + 'box-shadow:inset 0 -2px 0 #00000045 !important;}',
        '[data-composer-card]:focus-within{border-color:' + ORE_ACCENT + ' !important;'
          + 'box-shadow:inset 0 -2px 0 #00000045,0 0 0 2px ' + ORE_ACCENT_A + ' !important;}',
        '[data-composer-input]{border:0 !important;background:transparent !important;box-shadow:none !important;}',
        '[data-composer-placeholder]{color:' + ORE_TXT4 + ' !important;}',
        'input::placeholder,textarea::placeholder{color:' + ORE_TXT4 + ' !important;}',

        // ── 滚动条：细窄实心方块 ────────────────────────────────────
        '::-webkit-scrollbar{width:10px !important;height:10px !important;}',
        '::-webkit-scrollbar-track{background:' + ORE_CANVAS + ' !important;border-radius:0 !important;}',
        '::-webkit-scrollbar-corner{background:' + ORE_CANVAS + ' !important;}',
        '::-webkit-scrollbar-thumb{background-color:' + ORE_PANEL + ' !important;background-image:none !important;'
          + 'border:2px solid ' + ORE_LINE + ' !important;border-radius:0 !important;}',
        '::-webkit-scrollbar-thumb:hover{background-color:' + ORE_PANEL3 + ' !important;}',
        'html{scrollbar-color:' + ORE_PANEL + ' ' + ORE_CANVAS + ';scrollbar-width:thin;}',
      ].join('\n')
    }

    // ── 字体样式表 ──────────────────────────────────────────────────
    // 只在像素字体开关打开时注入。字体字节不在这个文件里：@font-face 指向
    // Host 半边（src/index.js）注册的路由，浏览器只在真正用到这个字体族时
    // 才去下载它。
    function buildFontCss() {
      var stack = '"' + FONT_FAMILY + '",' + MONO_STACK
      return [
        // unicode-range 把 U+00A0-U+00FF 排除出本字体。
        //
        // 原因：MinecraftAE-Pixel.ttf 这一个区段的字形是坏的 —— 96 个字符
        // （¡ ¢ £ § © ° ± · × ÷ ß à á 等）全被画成了字母 "u" 的变体，
        // 其中 ¸ 是 "ü"、· 是 "u"。而 · 是 DSH 界面的高频分隔符
        // （"引用会话 · {labels}"、统计行的 1.2k · 45 tok），
        // 显示成字母就是用户报的「部分字体显示成拼音v」。
        //
        // 已核实：ASCII 全对、CJK 汉字全对、U+0100 起（拉丁扩展A）全对，
        // 只有这一段损坏。诊断脚本见 .dsh-tools/font-atlas.mjs。
        //
        // 用 unicode-range 而不是改字体文件：16 MB 的 TTF 重写 cmap 要重排
        // 全部表偏移和校验和，算错会让整个字体加载失败（比现在还糟）。
        // unicode-range 是标准 CSS，零风险且可逆 —— 这些字符会落到
        // font stack 的下一个字体（系统等宽），显示正确。
        // 代价：这 96 个字符不再是像素风（但它们本来显示的就是错的）。
        '@font-face{font-family:"' + FONT_FAMILY + '";'
          + 'src:url("' + FONT_ROUTE + '") format("truetype");'
          + 'font-style:normal;font-weight:100 900;font-display:swap;'
          + 'unicode-range:U+0-9F,U+100-10FFFF;}',

        // 像素字体绝对不能合成粗体：伪粗体会把 1px 笔画糊成 2px，像素感全没了。
        // font-synthesis-weight:none 让 weight:700 直接复用 400 的字形。
        // -webkit-font-smoothing:none 让 macOS 别做次像素抗锯齿（别的平台无效）。
        'html body{font-synthesis-weight:none;-webkit-font-smoothing:none;}',

        // ★ 真正管用的那一层：覆写应用消费的两个字体「变量」，而不是给元素设字体。
        //
        // 应用是这么写的：body{font-family:var(--dsw-font-family, -apple-system,…)}，
        // 而输入框 .xxx_input 自己还有一条 font-family:var(--dsw-font-family)。
        // 关键在于「元素自己的声明」永远赢过「从 body 继承来的值」，所以
        // `html body input{font-family:… !important}` 这类写法对 contenteditable
        // 的输入区完全无效 —— 它继承不到，而它自己的声明又赢了。
        //
        // 改成覆写变量就没有这个问题：既有声明不用动，它自己就会解析到像素字体。
        // --dsw-font-family 被整套排版 token 引用（--dsw-font-base-16、
        // --dsw-font-markdown-*、--dsw-font-s-14 …共 40 多处），所以这一条
        // 就能把界面文字整体换掉；--ds-font-family-code 是行内代码和代码块
        // 单独走的那条，不改的话代码区仍是 SF Mono。
        //
        // 选择器用 html:root body 而不是 body：应用把 token 定义在 body 上，
        // 而 html[data-ds-dark-theme] body 这类选择器比 html body 更具体。
        // 这里再抬一级并配 !important，保证深浅两种模式下都赢。
        'html:root body{--dsw-font-family:' + stack + ' !important;'
          + '--ds-font-family-code:' + stack + ' !important;}',

        // 兜底：给元素直接设字体的那批仍然保留。变量覆写已经覆盖了绝大多数
        // 场景，但万一某个组件把字体写成字面量而不是 var()，这条还能接住。
        'html body,html body button,html body input,html body textarea,html body select,'
          + 'html body code,html body pre,html body kbd,html body samp{'
          + 'font-family:' + stack + ' !important;}',
      ].join('\n')
    }

    // ── 插件入口 ────────────────────────────────────────────────────
    function apply(ctx) {
      var theme = ctx.get('theme')
      if (theme !== undefined) themeService = theme

      // ── 持久化：接 Host 设置文档 ──
      //
      // 顺序很重要：先 bind 出 scope 并采纳一次已存的值，再 applySkin()，
      // 否则会出现"先按默认值渲染一帧、再跳到用户存的值"的闪烁。
      //
      // settingsScope 是可选依赖：拿不到就退化成内存态（开关照常可用，只是
      // 不跨会话记住），不阻塞插件加载。
      var settingsScope = ctx.get('settingsScope')
      if (settingsScope !== undefined && typeof settingsScope.bind === 'function') {
        scope = settingsScope.bind({ namespace: SETTINGS_NAMESPACE })
        adoptSettings()
        scopeStatus = (scope.getSnapshot() || {}).status || 'idle'
        // Host 侧变更（另一个标签页动了开关）也要跟随
        ctx.effect(function () { return scope.subscribe(adoptSettings) },
          PLUGIN_ID + ': settings adoption')
        if (scopeStatus === 'ready') {
          SETTINGS_HINT = '开关状态会保存在 Host 设置里，重启后保留。'
        }
      }

      applySkin()
      // 字体开关默认开着，所以启动时也要探一次；关着的话浏览器根本不会去
      // 请求那 16 MB。
      if (fontStore.get()) probeFont()

      ctx.effect(function () {
        return function () {
          tokenDispose !== null && tokenDispose()
          tokenDispose = null
          removeCss()
          while (slotHandles.length > 0) {
            var dispose = slotHandles.pop()
            try { dispose() } catch (e) { /* 已卸载 */ }
          }
        }
      }, PLUGIN_ID + ': teardown')

      var slots = ctx.get('slots')
      if (slots === undefined) return
      slotsService = slots
      applySlots()

      // 控制面永远挂载，否则关掉之后没法重新打开
      slots.inject('settings.general.item', function () {
        return slots.register(
          { name: 'settings.general.item', id: 'mc-theme', order: 13, label: 'MC 主题' },
          ToggleSettingsRow)
      })
      slots.inject('settings.general.item', function () {
        return slots.register(
          { name: 'settings.general.item', id: 'mc-font', order: 14, label: 'MC 像素字体' },
          FontSettingsRow)
      })
    }

    exports.apply = apply
    exports.inject = ['slots']
    return module.exports
  },
})