# 06 Vue

## Vue3 的设计目标

官方说的是四件事：**更小、更快、更好维护、更好的 TS 支持**。但它们是分层的——更小更快是手段，**更好维护才是目的**。

它们分别针对 Vue2 留下的五个硬伤：

| Vue2 的问题 | Vue3 怎么解 |
|---|---|
| Options API 把同一个功能的代码拆到 data / methods / watch 里，大组件越写越乱 | Composition API 按功能组织 |
| 逻辑复用只有 mixin，来源不明、会命名冲突 | 组合函数（composable） |
| `defineProperty` 初始化全量递归；新增/删除属性、数组下标都监听不到 | Proxy，惰性代理 |
| 虚拟 DOM 全量 diff，模板里哪些是静态的运行时看不出来 | 编译期标记：静态提升、Patch Flag |
| `this` 上挂一堆东西，类型推不出来 | 无 `this`，TS 友好 |

## 思路上的三个转变

这部分比 API 更重要——它解释了 Vue3 为什么值得升。

**一、从“运行时猜”到“编译期告诉”**

Vue2 的优化几乎都在运行时：不管模板长什么样，都先生成 vnode，再在 diff 里找差异。

Vue3 的想法是：模板是**编译器能看懂的静态结构**，那何必等到运行时？编译时就能知道“这棵树里只有 class 和这段文本会变”，于是提前打上标记，运行时只处理打了标记的部分。

这就是 Patch Flag 的本质——**把“运行时逐层猜”变成“编译期直接告诉”**。

也正因为这个，React 走不了这条路：JSX 就是普通表达式，编译器看不出“哪个 prop 是静态模板”。所以 React 只能靠运行时 `memo` 和比较来兜。

**二、从“框架替你决定”到“框架给你原语”**

Vue2 的响应式是隐式的：`data` 里写什么，框架自动劫持，用户什么都不用管，但边界也说不清（什么时候不响应、为什么）。

Vue3 把边界明确交出来：`ref` 要 `.value`、`reactive` 解构会丢响应式、`ref` 能用基本类型。这些“麻烦”其实是在说：**响应式的规则是明确的，不是黑魔法**。

Composition API 同理：不再给你 `mounted` 这种框架规定好的槽位，而是给你 `onMounted` 这样的函数，**由你决定怎么组织**。

**三、从“一个框架”到“一个内核 + 多端”**

Vue3 拆成 `runtime-core`（平台无关）/ `runtime-dom`（浏览器）/ `runtime-test`。核心逻辑跟平台解耦，自定义渲染器就能把同一套组件渲染到小程序、Native、Canvas 上。

这也是“渐进式”的延伸：从“渐进地用框架”，变成“框架本身可以渐进地用在任何平台”。

一句话总结：**Vue3 的进步，是把“框架要做的事”尽量往前挪——运行时挪到编译期，隐式挪到显式，Web 专属挪到平台无关。**

## 响应式：一个思路，两代实现

**核心就一句：读的时候收集依赖，写的时候通知更新。**

它要做两件事：把数据变成能感知读写的；谁读过这个数据就记下来，数据一变就通知这些人重新渲染。

**Vue2 用 `Object.defineProperty`**：递归遍历 data，给每个属性装 getter / setter。

- 代价：初始化时就要递归到底，数据一大就慢。
- 三个感知不到的地方：对象新增属性、删除属性、数组按下标赋值。所以才有 `$set`，也重写了数组那 7 个方法。

**Vue3 换成 Proxy**：

- 直接代理整个对象，不递归初始化，访问到才递归（惰性）。
- 新增、删除属性，数组下标修改，全都能监听到。
- 所以 `$set` 直接被删掉了。

一句话对比：**defineProperty 是给每个属性装钩子，Proxy 是换了个门卫。**

## 生命周期

Vue3 的顺序：`setup` → `onBeforeMount` → `onMounted` → `onBeforeUpdate` → `onUpdated` → `onBeforeUnmount` → `onUnmounted`。

- `beforeCreate` / `created` 被 `setup` 取代（setup 在 beforeMount 之前执行）。
- 有子组件时：父 created → 子 created → 子 mounted → 父 mounted。销毁时反过来。
- 记法：**父创子创，子挂父挂**。

## 组件通信

- 父子：`props` 往下传，`emit` 往上传（`v-model` 是这俩的语法糖）。
- 跨层级：`provide` / `inject`。
- 透传：`$attrs`，常配 `v-bind="$attrs"` 包一层。
- 全局：Pinia。Vuex 里 mutation 同步改 state、action 可异步并提交 mutation，被问到就答这个，再补一句“新项目基本都用 Pinia，它没有 mutation”。
- `$parent` / `$children` 少用，耦合太强。

## computed 与 watch

- **computed**：有缓存，依赖没变就不重算，用来算出一个值。
- **watch**：值变了就跑回调，用来做一件事（发请求、写缓存）。
- 判据：要**返回值**用 computed，要**副作用**用 watch。

## data 为什么是函数

组件实例会被复用多份，写成对象是引用共享，一份改了全改。写成函数，每次调用返回一个新对象。

## keep-alive

把组件实例缓存住，切走不销毁。就它有 `activated` / `deactivated` 两个钩子，常配 `include` / `exclude` / `max`。

## nextTick

- 改完数据 DOM 不会立刻更新。Vue 把同一个 tick 里的多次修改合并，在**微任务**里统一更新一次。
- 要读更新后的 DOM，就得 `await nextTick()`。
- 实现上优先用 `Promise.then`，不支持才降级成宏任务。

## Composition API

对比 Options API：

- 逻辑按**功能**聚在一起，不再被拆到各处。
- 复用靠组合函数，不再依赖 mixin。
- 没有 `this`，类型推导好，对 tree-shaking 也友好。

对比 React Hooks：

- `setup` **只执行一次**；React 的 hook 每次渲染都执行。
- 没有调用顺序限制，能写在条件和循环里。
- 依赖是**自动收集**的；React 要手写依赖数组。

## Vue3 的编译优化

- **静态提升**：不参与更新的节点提到 render 函数外面，只创建一次。
- **Patch Flag**：编译时就给动态节点打标记（只改了 class、只改了文本…），更新时只比动态那部分。
- **事件缓存**：内联事件不再每次重建。
- **tree-shaking**：`ref` / `computed` 这些按需引入，没用到的会被摇掉。

## reactive 与 ref

- `ref`：外面包一层 `{ value }`，基本类型也能用，模板里自动解包。
- `reactive`：只能接对象，直接访问属性，但**解构就会丢响应式**。
- 判据：单个值、或者需要整体替换时用 `ref`；一组相关的状态用 `reactive`。

## 两个常见坑

- `v-if` 和 `v-for` 别写在同一个元素上。Vue2 是 `v-for` 优先，Vue3 反过来了——`v-if` 先执行，所以拿不到 `v-for` 的循环变量。
- 模板最终会被编译成 render 函数，render 返回 vnode，再走 diff 那一套。
