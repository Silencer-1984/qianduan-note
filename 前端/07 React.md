# 07 React

## 一、React设计思想

**1. 单向数据流**。数据从父往子流，子要改只能通过回调往上喊。换来的是可追踪；代价是层级深了要一层层传（于是有了 Context）。

**2. 不可变数据，整个 React 的地基**，不可变数据就是修改数据不是在原值修改而是返回新值（纯函数）。
- 可回溯（更新都创建新对象，旧对象并没有被销毁，它依然留在内存中）、
- 更简单（react都是浅比较）、
- 可并发渲染。并发渲染（Concurrent Rendering）允许渲染过程随时被打断（比如用户突然输入了文字，React 会暂停当前耗时的渲染，优先响应输入）

## 二、class 为什么复杂，hooks 为什么出现

class 组件的痛点不是“写法丑”，是结构性的：

- **`this` 到处是坑**：事件回调里 `this` 丢失要 `bind`。根源是状态和方法绑在实例上，`this` 由调用方式决定。
- **逻辑被生命周期切碎**：一个功能的订阅、拉数据、清理被拆到 `componentDidMount` / `componentDidUpdate` / `componentWillUnmount`。组件一大，`componentDidMount` 里躺着五个不相关的请求。
- **复用只能靠 HOC / render props**，一层套一层。
- **`setState` 是浅合并，不是替换**：只传变化的部分，它帮你 `Object.assign`。这是可变数据时代的残留，也是新手最容易错的地方。


## 三、 React 16 优化Fiber

### 3.1 React 15 的问题：一次算完，不能停

React 15 的协调器叫 **Stack Reconciler**，做法是**递归**遍历虚拟 DOM：

- 一进递归就同步跑到底，**不可中断**；
- 树大、更新重时可能占住主线程几百毫秒，浏览器没法画、用户输入没响应；
- 中断了也没法恢复——进度在函数调用栈里，栈一退全没了。

### 3.2 Fiber 解决什么

一句话：**把“一次算完”改成“可中断、可恢复、可排优先级的分片计算”。**

**用链表代替递归。** 每个 Fiber 节点三个指针：

- `child`：第一个子节点
- `sibling`：下一个兄弟
- `return`：父节点

为什么必须链表：递归靠函数调用栈，栈退就丢；链表只要记住“当前在哪个节点”，下次从那儿接着走。**Fiber 本质是把递归栈搬到了堆上，自己实现了一套调用栈。**(浏览器自生的调用栈改为原生实现)

**配合调度器做时间切片。**

- 渲染拆成一个个小工作单元，每跑一个检查耗时；
- 超过 **5ms** 就让出主线程，把控制权还给浏览器去画帧、响应输入；
- 浏览器空了再回来继续。

**为什么让出要用宏任务？** 微任务清空之前浏览器根本没机会渲染，只有宏任务之间它才能插进来。

**优先级怎么起作用。** 输入、点击、动画是高优先级，普通数据更新是低优先级。高优先级任务来了可以打断低优先级。被打断的那份不保存，直接重做——所以**渲染必须是纯的，重做才没有副作用**。

### 3.3 Fiber 节点长什么样

它就是个普通 JS 对象，一个字段回答一个问题：

| 字段 | 回答什么问题 |
|---|---|
| `tag` / `type` | 我是什么（div、函数组件、Fragment…） |
| `key` | 列表里我是谁 |
| `stateNode` | 我对应的真实 DOM（或类组件实例） |
| `return` / `child` / `sibling` | 我爸、我大儿子、我弟弟 |
| `pendingProps` / `memoizedProps` | 这次要用的 props / 上次用的 props |
| `memoizedState` | 我的状态；函数组件里就是 **hooks 链表** |
| `updateQueue` | 排队的更新 |
| `flags` | 这轮我要做的副作用（插入、更新、删除） |
| `alternate` | 另一棵树里我的镜像 |
| `lanes` | 我属于哪个优先级 |

