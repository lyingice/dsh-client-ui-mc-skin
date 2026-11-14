# Security Policy

## Supported versions

| Version | Status |
| --- | --- |
| 1.5.x | Supported |
| < 1.5 | Not supported |

## Reporting a vulnerability

请不要在公开 issue 中粘贴漏洞细节、个人 profile 数据或可执行凭证。优先使用 GitHub 私密安全报告：

<https://github.com/lyingice/dsh-client-ui-mc-skin/security/advisories/new>

报告中请包含：

- 受影响版本与 DSH/Node 环境
- 复现步骤与影响范围
- 最小化的演示数据（不要包含真实用户 profile、字体授权文件或私密路径）
- 建议的修复方向（可选）

## Scope

这个项目是本地 DSH Web 主题插件，主要边界包括：

- 浏览器客户端主题与 Host 字体路由
- Host 设置命名空间与持久化开关
- `assets/` 下的 PNG / TTF 文件
- 与 DSH 客户端 UI 的 CSS 选择器和 token

项目没有自己的云端接口或账号系统。不要把本地 `dsh web` 无认证暴露到公网；第三方字体和素材的授权边界见 `THIRD_PARTY_NOTICES.md`。
