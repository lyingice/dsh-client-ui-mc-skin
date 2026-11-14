# Contributing

感谢改进 dsh-client-ui-mc-skin。这个包是一个无运行期 npm 依赖的 DSH Web 主题插件，`lib/` 是提交进仓库的构建产物。

## 环境

- Node.js 18+
- 一份可用的 DeepSeek Harness 源码（仅 `verify:selectors` 需要）
- 一个已运行过 `dsh web` 的 profile（真实界面回归用）

## 构建

```bash
npm run build
```

构建只使用 Node 内置模块，不联网。`lib/client.js` 和 `lib/index.js` 必须与 `src/` 同步提交。

## 检查

```bash
npm run build
node --check build.mjs
node --check src/client.js
node --check src/index.js
node --check lib/client.js
node --check lib/index.js
npm pack --dry-run
```

如果本机有 deepseek-harness 源码，可额外运行：

```bash
npm run verify:selectors
```

该脚本会检查主题中的 `--dsw-*` token、CSS Module 类名和 data-* 选择器是否仍对应 DSH 源码；它需要本地 harness 路径，不适合没有该源码的 CI 环境。

## 界面回归

涉及主题、字体或 Host 路由的改动，请至少验证：

1. 桌面端首页、侧栏、会话区和设置 → 通用。
2. “MC 主题”和“MC 像素字体”开关分别开关。
3. 从旧版升级时重启 `dsh web`，确认 Host 字体路由正常。
4. `curl -I http://127.0.0.1:3080/dsh-mc-skin/font.ttf` 返回 200 和 `font/ttf`。

## 约定

- 保持无构建依赖、无运行期 npm 依赖的轻量结构。
- 修改 `src/` 后必须重新运行 `npm run build`，并提交 `lib/`。
- 不提交 `node_modules/`、`*.tgz`、临时截图、日志或个人 profile 数据。
- 不要提交未确认授权的字体或 Minecraft 素材；现有素材授权边界见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
- 贡献代码即表示同意按本项目的 MIT License 提供该贡献（第三方素材与字体除外）。