和虚拟 DOM 的关系：**ReactElement（vnode）是一次性的、描述性的；Fiber 是持久的、可操作的工作单元。** vnode 每次渲染新建，Fiber 会复用，并挂上真实 DOM、状态、优先级。

### 3.4 双缓存

解决的问题很实际：**渲染到一半被打断，屏幕上那份怎么办？**

React 同时维护两棵树：

- **current 树**：屏幕上正在显示的那棵。
- **workInProgress 树**：后台正在构建的新树。

所有计算都在 workInProgress 上做，current 一个字都不动。整棵算完，commit 时把根指针一换 `root.current = workInProgress`，O(1) 切换。用户看到的是完整的新旧交替，不会看到半成品。

两棵树用 `alternate` 互相指向，下次更新旧树直接复用成新的 workInProgress——“双缓存”和显卡双缓冲一个意思。

为什么必须两棵：① render 可中断可丢弃，不能污染屏幕上的树；② commit 需要“算完的结果”一次性应用，不能边算边改；③ 切换只是换指针，不用遍历。

### 3.5 render 和 commit

- **render 阶段**：算。可中断、可重来、可并发。**必须纯**。
- **commit 阶段**：做。同步、一口气、不可中断——要直接改 DOM，绝不能让人看到改一半的页面。

commit 内部三小步：变更前（`getSnapshotBeforeUpdate`）→ 变更中（插入/删除/更新 DOM）→ 变更后（`useLayoutEffect`、`componentDidMount/Update`）。

一句话串起来：**Fiber 让“算”能停下，双缓存让“停”不伤到屏幕，commit 保证“改”一次到位。**

### 3.6 Fiber 一句话版本

> React 15 的协调是递归的，一次渲染同步跑完、不能中断，树一大就卡主线程。Fiber 把树换成链表，每个节点是一个工作单元，配合调度器切片执行，超过 5ms 就让出主线程，高优先级任务还能打断低优先级。为了保证中断时屏幕不受影响，它用 current 和 workInProgress 双缓存，算完再一次性切换。整件事分 render 和 commit 两段，render 可以停，commit 不能停。

### 3.7 并发模式（React 18）

- **`startTransition`**：把某个更新标记成**非紧急**。紧急更新（输入框里的字）先渲染，非紧急的（根据输入算出来的大列表）在后头慢慢算，被打断就重来。
  和普通 `setState` 的区别不是“同步异步”，是**优先级不同**：`setState` 是紧急更新，`startTransition` 里的更新可以被打断、被后来更紧急的更新挤掉重做。
- **`useDeferredValue`**：不控制更新，而是让某个值“晚一步生效”，适合纯展示的场景。
- **自动批处理**：React 18 起，`setTimeout`、原生事件里的多次 set 也会合并。
- **Suspense**：等数据/代码时先显示 fallback。

两个**别搞错**的点：

- `startTransition` **不是防抖**，它不省请求，只是让渲染不阻塞输入；
- 它是**渲染优先级**，不改数据，也不保证一定执行（被更高优先级打断就重做）。

### 3.8 时间切片和调度器（Scheduler）
**时间切片**解决的是“一个任务执行太久，把主线程卡死”的问题。在 React 18 中，React 把渲染工作（比如遍历 Fiber 树）切成了无数个极小的时间片段（通常是 5ms 左右）React 执行 5ms 的渲染任务后，会主动停下来，看看浏览器有没有更重要的事（比如用户点击、输入）。如果有，就把主线程让给浏览器（让出执行权）；如果没有，就继续执行下一个 5ms。
这就是“时间切片”——把长任务切成短任务，分片执行。

