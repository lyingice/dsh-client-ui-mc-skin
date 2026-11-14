## Summary

请说明这个 PR 改了什么，以及为什么需要它。

## Verification

- [ ] `npm run build`
- [ ] `git diff --exit-code -- lib` 通过
- [ ] `npm pack --dry-run` 通过
- [ ] 已补做真实 DSH 界面回归（如涉及主题/字体）
- [ ] 如修改选择器，已运行 `npm run verify:selectors`

## Compatibility

是否影响 Host 半边、字体路由或持久化设置？是否需要重启 `dsh web`？

## Notes

不要提交 `node_modules/`、`*.tgz`、个人 profile 或未确认授权的素材。
