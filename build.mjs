/**
 * 构建脚本：lib/ 是纯产物目录，两个半边都由这里生成。
 *
 *   1. src/client.js → lib/client.js：把 assets/*.png 内联成 data URL，
 *      注入 __ASSETS__ 占位符。
 *   2. src/index.js  → lib/index.js：Host 半边原样搬运，只加一条"勿手改"横幅。
 *
 * 字体（assets/MinecraftAE-Pixel.ttf）不进产物：它由 Host 半边按需发货，
 * 详见 src/index.js 的说明。
 *
 * 用法： node build.mjs
 *
 * 不需要任何依赖，也不联网。
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const assetsDir = join(here, 'assets')
const srcPath = join(here, 'src', 'client.js')
const hostSrcPath = join(here, 'src', 'index.js')
const outDir = join(here, 'lib')
const outPath = join(outDir, 'client.js')
const hostOutPath = join(outDir, 'index.js')

const assets = {}
let total = 0
for (const name of readdirSync(assetsDir).sort()) {
  if (!name.toLowerCase().endsWith('.png')) continue
  const bytes = readFileSync(join(assetsDir, name))
  total += bytes.length
  assets[name] = 'data:image/png;base64,' + bytes.toString('base64')
}

let code = readFileSync(srcPath, 'utf8')

// 占位符只在 `var ASSETS = __ASSETS__` 这一条赋值语句里；文件开头的注释虽然也
// 提到 __ASSETS__，但那只是说明文字。必须锚定整条赋值语句——否则 replace 会命中
// 注释里的第一次出现，把注释换成 JSON，却把真正的占位符留在代码里，浏览器加载时
// 就报 "__ASSETS__ is not defined"。
const ASSETS_ASSIGNMENT = 'var ASSETS = __ASSETS__'
if (code.indexOf(ASSETS_ASSIGNMENT) === -1) {
  console.error('src/client.js 里找不到 `var ASSETS = __ASSETS__` 占位符，构建中止')
  process.exit(1)
}

// 用函数形式的替换，避免素材内容里的 $ 被当成替换模式（$&、$' 等）。
code = code.replace(ASSETS_ASSIGNMENT, () => 'var ASSETS = ' + JSON.stringify(assets, null, 2))

// 替换后自检：如果占位符仍然存在，说明锚定失效或源码结构变了，直接失败而不是产出坏包。
if (code.indexOf('var ASSETS = __ASSETS__') !== -1) {
  console.error('替换失败：lib/client.js 里仍残留 `var ASSETS = __ASSETS__`，构建中止')
  process.exit(1)
}

const banner = [
  '/*!',
  ' * dsh-client-ui-mc-skin — 构建产物，请勿直接编辑。',
  ' * 源码在 src/client.js，改完跑 `node build.mjs` 重新生成。',
  ' * 素材已内联为 data URL（' + Object.keys(assets).length + ' 张，共 ' + total + ' 字节）。',
  ' */',
  '',
].join('\n')

mkdirSync(outDir, { recursive: true })
writeFileSync(outPath, banner + code, 'utf8')

// ── Host 半边：搬运 + 横幅 ──────────────────────────────────────────
// 产物路径必须是 lib/index.js：src/index.js 里用 `../assets/...` 定位字体，
// lib/ 和 src/ 同在包根下一层，所以两边解析结果一致。
const hostBanner = [
  '/*!',
  ' * dsh-client-ui-mc-skin — 构建产物，请勿直接编辑。',
  ' * 源码在 src/index.js，改完跑 `node build.mjs` 重新生成。',
  ' */',
  '',
].join('\n')
writeFileSync(hostOutPath, hostBanner + readFileSync(hostSrcPath, 'utf8'), 'utf8')

const size = readFileSync(outPath).length
console.log('已生成 lib/client.js')
console.log('  内联素材 ' + Object.keys(assets).length + ' 张 / ' + total + ' 字节')
console.log('  产物大小 ' + size + ' 字节')
console.log('已生成 lib/index.js（Host 半边，' + readFileSync(hostOutPath).length + ' 字节）')