**调度器**（React 内部称为 Scheduler 模块）解决的是“多个任务同时来，先做哪个”的问题。
它的核心职责是优先级管理（Priority）。它内部维护了一个任务队列（Task Queue），基于小顶堆（Min-Heap）实现。当有新的更新（setState）产生时，调度器会给它分配一个优先级（比如：用户输入是 Immediate 最高优，过渡更新是 Normal 或 Low）。调度器会根据优先级，决定下一个要执行谁，以及什么时候执行。

**底层技术依赖**
时间切片和调度器都极其依赖浏览器的一个底层 API：

- MessageChannel：React 用 MessageChannel 模拟了一个宏任务（MacroTask）。因为 setTimeout 有最小 4ms 的延迟，精度太低，MessageChannel 能在当前宏任务结束后、浏览器渲染之前尽早执行，从而实现更精细的切片。

- requestIdleCallback（已弃用/降级）：早期 React 尝试用过，但因为兼容性和触发频率不稳定，最终改用了基于 MessageChannel 自己实现的时间切片。
## 四、Hooks

### 4.1 为什么不能写在 if 里

组件函数每轮渲染都会**重新执行**，状态不能存在函数里（执行完就没了），只能存在 Fiber 上。

Fiber 的 `memoizedState` 挂着一条**单向链表**，每个节点对应一个 hook。React 沿链表**按顺序**取，不认名字只认顺序。条件里少执行一个，后面全部错位——把 `useEffect` 的状态当成了 `useState` 的。

所以报错“hooks 顺序不一致”，本质是链表对不上。

### 4.2 为什么每次 render 都是新的闭包

每轮渲染都是一次新的函数执行，这次执行里的 `props`、`state`、函数**都是当次的值**。事件回调和 effect 闭包捕获的就是当次快照。

经典翻车：

```js
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000)  // count 永远是 0
  return () => clearInterval(id)
}, [])  // 依赖漏了 count
```

不是 React 有 bug，是那个闭包里的 `count` 就是第一次渲染时的那份。

### 4.3 依赖数组为什么是数组

React 用 `Object.is` **逐项比较**上一次和这一次的依赖数组。

- 长度必须一致（变化会警告）；
- 比的是**引用**，所以每次渲染新建的对象/函数放进去，等于每次都不相等；
- 函数要进依赖，就用 `useCallback` 固定引用。

依赖数组的设计本质是：**把“什么时候重跑”的控制权，用最便宜的数组比较交给使用者**。

### 4.4 hooks 分组记，别一个个背

**状态**

- `useState`：基础。
- `useReducer`：状态复杂、下一状态依赖上一状态、想集中管理更新逻辑。

**副作用**

- `useEffect`：commit 之后异步跑，不阻塞绘制。请求、订阅、日志。
- `useLayoutEffect`：commit 之后、浏览器**绘制之前**同步跑，会阻塞绘制。要读 DOM 尺寸再调整时用，否则闪一下。

**引用**

- `useRef`：能在所有渲染之间存活的盒子，**改它不触发渲染**。两个用途：存定时器/上一次的值；拿 DOM。
- `useImperativeHandle`：配 `forwardRef`，决定父组件通过 ref 能调到你哪些方法。

**性能**

- `useMemo`：缓存值。
- `useCallback`：缓存函数引用。
- `memo`：组件级，props 浅比较没变就跳过渲染。

**跨层**

- `useContext`：读 Context。

### 4.5 useMemo / useCallback 什么时候**不**需要

两条容易搞错的：

- 计算很便宜（一次简单运算）时，`useMemo` 的比较成本比计算还高，**不用**。
- `useCallback` 只在三种情况有用：传给 `memo` 子组件、作为别的 hook 的依赖、作为 `useEffect` 依赖。其他时候把它塞进依赖数组只是自找麻烦。
- 子组件没被 `memo` 包，你给它的函数怎么缓存都没意义——父组件一渲染它照样重渲染。

### 4.6 自定义 Hook 的原则

