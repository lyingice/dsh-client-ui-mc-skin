/*!
 * dsh-client-ui-mc-skin — 构建产物，请勿直接编辑。
 * 源码在 src/client.js，改完跑 `node build.mjs` 重新生成。
 * 素材已内联为 data URL（5 张，共 2552 字节）。
 */
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
    var ASSETS = {
  "close.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAYUlEQVR4AeyQQQrAIAwE2/6tPto+rnXEQImrHjwJirpZs4OQ65hYGy7DC3d4S5nF+/yYLjmw+MTTABSfstWWMCmAHkimCRuIElRHwgD8DIDiqf2RMMA/6L31JGzNkS4KfwAAAP//HOdQPgAAAAZJREFUAwDlSCQfVarqTwAAAABJRU5ErkJggg==",
  "minecraft24x.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAADDklEQVR4AayVS04UURSG/ypaBYyvrsSpxsQdaBBniusw0ZH70IkmOgDkITjU+FiDiyAhYcDDDfBUEMS2y+8/1be6iY2ERHL/Ou//nHvrVpNrbrSs8elBqX74fL/Ux7EuPqAbM3dKGdMjpYwppPGe/HfGvTLXSX9lKbWzbhZmbThm2JH8Jbmh81jc+XJ8g6wtpeJEQI3VDJmlGLoMB0wu6pJjoD2W69J51djek7Z3lW3tSmlqF2/ZDyyJleSU1h1LxG5YQm6fY5s/pG+H6u6AiYvxZRXjK2pOrKh4ulDh2QLNqGobsF1koIvDDDWsYmq1wjT502sqZtZ0fmJV8k6iWUkDiOMo0sRw9F0uUpsQjXget7LD3zRwXpWR6yRi5/VuP2wex/SJI/EwAbEDcuVkw3oHO8vflRBx+13ks93kHYEUt3Q44BtgrhiqpIENIvYj+i8TB9rd7dvuk90YauCFlKULZ5SbuLpy9hA7bvmlOWbigI2/kWUZQ+A33dVBcWRlvGPvaOPJDSW03t5VYH5UxSy35c1XFcYct8WYX1NrdkStmQobj69r41GFOFITghzQrmfFdJ6CEQh6hz3RoyoplQOFVRHjoS7pufxxbfFR8AEpyLvn/E9yeOqzqMl9IBhXhqTmkHRlkCOKbialoueci+eLar6o4FvSD8XLJQVeLdELYtfHkOayLTfA8HLgbIPEDNhxSrjeJZYxNAY9cl3m0w8MSYNnIccrg4TTrCD2SVDLCgoacWiwoPDkh4530Qn2HknE+jyO5JgjmjgREtuoue+oX6ZRdcVLnOcpF0WpAWriysWnXwb4OY4Aj073U3UIcmrNbGEJYgccfCzvBl/ol25eUELr9W0FJpGTt9SaqJDilmry/prnJCNIGI9GNKiU8OHAokFSwsJGelcB6x0g6uWS2EXnFnbsbgN38L/oICGprkQJn2UHCHfNGj15JpdvEVj/Ka0fgH2+gyCmHUsDBAcoakjx2+LfF6BdCow9ZI1DrT+8Vudpn9j+L+kADMNhPgbp7qDjwPd/FrN6Q38AAAD//5I6IQsAAAAGSURBVAMAnnkFRLwb3+oAAAAASUVORK5CYII=",
  "minecraft34x.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAADw0lEQVR4AcyW3Y4URRTH/9074u4SWJlOvNWY+AYaxDvF5zDRK99DbzTRCxbZRfBS48cz+BAkm3CBwAss7PK5sAxT/P5nunq6e2CWzQZ2JvWrj1Onzjl1qnq6S105lzr881XSQfz7ZdLf57v8xTiz+VlSZuNsUuYS/cyf2Pgj80UqddhfStK46K5C1BFYJ+MJzxv3TWJ9jF3B1r3/Dh+IDb0BDg6kGEumvUPxYyPKMCzoT6DDuJmrhxYpMkE2hE21JpbG50utnVSH3UfS7sOg2KH1MZiwROX1O9apcR+9xJrAY+ugGiWcI4iNEEAyzFjv7mPJ3N9XNyPsvLpwQ9WF/4PhOu3311S1+eEadwTD4wxGT7OZ06uSWVtVdenmlA1sbNxSZTZp4eT6TSkCdFAm9QLB5nGVsnP+7SM4KKLY0UvO+6B1zBf7z8nImN60lDqM87yuf96Wc1LKeDyH0nN5I9FqkY4moqN6xW7u3XigPrFzlkTxjnzz7/KE1czoh2Kr8nMe/qgiu2mRMkJQOVYHmvtzW2ehYdy9eJbPXSwNVgZo4JgS2T31jko7L0iPwSIKr1nij4kgrG7nDRbMpyiKiascyPvLKi0hDmXufPeR2ox+/1wdrp5TdZk/rN9uq8pc4Y8qc/WWRpfParQ55c63Hyr4hrYmMpGd0hLI/Ojf1mxJMLO+mjQ7heTPSjU+ytkFPQlLphIGlEkGkDZ9OpQsL+WX3A4vn4BHMILg7Nt3gPUOwNB9jdLy0OrKnz8BwjMr0nBFwZll7kjsNDvGhwOgiUJQ1Y9bMsOftpTp/0/0x9XP19Xwy3WuIY47fpxpPITMcyIQxotQyjijHAkZ0IkBOyhq8sQRW9s12Yz7kQ0EJMQxlHqPb4mGFWn5BEEwa0VroHvkEo69uXwFbB+rNOECX5PHl078kTCnXS5uo6CZ94zvg9XmYZ02YTt8OBjj1TgJGS3DSSB0jrtwR5KKpIZJqsTx1NAcveDAhpsjwmItstiU/nhNvMYn8EEcClSttLHsaKUJoLZrz3Snu00L9fg6tJpoqCgO2qx9fEp9Rr9+qoaL9C9+otH6lL6+hjyJwbvSsMbGc57xt0iXlbCIKALMLaIovifR6VWhR+X5gHmGjQ2GndLM+dHNoNGS89S0BLaUX0rhgEVMz5SYQ9oYot+UpGLQW5cvq8Zogd9n20+l7Sc1e76sicubQW8JxSUMmYEmHzT5w6Zu9RAjmUf0O+xr++sPOuu0h07wTNqDJ7CKD9x673h1IG6On+7ROMK3GRPJz6f1AgAA///wrmw4AAAABklEQVQDANzV2dHwjAaAAAAAAElFTkSuQmCC",
  "off.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAQCAYAAAABOs/SAAAAtklEQVR4AeyUQQrEIAxFM3MsV17Iuwz1EmVO4UqP5fhd2EATyKjLgg/sb8wTBd9EVI20sn0DYqq1quSc99lYpy7GdymFJI7Pgd/AejJaHXoMhngkysR7T34SqaVZLC1eyZbEIQTi/LORaTGEMUbiILPKp8VWgVb3iLWTueW4W9wpB9mtUAmWjhoijuIQ4yWx2NEYmsUpJUqTSHvpYrzReJMl2KJXm6/Qll+ji51zdH5Plat83+wHAAD//7MNp6gAAAAGSURBVAMAsxenF8JZkAYAAAAASUVORK5CYII=",
  "on.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAQCAYAAAABOs/SAAAAmUlEQVR4AeyUwQ2AIAxFv47FhdEIGxinMG7BBcbC0sRbFVIk0UTjg0NpX+mBGc9/mUpWGSFGzvmSGCP1BUjiareUeXeGwkBKSWRdVo5LYjjn1HDVhkUUN+R1H1GLQwgoaDtQi7XCM+8Xn5MYvn9v1NZaFLSjedeNvffQ0joB6cYTJffAb3R5kyWoNv+SmAM9izEG275dUmofAAAA//+2zcOZAAAABklEQVQDACCFjxfOZhx4AAAAAElFTkSuQmCC"
}

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

    // ── Ore UI 调色板（逐像素取样自 Minecraft 官方 Design System 图）──
    //
    // 来源：C:\Users\12501\Pictures\Screenshots\Ore_ui 的两张规范图。
    // 取样脚本：.dsh-env-backup/ore-palette.py 与 ore-shape.py
    //
    // 关键结论（实测，不是印象）：
    //   · 全部控件是硬直角 —— 逐行扫绿色按钮的边缘，各行最左/最右 x 完全一致
    //   · 画布 #202028 占规范图 46%；面板/卡片/行 #484848 占 16%
    //   · 浅色控件 #D0D0D4；主色绿 #3C8424（悬停 #50A434 / 按下 #28641C）
    //   · 语义色：蓝 #2C68E4、红 #C83434、黄 #FCE864
    //   · 按钮 = 浅灰面 + 深色字 + 1px 深边 + 底部 2px 暗唇边
    var ORE_CANVAS     = '#202028'   // 画布 / 最底
    var ORE_SURFACE    = '#484848'   // 面板、卡片、列表行、标签页
    var ORE_SURFACE_HI = '#5A5A60'   // 面悬停 / 选中态
    var ORE_SURFACE2   = '#3A3A3E'   // 次级面
    var ORE_SURFACE3   = '#404046'   // 三级面
    var ORE_INSET      = '#303030'   // 输入框 / 代码块底
    var ORE_DEEP       = '#1C1C20'   // 最深内嵌
    var ORE_BANNER     = '#282828'   // 代码块标题条
    var ORE_LINE       = '#5C5C62'   // 边框 / 分隔线
    var ORE_LINE_HI    = '#6E6E76'
    var ORE_LINE_DK    = '#26262C'   // 暗边
    var ORE_TEXT       = '#F4F4F8'   // 主文字
    var ORE_TEXT2      = '#B4B4BC'   // 次文字
    var ORE_TEXT3      = '#8A8A94'   // 三级 / 说明
    var ORE_LIGHT      = '#D0D0D4'   // 浅色控件面（次要按钮、滑块手柄）
    var ORE_LIGHT_HI   = '#E6E6EA'
    var ORE_LIGHT_LO   = '#A8A8B0'
    var ORE_GREEN      = '#3C8424'   // 主色（主按钮、选中标签页）
    var ORE_GREEN_HI   = '#50A434'
    var ORE_GREEN_LO   = '#28641C'
    var ORE_BLUE       = '#2C68E4'
    var ORE_RED        = '#C83434'
    var ORE_YELLOW     = '#FCE864'

    // 兼容旧变量名：TOKENS 与部分规则里仍在引用
    var L_FILL = ORE_CANVAS
    var L_EDGE = ORE_LINE_DK
    var L_TOP = ORE_LINE
    var L_BOTTOM = ORE_LINE_DK
    var R_FILL = ORE_CANVAS
    var R_EDGE = ORE_LINE_DK
    var R_TOP = ORE_LINE
    var R_BOTTOM = ORE_LINE_DK

    // 槽位候选：按顺序取第一个存在的
    var SIDEBAR_FILES = ['minecraft24x.png']
    var HERO_FILES = ['minecraft34x.png']

    // 主文字色。Ore UI 在深底上用近白 #F4F4F8，不用纯白（会发光、久读刺眼）。
    var TEXT_PRIMARY = ORE_TEXT


    var TOKENS = {
      '--dsw-alias-bg-base':        { light: ORE_CANVAS, dark: ORE_CANVAS },
      '--dsw-alias-bg-layer-1':     { light: ORE_SURFACE2, dark: ORE_SURFACE2 },
      '--dsw-alias-bg-layer-2':     { light: ORE_SURFACE, dark: ORE_SURFACE },
      '--dsw-alias-bg-layer-3':     { light: ORE_SURFACE3, dark: ORE_SURFACE3 },
      // --dsw-alias-bg-layer-4 曾经在这里，但 design-platform.css 里没有这个
      // token（只有 layer-1..3），覆盖它等于写了个没人读的变量，已删除。
      '--dsw-alias-bg-overlay':     { light: ORE_SURFACE2, dark: ORE_SURFACE2 },

      // 代码块 / Diff / 终端 / Read 面板的底色。这三个面板（ui-primitives 的
      // CodeBlock、DiffBlock、ReadBlock/TerminalBlock）**只**从这一对 token
      // 取底色，所以钉死它们等于一次修好全部面板，不需要再猜类名。
      // 浅色模式下 markdown-code-block = bluish-50 = rgb(249,250,251)，近白，
      // 而标签文字已被本主题染成浅色 —— 就是用户截图里那块白底白字的 diff 面板。
      '--dsw-alias-markdown-code-block':        { light: ORE_INSET, dark: ORE_INSET },
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
      '--dsw-specific-tip':         { light: ORE_SURFACE, dark: ORE_SURFACE },
      '--dsw-alias-bg-module-platform':         { light: ORE_DEEP, dark: ORE_DEEP },
      '--dsw-alias-bg-multi-select':            { light: ORE_SURFACE2, dark: ORE_SURFACE2 },
      '--dsw-alias-bg-mask-drop':               { light: '#000000B3', dark: '#000000B3' },
      '--dsw-alias-button-elevated-fill':       { light: ORE_LIGHT, dark: ORE_LIGHT },
      '--dsw-alias-button-floating-fill':       { light: ORE_SURFACE, dark: ORE_SURFACE },
      '--dsw-alias-button-ghost-active-fill':   { light: ORE_SURFACE_HI, dark: ORE_SURFACE_HI },
      '--dsw-alias-interactive-bg-hover-solid': { light: ORE_SURFACE_HI, dark: ORE_SURFACE_HI },
      '--dsw-alias-scrollbar-bg-l1':            { light: ORE_CANVAS, dark: ORE_CANVAS },
      '--dsw-alias-scrollbar-bg-l2':            { light: ORE_SURFACE, dark: ORE_SURFACE },

      // 这里曾经有一批「浅色模式漏底封口」的 token，一次钉了 29 个
      // （--dsw-specific-menu / -bubble / -sidebar-nav-item-* 、markdown-* 、
      // state-*-tertiary 等）。已全部撤回，原因见上面的「范围纪律」。
      '--dsw-alias-border-l1':      { light: ORE_LINE, dark: ORE_LINE },
      '--dsw-alias-border-l2':      { light: ORE_LINE_HI, dark: ORE_LINE_HI },
      '--dsw-alias-border-l3':      { light: ORE_LINE_DK, dark: ORE_LINE_DK },
      '--dsw-alias-brand-primary':  { light: ORE_GREEN_HI, dark: ORE_GREEN_HI },
      // 文件改动的增删配色：删除=Ore UI 红 #C83434、添加=Ore UI 绿 #50A434。
      // DiffBlock 的 .del/.add 就走这两个 token；buildCss 里那份必须同值。
      '--dsw-alias-state-error-primary':   { light: ORE_RED, dark: ORE_RED },
      '--dsw-alias-state-success-primary': { light: ORE_GREEN_HI, dark: ORE_GREEN_HI },
      '--dsw-alias-state-warn-primary':    { light: ORE_YELLOW, dark: ORE_YELLOW },
      '--dsw-specific-sidebar-fill': { light: ORE_CANVAS, dark: ORE_CANVAS },
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
      var face = on ? ORE_GREEN : '#5A5A60'
      var edge = on ? ORE_GREEN_HI : '#6A6A72'
      return React.createElement('button', {
        type: 'button',
        'data-mc-swatch': '1',
        role: 'switch',
        'aria-checked': on ? 'true' : 'false',
        'aria-label': on ? '已启用' : '已关闭',
        onClick: props.onToggle,
        style: {
          position: 'relative', display: 'block', flex: 'none',
          width: 42, height: 20, padding: 0, cursor: 'pointer',
          border: '1px solid #14141A',
          backgroundColor: face,
          backgroundImage: 'linear-gradient(' + edge + ',' + edge + ')',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          backgroundSize: '100% 1px',
          boxShadow: 'none',
        },
      }, React.createElement('span', {
        style: {
          position: 'absolute', top: 2, left: on ? 23 : 2,
          width: 15, height: 13,
          backgroundColor: ORE_LIGHT,
          backgroundImage: 'linear-gradient(' + ORE_LIGHT_HI + ',' + ORE_LIGHT_HI + ')',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          backgroundSize: '100% 1px',
          border: '1px solid #14141A',
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
        // Ore UI 的层级用**实色灰阶**表达，不用半透明度。上一版靠 .90/.80/.72
        // 的透明白拉开层次，压在灰面上会随底色漂移（用户报的「字体变灰看不清」
        // 就是这么来的）。现在四个层级各给一个固定色，对比度可预测：
        //     primary   #F4F4F8 / #202028 → 13.2:1
        //     secondary #B4B4BC / #202028 →  7.6:1
        //     tertiary  #8A8A94 / #202028 →  4.4:1
        //     caption   #8A8A94（同三级，靠字号区分）
        'html body{'
          + '--dsw-alias-label-primary:' + textHex + ' !important;'
          + '--dsw-alias-label-secondary:' + ORE_TEXT2 + ' !important;'
          + '--dsw-alias-label-tertiary:' + ORE_TEXT3 + ' !important;'
          + '--dsw-alias-label-caption:' + ORE_TEXT3 + ' !important;'
          + '--dsw-alias-bg-base:' + ORE_CANVAS + ' !important;'
          + '--dsw-specific-sidebar-fill:' + ORE_CANVAS + ' !important;'
          + '--dsw-alias-border-l3:' + ORE_LINE_DK + ' !important;'
          + '--dsh-scrollbar-thumb:' + ORE_SURFACE + ' !important;'
          + '--dsh-scrollbar-thumb-hover:' + ORE_LINE + ' !important;}',

        // 行内代码：Ore UI 的内嵌底 + 1px 描边
        'code,pre,kbd,samp{background-color:' + ORE_INSET + ' !important;background-image:none !important;'
          + 'border:1px solid ' + ORE_LINE_DK + ' !important;}',

        // ── Diff 增删行的语义色 ──
        //
        // 这三个面板（CodeBlock / DiffBlock / ReadBlock / TerminalBlock）的底色
        // 走 TOKENS 里的 --dsw-alias-markdown-code-block(-banner)，这里只管
        // diff 的增删色，取 Ore UI 语义色：红 #C83434 / 绿 #50A434。
        //
        // 历史教训：这里曾经有 8 条 [class*="_codeViewer"] / "_diff" 之类的选择器，
        // 全是猜的类名（自检脚本 58 条里 37 条是死的），已改成走 token。
        'html:root body{'
          + '--dsw-alias-state-success-primary:' + ORE_GREEN_HI + ' !important;'
          + '--dsw-alias-state-error-primary:' + ORE_RED + ' !important;}',

        // ── 面：气泡 / 列表行 / 卡片 ────────────────────────────────
        // Ore UI 的面统一 #484848，靠 1px 暗边分层，不用渐变。
        '[class*="_bubble"]{background-color:' + ORE_SURFACE + ' !important;background-image:none !important;}',
        '[class*="_row"],[class*="_millerRow"],[class*="_rowSeat"]{background-color:' + ORE_SURFACE + ' !important;background-image:none !important;}',
        // 卡片内部的 row 必须透明：消息卡片的工具行就是 _row，
        // 给它上色会在卡片底部拉出一条多余色带。
        '[data-composer-card] [class*="_row"]{background-color:transparent !important;}',
        '[class*="_card"]{background-color:' + ORE_SURFACE + ' !important;}',
        '[class*="_cardActive"]{background-color:' + ORE_SURFACE_HI + ' !important;box-shadow:inset 0 0 0 2px ' + ORE_GREEN + ' !important;}',
        // 模型设置里「编辑」展开的面板：底色由 --dsw-alias-bg-module-platform
        // 钉成 ORE_DEEP，这里补一道描边分层。只认 rowCard 里的那一层——
        // addCard / setupCard 里的同名组件自己写成透明，加边框会出现双重框。
        '[class*="_rowCard"] > [class*="_editor"]{border:1px solid ' + ORE_LINE + ' !important;}',
        // 对话轮次标记轨
        '[class*="_mark"]{background:transparent !important;border:0 !important;box-shadow:none !important;}',
        // 标签条 / 标签按钮的底。
        // ⚠ 必须排除 _tabLayout：那是 ui-dockkit 的标签页布局容器
        // （TabLayout.tsx 的 css.tabLayout），会话里实测是 577×822 的整块 ——
        // 裸的 [class*="_tab"] 会把它刷成实心色、盖住整个 pane（1.3.1 修过）。
        '[class*="_tab"]:not([class*="_tabLayout"]),[class*="_tabActive"]{background-color:' + ORE_SURFACE + ' !important;background-image:none !important;}',

        // ── 左：侧边栏 ───────────────────────────────────────────────
        // 不再画四边像素框：Ore UI 的侧栏是纯色画布 + 一道右侧分隔线。
        SB_SEL + '{background-color:' + ORE_CANVAS + ' !important;border:0 !important;'
          + 'border-right:1px solid ' + ORE_LINE_DK + ' !important;background-image:none !important;}',
        SB_SEL + ' > *{background-color:transparent !important;background-image:none !important;}',

        // ── 右：会话 ─────────────────────────────────────────────────
        // 会话区就是画布本身，分层交给里面的卡片/气泡。
        CONV_SEL + '{background-color:' + ORE_CANVAS + ' !important;border:0 !important;background-image:none !important;}',

        // ── 按钮：Ore UI 浅色实心 + 深色字 + 底部 2px 暗唇边 ────────
        //
        // 规范图里的按钮是「浅灰面 + 深字 + 1px 深边 + 底边一道更暗的唇」，
        // 不是像素立体斜角。悬停提亮、按下压暗。
        'button{--ore-face:' + ORE_LIGHT + ';--ore-hi:' + ORE_LIGHT_HI + ';--ore-lo:' + ORE_LIGHT_LO + ';}',
        BTN_SEL + '{'
          + 'border:1px solid #14141A !important;border-radius:0 !important;'
          + 'color:#14141A !important;text-shadow:none !important;'
          + 'background-color:var(--ore-face) !important;'
          + 'background-image:linear-gradient(var(--ore-hi),var(--ore-hi)),linear-gradient(var(--ore-lo),var(--ore-lo)) !important;'
          + 'background-repeat:no-repeat !important;'
          + 'background-position:center top,center bottom !important;'
          + 'background-size:100% 1px,100% 2px !important;'
          + 'box-shadow:none !important;}',
        BTN_SEL + ':hover{--ore-face:' + ORE_LIGHT_HI + ';}',
        BTN_SEL + ':active{--ore-face:' + ORE_LIGHT_LO + ';}',
        BTN_SEL + ':disabled{--ore-face:' + ORE_SURFACE + ';color:#7A7A84 !important;border-color:' + ORE_LINE_DK + ' !important;}',
        BTN_SEL + ':focus-visible{outline:2px solid ' + ORE_TEXT + ' !important;outline-offset:-3px !important;}',

        // 主要按钮：Ore UI 绿（规范图里 PLAY 那颗）+ 白字 + 深绿唇边
        PRIMARY_SEL + '{'
          + 'border-color:#0E1A0A !important;color:#FFFFFF !important;'
          + 'background-color:' + ORE_GREEN + ' !important;'
          + 'background-image:linear-gradient(' + ORE_GREEN_HI + ',' + ORE_GREEN_HI + '),'
            + 'linear-gradient(' + ORE_GREEN_LO + ',' + ORE_GREEN_LO + ') !important;'
          + 'text-shadow:1px 1px 0 rgba(0,0,0,.45) !important;}',
        PRIMARY_SEL + ':hover{background-color:' + ORE_GREEN_HI + ' !important;}',
        PRIMARY_SEL + ':active{background-color:' + ORE_GREEN_LO + ' !important;}',
        PRIMARY_SEL + ':disabled{background-color:#2E4A25 !important;color:#9AA394 !important;text-shadow:none !important;}',

        // 按钮内部往往还有非 button 的子元素在写字，走的是 label token 而不是
        // 继承 color。浅底必须配深字，否则会出现 rgba(255,255,255,.44) 压浅灰
        // 的 1.28:1 事故。所以把整套 label token 一起钉在按钮子树里。
        // -inverted / -primary-inverted 不覆盖：那一对本来就是给深底配浅字的。
        BTN_SEL + ',' + BTN_SEL + ' *{'
          + '--dsw-alias-label-primary:#14141A !important;'
          + '--dsw-alias-label-primary-foreground:#14141A !important;'
          + '--dsw-alias-label-primary-dimmed:#2A2A32 !important;'
          + '--dsw-alias-label-secondary:#2A2A32 !important;'
          + '--dsw-alias-label-tertiary:#3A3A42 !important;'
          + '--dsw-alias-label-caption:#46464E !important;'
          + '--dsw-alias-label-dimmed:#3A3A42 !important;}',
        // 主按钮反过来：白字压绿底
        PRIMARY_SEL + ',' + PRIMARY_SEL + ' *{'
          + '--dsw-alias-label-primary:#FFFFFF !important;'
          + '--dsw-alias-label-primary-foreground:#FFFFFF !important;'
          + '--dsw-alias-label-secondary:#E8F2E2 !important;'
          + '--dsw-alias-label-tertiary:#D2E4CA !important;'
          + '--dsw-alias-label-caption:#C2D8BA !important;'
          + '--dsw-alias-label-dimmed:#D2E4CA !important;}',

        // ── close.png ──
        CLOSE_SEL + '{border:0 !important;border-radius:0 !important;background-color:transparent !important;'
          + 'background-image:url(' + ASSETS['close.png'] + ') !important;'
          + 'background-repeat:no-repeat !important;background-position:center !important;'
          + 'background-size:15px 15px !important;box-shadow:none !important;'
          + 'color:transparent !important;min-width:15px;min-height:15px;}',

        // ── 标签页：Ore UI 分段控件（未选=面，选中=绿实心）───────────
        // 对应规范图左下那组：整条连体，选中段绿色实心 + 白字 + 底部深绿唇。
        TAB_SEL + '{border:1px solid ' + ORE_LINE_DK + ' !important;border-radius:0 !important;'
          + 'background:' + ORE_SURFACE + ' !important;background-image:none !important;'
          + 'color:' + ORE_TEXT2 + ' !important;font-weight:700 !important;letter-spacing:.04em;'
          + 'text-shadow:none !important;box-shadow:none !important;}',
        TAB_SEL + ':after{display:none !important;}',
        '[class*="_tabs"] > button[class*="_tabActive"]{background:' + ORE_GREEN + ' !important;'
          + 'color:#FFFFFF !important;border-color:#0E1A0A !important;'
          + 'box-shadow:inset 0 -2px 0 ' + ORE_GREEN_LO + ' !important;}',
        '[class*="_tabs"] > button[class*="_tab"]:hover:not([class*="_tabActive"]){'
          + 'background:' + ORE_SURFACE_HI + ' !important;color:' + ORE_TEXT + ' !important;}',
        // 段间不留缝，形成 Ore UI 那种连体分段控件
        '[class*="_tabs"]{gap:0 !important;}',

        // ── 输入框 / 输入卡片：Ore UI 内嵌底 + 1px 描边 ──────────────
        'input,textarea{border:1px solid ' + ORE_LINE + ' !important;border-radius:0 !important;'
          + 'background-color:' + ORE_INSET + ' !important;background-image:none !important;'
          + 'color:' + ORE_TEXT + ' !important;box-shadow:none !important;}',
        'input:focus,textarea:focus{border-color:' + ORE_TEXT + ' !important;outline:none !important;}',
        // 整张输入卡片
        '[data-composer-card]{border:1px solid ' + ORE_LINE + ' !important;border-radius:0 !important;'
          + 'background-color:' + ORE_INSET + ' !important;background-image:none !important;'
          + 'box-shadow:none !important;}',
        '[data-composer-card]:focus-within{border-color:' + ORE_TEXT + ' !important;}',
        '[data-composer-input]{border:0 !important;background:transparent !important;box-shadow:none !important;}',
        '[data-composer-placeholder]{color:' + ORE_TEXT3 + ' !important;}',
        'input::placeholder,textarea::placeholder{color:' + ORE_TEXT3 + ' !important;}',

        // ── 滚动条：Ore UI 是细窄的实心方块，没有渐变和圆角 ──────────
        '::-webkit-scrollbar{width:10px !important;height:10px !important;}',
        '::-webkit-scrollbar-track{background:' + ORE_CANVAS + ' !important;border-radius:0 !important;}',
        '::-webkit-scrollbar-corner{background:' + ORE_CANVAS + ' !important;}',
        '::-webkit-scrollbar-thumb{background-color:' + ORE_SURFACE + ' !important;background-image:none !important;'
          + 'border:1px solid ' + ORE_LINE_DK + ' !important;border-radius:0 !important;}',
        '::-webkit-scrollbar-thumb:hover{background-color:' + ORE_LINE + ' !important;}',
        'html{scrollbar-color:' + ORE_SURFACE + ' ' + ORE_CANVAS + ';scrollbar-width:thin;}',
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