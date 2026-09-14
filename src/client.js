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

    // 字体路由由 Host 半边（src/index.js）注册，两边必须是同一个路径。
    var FONT_ROUTE = '/dsh-mc-skin/font.ttf'
    // 用来匹配 @font-face 的族名。这里就是字体 name 表里的 family
    // （"Minecraft AE"），不是文件名 —— 虽然 @font-face 允许随便起名，
    // 用真名能让 DevTools 里一眼看懂。
    var FONT_FAMILY = 'Minecraft AE'
    var MONO_STACK = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'

    // ── 调色板（来自 user 提供的模板图）────────────────────────────
    var L_FILL = '#313233'   // background_template_left  填充
    var L_EDGE = '#030303'   // background_template_left  外框
    var L_TOP = '#2A2B2B'    // background_template_left  顶边（更暗）
    var L_BOTTOM = '#3B3B3C' // background_template_left  底边（更亮）

    var R_FILL = '#6B6B6B'   // background_template_right 填充
    var R_EDGE = '#030303'
    var R_TOP = '#3B3B3C'
    var R_BOTTOM = '#8D8E8E'

    // 槽位候选：按顺序取第一个存在的
    var SIDEBAR_FILES = ['minecraft24x.png']
    var HERO_FILES = ['minecraft34x.png']

    // MC 标准十六色（聊天颜色代码）
    var TEXT_COLORS = [
      { code: '0', hex: '#000000', name: '黑' },
      { code: '1', hex: '#0000AA', name: '深蓝' },
      { code: '2', hex: '#00AA00', name: '深绿' },
      { code: '3', hex: '#00AAAA', name: '青' },
      { code: '4', hex: '#AA0000', name: '红' },
      { code: '5', hex: '#AA00AA', name: '紫' },
      { code: '6', hex: '#FFAA00', name: '金' },
      { code: '7', hex: '#AAAAAA', name: '灰' },
      { code: '8', hex: '#555555', name: '深灰' },
      { code: '9', hex: '#5555FF', name: '蓝' },
      { code: 'a', hex: '#55FF55', name: '绿' },
      { code: 'b', hex: '#55FFFF', name: '浅蓝' },
      { code: 'c', hex: '#FF5555', name: '亮红' },
      { code: 'd', hex: '#FF55FF', name: '粉' },
      { code: 'e', hex: '#FFFF55', name: '黄' },
      { code: 'f', hex: '#FFFFFF', name: '白' },
    ]
    var DEFAULT_COLOR = 15

    var TOKENS = {
      '--dsw-alias-bg-base':        { light: R_FILL, dark: R_FILL },
      '--dsw-alias-bg-layer-1':     { light: '#3A3B3C', dark: '#3A3B3C' },
      '--dsw-alias-bg-layer-2':     { light: '#2A2B2C', dark: '#2A2B2C' },
      '--dsw-alias-bg-layer-3':     { light: '#333435', dark: '#333435' },
      '--dsw-alias-bg-layer-4':     { light: '#3A3B3C', dark: '#3A3B3C' },
      '--dsw-alias-bg-overlay':     { light: '#3E3F40', dark: '#3E3F40' },

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
      '--dsw-specific-tip':         { light: '#353638', dark: '#353638' },
      '--dsw-alias-bg-module-platform':         { light: '#1B1C1D', dark: '#1B1C1D' },
      '--dsw-alias-bg-multi-select':            { light: '#2A2B2C', dark: '#2A2B2C' },
      '--dsw-alias-bg-mask-drop':               { light: '#000000B3', dark: '#000000B3' },
      '--dsw-alias-button-elevated-fill':       { light: '#3A3B3C', dark: '#3A3B3C' },
      '--dsw-alias-button-floating-fill':       { light: '#3A3B3C', dark: '#3A3B3C' },
      '--dsw-alias-button-ghost-active-fill':   { light: '#3A3B3C', dark: '#3A3B3C' },
      '--dsw-alias-interactive-bg-hover-solid': { light: '#3A3B3C', dark: '#3A3B3C' },
      '--dsw-alias-scrollbar-bg-l1':            { light: '#313233', dark: '#313233' },
      '--dsw-alias-scrollbar-bg-l2':            { light: '#474848', dark: '#474848' },

      // 这里曾经有一批「浅色模式漏底封口」的 token，一次钉了 29 个
      // （--dsw-specific-menu / -bubble / -sidebar-nav-item-* 、markdown-* 、
      // state-*-tertiary 等）。已全部撤回，原因见上面的「范围纪律」。
      '--dsw-alias-border-l1':      { light: '#030303', dark: '#030303' },
      '--dsw-alias-border-l2':      { light: '#5A5C5E', dark: '#5A5C5E' },
      '--dsw-alias-border-l3':      { light: '#030303', dark: '#030303' },
      '--dsw-alias-brand-primary':  { light: '#6ABF4D', dark: '#6ABF4D' },
      '--dsw-alias-state-error-primary':   { light: '#E06C5A', dark: '#E06C5A' },
      '--dsw-alias-state-success-primary': { light: '#6ABF4D', dark: '#6ABF4D' },
      '--dsw-alias-state-warn-primary':    { light: '#D9A441', dark: '#D9A441' },
      '--dsw-specific-sidebar-fill': { light: L_FILL, dark: L_FILL },
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
    var colorStore = createStore(DEFAULT_COLOR)   // MC 十六色里的下标
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
        (themeOn ? buildCss(TEXT_COLORS[colorStore.get()].hex) : '') +
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

    function setTextColor(index) { colorStore.set(index); applySkin() }
    function setTheme(next) { themeStore.set(next); applySkin(); applySlots() }
    function setFont(next) {
      fontStore.set(next)
      applySkin()
      if (next) probeFont()
      else { fontProbe = null; fontStatusStore.set('idle') }
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
    function Switch(props) {
      var src = ASSETS[props.on ? 'on.png' : 'off.png']
      if (src === undefined) {
        return React.createElement('button', {
          type: 'button', 'data-mc-swatch': '1', onClick: props.onToggle,
          style: { padding: '4px 12px', fontSize: 12, cursor: 'pointer' },
        }, props.on ? '关闭' : '启用')
      }
      return React.createElement('img', {
        src: src, width: 30, height: 16,
        alt: props.on ? '已启用' : '已关闭', onClick: props.onToggle, draggable: false,
        style: { display: 'block', cursor: 'pointer', imageRendering: 'pixelated' },
      })
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

    function ColorPicker() {
      var idx = colorStore.use()
      var cur = TEXT_COLORS[idx]
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 7 } },
        React.createElement('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap' } },
          TEXT_COLORS.map(function (c, i) {
            return React.createElement('button', {
              key: c.code, type: 'button', 'data-mc-swatch': '1',
              title: '§' + c.code + ' ' + c.name + '  ' + c.hex,
              onClick: function () { setTextColor(i) },
              style: {
                width: 22, height: 22, padding: 0, cursor: 'pointer',
                backgroundColor: c.hex,
                boxShadow: i === idx ? '0 0 0 2px #6ABF4D,0 0 0 3px #000000' : '0 0 0 1px #000000',
              },
            })
          })),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
          '当前 §' + cur.code + ' ' + cur.name + '  ' + cur.hex))
    }

    function ToggleSettingsRow() {
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 600 } }, 'MC 主题'),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
          '开关控制配色与标志图；像素字体是下面那个独立开关。关闭即恢复原生外观。'),
        React.createElement(ThemeToggle, null))
    }

    function FontSettingsRow() {
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 600 } }, 'MC 像素字体'),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
          '把界面文字换成 Minecraft AE 像素字体。字体文件约 16 MB，由插件的 Host 半边按需发货，'
          + '只在首次打开开关时下载一次，之后走浏览器缓存；关掉立即恢复系统字体。'),
        React.createElement(FontToggle, null))
    }

    function SettingsRow() {
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 0' } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 600 } }, 'MC 字体颜色'),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
          '使用 Minecraft 聊天颜色代码，作用于全局文字（主/次/三级/注释按亮度递降）。'),
        React.createElement(ColorPicker, null))
    }

    // ── 样式表内容 ──────────────────────────────────────────────────
    // 变量必须写在 html body 上：主题把变量定义在 body，写在 :root 的即使带
    // !important 也赢不了——自定义属性是继承的，而继承不看重要性。
    var BTN_SEL = 'button:not([data-mc-swatch]):not([class*="_tab"]):not([class*="_crumb"])'
      + ':not([class*="_brand"]):not([class*="_card"]):not([class*="_row"])'
      + ':not([class*="_bubble"]):not([class*="_mark"]):not([class*="Close"]):not([class*="close"])'
    var SB_SEL = 'html body [class*="_sidebarCol"]'
    var CONV_SEL = 'html body [data-phase][class*="_root"]'
    var CLOSE_SEL = 'button[class*="Close"],button[class*="close"],'
      + 'button[aria-label*="关闭"],button[aria-label*="Close"],button[title*="关闭"]'
    var TAB_SEL = '[class*="_tabs"] > button[class*="_tab"]'

    function buildCss(textHex) {
      return [
        '*:not(svg){border-radius:0 !important;}',
        'img,canvas{image-rendering:pixelated;}',
        'body,button,input,textarea,select{font-family:"Courier New",ui-monospace,SFMono-Regular,Menlo,monospace !important;}',

        // 全局文字颜色：整个 label 层级亮度递降，保留层次。
        //
        // ⚠ 透明度不能再低。这套层次原来是 .74/.56/.44，在侧边栏 #313233 上
        // 勉强能看（5.2:1），但对话区的底是 #6B6B6B 这种中灰，半透明白压上去
        // 会直接糊掉：
        //     .74 白 / #6B6B6B → 3.5:1      .56 → 2.4:1      .44 → 1.8:1
        // 用户报的「黑背景地方字体变灰看不清」就是这个。层次感要靠字号和字重
        // 去做，不能靠把字调到快看不见。
        'html body{'
          + '--dsw-alias-label-primary:' + textHex + ' !important;'
          + '--dsw-alias-label-secondary:' + withAlpha(textHex, 0.88) + ' !important;'
          + '--dsw-alias-label-tertiary:' + withAlpha(textHex, 0.82) + ' !important;'
          + '--dsw-alias-label-caption:' + withAlpha(textHex, 0.68) + ' !important;'
          + '--dsw-alias-bg-base:' + R_FILL + ' !important;'
          + '--dsw-specific-sidebar-fill:' + L_FILL + ' !important;'
          + '--dsw-alias-border-l3:' + L_EDGE + ' !important;'
          + '--dsh-scrollbar-thumb:#C6C6C6 !important;'
          + '--dsh-scrollbar-thumb-hover:#D6D6D6 !important;}',

        // 行内代码
        'code,pre,kbd,samp{background-color:' + L_FILL + ' !important;background-image:none !important;'
          + 'border:1px solid ' + L_EDGE + ' !important;}',

        // 代码查看器 / 终端输出面板：DSH 用 div + 行号渲染，
        // <pre> 规则够不着。强制上深色底，避免白字压浅灰。
        '[class*="_codeViewer"],[class*="_codeBlock"],[class*="_sourceView"],'
          + '[class*="_terminal"],[class*="_logView"],[class*="_previewContent"],'
          + '[class*="_codeContainer"],[class*="_codeArea"]{'
          + 'background-color:' + L_FILL + ' !important;'
          + 'background-image:none !important;'
          + 'border-color:' + L_EDGE + ' !important;'
          + 'color:' + textHex + ' !important;}',

        // ── 文件差异 / 补丁查看器（Diff View）──
        // 截图里那个白底绿字的 diff 面板，类名通常带 _diff / _patch。
        // 强制刷深底，让新增/删除行有清晰的对比度。
        '[class*="_diff"],[class*="_patch"],[class*="_fileChange"],[class*="_fileDiff"],'
          + '[class*="_changeset"],[class*="_sourceDiff"],[class*="_diffViewer"]{'
          + 'background-color:' + L_FILL + ' !important;'
          + 'border:1px solid ' + L_EDGE + ' !important;'
          + 'color:' + textHex + ' !important;}',

        // 顶部标题栏（如："写入 · .dsh-tools\cdp-ugly-cause.mjs +104 -0"）
        '[class*="_diffHeader"],[class*="_fileHeader"],[class*="_patchHeader"],'
          + '[class*="_diffTitle"],[class*="_fileName"]{'
          + 'background-color:#2A2B2C !important;'
          + 'border-bottom:1px solid ' + L_EDGE + ' !important;'
          + 'color:' + withAlpha(textHex, 0.9) + ' !important;}',

        // 代码内容区：去掉白底，透出深色背景
        '[class*="_diffContent"],[class*="_patchContent"],[class*="_diffLines"],'
          + '[class*="_codeLine"],[class*="_lineContent"]{'
          + 'background-color:transparent !important;'
          + 'color:' + textHex + ' !important;}',

        // 新增的行（+）：用 MC 绿做高亮，避免刺眼
        '[class*="_lineAdd"],[class*="_diffAdd"],[class*="_addedLine"],'
          + '[class*="_insertion"]{'
          + 'background-color:rgba(106,191,77,0.15) !important;'
          + 'color:#6ABF4D !important;}',

        // 删除的行（-）：用 MC 红做高亮
        '[class*="_lineDel"],[class*="_diffDel"],[class*="_deletedLine"],'
          + '[class*="_deletion"]{'
          + 'background-color:rgba(224,108,90,0.15) !important;'
          + 'color:#E06C5A !important;}',

        // 左侧行号槽：深色底，弱化显示
        '[class*="_lineNumber"],[class*="_lineNum"],[class*="_diffLineNumber"]{'
          + 'background-color:#2A2B2C !important;'
          + 'color:' + withAlpha(textHex, 0.45) + ' !important;'
          + 'border-right:1px solid ' + L_EDGE + ' !important;}',

        // 消息泡泡 / 列表行：只上底色，不加边框
        '[class*="_bubble"],[class*="_userMessage"],[class*="_userTurn"]{background-color:' + L_FILL + ' !important;background-image:none !important;}',
        '[class*="_row"],[class*="_millerRow"],[class*="_rowSeat"]{background-color:' + L_FILL + ' !important;background-image:none !important;}',
        // 卡片内部的 row 必须透明：消息卡片的工具行就是 _row，
        // 给它上色会在卡片底部拉出一条深色带。
        '[data-composer-card] [class*="_row"]{background-color:transparent !important;}',
        // 卡片底色：排除按钮斜角还不够，激活卡片是浅底，会被白字压掉
        '[class*="_card"]{background-color:' + L_FILL + ' !important;}',
        '[class*="_cardActive"]{background-color:#3A3B3C !important;box-shadow:inset 0 0 0 1px #6ABF4D !important;}',
        // 模型设置里「编辑」展开的那块面板：底色由 --dsw-alias-bg-module-platform
        // 钉成黑（见 TOKENS），这里再补一圈亮边，让它和外面的卡片分层。
        // 只认 rowCard 里的那一层——addCard / setupCard 里的同名组件是组件自己
        // 写成透明的（background:0 0），给它加边框会出现双重框。
        '[class*="_rowCard"] > [class*="_editor"]{border:1px solid #C6C6C6 !important;}',
        // 对话轮次标记轨
        '[class*="_mark"]{background:transparent !important;border:0 !important;box-shadow:none !important;}',
        // markdown 标签页本体是 DIV，浅底白字，需要单独上色
        '[class*="_tab_"],[class*="_tabActive_"]{background-color:' + L_FILL + ' !important;background-image:none !important;}',

        // ── 左：工作区 ──
        SB_SEL + '{border:1px solid ' + L_EDGE + ' !important;}',
        SB_SEL + ',' + SB_SEL + ' > *{'
          + 'background-color:' + L_FILL + ' !important;'
          + 'background-image:linear-gradient(' + L_TOP + ',' + L_TOP + '),linear-gradient(' + L_BOTTOM + ',' + L_BOTTOM + ') !important;'
          + 'background-repeat:no-repeat !important;background-position:center top,center bottom !important;'
          + 'background-size:100% 1px,100% 1px !important;}',

        // ── 右：对话 ──
        CONV_SEL + '{'
          + 'border:1px solid ' + R_EDGE + ' !important;background-color:' + R_FILL + ' !important;'
          + 'background-image:linear-gradient(' + R_TOP + ',' + R_TOP + '),linear-gradient(' + R_BOTTOM + ',' + R_BOTTOM + ') !important;'
          + 'background-repeat:no-repeat !important;background-position:center top,center bottom !important;'
          + 'background-size:100% 1px,100% 1px !important;}',

        // ── button_template：黑框 + #F1F1F1 上/左/右高光 + 白线 + 2px #555555 底 ──
        'button{--mc-face:#C6C6C6;--mc-hi:#F1F1F1;--mc-lo:#555555;--mc-line:#FFFFFF;}',
        BTN_SEL + '{'
          + 'border:1px solid #000 !important;border-radius:0 !important;color:#1C1C1C !important;text-shadow:none !important;'
          + 'background-color:var(--mc-face) !important;'
          + 'background-image:linear-gradient(var(--mc-lo),var(--mc-lo)),'
            + 'linear-gradient(var(--mc-line),var(--mc-line)),'
            + 'linear-gradient(var(--mc-hi),var(--mc-hi)),'
            + 'linear-gradient(var(--mc-hi),var(--mc-hi)),'
            + 'linear-gradient(var(--mc-hi),var(--mc-hi)) !important;'
          + 'background-repeat:no-repeat !important;'
          + 'background-position:center bottom,center bottom,center top,left center,right center !important;'
          + 'background-size:100% 2px,calc(100% - 2px) 3px,100% 1px,1px 100%,1px 100% !important;'
          + 'box-shadow:none !important;}',
        BTN_SEL + ':hover{--mc-face:#D6D6D6;}',
        BTN_SEL + ':active{--mc-face:#A8A8A8;--mc-hi:#555555;--mc-lo:#F1F1F1;--mc-line:#8B8B8B;}',
        BTN_SEL + ':disabled{--mc-face:#8B8B8B;--mc-hi:#A8A8A8;--mc-lo:#4A4A4A;--mc-line:#7A7A7A;color:#5A5A5A !important;}',
        BTN_SEL + ':focus-visible{outline:1px solid #FFFFFF;outline-offset:1px;}',

        // 按钮上的字必须跟着按钮一起变暗 —— 这两条是一体的，拆开就会出对比度事故。
        //
        // 上面那条规则把每个按钮的面板刷成 #C6C6C6（浅色）。但按钮内部往往还有
        // 非 button 的子元素在写字，它们走的是 label token 而不是继承 color：
        //   ._7KE1Ra_triggerEffort{color:var(--dsw-alias-label-caption)}   ← 一个 div
        // 原生主题里这个元素所在的触发器是透明 ghost（background:0 0），浅色注释字
        // 压在深底上没问题；可一旦被刷成 #C6C6C6，就变成 rgba(255,255,255,.44)
        // 压浅灰 —— 对比度 1.28:1，基本看不见。
        //
        // 所以：在按钮及其后代上把整套 label token 钉成深色，让「浅底 + 深字」
        // 始终成立，而不是去猜哪个类名是文字。
        //
        // -inverted / -primary-inverted 故意不在这里覆盖：那对 token 的语义就是
        // 「反色标签」，本来就是给深底配浅字用的。
        BTN_SEL + ',' + BTN_SEL + ' *{'
          + '--dsw-alias-label-primary:#1C1C1C !important;'
          + '--dsw-alias-label-primary-foreground:#1C1C1C !important;'
          + '--dsw-alias-label-primary-dimmed:#3B3B3C !important;'
          + '--dsw-alias-label-secondary:#2A2B2C !important;'
          + '--dsw-alias-label-tertiary:#3B3B3C !important;'
          + '--dsw-alias-label-caption:#474848 !important;'
          + '--dsw-alias-label-dimmed:#3B3B3C !important;}',

        // ── close.png ──
        CLOSE_SEL + '{border:0 !important;border-radius:0 !important;background-color:transparent !important;'
          + 'background-image:url(' + ASSETS['close.png'] + ') !important;'
          + 'background-repeat:no-repeat !important;background-position:center !important;'
          + 'background-size:15px 15px !important;box-shadow:none !important;'
          + 'color:transparent !important;min-width:15px;min-height:15px;}',

        // ── page_template：只命中分页栏的直接子级，避免全站误伤 ──
        TAB_SEL + '{border:0 !important;border-radius:0 !important;'
          + 'background:#2F6E1E !important;background-image:none !important;'
          + 'color:#A9CE9B !important;font-weight:700 !important;letter-spacing:.06em;'
          + 'padding:4px 14px 5px !important;text-shadow:none !important;'
          + 'box-shadow:0 0 0 1px #000000,inset 0 0 0 1px #4C9C34 !important;}',
        TAB_SEL + ':after{display:none !important;}',
        '[class*="_tabs"] > button[class*="_tabActive"]{background:#3C8527 !important;color:#FFFFFF !important;'
          + 'box-shadow:0 0 0 1px #000000,inset 0 0 0 1px #6ABF4D !important;}',
        '[class*="_tabs"] > button[class*="_tab"]:hover:not([class*="_tabActive"]){background:#458F2E !important;color:#E8F5E0 !important;}',
        '[class*="_tabs"]{gap:8px !important;}',

        // ── text_template：内凹深底 ──
        'input,textarea{border:1px solid #18191A !important;border-radius:0 !important;'
          + 'background-color:#474848 !important;'
          + 'background-image:linear-gradient(#3B3B3C,#3B3B3C),linear-gradient(#717272,#717272) !important;'
          + 'background-repeat:no-repeat !important;background-position:center top,center bottom !important;'
          + 'background-size:100% 1px,100% 1px !important;box-shadow:none !important;}',
        // 整张消息卡片
        '[data-composer-card]{border:1px solid #18191A !important;background-color:#474848 !important;'
          + 'background-image:linear-gradient(#3B3B3C,#3B3B3C),linear-gradient(#717272,#717272) !important;'
          + 'background-repeat:no-repeat !important;background-position:center top,center bottom !important;'
          + 'background-size:100% 1px,100% 1px !important;box-shadow:none !important;}',
        '[data-composer-input]{border:0 !important;background:transparent !important;box-shadow:none !important;}',
        '[data-composer-placeholder]{color:#8A8B8C !important;}',
        'input::placeholder,textarea::placeholder{color:#8A8B8C !important;}',

        // ── 滑轮模板：伪元素不归 * 管，圆角要单独写 ──
        '::-webkit-scrollbar{width:8px !important;height:8px !important;}',
        '::-webkit-scrollbar-track{background:#313233 !important;border-radius:0 !important;}',
        '::-webkit-scrollbar-corner{background:#313233 !important;}',
        '::-webkit-scrollbar-thumb{background-color:#C6C6C6 !important;'
          + 'background-image:linear-gradient(#FFFFFF,#FFFFFF),linear-gradient(#717171,#717171) !important;'
          + 'background-repeat:no-repeat !important;background-position:center top,center bottom !important;'
          + 'background-size:100% 1px,100% 1px !important;'
          + 'border:1px solid #131311 !important;border-radius:0 !important;}',
        '::-webkit-scrollbar-thumb:hover{background-color:#D6D6D6 !important;}',
        'html{scrollbar-color:#C6C6C6 #313233;scrollbar-width:thin;}',
      ].join('\n')
    }

    // ── 字体样式表 ──────────────────────────────────────────────────
    // 只在像素字体开关打开时注入。字体字节不在这个文件里：@font-face 指向
    // Host 半边（src/index.js）注册的路由，浏览器只在真正用到这个字体族时
    // 才去下载它。
    function buildFontCss() {
      var stack = '"' + FONT_FAMILY + '",' + MONO_STACK
      return [
        '@font-face{font-family:"' + FONT_FAMILY + '";'
          + 'src:url("' + FONT_ROUTE + '") format("truetype");'
          + 'font-style:normal;font-weight:100 900;font-display:swap;}',

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
      slots.inject('settings.general.item', function () {
        return slots.register(
          { name: 'settings.general.item', id: 'mc-text-color', order: 15, label: 'MC 字体颜色' },
          SettingsRow)
      })
    }

    exports.apply = apply
    exports.inject = ['slots']
    return module.exports
  },
})