- 名字必须 `use` 开头，否则 React 不知道里面会有 hooks 规则。
- 内部只能调 hooks 和纯逻辑，不能有“隐藏的副作用”让人意外。
- 一个 hook 只干一件事，返回元组（像 `useState`）或对象（超过两个值）。
- 别为抽象而抽象——两处代码长得像，不代表要抽 hook。

## 五、Context

**解决什么**：props 一层层往下传太痛苦（props drilling）。

**怎么用**：`createContext` 建盒子 → `<Provider value>` 放值 → 任意层级 `useContext` 读**最近**那个 Provider。

**实现思路**：Context 对象上挂当前值，Provider 渲染时更新它；`useContext` 读值并把自己登记成依赖，值一变就重渲染。

**两个坑**：

1. `value` 每次渲染新建对象 → 所有消费者全重渲染。用 `useMemo` 包，或拆成多个 Context。
2. Context 一变是**全量**重渲染，它没有“只更新用到某字段的组件”的能力。

**适用边界**：低频变化的东西（主题、语言、当前用户、依赖注入）用它很合适；高频变化的（输入框、鼠标位置）别塞 Context。

## 六、组件之间怎么通信

- **父 → 子**：`props`。
- **子 → 父**：父传回调，子调用。
- **兄弟**：状态提升到共同父级。
- **跨层级**：Context。
- **父要调子的方法**：`forwardRef` + `useImperativeHandle`（触发子组件的 `focus()`、`reset()`）。
- **全局/服务端**：状态库、React Query。
- **跨窗口/非 React**：`postMessage`、自定义事件。

选型一句话：**能用 props 就别上 Context，能用 Context 就别上全局库。状态放得越低越好维护。**

## 七、状态管理的三套思路

先分两类：**服务端状态**（接口数据、缓存、失效）和**客户端状态**（用户偏好、跨页共享）。前者交给 React Query / SWR，不属于状态管理库的活。

### Redux：集中式 + 单向数据流

- **思路**：一个 store 存全量状态，只能 `dispatch(action)` 改，reducer 是纯函数 `(state, action) => newState`，每次返回新对象。
- **机制**：dispatch → reducer → 新 state → 遍历订阅者通知；中间件（thunk / saga）挂异步；状态快照可回溯，所以有时间旅行。
- **实现**：store 内部是发布订阅；`react-redux` 用 Context 把 store 传下去，`useSelector` 订阅并做相等比较，决定要不要重渲染。
- **代价**：样板多；异步要中间件；每个组件得自己用 selector 控重渲染，不然全量刷新。

### MobX：响应式 + 可观察对象

- **思路**：状态是 observable，读的时候自动收集依赖，改了自动通知。不用 dispatch，直接改。
- **机制**：`observable` 包装状态（现在基于 Proxy），`computed` 做派生，`reaction` / `autorun` 在依赖变化时执行。
- **优势**：细粒度、写法最自然、样板最少。
- **代价**：隐式魔法，改状态的地方不统一、不好追溯；和 React 的不可变模型相左——它鼓励可变。

### zustand：外部 store + 选择器订阅

- **思路**：store 就是一个普通对象加发布订阅，`create` 直接返回一个 hook。
- **机制**：`set` 合并状态并通知 listener；组件用 selector 只取自己关心的那片，`Object.is` 比较，没变就不重渲染。
- **优势**：不需要 Provider、能在组件外 `getState()`、订阅粒度自己控、体积小。
- **代价**：全靠约定，大团队要额外立规范。

### Jotai：原子化，自下而上

- **思路**：状态拆成一堆 atom，组件读哪个就订阅哪个；派生 atom 自动挂到上游。
- **机制**：atom 依赖图 + 内部 store，读时收集依赖，写时只通知受影响的下游。
- **和 zustand 的区别**：zustand 是“一个 store + 选择器”，Jotai 是“很多小 store 自己组合”，粒度更细。



## 八、setState / useState 之后发生了什么

### class（react15）：`this.setState(obj)`

