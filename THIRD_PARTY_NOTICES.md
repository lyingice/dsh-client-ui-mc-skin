# Third-party notices

本仓库的 MIT License 覆盖项目作者提供的 JavaScript 源码、构建脚本和文档。以下素材/名称不包含在 MIT 授权范围内，其权利归各自提供者或原作者。

## Minecraft assets and trademarks

- `assets/*.png` 是主题使用的界面素材，由项目提供者提供，**不包含在 MIT 授权内**。
- Minecraft 是 Mojang Studios / Microsoft 的商标。本项目是独立的、非官方的社区主题，与 Mojang Studios、Microsoft 或 Minecraft 官方无隶属、赞助或背书关系。
- 本仓库不包含 Minecraft 游戏本体、官方客户端代码或官方客户端资源。

## MinecraftAE-Pixel font

- `assets/MinecraftAE-Pixel.ttf` 是主题可选的像素字体，**不包含在 MIT 授权内**；字体版权归原作者所有。
- 本仓库仅负责按 Host 路由提供字体文件，不声明拥有字体的再分发权。若要在其他项目或商业场景中再分发该字体，请先向原作者/提供者确认授权。
- 如果不希望携带字体，可以删除该文件；主题仍可运行，字体开关会提示加载失败，界面回退到系统字体。

## DeepSeek Harness

DeepSeek Harness 及其客户端 UI 是独立项目，其名称、接口、CSS token 与代码权利归其作者/维护者所有。本项目是第三方主题插件，不包含 DSH 运行时，也不代表 DSH 官方。

## Dependencies

`package.json` 当前没有运行期 npm 依赖；Host 半边使用的 `@deepseek-ai/dsh-client-ui-*` 模块由 DSH 宿主提供，不随本仓库打包。若未来加入第三方依赖，应在此处补充来源与许可证。
