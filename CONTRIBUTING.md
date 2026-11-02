# 贡献指南

感谢参与改进本项目！请在提交前阅读以下约定。

## 1. 开发环境

- Node.js ≥ 18，npm ≥ 9
- Python ≥ 3.10（仅本地服务）
- 推荐 VS Code + ESLint/Prettier 插件（本项目未内置 ESLint 配置，可自行添加）

```bash
npm install
npm run dev        # 桌面开发模式
npm run dev:web    # 浏览器联调（localhost:5180）
npm run typecheck  # 提交前必须通过
```

## 2. 分支与提交

| 类型 | 命名 | 示例 |
| --- | --- | --- |
| 新功能 | `feat/<scope>` | `feat/item-export` |
| 缺陷修复 | `fix/<scope>` | `fix/titlebar-maximize` |
| 文档 | `docs/<scope>` | `docs/api-examples` |
| 重构 | `refactor/<scope>` | `refactor/api-client` |

提交信息遵循 Conventional Commits：

```
feat(overview): 支持按分类筛选
fix(titlebar): 修复最大化图标不同步
docs(api): 补充 items 删除接口示例
```

## 3. 代码规范

1. TypeScript 严格模式，禁止 `any`（确实需要时加注释说明）；
2. 组件只做展示与事件回调，网络请求统一放 `api/`；
3. 新增设计令牌必须同时更新 `styles.css :root` 与 `theme.ts`；
4. 新增接口必须同步 `docs/API.md` 与前后端类型；
5. 保持零业务术语、零真实数据、零密钥。

## 4. 提交前检查

```bash
npm run typecheck   # 必须通过
npm run build       # 建议本地验证
```

如改动主进程或打包配置，请附上 `npm run dist:win` 的构建结果说明。

## 5. PR 要求

- 标题清晰，描述包含：动机、改动点、验证方式、影响范围；
- 关联相关 Issue；
- 单 PR 聚焦一个主题，避免混合无关重构；
- 截图（UI 变更时）或接口响应示例（API 变更时）。

## 6. 不接收的内容

- `node_modules/`、`out/`、`release/`、`runtime/`、数据库文件、日志；
- 任何公司/项目专属的业务数据、Logo、协议文本；
- 与框架无关的个性化配置（`.vscode` 个人设置等）。

## 7. 行为准则

保持友好、就事论事；对事不对人；尊重不同技术选型。