1. 先把参数**浅合并**进待处理状态（`Object.assign` 语义，不是替换）。
2. 生成一个 update 排进队列，标上优先级（lane）。
3. 调度：同一轮里的多次更新合并成一次渲染（合成事件、生命周期内）。
4. render 阶段重新执行组件，reconcile 出新的 workInProgress。
5. commit 阶段把差异写到 DOM。
6. `setState(updater, callback)` 的 callback 在 commit **之后**执行。

这就是“setState 之后拿不到新值”的根源：它没有立刻改 `this.state`，只是排了队。

### 函数组件：`dispatch`

1. `dispatch(action)` 生成一个 update 对象，塞进这个 hook 的 `queue`（环形链表）。
2. 调 `scheduleUpdateOnFiber`，用 lane 标优先级，交给调度器。
3. render 阶段按 hook 链表顺序走，遇到这个 hook 就把 queue 里的 update 依次 reduce 出新的 state；新值和旧值 `Object.is` 相等时可能跳过渲染（bailout）。
4. commit 之后执行 effect。

**状态存在哪**：`fiber.memoizedState` 是 hook 链表，`useState` 那个节点上存当前值和更新队列。

### 三个高频追问

- **setCount(count + 1)连写三次只加 1**：三次读到的都是同一份快照，用函数式更新：setCount(c => c + 1)累加。
- **为什么 `ref` 立刻能拿到新值**：useRef 是挂在 Fiber 节点（Hook 链表）上的一个对象，它的修改不触发渲染，但它的值会作为渲染结果的一部分被读取。。
- **为什么 `useState(fn)` 的 fn 只跑一次**：初值惰性求值，后续渲染直接忽略。


## 九、性能优化

### 9.1 常见手段，按“拦得住 / 算得快 / 不阻塞”分三类

**拦掉不必要的渲染**

- `React.memo`：props 没变就跳过这个组件。
- 稳定 props：回调用 `useCallback`、对象/数组用 `useMemo`，别在 JSX 里内联新建。
- 状态下放：谁用谁持有，别都塞顶层。
- 拆组件：让频繁变化的部分单独成一个组件，别带着整块一起渲染。
- `children` 稳定：把不变的子树作为 `props.children` 传进去。
- 拆分 Context、减小 Provider value 的变动范围。

**降低单次渲染成本**

- 昂贵计算用 `useMemo` 缓存，或者干脆提出渲染过程（提前算好、用 `useRef` 存住）。
- 长列表虚拟化：`react-window`、`@tanstack/react-virtual`。
- 别在 render 里做大对象创建、数组 map 大集合、正则构造。

**别阻塞输入**

- `startTransition` / `useDeferredValue`：把“因为输入而重算的大列表”降成非紧急，输入框先响应。

**加载层面**

- `React.lazy` + `Suspense` 做代码分割，路由级拆分。

### 9.2 React.memo 的作用，第二个参数怎么用

**作用**：包一层，props **浅比较**相等就跳过本次渲染，直接复用上次结果。它是高阶组件，不是 hook。

三个边界要知道：

- 只比 props；它自己的 state、用到的 context 变了照样渲染。
- 浅比较比的是**引用**，父组件每次新建对象/函数，`memo` 直接失效。
- 它是“跳过渲染”，不是“阻止更新”——数据该变还是会变。

**第二个参数**：`React.memo(Comp, arePropsEqual)`，签名 `(prevProps, nextProps) => boolean`。

- 返回 `true` = **认为相等 = 跳过渲染**。
- 返回 `false` = 不相等 = 重新渲染。

**这里有个高频坑**：它的语义和 `shouldComponentUpdate` **正好相反**。`shouldComponentUpdate` 返回 `true` 是要更新，`arePropsEqual` 返回 `true` 是不更新。

典型用法：只关心某个字段，比如 `(prev, next) => prev.id === next.id`。但要注意，漏比了该比的字段就会“不刷新”，而且自定义比较里做深比较，等于把成本从渲染挪到了比较，往往更亏。

