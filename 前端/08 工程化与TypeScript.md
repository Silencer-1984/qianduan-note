# 08 工程化与 TypeScript

## 构建工具的演进

- **Grunt / Gulp**：任务流时代，把压缩、合并、编译当成一个个 task 串起来，管不了模块依赖。
- **Webpack**：模块打包时代，“一切皆模块”，从入口递归分析依赖、打成 bundle。代价是项目越大启动越慢。
- **Vite**：开发期不打包。借浏览器原生 ESM，按需请求源文件；第三方依赖用 esbuild 预构建。
- **现在**：用 Rust / Go 重写构建工具——Rspack（兼容 Webpack 配置）、Turbopack（Next 用）、Rolldown（未来接替 Vite 里的 Rollup）。方向都是“把 JS 里那套编译活挪到原生语言里”。

一句话串起来：**从“把活全干完再给浏览器”，变成“浏览器要什么给什么”，再到“用更快的语言干同样的活”。**

## Vite 为什么快

**冷启动**：Webpack 要从入口递归分析所有依赖、打成 bundle 才能启动，项目越大越慢。Vite 开发时完全不打包——浏览器原生支持 ESM，直接按需请求源文件。启动时只做一件事：用 **esbuild**（Go 写的，极快）把 `node_modules` 里的依赖预构建成 ESM，合并成少量文件。所以业务代码改多少都不影响冷启动速度。

**HMR**：Vite 通过 WebSocket 和浏览器保持连接。文件一变，服务端算清楚哪个模块失效了，推给浏览器，浏览器**只重新请求那一个模块**并热替换，不用刷新页面，也不用重新打包其他模块。Webpack 的 HMR 需要沿着依赖图重新构建受影响的 chunk，模块越多越慢。

## 生产环境为什么还要打包

三个原因：

1. 几百个模块就是几百个 HTTP 请求，网络开销扛不住。
2. 要做 tree shaking、代码分割、压缩混淆、指纹缓存——这些都得静态分析完才能干。
3. 兼容性：老浏览器不一定支持 ESM（这条现在弱了，`build.target` 能降级，但仍算一个理由）。

所以 Vite 的定位很清晰：**开发期靠浏览器，生产期靠 Rollup**。

## 打包产物怎么变小

跟用哪个工具无关，就两件事：

- **Tree shaking**：删掉没被引用的代码。生效前提要说全——必须是 ESM（静态可分析）、生产模式的压缩阶段、包里 `sideEffects: false`、被删的模块不能有副作用。
- **Code splitting**：用动态 `import()` 拆包，按路由或按功能拆，减小首屏体积。

## Vite 现在常被问的点

- **环境变量**用 `import.meta.env`，不是 `process.env`；只有 `VITE_` 前缀的才会暴露给客户端。
- **依赖预构建**：`node_modules` 里的包是 CJS 或碎成一堆小文件，Vite 用 esbuild 预打包成 ESM，缓存放在 `node_modules/.vite`。
- **代理**：`server.proxy` 解决开发跨域，本质是 dev server 转发。
- **SSR**：`vite build --ssr` 出服务端产物，页面首屏由服务端吐出。

## 微前端

### 什么时候值得上

判断三条：**多团队要独立发布**、**技术栈异构或要渐进迁移**、**单体已经到维护瓶颈**。

代价同样明确：复杂度上升（构建、路由、通信、调试都要额外设计）、性能开销（多份运行时）、体验一致性难保证。一个团队维护的小项目上微前端，是纯负收益。

### 为什么选 qiankun

- **HTML Entry**：子应用不用改构建产物结构，直接把入口 HTML 接进来，接入成本最低。
- **沙箱成熟**：JS 隔离和 CSS 隔离都有现成方案。
- **生命周期规范**：`bootstrap` / `mount` / `unmount`，边界清晰。
- 对比：iframe 隔离最彻底，但路由、弹窗、通信都难；Module Federation 能共享模块，但构建期强耦合，适合同技术栈；single-spa 更底层，沙箱和加载都要自己做。

### JS 沙箱

- **SnapshotSandbox**（1.x，单实例）：激活时记录 window 上的属性快照，卸载时还原。简单，但只支持单实例。
- **LegacySandbox**（2.x，单实例）：用 Proxy 记录对 window 的增删改，卸载时回滚。共享真 window，隔离性一般。
- **ProxySandbox**（2.x，多实例）：给每个子应用一个 `fakeWindow`，读写都被 Proxy 拦到 fakeWindow 上，卸载直接丢弃，不污染主应用。

要清楚它的边界：隔离的是**全局变量污染**，管不了定时器泄漏、全局事件监听、以及跑到 `document.body` 上的 DOM。

### CSS 隔离

- **`strictStyleIsolation`**：Shadow DOM，真隔离。坑是挂到 `document.body` 的弹窗、Portal、全局主题变量进不去，antd 这类组件库的浮层会掉样式。
- **`experimentalStyleIsolation`**：给子应用所有选择器加 `div[data-qiankun="xxx"]` 前缀。侵入性低，但不彻底——内联样式、动态插入的 `<style>`、`@keyframes`、`body` / `html` 级选择器都可能漏。

实践上最有效的是**子应用本身别写全局样式**：用 CSS Modules、BEM 或组件库按需引入；主题用主应用统一注入 CSS 变量。注意 Tailwind 的 `preflight` 本身就是全局 reset，上微前端前要关掉或收敛，否则它也会渗透。

### 通信

- **`initGlobalState`（订阅发布）**：主应用 `setGlobalState`，子应用在 `mount` 里 `onGlobalStateChange` 注册回调，卸载时 `offGlobalStateChange`。实时、开销小；代价是每个子应用都要写一套注册和注销。
- **`props` 注入**：`mount(props)` 里传 `actions`、router、store 实例。适合一次性注入能力，不适合高频数据。
- **`CustomEvent` / 事件总线**：解耦，但要自己定事件协议，容易变成隐式依赖。
- **URL / `localStorage`**：简单，但不实时（`localStorage` 要监听 `storage` 事件才能跨标签同步），只适合低频或持久化数据。
- **共享状态库实例**：把同一个 zustand / redux store 通过 props 传下去，读写都实时。耦合最强，要求技术栈和版本一致。

选型：高频共享走全局状态，能力注入走 props，低频数据走 URL / storage。

### 落地最容易踩的坑

- **样式渗透**：主应用引入的组件库全局 reset 影响子应用。根治是“子应用不产生全局样式”，而不是靠沙箱兜。
- **切换慢**：子应用资源包大 → 开 `prefetch`（主应用空闲时预加载）、加骨架屏、公共依赖用 `externals` 共享（React / ReactDOM 由主应用或 CDN 提供，别每个子应用打一份）。
- **路由冲突**：主应用统一分配路径前缀，子应用用 `basename` 或 memory 模式。
- **公共依赖版本不一致**：会出现两份 React、hooks 报错。要么 external 统一，要么明确版本约束。
- **登录态**：主应用统一登录，token 通过 props 下发，别让每个子应用各存一份。
- **环境与接口地址**：运行时注入配置，别编译进产物，否则一套产物只能对应一个环境。
- **调试**：每个子应用要能独立启动、本地 mock 接口，否则排查问题必须连主应用。


