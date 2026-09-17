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
 * 持久化命名空间。必须匹配 Host 的 /^[a-z][a-z0-9-]*$/。
 * 客户端半边 src/client.js 里有一份同名常量，改一处要改两处。
 */
const SETTINGS_NAMESPACE = 'ui-mc-skin'

/** 两个开关的字段名。与 src/client.js 的 SETTINGS_FIELD_* 一一对应。 */
const FIELD_THEME = 'themeEnabled'
const FIELD_FONT = 'pixelFontEnabled'

/**
 * 开关的持久化 schema —— 不依赖 @deepseek-ai/schemastery。
 *
 * 为什么不 import schemastery：本包常以 `link:` 装进 profile，
 * 而 Node 解析软链时用的是**真实路径**（D:\...\dsh-client-ui-mc-skin），
 * 从那里向上走只能到工作区的 node_modules，够不到 dsh 自带的依赖树。
 * web profile 恰好把 schemastery 摊在 node_modules/@deepseek-ai/ 下所以能解析，
 * 但桌面端（tauri profile）的 @deepseek-ai/ 是空的、依赖全在它自带的 dsh 树里，
 * 于是 import 直接 ERR_MODULE_NOT_FOUND，整个 Host 半边加载失败
 * ——字体路由和设置命名空间一起没了。
 *
 * 所以这里不引入依赖，直接实现 dsh-settings 真正用到的那两部分契约。
 * 它对 schema 的用法（dsh-settings/lib/index.js）只有两处：
 *
 *   1. resolve() 里：  const value = schema(mergeLayers(base, section))
 *      —— 把「composition base + 用户层」合并后的对象喂进来，拿回补过默认值的对象。
 *   2. describe() 里： registration.schema.toJSON()
 *      —— 给配置界面看的 JSON Schema 描述。
 *
 * 于是只要「可调用 + 有 toJSON」就够，不需要完整的 schemastery。
 */
const SCHEMA_DEFAULTS = { [FIELD_THEME]: true, [FIELD_FONT]: true }

const SCHEMA_FIELDS = [
  { key: FIELD_THEME, title: 'MC 主题' },
  { key: FIELD_FONT, title: 'MC 像素字体' },
]

/**
 * 把一层原始值收敛成一个开关：只认布尔，其它一律回落到默认值。
 * 设置文档可能被人手工编辑成杂物，这里不做类型强转、也不抛错 ——
 * 一个坏字段不应该让整个命名空间解析失败（那会让插件加载不出来）。
 */
function readFlag(raw, fallback) {
  return typeof raw === 'boolean' ? raw : fallback
}

/**
 * 见上方说明：一个「可调用 + 可序列化」的最小 schema。
 *
 * 调用结果总是补齐两个字段的完整对象，所以客户端读到的永远是布尔，
 * 不会出现 undefined（那种情况客户端会当成"没有偏好"而用内置默认）。
 */
const SettingsSchema = Object.assign(
  function resolveSettings(section) {
    const source = (section !== null && typeof section === 'object') ? section : {}
    const out = {}
    for (const { key } of SCHEMA_FIELDS) {
      out[key] = readFlag(source[key], SCHEMA_DEFAULTS[key])
    }
    return out
  },
  {
    /** 配置界面用的 JSON Schema 描述。形状对齐 dsh-settings 的 describe()。 */
    toJSON() {
      return {
        type: 'object',
        properties: Object.fromEntries(SCHEMA_FIELDS.map(({ key, title }) => [
          key,
          { type: 'boolean', default: SCHEMA_DEFAULTS[key], description: title },
        ])),
      }
    },
  },
)


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
 * 注册字体路由 + 持久化设置命名空间。
 *
 * 两件事都是"有就挂、没有就等"：webServer 可能不存在（例如在 TUI profile 里
 * 挂载本包），settings 也可能没被装配。先 `get` 再 `inject`，避免整行插件卡在
 * 等待注入上。这是 dsh-client-modules 里同一件事的写法。
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

  // 设置命名空间。schema 的键必须与客户端半边 src/client.js 里
  // SETTINGS_FIELD_THEME / SETTINGS_FIELD_FONT 完全一致，改一处要改两处。
  //
  // register() 返回的是 Host 侧的 SettingsScope；浏览器那半边不读它，
  // 而是通过 ctx.settingsScope.bind({ namespace }) 拿同一节的镜像。
  const mountSettings = (scoped) => {
    scoped.settings.register(SETTINGS_NAMESPACE, SettingsSchema, { applies: 'live' })
  }
  if (ctx.get('settings') !== undefined) mountSettings(ctx)
  else ctx.inject(['settings'], mountSettings)
}

export { apply, FONT_ROUTE, SETTINGS_NAMESPACE }