### 9.3 memo / useMemo / useCallback 怎么配合

分工一句话：

- `React.memo` 是**闸门**，挡在组件入口。
- `useMemo` / `useCallback` 是**让闸门能关上的锁**——它们的作用一大半是把 props 的引用固定住。

为什么必须配合：父组件每次渲染，内联的函数和对象都是**新引用**，`memo` 一比较就判定“变了”，子组件照渲染。所以链路是：

```
父组件 useCallback 稳定回调 → 子组件 memo 比较通过 → 子组件跳过渲染
```

反过来，子组件没包 `memo`，父组件怎么 `useCallback` 都没用；`useMemo` 缓存的是便宜计算，也是白做。

### 9.4 父组件更新时，怎么让子组件不跟着渲染

按性价比从高到低：

1. **状态下放**：把 state 移到真正需要它的子组件里。父组件不重新渲染，子组件自然不会跟着渲染——这是最根本的解法。
2. **`React.memo` + 稳定 props**：给子组件包 `memo`，父组件用 `useCallback` / `useMemo` 稳住传下去的引用。
3. **`children` 组合**：`<Layout><Expensive /></Layout>` 里，`Expensive` 的元素对象是父组件外面创建的，父组件重渲染时这个引用没变，React 会直接跳过这棵子树。
4. **拆 Context**：Provider 的 value 一变，所有消费者都重渲染。把“数据”和“更新函数”拆成两个 Context，value 用 `useMemo` 包住。
5. **别把大对象塞进依赖**：依赖数组里放每次新建的对象，等于每次都不相等。

### 9.5 什么时候**不该**用 useMemo / useCallback

- **计算很便宜**：一次加法、一次简单拼接，依赖比较加闭包捕获的成本可能比计算本身还高。
- **子组件没有 `memo`**：缓存函数没有接收方，纯属噪音。
- **不是 hook 依赖、也不往下传**：缓存它没有受益方。
- **依赖本身就是每次新建的**：`useMemo(fn, [obj])` 里 `obj` 每轮都是新的，缓存永远失效。
- **为了“看起来优化”**：多一层记忆化就多一层依赖数组要维护，依赖写错反而出 bug。React Compiler 之后，这类记忆化大部分可以交给编译器。

### 9.6 重复渲染一定慢吗？怎么判断一次渲染昂贵

**不一定。** 渲染 ≠ DOM 操作：

- render 阶段只是**执行函数 + diff**，是纯 JS，通常很快。
- 贵的是 commit 阶段真去改 DOM、触发布局和重绘，以及 render 里的大计算。

判断方法：

- **Profiler 看 `actualDuration`**：这个组件自己这次渲染花了多久，`baseDuration` 是完全不优化时的估算值。
- **看调用栈/火焰图**：是卡在 JS 计算、还是卡在布局重排。
- **看数据规模**：列表几千条、每次渲染都要 map/sort/深比较、正则、`JSON.parse`，这才叫贵。
- **看是否强制同步布局**：render 里读 `offsetHeight`、`getBoundingClientRect`，会触发浏览器立刻算布局。

结论：小组件、无副作用的重渲染，基本不用管；大列表、重计算、高频输入场景才值得动手。

### 9.7 状态放得太高会有什么问题

- **影响面变大**：state 在谁身上，`setState` 就会让谁和它整棵子树重新渲染。放得越高，重渲染的树越大。
- **兄弟组件被连坐**：只用一个字段的兄弟组件也跟着渲染。
- **逼出“全局心魔”**：什么都往顶层塞，最后变成“任何一次输入都全页刷新”。
- **优化只能靠补救**：于是到处 `memo`、`useCallback`，代码越来越难维护。

解法就是“就近”：状态放在真正需要它的最近公共父级；再往上是 Context，再往上才是全局库。**能用 props 就别上 Context，能用 Context 就别上全局库。**

