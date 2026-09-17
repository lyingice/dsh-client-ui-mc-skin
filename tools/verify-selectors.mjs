/**
 * 把 dsh-client-ui-mc-skin 里靠猜的选择器，逐个拿去 DSH 真实源码里核对。
 *
 * 核对的是两件互相独立的事：
 *   A. 每个 `[class*="_xxx"]` 的 `_xxx`，在源码里是否真的是一个会被渲染的
 *      CSS Module 类。机制：源码写 `.sidebarCol`，构建后局部名是
 *      `_sidebarCol_<hash>`，TSX 通过 `className={css.sidebarCol}` 引用；
 *      所以 `[class*="_rowCard"]` 要能命中，`rowCard` 必须既是真实类定义、
 *      又真的被组件引用。只在注释或无关字符串里出现不算。
 *   B. 每个被覆盖的 `--dsw-*` token 是否真实存在。权威来源是
 *      ui-theme/src/styles/design-platform.css（浅色在 body、深色在
 *      body[data-ds-dark-theme]，两套）。
 *
 * 用法：
 *   node tools/verify-selectors.mjs [harness 源码路径]
 *
 * harness 路径默认在同级目录找 deepseek-harness-master，也可用第一个参数
 * 或 DSH_HARNESS_SRC 指定。找不到源码就直接报错退出（不会假装通过）。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = resolve(HERE, '..')

const CANDIDATES = [
  process.argv[2],
  process.env.DSH_HARNESS_SRC,
  resolve(PKG, '..', 'deepseek-harness-master'),
  resolve(PKG, '..', '..', 'deepseek-harness-master'),
].filter(Boolean)

const HARNESS = CANDIDATES.find((p) => existsSync(join(p, 'packages', 'client')))
if (HARNESS === undefined) {
  console.error('找不到 deepseek-harness 源码（需要其中含 packages/client）。试过：')
  for (const c of CANDIDATES) console.error('  - ' + c)
  console.error('')
  console.error('请传入路径：node tools/verify-selectors.mjs <deepseek-harness-master>')
  process.exit(2)
}

const CLIENT = join(HARNESS, 'packages/client')
const SRC = join(PKG, 'src/client.js')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'lib' || name === 'tests') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(module\.css|tsx)$/.test(name)) out.push(p)
  }
  return out
}
const files = walk(CLIENT)

// 真实的 CSS 类定义：`.name {` / `.name,` / `.name:hover` / `.name::before`
const cssClasses = new Set()
// TSX 里 className 用到的模块成员：css.name / styles.name
const usedClasses = new Set()
const dataAttrs = new Set()
const probeAttrs = new Set()
const tokens = new Set()

for (const f of files) {
  const text = readFileSync(f, 'utf8')
  if (f.endsWith('.module.css')) {
    for (const m of text.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) cssClasses.add(m[1])
  } else {
    // 点访问：css.foo
    for (const m of text.matchAll(/(?:css|styles)\.([_a-zA-Z][\w-]*)/g)) usedClasses.add(m[1])
    // 下标访问：styles['foo'] —— ModelsSection 用的就是这种，漏掉会把
    // rowCard 这种真实存在的类误判成死规则。
    for (const m of text.matchAll(/(?:css|styles)\[['"]([_a-zA-Z][\w-]*)['"]\]/g)) usedClasses.add(m[1])
  }
  // data-* 在源码里有四种落法，缺一种就会误报「DEAD」：
  //   1. JSX 属性：data-foo={x} / data-foo="x"
  //   2. JSX 简写布尔：单独一个 data-foo
  //   3. 字符串字面量：'data-foo'（多为测试里的 querySelector）
  //   4. CSS 里的 :global(body[data-foo]) —— ui-theme 与若干 module.css 用它
  //      切深浅色，只扫 .tsx 会漏掉，所以这里连 CSS 一起扫。
  for (const m of text.matchAll(/(?:^|[\s{[(])(data-[\w-]+)/gm)) dataAttrs.add(m[1])
  for (const m of text.matchAll(/(--ds[\w-]*)\s*:/g)) tokens.add(m[1])
}

// 设计 token 的权威来源是 ui-theme/src/styles/design-platform.css：
// --dsw-alias-* / --dsw-specific-* 都在这里按 body（浅色）和
// body[data-ds-dark-theme]（深色）两套定义。只扫「谁引用了它」会得出
// 全部 MISS 的错误结论，所以单独读这个文件。
const PLATFORM_CSS = join(CLIENT, 'ui-theme/src/styles/design-platform.css')
const definedTokens = new Set()
for (const m of readFileSync(PLATFORM_CSS, 'utf8').matchAll(/^\s*(--dsw-[\w-]+)\s*:/gm)) {
  definedTokens.add(m[1])
}

// 真正会被渲染出来的类名 = CSS 里定义了 + TSX 里被引用
const live = new Set([...cssClasses].filter((c) => usedClasses.has(c)))

const theme = readFileSync(SRC, 'utf8')
const substrSelectors = new Set()
for (const m of theme.matchAll(/\[class\*=["']([^"']+)["']\]/g)) substrSelectors.add(m[1])
const themeTokens = new Set()
for (const m of theme.matchAll(/'(--ds[\w-]+)'\s*:/g)) themeTokens.add(m[1])
const themeDataAttrs = new Set()
for (const m of theme.matchAll(/\[(data-[\w-]+)\]/g)) themeDataAttrs.add(m[1])

const line = (s) => console.log(s)
const head = (s) => { line(''); line('='.repeat(74)); line(s); line('='.repeat(74)) }

head('A. [class*="..."] 是否命中真实渲染出来的类名')
line(`  真实类定义 ${cssClasses.size} 个，其中被 TSX 引用 ${live.size} 个`)
line('')
const dead = []
for (const sel of [...substrSelectors].sort()) {
  // 编译后是 `_name_hash`，所以 sel="_rowCard" 要匹配 live 里的 "rowCard"
  const bare = sel.replace(/^_/, '')
  const hit = live.has(bare)
  if (!hit) dead.push(sel)
  line(`  ${hit ? ' OK ' : 'DEAD'}  [class*="${sel}"]`)
}
line('')
line(`  合计 ${substrSelectors.size} 条 → 命中 ${substrSelectors.size - dead.length}，死规则 ${dead.length}`)
line('')
line('  ── 死规则清单（当前完全不起作用）──')
for (const d of dead) line('    ' + d)

head('B. 主题覆盖的 --dsw-* token 是否真实存在（权威源 design-platform.css）')
line(`  design-platform.css 定义的 --dsw-* token：${definedTokens.size} 个`)
line('')
const bad = []
for (const t of [...themeTokens].sort()) {
  const hit = definedTokens.has(t)
  if (!hit) bad.push(t)
  line(`  ${hit ? ' OK ' : 'MISS'}  ${t}`)
}
line('')
line(`  合计 ${themeTokens.size} → 存在 ${themeTokens.size - bad.length}，查无此 token ${bad.length}`)
for (const b of bad) line('    - ' + b)

head('C. data-* 选择器')
for (const d of [...themeDataAttrs].sort()) {
  const hit = dataAttrs.has(d) || probeAttrs.has(d)
  line(`  ${hit ? ' OK ' : 'DEAD'}  [${d}]`)
}

head('D. 主题没覆盖的真实 --dsw-* token（按前缀分组计数）')
const uncovered = [...definedTokens].filter((t) => !themeTokens.has(t))
const groups = {}
for (const t of uncovered) {
  const k = t.split('-').slice(0, 3).join('-')
  groups[k] = (groups[k] || 0) + 1
}
for (const [k, v] of Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 25)) {
  line(`  ${String(v).padStart(3)}  ${k}`)
}
line('')
line(`  未覆盖合计 ${uncovered.length} / 共 ${definedTokens.size}`)

// ── 退出码：当成门禁用 ────────────────────────────────────────────────
// A 段的 dead 里可能混进注释文字（源码注释里提到已删的类名），所以不拿
// dead.length 直接当失败条件，而是只统计**真正出现在选择器里**的。
// 做法：把源码里的注释剥掉再扫一遍。
const noComment = readFileSync(SRC, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')

const liveDead = []
for (const sel of dead) {
  // 该选择器名字是否还出现在（去掉注释的）源码里
  if (new RegExp('class\\*=["\']' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']').test(noComment)) {
    liveDead.push(sel)
  }
}

head('结论')
line(`  死规则（真实存在于选择器中）：${liveDead.length}`)
for (const d of liveDead) line('    - ' + d)
line(`  查无此 token：${bad.length}`)
for (const b of bad) line('    - ' + b)
line('')
if (liveDead.length === 0 && bad.length === 0) {
  line('  ✓ 全部选择器与 token 均对应真实存在的实现。')
  process.exit(0)
} else {
  line('  ✗ 存在失效的选择器或 token，见上。')
  process.exit(1)
}
