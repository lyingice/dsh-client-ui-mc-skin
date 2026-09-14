/*!
 * dsh-client-ui-mc-skin — 构建产物，请勿直接编辑。
 * 源码在 src/index.js，改完跑 `node build.mjs` 重新生成。
 */
/**
 * Host 半边：把 assets/MinecraftAE-Pixel.ttf 通过一条 HTTP 路由发给浏览器。
 *
 * 为什么字体必须走 Host 半边，而不是像 PNG 那样内联进 client.js：
 * 客户端插件只有 client.js 一个入口，没有静态资源路由；而这份字体是
 * 16 MB，base64 内联要撑成 22 MB 的脚本，每次打开界面都得先解析一遍。
 * 所以字体留在磁盘上，这里按需发货：浏览器只在真正用到该字体族时才下载，
 * 之后靠 ETag 走 304 复验，不会重复传 16 MB。
 *
 * 路由路径与客户端半边的 @font-face 是同一个常量，改一处就要改另一处：
 *   src/client.js 里的 FONT_ROUTE
 */

import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

/** 字体路由。客户端 @font-face 的 src 必须与此一致。 */
const FONT_ROUTE = '/dsh-mc-skin/font.ttf'

/**
 * 字体文件位置。lib/index.js 与 src/index.js 都在包根下一层，
 * 所以 `../assets` 两种情况都指向包根的 assets/。
 */
const FONT_PATH = fileURLToPath(new URL('../assets/MinecraftAE-Pixel.ttf', import.meta.url))

const CONTENT_TYPE = 'font/ttf'

/**
 * 已读入的字体字节，按 ETag 失效：换了字体文件就重新读一次。
 * 命中 If-None-Match 的请求根本不会走到这里，所以正常浏览不会反复读 16 MB。
 */
let cached = null

/**
 * 读字体并算出它的 ETag（大小 + mtime 就够：内容变了这两个必然变）。
 * @returns {Promise<{ bytes: Buffer, etag: string }>}
 */
async function fontEntry() {
  const info = await stat(FONT_PATH)
  const etag = '"' + info.size.toString(16) + '-' + Math.floor(info.mtimeMs).toString(16) + '"'
  if (cached !== null && cached.etag === etag) return cached
  cached = { bytes: await readFile(FONT_PATH), etag }
  return cached
}

/**
 * 一条只服务字体的 GET/HEAD 路由。
 * @param ctx - 用来记日志的上下文。
 * @returns node:http 处理器（自己负责整个响应生命周期）。
 */
function fontHandler(ctx) {
  return async function handleFont(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' })
      res.end()
      return
    }

    let entry
    try {
      entry = await fontEntry()
    } catch (error) {
      // 文件缺失不是崩溃：客户端会把开关标成"加载失败"，界面照常用后备字体。
      if (error.code !== 'ENOENT') ctx.logger.warn(error)
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('mc-skin: font not found at ' + FONT_PATH + '\n')
      return
    }

    if (req.headers['if-none-match'] === entry.etag) {
      res.writeHead(304, { etag: entry.etag, 'cache-control': 'public, max-age=0, must-revalidate' })
      res.end()
      return
    }

    res.writeHead(200, {
      'content-type': CONTENT_TYPE,
      'content-length': String(entry.bytes.byteLength),
      'cache-control': 'public, max-age=0, must-revalidate',
      etag: entry.etag,
    })
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    res.end(entry.bytes)
  }
}

/**
 * 注册字体路由。
 *
 * webServer 可能不存在（例如在 TUI profile 里挂载本包），所以先 `get` 再
 * `inject`：有就直接挂，没有就等它上线，而不是让整行插件卡在等待注入上。
 * 这是 dsh-client-modules 里同一件事的写法。
 *
 * @param ctx - 插件上下文。
 */
function apply(ctx) {
  const mount = (scoped) => {
    scoped.effect(
      () => scoped.webServer.register({ kind: 'exact', path: FONT_ROUTE, handler: fontHandler(scoped) }),
      'mc-skin: font route ' + FONT_ROUTE,
    )
  }
  if (ctx.get('webServer') !== undefined) mount(ctx)
  else ctx.inject(['webServer'], mount)
}

export { apply, FONT_ROUTE }