### 9.8 渲染性能指标，长任务怎么观测

**React 侧**

- `<Profiler>` 的 `onRender`：拿到 `phase`（mount/update）、`actualDuration`、`baseDuration`、`startTime`、`commitTime`。
- React DevTools Profiler：按 commit 看耗时排行，打开 “Record why each component rendered” 能看到渲染原因。
- `performance.mark` / `measure` 手动包住关键组件，测单次渲染时长。

**浏览器侧**

- **INP**（交互到下一次绘制）：现在最该看的交互指标，替代了 FID。
- **长任务**：超过 **50ms** 的任务就是 long task，会卡住输入响应。用 `PerformanceObserver` 监听 `longtask`、`event`、`element` 这些 entry。
- **TBT**（总阻塞时间）：长任务累加，衡量“页面多久不可交互”。
- 火焰图看主线程：JS 执行、样式计算、布局、绘制各占多少。

**关联起来看**：INP 差 → 找长任务 → 看是不是某个组件的大渲染或同步计算 → 用 Profiler 定位到组件 → 再决定用 memo、下放状态还是虚拟列表。

### 9.9 防止函数被重复调用

三个场景，三种解法：

- **重渲染导致的重复执行**：`useCallback` 固定函数引用 + 子组件 `memo`；`useMemo` 缓存计算结果。
- **用户高频触发**：防抖节流。React 里必须用 `useRef` 把函数存住，否则每次渲染都新建一个 debounce 实例，防抖直接失效。
- **副作用重复执行**：`useEffect` 配对依赖，在清理函数里取消请求、清定时器，避免旧请求回来覆盖新结果。

```js
const debouncedSearch = useRef(debounce(fetchData, 500)).current
useEffect(() => () => debouncedSearch.cancel(), [])
```



## 十、React 18 与 React 19

### React 18

- **并发根**：`createRoot` 取代 `ReactDOM.render`，渲染从“一次跑完”变成可中断的并发模式，默认开启。
- **自动批处理**：`setTimeout`、原生事件、`Promise.then` 里的多次 set 也合并；以前只在合成事件和生命周期里合并。
- **`useTransition` / `startTransition`**：标记非紧急更新，可被打断重做。
- **`useDeferredValue`**：让某个值晚一步生效，纯展示场景用。
- **`useSyncExternalStore`**：外部 store（Redux、zustand）的官方适配钩子，解决并发下的撕裂（tearing）。
- **`useId`**：SSR 与客户端生成一致的 id，给表单 label、aria 用。
- **流式 SSR**：`renderToPipeableStream`，服务端边渲染边输出。
- **StrictMode 双调用**：开发环境故意执行两次，暴露副作用问题。

### React 19

- **Actions**：表单的 `action` 可以直接给一个异步函数，React 自动管提交中、错误、乐观更新，不用再手写 `useEffect` + loading 状态。
- **`useActionState`**：返回 `[state, formAction, isPending]`，一个 hook 顶掉“结果 / 报错 / 提交中”三套状态。
- **`useFormStatus`**：子组件直接读父表单的提交状态，不用层层传 props。
- **`useOptimistic`**：先乐观显示，失败回滚。
- **`use()`**：读 Promise 或 Context，可以写在条件和循环里——因为它是“读”而不是“注册”，不受 hooks 顺序约束。
- **ref 直接当 prop**：函数组件不再必须 `forwardRef`。
- **RSC 进内核**：Server Components 正式成为 React 的一部分，组件在服务端执行，客户端只收序列化结果。
- **文档元数据**：`<title>`、`<meta>` 可以直接写在组件里。
- **移除的旧 API**：函数组件的 `defaultProps`、字符串 ref、`ReactDOM.render`。

### 一句话对比

**18 解决“渲染能不能被打断”，19 解决“数据变了之后那堆样板代码能不能不写”。**

