# 全栈面试知识库

用 [VitePress](https://vitepress.dev) 建成的静态站，按 **前端 / 后端 / 大模型** 三个领域归档面试知识，部署在 GitHub Pages：<https://silencer-1984.github.io/qianduan-note/>

> 仓库名仍是 `qianduan-note`（历史遗留），但站点内容已是全栈三分类。**不要改仓库名**，否则 Pages 地址和所有旧链接都会失效。

## 命令

```bash
npm install          # 首次
npm run docs:dev     # 开发模式，热更新，http://localhost:5173
npm run docs:build   # 构建静态站 → 根目录 dist/
npm run docs:preview # 预览构建产物，http://localhost:4173
npm run docs:serve   # 构建 + 预览（一条命令，推荐）
```

源目录是**项目根**（`vitepress build .`），不是 `前端/`。

## 目录结构

```
面试准备/
├── .vitepress/
│   ├── config.mts          # 站点配置（base、cleanUrls、srcExclude、搜索分词）
│   └── chapters.mjs        # 多分类章节生成器（单一数据源）
├── index.md                # 首页：三分类目录
├── 前端/                    # 9 章，01–09
├── 后端/                    # 4 章，01–04
├── 大模型/                  # 3 章，01–03
├── public/                 # favicon.svg + .nojekyll
├── scripts/
│   └── build-knowledge.mjs # 从原始素材抽取知识本体的整理脚本（可复跑）
├── _source/                # 原始素材备份，不进站点
└── dist/                   # 构建产物，gitignore
```

`_source/` 里是两份 LLM 生成的原始题库和旧首页，保留用于追溯；`srcExclude` 已排除它、`文档转网页/`、`算法概念.md`、`README.md`、`前端/面试总结.md` 等，CI 构建不会把它们扫成页面。

## 新增章节

**不用改任何配置。** 往 `前端/`、`后端/`、`大模型/` 任一目录放入按 `NN 标题.md` 命名的文件（如 `05 状态管理.md`），push 后构建时会自动：生成短路径、加入对应领域的侧边栏分组、出现在首页目录、进入顶部导航和本地搜索索引。

- 命名规则：两位编号 + 空格 + 标题，正则 `^\d{2}\s+.+\.md$`，同目录内按编号排序。
- 短路径：前端 01–09 沿用历史短名（`js-core`、`async`、`algorithm`…），**不要改** `chapters.mjs` 里的兼容常量，否则线上旧链接失效；新增章节用 `fe-NN` / `be-NN` / `ai-NN`。
- `rewrites` / `sidebar` / `nav` / 首页目录全部由 `chapters.mjs` 生成，改分组规则只需动这一个文件。

## 内容约定

- 只留知识本体：题目、答案、代码、表格，以及 `**考察点** / **参考答案** / **追问**` 结构。
- **不写**针对个人简历的备考引导：面试官期待、必背/放弃分档、复习计划、自测清单、使用建议、回答策略。
- 原始素材由 `node scripts/build-knowledge.mjs` 抽取生成；脚本只做机械切块和标题中性化，正文不改。

## 搜索

本地搜索用 MiniSearch，`tokenize` 换成「整段 + 相邻双字」切分，否则中文基本搜不到。改 `config.mts` 里的 `tokenize` 会直接影响搜索效果。

## 为什么不能双击 dist/index.html

构建产物里的资源是绝对路径（`/qianduan-note/assets/app.xxx.js`），`file://` 打开时根变成磁盘根，资源 404；而且 `<script type="module">` 在 `file://` 下会被浏览器 CORS 策略拦掉。必须用 HTTP 服务打开（`npm run docs:serve`）。

`docs:preview` 启动时会对 `dist` 做一次文件列表快照，重新构建后必须重启 preview，否则 JS/CSS 404（搜索点不开、主题切不了、右侧目录不显示）。

## 部署到 GitHub Pages

`.github/workflows/deploy.yml` 在 push 到 `main` 时自动 `npm ci` → 构建 → `upload-pages-artifact` → `deploy-pages`。`dist/` 已 gitignore，CI 自己构建。

| 配置 | 值 | 原因 |
|---|---|---|
| `base` | CI 由 `BASE_PATH` 传入 `/${{ github.event.repository.name }}/` | 项目页在子路径下，资源必须带前缀 |
| `cleanUrls` | `false` | Pages 不做无扩展名重写，URL 是 `/be-01.html` |
| `public/.nojekyll` | 空文件 | 阻止 Jekyll 处理产物 |

手动部署（不想用 Actions）：

```bash
BASE_PATH=/qianduan-note/ npm run docs:build
# 然后把 dist/ 整个推到 gh-pages 分支
```

## 本机环境备忘（构建 / 推送）

1. **本地构建前要把 `TMP`/`TEMP` 指到工作区内目录**，否则 esbuild 删除 `%TEMP%\esbuild-*` 临时文件时报 `Access is denied`，构建卡在 `building client + server bundles`。这是本机安全软件/环境锁定系统 Temp 所致，与 WorkBuddy 沙箱、依赖版本无关；CI 的 `ubuntu-latest` 不受影响。用 PowerShell：

   ```powershell
   New-Item -ItemType Directory -Force .vitepress\cache\_wb_tmp | Out-Null
   $env:TMP  = (Resolve-Path '.vitepress\cache\_wb_tmp').Path
   $env:TEMP = $env:TMP
   $env:BASE_PATH = '/qianduan-note/'
   npm run docs:build
   ```

   `_wb_tmp` 位于已 gitignore 的 `.vitepress/cache/` 下，不会留下垃圾。`BASE_PATH` 在 Git Bash 里会被 MSYS 转换成 `C:/Program Files/Git/...`，本地验证请用 PowerShell。

2. **批量删除保护**：连续多次构建可能触发 WorkBuddy 的「一次删除达到 50 个需审批」，报错 `[safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED]`。页面产物其实已写入 `dist/`，只是退出码 1；新开一轮再构建即可。CI 无此限制。

3. **GitHub 访问**：系统代理是 TUN 模式（DNS 解析到 `198.18.0.22`），HTTPS 的 schannel 握手失败；SSH 22 也被关。本仓库已设 `http.sslBackend = openssl` + Git 自带 CA，`~/.ssh/config` 让 `github.com` 走 `ssh.github.com:443`，用 `id_rsa`（`id_ed25519` 未加到 GitHub）。remote：`git@github.com:Silencer-1984/qianduan-note.git`。

## 相关站点

另一个独立仓库 `Silencer-1984/mianshiti`（<https://silencer-1984.github.io/mianshiti/>）是**大题库刷题站**（AI Agent 151 题 / Python 201 题 / React），与本库的「体系化精编」定位互补，不合并。
