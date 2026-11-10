# 前端面试复习站

`前端/` 下的 Markdown 用 [VitePress](https://vitepress.dev) 建成的本地静态站。

## 命令

```bash
npm install          # 首次
npm run docs:dev     # 开发模式，热更新，http://localhost:5173
npm run docs:build   # 构建静态站 → 根目录 dist/
npm run docs:preview # 预览构建产物，http://localhost:4173
npm run docs:serve   # 构建 + 预览（一条命令，推荐）
```

## 注意

**`docs:preview` 在启动时会对 `dist` 做一次文件列表快照。** 如果预览开着的时候重新构建，新产物的文件名带了新 hash，服务器不认识，会出现页面正常但 JS/CSS 资源 404 —— 表现就是**搜索点不开、主题切不了、右侧目录不显示**。

所以：**重新构建后一定要重启 preview**，或者直接用 `npm run docs:serve`。

## 目录

- `前端/`：文档本体，`01`–`09` 按复习顺序编号
- `前端/.vitepress/config.mts`：站点配置（侧边栏、搜索分词、URL 短路径映射、产物路径）
- `前端/index.md`：首页
- `前端/public/`：静态资源（favicon）
- `dist/`：构建产物，纯静态，可直接部署；每次 `docs:build` 会整体覆盖

`前端/7.Event Loop事件循环.md` 和 `前端/面试总结.md` 是历史遗留，已在配置里 `srcExclude` 排除，不进站。

## 搜索

本地搜索用 MiniSearch，`tokenize` 换成了「整段 + 相邻双字」切分，否则中文基本搜不到。改 `config.mts` 里的 `tokenize` 会直接影响搜索效果。

## 为什么不能双击 dist/index.html

构建产物里的资源是绝对路径（`/assets/app.xxx.js`），`file://` 打开时根变成磁盘根，资源 404；而且 `<script type="module">` 在 `file://` 下会被浏览器的 CORS 策略拦掉。所以**必须用 HTTP 服务打开**：

```bash
npm run docs:serve     # 或 npx serve dist
```

## 部署到 GitHub Pages

仓库里已经放了 `.github/workflows/deploy.yml`，走 GitHub Actions 自动构建+发布。

1. 建仓库并把代码推上去（`dist/` 已被 gitignore，CI 会自己构建）：

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

2. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。

3. 之后每次 push 到 `main` 会自动部署，地址是 `https://<用户名>.github.io/<仓库名>/`。

### 部署相关的三处配置

| 配置 | 值 | 原因 |
|---|---|---|
| `base` | CI 里由 `BASE_PATH` 传入 `/<仓库名>/` | 项目页部署在子路径下，资源必须带前缀 |
| `cleanUrls` | `false` | GitHub Pages 不做无扩展名重写，URL 是 `/react.html` |
| `前端/public/.nojekyll` | 空文件 | 阻止 Jekyll 处理产物 |

如果部署到 `<用户名>.github.io` 这种用户主页仓库（根路径），把 workflow 里的 `BASE_PATH` 改成 `/`。

### 手动部署（不想用 Actions）

```bash
BASE_PATH=/<仓库名>/ npm run docs:build
# 然后把 dist/ 整个推到 gh-pages 分支
```

## 本机环境备忘（推送相关）

这台机器的 GitHub 访问有两个坑，已经处理过：

1. **HTTPS 走不通**：系统代理是 TUN 模式（DNS 解析到 `198.18.0.22`），git 的 schannel 后端握手失败。本仓库已设置：
   - `http.sslBackend = openssl`
   - `http.sslCAInfo = C:\Program Files\Git\mingw64\etc\ssl\certs\ca-bundle.crt`

2. **SSH 22 端口被代理关闭**，改走 GitHub 的 443 端口。`~/.ssh/config` 里已配置：

   `
   Host github.com
     HostName ssh.github.com
     Port 443
     User git
     IdentityFile C:/Users/1/.ssh/id_rsa
     IdentitiesOnly yes
   `

   remote 用的是 SSH：`git@github.com:Silencer-1984/qianduan-note.git`

注意：生效的是 `id_rsa`，`id_ed25519` 没有加到 GitHub。
