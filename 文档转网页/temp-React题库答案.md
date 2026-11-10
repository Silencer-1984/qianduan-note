# React 面试题库（答案版）

## 一、React 基础与组件模型

### 框架认知

**1. 谈谈你对 React 的理解，它的核心设计思想是什么？**
声明式 UI、组件化、单向数据流、不可变数据。核心是 `UI = f(state)`：你描述状态对应的界面，框架负责算出最小 DOM 变更；再往深一层，是 Fiber 让渲染可中断、可排优先级。

**2. React 有什么优点和缺点？**
优点：生态最大、组件化清晰、心智统一、能跨端（RN）、并发能力。缺点：默认全组件重渲染，性能要靠手动优化；抽象多、上手后要理解一层层机制；包体积比轻量库大；对极致 DOM 操作不是最优解。

**3. React 和 Vue 的设计思想有什么异同？**
相同：都是组件化 + 数据驱动 + 虚拟 DOM。不同：React 用 JS 描述 UI（JSX），不可变数据 + 手动 `setState` 触发重渲染，把优化留给运行时；Vue 用模板 + 响应式自动追踪，改了就精确更新，把优化大量挪到编译期。

**4. React、Vue、Angular 怎么选？**
React：生态和跨端最强，团队规模大、需要灵活架构时选。Vue：上手快、国内生态好，中小项目、渐进式改造合适。Angular：强规范、依赖注入、TS 一体化，适合企业级大团队长期维护。

**5. 为什么选 React，它比原生 JS 和 jQuery 解决了什么？**
解决了“状态和 DOM 手动同步”的问题。jQuery 时代是命令式地找元素、改属性，状态一多就对不上账；React 让你只描述结果，DOM 变更由 diff 自动算出来，组件还能复用和组合。

**6. React 是 MVC 还是 MVVM 框架？**
都不是。它借鉴了 MVVM 的“数据驱动视图”，但本质是**组件 + 单向数据流**：没有 ViewModel 那层双向绑定，数据只往下流，改动靠回调往上走。

**7. React 的“单向数据流”怎么理解？**
数据只能从父组件通过 props 流向子组件；子组件想改数据，只能调用父组件传下来的回调。好处是数据流向唯一、可追踪、可预测；所谓双向绑定只是“value + onChange”的语法糖。

**8. 除了 React，你还了解哪些前端框架？**
Vue（响应式 + 模板）、Angular（全家桶 + DI）、Svelte（编译期消解框架运行时）、Solid（细粒度信号）、Preact（轻量兼容层）；跨端还有 React Native、Flutter。

### JSX 与组件

**1. JSX 是什么，它如何被编译成 React Element？**
JSX 是 `React.createElement` 的语法糖。Babel/SWC 把它编译成 `createElement(type, props, ...children)`，返回一个描述 UI 的普通对象（ReactElement）。新版用自动运行时，编译成 `jsx()` / `jsxs()`，不用手动引 React。

**2. JSX 和 HTML 有什么区别？**
属性名用 DOM property 名（`className`、`htmlFor`）；事件是小驼峰且传函数；`style` 传对象；`{}` 里只能放表达式不能放语句；标签必须闭合；注释要写 `{/* */}`；自定义组件首字母必须大写。

**3. 为什么写 className 而不是 class，htmlFor 而不是 for？**
JSX 最终映射到 DOM 的 **property**，`element.className` 才是真实属性名；`class`、`for` 在 JS 里是保留字，且 `for` 是语句关键字。React 早期为了统一走 property 赋值，就沿用了这套命名。

**4. JSX 中事件为什么写成小驼峰，传函数而不是字符串？**
React 用合成事件统一封装，`onClick` 对应 DOM 事件的驼峰命名习惯；传函数是直接绑定回调引用，而字符串是 HTML 内联执行，作用域和编译方式都不同，也不利于统一处理。

**5. React 组件有哪几种定义方式，函数组件和类组件有什么区别？**
函数组件和类组件。区别：类有实例、`this`、生命周期方法；函数没有实例，靠 Hooks 拿状态和副作用；函数更轻、更利于逻辑复用和 tree-shaking；现在只用函数组件。

**6. props 和 state 有什么区别？**
props 是外部传进来的、只读的；state 是组件自己维护的、可变的，且必须通过 `setState` / `dispatch` 改。props 变化由父组件决定，state 变化由组件内部决定。

**7. state 为什么不能直接修改？**
直接改不触发渲染，UI 不会更新；而且破坏了不可变约定——`memo`、`shouldComponentUpdate`、diff 都靠引用比较来判断变化，原地改会让它们全部失效。

**8. React 组件的 children 是什么，React.Children 工具方法用来做什么？**
`children` 是标签之间的内容，作为 `props.children` 传入，可能是元素、数组、字符串或函数。`React.Children` 提供 `map` / `forEach` / `count` / `toArray` / `only`，用来安全处理“单个子元素和数组不一致”的情况，并给元素补 key。

### 组件通信与复用

**1. React 组件之间有哪些通信方式？**
props、回调函数、状态提升、Context、ref（父调子）、全局状态库、事件总线 / `postMessage`（非 React 场景）。

**2. 父子、兄弟、跨层级分别怎么通信？**
父 → 子：props。子 → 父：父传回调，子调用。兄弟：状态提升到共同父级，或者用 Context。跨层级：Context 或全局状态库。

**3. 什么是受控组件和非受控组件，分别适合什么场景？**
受控：值由 state 驱动，`value` + `onChange`，每次输入都走 React。非受控：值由 DOM 自己管，用 `defaultValue` + `ref` 读取。受控适合需要联动、实时校验、格式化；非受控适合大表单、文件输入、只关心提交结果的场景。

**4. 高阶组件是什么，和普通函数有什么区别？**
HOC 是“接收组件、返回新组件”的函数。和普通函数的区别：它的入参和出参都是组件，返回的是包装后的组件，用来注入 props 或横切逻辑，而不修改原组件。

**5. 高阶组件有哪些使用场景和注意事项？**
场景：权限控制、埋点、数据注入、`connect` / `memo` 这类包装。注意：不要改原组件原型；把不认识的 props 透传下去；设置 `displayName` 方便调试；ref 要用 `forwardRef` 转发；静态方法要手动拷贝；别层层嵌套。

**6. Render Props 是什么，和 HOC、Hooks 怎么选？**
Render Props：把函数作为 prop 传进去，由它决定渲染什么，逻辑在父级复用。HOC 复用“包装”，render props 复用“渲染逻辑”，Hooks 直接复用“状态逻辑”且不产生层级。现在优先 Hooks。

**7. 自定义 Hook 和 HOC 在逻辑复用上有什么区别？**
自定义 Hook 不产生组件层级、每个调用点有独立状态、组合自然；HOC 会产生层级、props 容易冲突、多个 HOC 叠起来难调试。

### 生命周期与错误处理

**1. React 组件的生命周期阶段有哪些？**
挂载、更新、卸载，外加错误处理。类组件依次是 `constructor` → `render` → `componentDidMount`；更新走 `shouldComponentUpdate` → `render` → `componentDidUpdate`；卸载走 `componentWillUnmount`。

**2. React 16 之后生命周期有哪些变化，哪些旧钩子被废弃？**
废弃了 `componentWillMount`、`componentWillReceiveProps`、`componentWillUpdate`（改用 `getDerivedStateFromProps`）；新增 `getDerivedStateFromProps`、`getSnapshotBeforeUpdate`、`componentDidCatch`。原因是旧钩子在并发渲染下可能被多次调用，不安全。

**3. 父子组件的生命周期执行顺序是什么？**
挂载：父 `render` → 子 `render` → 子 `componentDidMount` → 父 `componentDidMount`。更新：父 `render` → 子 `render` → 子 `componentDidUpdate` → 父 `componentDidUpdate`。卸载：父 `componentWillUnmount` → 子 `componentWillUnmount`。

**4. React 如何捕获渲染错误，Error Boundary 怎么用？**
用类组件实现 `getDerivedStateFromError`（返回降级 state）+ `componentDidCatch`（上报），把子树包起来。它只能捕获**渲染、生命周期、构造函数**里的错误，捕不到事件回调、异步代码、服务端渲染和它自己的错误。

**5. componentDidCatch 和 getDerivedStateFromError 有什么区别？**
`getDerivedStateFromError` 是静态方法，只收 `error`，用来更新 state 渲染 fallback，必须是纯的；`componentDidCatch` 收 `error` 和 `info`（组件栈），用来做副作用，比如上报。

**6. ref 有哪几种用法，forwardRef 解决什么问题？**
三种：字符串 ref（已废弃）、回调 ref、`createRef` / `useRef`。用途是拿 DOM 节点或类组件实例。`forwardRef` 解决函数组件不能直接接收 ref 的问题，把 ref 透传给它内部的 DOM 或方法。

**7. React 19 还需要 forwardRef 吗？**
不需要。React 19 里 `ref` 就是普通 prop，函数组件可以直接接收；`forwardRef` 仍然可用，但新代码可以不用了。

## 二、Hooks 使用与原理

### 基础与规则

**1. useMemo 和 useCallback 有什么区别？**
`useMemo` 缓存一个计算出来的**值**，`useCallback` 缓存一个**函数引用**。`useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`。

**2. React Hooks 是什么，为什么要有 Hooks？**
一组让你在函数组件里使用状态、副作用、上下文等能力的函数。目的是让逻辑复用不产生组件层级、让相关代码按功能聚在一起、并且摆脱 `this`。

**3. Hooks 解决了类组件的哪些问题？**
`this` 绑定问题；同一功能的代码被生命周期切碎；复用只能靠 HOC / render props 导致嵌套；复杂组件难拆分；class 对编译优化不友好。

**4. 常用的 Hooks 有哪些，分别解决什么问题？**
`useState` / `useReducer` 管状态；`useEffect` / `useLayoutEffect` 管副作用；`useRef` 存跨渲染引用；`useMemo` / `useCallback` 做记忆化；`useContext` 跨层取数；`useTransition` / `useDeferredValue` 做并发；`useId`、`useSyncExternalStore` 是专项工具。

**5. Hooks 的使用规则有哪些，为什么不能在条件和循环里调用？**
只在顶层调用，只在 React 函数组件或自定义 Hook 里调用。因为状态是按**调用顺序**存在 Fiber 的链表上的，顺序变了就全部错位。

**6. React 为什么用链表来存 Hook 状态？**
每个 Hook 一个节点，按调用顺序串联。链表结构简单、遍历成本低，而且不需要知道 Hook 的名字——只要能按顺序对上就行，天然支持任意数量、任意顺序的 Hook。

**7. 多个 useEffect 的执行顺序是什么？**
按声明顺序依次执行；清理函数也按声明顺序执行（卸载时同样是这个顺序）。多个 effect 之间互不干扰。

**8. Hooks 有哪些缺点，闭包陷阱是怎么回事？**
缺点：依赖数组要手动维护，规则限制多，闭包陷阱，出问题难调试。闭包陷阱：每次渲染的 props/state 是快照，回调和 effect 捕获的是**当次**的值，所以 `setInterval`、异步回调里容易拿到旧值。

**9. 自定义 Hook 和普通工具函数有什么区别？**
自定义 Hook 内部可以调用其他 Hook，能参与 React 的渲染、状态和副作用；普通函数不能调 Hook。命名必须 `use` 开头，否则规则检查不到。

### useState 与 useReducer

**1. useState 的作用和用法是什么？**
给函数组件加局部状态，返回 `[state, setState]`。`setState` 可以传新值，也可以传 `(prev) => next` 的函数。

**2. useState 是同步还是异步的，怎么拿到最新值？**
`setState` 调用是同步的，但**更新是批处理延后的**，所以紧接着读 state 还是旧值。拿最新值：函数式更新、在 `useEffect` 里读、或者用 ref 存。

**3. useState 传入函数和直接传值有什么区别？**
传函数是**惰性初始化**，只在首次渲染执行一次；传值则是每次渲染都会求值（虽然只有第一次被采用）。有昂贵计算时用函数形式。

**4. 多次调用 setState 会合并吗，为什么？**
同一轮里的多次更新会被批处理合并成一次渲染。但如果用的是传值形式，每次都基于同一份快照，结果是最后一次覆盖；用函数式更新则逐个叠加。

**5. useState 和 useReducer 有什么区别，怎么选？**
`useState` 适合简单、独立的状态；`useReducer` 适合状态有多个子字段、下一状态依赖上一状态、或者更新逻辑需要集中管理和测试的场景。

**6. useState 为什么返回数组而不是对象？**
数组解构时可以自由命名、顺序固定，不用记 key 名；对象还容易重名。数组也符合“位置对应”的设计，`useState` 第一个永远是值、第二个永远是 setter。

### useEffect 与副作用

**1. useEffect 的作用是什么，什么时候执行？**
在渲染提交之后执行副作用：请求、订阅、操作 DOM。默认每次渲染后都执行。

**2. 第二个参数有哪些写法，空数组和不传有什么区别？**
不传：每次渲染后都执行。`[]`：只在挂载后执行一次。`[a, b]`：`a` 或 `b` 变化后才执行。依赖比较用 `Object.is`。

**3. 返回值和清理时机是什么？**
返回的函数是清理函数，在**下一次 effect 执行前**和**组件卸载时**调用，用来取消订阅、清定时器、中断请求。

**4. 怎么模拟类组件的生命周期？**
`componentDidMount` → `useEffect(fn, [])`；`componentDidUpdate` → `useEffect(fn)` 或带依赖；`componentWillUnmount` → `useEffect(() => () => cleanup, [])`。

**5. useEffect 里怎么写 async/await，为什么不能直接传 async 函数？**
`async` 函数返回 Promise，而 effect 要求返回清理函数或 `undefined`。所以要在内部定义 async 函数再调用，或者用 IIFE 包一层。

**6. useEffect 和 useLayoutEffect 有什么区别？**
`useEffect` 在浏览器**绘制之后**异步执行，不阻塞；`useLayoutEffect` 在 DOM 更新后、**绘制之前**同步执行，会阻塞绘制。

**7. useLayoutEffect 适合什么场景，SSR 下要注意什么？**
读布局再同步调整，避免闪一下：tooltip 定位、滚动位置恢复、测量尺寸。SSR 环境没有 DOM，会报警告，要改成 `useEffect` 或做 isomorphic 处理。

**8. 依赖数组里放对象或函数会有什么问题？**
每次渲染新建的对象/函数引用都不同，导致 effect 每次都执行。要么用 `useMemo` / `useCallback` 固定引用，要么把依赖拆成原始值。

### useMemo、useCallback 与 useRef

**1. useMemo 的作用是什么，什么时候不该用？**
缓存计算结果，依赖不变就复用。不该用在：计算很便宜、依赖本身每次新建、结果没有接收方（比如没传给 `memo` 子组件）。

**2. useCallback 适合哪些场景，为什么不能滥用？**
传给 `memo` 子组件、作为其他 hook 的依赖时才真正有用。滥用只会增加依赖维护成本，还多一层闭包。

**3. useRef 有什么用，和 useState 有什么区别？**
存跨渲染的值、拿 DOM 节点。和 `useState` 的区别：改 `ref.current` 不触发渲染，读到的永远是最新值；改 state 会触发重渲染。

**4. useRef 为什么能保存最新值而不触发重渲染？**
`ref.current` 只是挂在 Fiber 上的一个可变对象，修改它就是改属性，不进入更新调度；下次渲染读到的自然是新值。

**5. useImperativeHandle 解决什么问题？**
让父组件通过 ref 只能访问子组件**主动暴露**的方法（如 `focus`、`reset`），而不是整个 DOM 节点或实例，收敛 API、降低耦合。

### 自定义 Hook 与进阶

**1. 自定义 Hook 是什么，怎么封装一个可复用的 Hook？**
以 `use` 开头、内部调用其他 Hook 的函数，把一段状态逻辑抽出来复用。封装思路：定义输入参数 → 内部用 `useState` / `useEffect` 维护状态 → 返回需要的值和操作。

**2. useContext 怎么用，Context 更新时哪些组件会重渲染？**
`createContext` → `Provider` 提供值 → `useContext` 读取。Provider 的 `value` 变化时，**所有读取该 Context 的组件**都会重渲染，哪怕只用了其中一部分数据。

**3. useTransition 和 useDeferredValue 有什么区别？**
`useTransition` 返回 `[isPending, startTransition]`，用来包住“我要触发的更新”，把更新降级；`useDeferredValue` 是让某个**值**晚一步生效，用于纯展示场景。一个控制更新，一个控制读取。

## 三、状态管理与数据流

### 状态与数据流

**1. React 有哪些状态管理方案，怎么选？**
先分两类。服务端状态：React Query / SWR。客户端状态：组件内 `useState` → 跨层 `Context` → 全局 zustand / Jotai → 大团队强规范用 RTK → 老项目 MobX。选型看“状态属于谁、活多久、变多快”。

**2. 什么状态应该放在组件内，什么应该放到全局？**
只有自己用、生命周期跟组件一致的放组件内；跨路由、跨兄弟、需要持久化或跨页面共享的才放全局。能从 props / 已有 state 算出来的，两种都不放。

**3. 状态提升是什么，什么时候需要？**
把 state 从子组件挪到它们最近的共同父级，让多个兄弟共享同一份数据。当两个组件需要读同一份状态、或者一个组件的操作要影响另一个组件时，就需要提升。

**4. 什么是派生状态，为什么不建议把 props 复制到 state？**
派生状态是能从 props 或已有 state 算出来的值。复制到 state 会产生第二份真相，props 一变就要手动同步，容易不同步；正确做法是渲染时直接算，或用 `useMemo` 缓存。

**5. 服务端状态和客户端状态为什么要分开管理？**
服务端状态本质是“远端数据的缓存”：有新鲜度、重试、失效、并发去重、乐观更新这些需求；客户端状态是纯 UI 状态。混在一起会让 store 变成什么都能装的垃圾桶，缓存逻辑也写不对。

### Context

**1. Context 和 Redux 有什么区别，各自适用什么场景？**
Context 是**传值机制**（依赖注入），解决“props 钻透”；Redux 是**状态管理**，有不可变更新、中间件、devtools、时间回溯。Context 适合主题、语言、当前用户；Redux 适合复杂业务状态和需要追踪变更的场景。

**2. 为什么用了 Context 还需要 Redux？**
Context 只解决“怎么传”，不解决“怎么改、怎么追踪、怎么回溯”。它的 value 一变，所有消费者全量重渲染；也没有中间件、devtools 和状态历史。状态频繁变化、需要可预测时，Context 不够。

**3. Context 更新导致大面积重渲染怎么解决？**
拆分多个 Context（数据一个、更新函数一个）；`value` 用 `useMemo` 稳定；把消费者拆成更小的组件；用 `use-context-selector` 这类带选择器的方案；或者干脆换 zustand。

**4. 多个 Context 嵌套时怎么避免 Provider 地狱？**
做一个组合组件，把多个 Provider 收进一个（或用 `composeProviders` 工具）；也可以把这些值合并进一个 Context（代价是全量重渲染），或者改用状态库。

### Redux 与 MobX

**1. Redux 的核心概念有哪些，数据流是怎样的？**
store、action、reducer、dispatch、subscribe。UI `dispatch(action)` → reducer 算出新 state → store 通知订阅者 → 组件重渲染。全程单向、同步、可追溯。

**2. Redux 的三大原则是什么？**
单一数据源、state 只读、只能通过纯函数（reducer）修改。

**3. Redux 为什么要求 reducer 是纯函数，不能直接修改 state？**
纯函数才能保证“同样输入同样输出”，从而可回溯、可时间旅行、可测试、并发下安全；直接改 state 的话引用不变，订阅方的比较判断不出来变化。

**4. Redux 的 store 是怎么订阅变更并通知组件的？**
store 内部维护 listener 列表，`subscribe` 注册，`dispatch` 后 state 更新并遍历通知所有 listener。`react-redux` 在 Provider 里传 store，`useSelector` 订阅并在选择结果变化时触发重渲染。

**5. react-redux 的 connect 和 useSelector / useDispatch 有什么区别？**
`connect` 是 HOC，靠 `mapStateToProps` 把 state 映射成 props，内部做浅比较；hooks 更灵活、按需订阅、不产生包裹层、对 TS 更友好。新代码基本都写 hooks。

**6. Redux 的异步方案有哪些，thunk 和 saga 有什么区别？**
`redux-thunk`（action 返回函数，简单直接）、`redux-saga`（用 generator 管理副作用，适合复杂流程：取消、竞态、重试、并发编排）、`redux-observable`（RxJS）。简单异步用 thunk，复杂流程用 saga。

**7. Redux Toolkit 解决了什么问题？**
样板代码多、不可变更新要手写展开、action type 常量重复、devtools 配置繁琐、异步要额外装中间件。RTK 用 `createSlice` 收敛 reducer + action，内置 immer 允许“写可变代码产出不可变结果”，`createAsyncThunk` 管异步。

**8. Redux 有哪些缺点，什么项目不适合用？**
概念多、样板多、心智负担重；异步要靠中间件；小项目属于过度设计。状态简单、页面少、共享需求弱的项目不该用。

**9. MobX 和 Redux 有什么区别？**
MobX 是响应式：状态可观察、读时自动收集依赖、改了自动通知，代码量最小，但隐式、难追溯；Redux 是不可变 + 单向 + 显式，啰嗦但可预测、可回溯、调试和生态更强。

### 新兴状态库与服务端状态

**1. Zustand 相比 Redux 有什么优势，为什么越来越多项目用它？**
不用 Provider、API 极简（一个 `create` 就是 store）、用 selector 精确订阅、体积小、能在组件外读写、没有 action/reducer 样板。中小项目用它成本最低。

**2. Zustand、Jotai、Recoil 有什么区别？**
zustand：单个 store + selector 订阅。Jotai：原子化，状态拆成一堆 atom，靠依赖图精确更新。Recoil 也是原子模型，但维护停滞，现在基本被 Jotai 替代。

**3. React Query / TanStack Query 解决什么问题？**
服务端状态的全套问题：请求去重、缓存、失效与重取、分页/无限加载、乐观更新、重试、窗口聚焦刷新、并发竞态。它是数据同步层，不是全局状态库。

**4. Redux 中怎么做状态持久化？**
常用 `redux-persist`：配置 storage（localStorage / AsyncStorage）、白名单黑名单、rehydrate 时机，还要处理版本迁移。简单场景也可以 `subscribe` 里手动存、启动时读回。

**5. 大型 React 应用的状态管理怎么分层？**
按归属和生命周期分层：组件局部 `useState` → 跨组件共享（Context / 状态库）→ 服务端缓存（React Query）→ 表单状态（react-hook-form）→ URL 状态（路由 query）。原则是状态放得越低越好。

**6. Redux 和 Vuex 的设计有什么区别？**
都是集中式 + 单向。Vuex 分 mutation（同步改 state）和 action（异步，提交 mutation）两层，依赖 Vue 的响应式；Redux 只有 reducer + 中间件，依赖不可变和订阅。Vuex 已停止演进，被 Pinia 取代。

## 四、虚拟 DOM、Diff 与 Fiber

### 虚拟 DOM

**1. 什么是虚拟 DOM，它和真实 DOM 是什么关系？**
用 JS 对象描述 UI 的树，节点形如 `{ type, props, children }`。真实 DOM 是浏览器的对象，操作代价高；vdom 是它的轻量“描述”，diff 之后由 renderer 转成最小的真实 DOM 操作。

**2. 为什么要用虚拟 DOM，它一定比真实 DOM 快吗？**
不一定。手写最优 DOM 操作一定比 vdom 快。它的价值是：声明式（你只描述结果）、批量提交、diff 出最小变更、以及跨平台渲染。它保证的是**下限**不是上限。

**3. 虚拟 DOM 有什么缺点？**
多一层内存（整棵树的对象）；diff 本身要算；对简单静态页面是纯开销；极端场景下不如直接操作 DOM。

**4. 虚拟 DOM 的结构是怎样的，React Element 和 Fiber 有什么区别？**
ReactElement 是 `{ type, key, props }`，一次性的、不可变的“描述”。Fiber 是持久的“工作单元”，有 `child` / `sibling` / `return`、`stateNode`、`memoizedState`、`alternate`、`flags`、`lanes`。Element 每次渲染新建，Fiber 会复用。

**5. 虚拟 DOM 除了性能，还有什么优势？**
跨端渲染（RN、Canvas、SSR 同一套组件逻辑）；可测试（结构可断言）；把组件抽象成纯数据；便于调度、并发、时间旅行这类能力。

### Diff 与 key

**1. React 的 diff 算法原理是什么？**
同层比较；节点类型不同就直接整棵替换；类型相同先更新 props，再递归比 children；列表用 key 匹配身份，算出插入、删除、移动。

**2. 为什么能从 O(n³) 降到 O(n)？**
通用树的最小编辑距离要考虑跨层移动，是指数/立方级。React 只做**同层**比较，放弃了跨层复用，代价换来了线性复杂度。

**3. React diff 的假设和策略有哪些？**
① 只比较同一层，不跨层；② 节点类型不同则整棵替换，不再比较；③ 用 key 来标识列表中的元素身份。

**4. key 的作用是什么，为什么不能用数组下标？**
key 是元素的**身份**，让 React 在列表变动时知道“谁还是谁”，从而复用节点、算出最少的移动。用下标当 key，插入或删除时后面的元素全部错位，导致组件状态串到别的行，该复用的没复用。

**5. 重复的 key 会导致什么问题？**
React 会警告。复用逻辑会乱：可能更新到错误的节点、状态错乱、某些节点丢失或重复渲染。

**6. React 和 Vue 的 diff 算法有什么区别？**
React 是单端从左遍历，靠 `lastPlacedIndex` 判断谁要移动。Vue2 是双端比较（四个指针试四种组合）；Vue3 先掐掉相同首尾，中间用最长递增子序列算出“哪些不用动”。React 更依赖 key 的稳定性。

### Fiber 与调度

**1. Fiber 是什么，它解决了什么问题？**
React 16 引入的协调架构。把原来递归、不可中断的渲染，改成可中断、可恢复、可排优先级的“工作单元”模型，解决长任务阻塞主线程、页面掉帧和输入卡顿。

**2. Fiber 节点的数据结构是什么样的，为什么用链表？**
字段包括 `child` / `sibling` / `return`、`type`、`key`、`stateNode`、`memoizedProps`、`memoizedState`、`updateQueue`、`flags`、`alternate`、`lanes`。链表相当于把递归栈搬到堆上，中断后记住当前节点就能恢复。

**3. render 阶段和 commit 阶段分别做什么，哪个可以中断？**
render：算差异、生成 workInProgress、打 flags，**可中断**。commit：把变更写到 DOM、执行生命周期和 effect，**同步不可中断**。commit 内部又分 before mutation → mutation → layout。

**4. Fiber 如何实现可中断的异步渲染？**
三件套：链表化的工作单元 + 时间切片（超过 5ms 让出主线程）+ 优先级调度。再配合双缓存，中断时屏幕不受影响、下次能接着干或直接重做。

**5. Fiber 的优先级调度是怎么做的，时间切片是什么？**
Scheduler 把渲染切成小片，每片结束检查是否超时（默认 5ms），超时就通过 `MessageChannel` 的宏任务让出主线程。高优先级（输入、点击）可以打断低优先级渲染。

**6. React 的 Scheduler 有哪些优先级？**
`Immediate`（立即）、`UserBlocking`（用户交互，250ms）、`Normal`（普通，5s）、`Low`（10s）、`Idle`（空闲，无限等）。它们会映射到 lane 模型。

**7. 双缓存 Fiber Tree 是什么，current 和 workInProgress 怎么切换？**
内存里两棵树，current 是屏幕上那棵，workInProgress 是正在算的。算完在 commit 时 `root.current = workInProgress`，指针一换就完成切换；两棵树通过 `alternate` 互指，下次复用。

**8. React 的 render 全流程是怎样的？**
触发更新（setState / dispatch / 父渲染 / context）→ 调度（lane + Scheduler）→ render 阶段（beginWork 向下 diff、completeWork 向上归并，生成 wip、打 flags）→ commit（before mutation → mutation 改 DOM → layout 跑 effect）→ 浏览器绘制。

### setState 与更新流程

**1. setState 之后发生了什么？**
入队（挂到 fiber 的 updateQueue）→ 标 lane、调度 → render 阶段按顺序 reduce 出新的 state，diff 生成 wip → commit 改 DOM → 执行 effect 和回调。

**2. setState 是同步还是异步的，哪些场景下是同步的？**
调用本身是同步的，渲染是批处理延后的。React 17 及以前，在 `setTimeout`、原生事件里是“同步立即渲染”；React 18 起自动批处理，所有场景都合并，所以基本可以认为都是异步生效。

**3. React 18 里 setState 的批处理有什么变化？**
从“只在合成事件和生命周期内批处理”变成**全场景自动批处理**：`setTimeout`、`Promise.then`、原生事件回调里的多次更新也会合并成一次渲染。

**4. 多次 setState 会渲染几次，为什么？**
同一轮（同一个事件/微任务）里合并成一次，因为更新被排进队列、统一在 render 阶段处理；跨事件循环或 `await` 之后就可能渲染多次。

**5. React 的优先级 Lane 模型是什么？**
用 31 位二进制表示不同优先级的更新批次，位运算来合并、筛选和比较，取代了旧版的 `expirationTime`。它能表达“同时有多个不同优先级的更新”，支持并发渲染下的跳过、打断和合并。

**6. React 的协调和渲染是什么关系？**
协调（reconcile）是“算差异”，属于 render 阶段；渲染（commit）是“把差异应用到 DOM”。先协调后提交，协调可中断，提交不可中断。

### 并发与渲染边界

**1. React 18 的并发渲染是什么，和 Fiber 是什么关系？**
并发是“多个更新可以交替进行、低优先级可被打断”的能力。它建立在 Fiber 之上（链表、时间切片、双缓存、lane 优先级），Fiber 是地基，React 18 让并发成为默认行为。

**2. React 的 Suspense 原理是什么？**
渲染时如果遇到未就绪的异步资源，组件会“抛出一个 Promise”，最近的 Suspense 边界捕获后显示 fallback；Promise resolve 后 React 重新渲染这棵子树。

**3. React 的 hydration 是什么，水合不一致会怎样？**
服务端先输出 HTML，客户端渲染时复用已有 DOM、只挂事件和状态，这个过程叫 hydration。不一致会导致警告，React 可能放弃复用、整棵树重新渲染，甚至丢失状态和事件。

**4. 为什么 render 阶段的生命周期里不能有副作用？**
render 可被中断、丢弃、重试，甚至开发环境双调用。副作用会执行多次，或者作用在从未提交的树上，造成重复请求、状态错乱。

**5. StrictMode 为什么会执行两次 render？**
开发环境故意双调用，用来暴露不纯的渲染逻辑和有问题的副作用（比如没写清理函数）。生产环境不会双调用。

## 五、性能优化

### 渲染优化

**1. React 中常见的性能优化手段有哪些？**
拦掉渲染（`memo`、状态下放、拆组件、稳定 props、稳定 children）、降单次成本（`useMemo`、避免大计算、虚拟列表）、别阻塞输入（`startTransition`）、加载层面（代码分割、懒加载）。

**2. React.memo 的作用是什么，第二个参数怎么用？**
浅比较 props，相等就跳过这次渲染。第二个参数 `arePropsEqual(prevProps, nextProps)`，返回 `true` 表示**相等、跳过渲染**——和 `shouldComponentUpdate` 的返回值语义正好相反，容易答反。

**3. React.memo、useMemo、useCallback 三者怎么配合？**
`memo` 是闸门，挡在组件入口；`useMemo` / `useCallback` 稳定传给它的引用，闸门才关得上。子组件没 `memo`，父组件怎么缓存都没用。

**4. 父组件更新时怎么避免子组件不必要的渲染？**
按性价比：状态下放 → `memo` + 稳定 props → `children` 组合（元素引用不变直接跳过）→ 拆 Context → 别往依赖里塞新对象。

**5. 什么时候不该用 useMemo 和 useCallback？**
计算很便宜、子组件没 `memo`、不是 hook 依赖、依赖本身每次新建的时候。多一层记忆化就多一份依赖维护成本。

**6. 重复渲染一定慢吗，怎么判断一次渲染是否昂贵？**
不一定。render 只是执行函数 + diff，贵的是 commit 改 DOM、大计算、强制同步布局。看 Profiler 的 `actualDuration`，看数据规模，看有没有在 render 里读布局属性。

**7. 状态放得太高会有什么性能问题？**
state 在谁身上，`setState` 就让谁和整棵子树重渲染。放太高会连坐大量兄弟组件，最后只能到处 `memo` 打补丁。

**8. React 的渲染性能指标有哪些，长任务怎么观测？**
React 侧：`actualDuration`、`baseDuration`、commit 耗时、渲染次数。浏览器侧：INP、long task（>50ms）、TBT、火焰图。用 `PerformanceObserver` 监听 `longtask` 和 `event`。

### 列表与代码分割

**1. 列表渲染怎么优化，key 和虚拟列表要注意什么？**
key 用稳定的业务 id，别用下标；行组件用 `memo` 且 props 稳定；虚拟列表要处理行高固定还是动态测量，`overscan` 预留缓冲行，滚动时别做重计算。

**2. 长列表有十万条数据怎么渲染？**
虚拟滚动，只渲染可视区加缓冲；配合分页或无限加载，别一次全拿；数据预处理（过滤、排序）放 Worker 或后端。

**3. React.lazy 和 Suspense 怎么做代码分割？**
`const Comp = React.lazy(() => import('./Comp'))`，外面套 `<Suspense fallback={...}>`；模块加载中显示 fallback，加载失败可以用 Error Boundary 兜。

**4. 路由级代码分割怎么做？**
路由表里每个页面都用 `lazy`，配合路由的 `pendingComponent` / `Suspense`，这样首屏只加载当前页面的 chunk。

**5. 图片和静态资源怎么优化？**
用 webp / avif、按需尺寸 `srcset`、`loading="lazy"`、CDN、关键图片 `preload`、字体子集化和 `font-display: swap`。

**6. React 项目怎么做首屏性能优化？**
路由级代码分割 + 关键资源预加载、SSR/SSG、关键 CSS 内联、图片优化、减少第三方脚本、骨架屏减少 CLS。

### 工具与运行时

**1. 如何定位 React 的渲染性能问题，Profiler 怎么看？**
DevTools Profiler 录一段交互，看每个 commit 的耗时排行、`actualDuration`，打开 “why did this render” 看渲染原因；再用 Highlight updates 肉眼确认范围，最后到 Performance 面板看火焰图和长任务。

**2. React Compiler 是什么，它会取代 useMemo/useCallback 吗？**
编译期自动做记忆化，把“手动 memo”变成编译器推导。会大幅减少手写，但不会完全取代：跨组件边界的稳定引用、外部数据、需要精确控制语义的场景仍然要手写。

**3. useTransition 怎么用于性能优化？**
把“由输入触发的重计算/大列表渲染”包进 `startTransition`，让它变成非紧急更新，输入框的更新优先，保证打字不卡。

**4. 什么是时间切片，为什么它能改善交互体验？**
把长渲染任务切成若干小于 5ms 的小片，片与片之间把主线程还给浏览器，让它能绘制和响应输入。本质是把“一次长阻塞”变成“多次短阻塞”。

**5. React 18 的自动批处理对性能有什么影响？**
减少渲染次数和重复的 diff/commit，整体更快；副作用是“setState 之后立刻读 state”这种代码在更多场景下拿到旧值。

### 工程与监控

**1. React 项目怎么做性能监控？**
接 Web Vitals（LCP / INP / CLS）上报；`PerformanceObserver` 采集长任务；Sentry 这类平台抓异常和慢事务；React Profiler 采样上报渲染耗时；按路由和版本做对比看板。

**2. 内存泄漏在 React 里怎么产生，怎么排查？**
定时器、订阅、全局事件监听没清理；闭包长期持有大对象；全局缓存没有上限；DOM 已移除但 JS 还引用（detached DOM）。排查用 Memory 面板做快照对比、看 detached 节点、用 Performance Monitor 观察内存曲线。

**3. 大型 React 应用的构建优化有哪些？**
代码分割、tree shaking、按需引入组件库、构建缓存、并行构建、产物分析找大包、CDN 分发、monorepo 增量构建。

**4. SSR 和 CSR 的性能差异在哪里？**
SSR 首屏内容快（HTML 直出，FCP/LCP 好），但 TTFB 受服务端影响，还有 hydration 成本；CSR 首屏要等 JS 下载执行，但后续交互快、服务端压力小。内容型站点偏 SSR/SSG，后台系统偏 CSR。

**5. React 项目怎么做防抖和节流？**
`lodash` 的 `debounce` / `throttle`，或手写；用在搜索输入、滚动监听、resize；放在 `useEffect` 里时记得在清理函数里 `cancel`。

## 六、React 18 与 React 19 新特性

### React 18

**1. React 18 带来了哪些新特性？**
并发根 `createRoot`、全场景自动批处理、`useTransition` / `useDeferredValue`、`useSyncExternalStore`、`useId`、Suspense 增强与流式 SSR、StrictMode 的双调用行为。

**2. createRoot 和 ReactDOM.render 有什么区别？**
`ReactDOM.render` 是旧的同步根，一渲染就跑到底；`createRoot` 开启并发能力（可中断、可排优先级、自动批处理）。19 里 `ReactDOM.render` 已被移除。

**3. React 18 的并发特性有哪些，useTransition 怎么用？**
`startTransition` / `useTransition`、`useDeferredValue`、配合 Suspense 的并发渲染。用法：`const [isPending, startTransition] = useTransition()`，把降级更新包进 `startTransition(() => setXxx(...))`，`isPending` 用来显示加载态。

**4. React 18 的自动批处理在哪些场景生效？**
所有场景：合成事件、生命周期、`setTimeout`、`Promise.then`、原生事件回调。以前只有前两者会合并。

**5. React 18 的 Suspense 支持哪些场景？**
代码分割（`lazy`）、数据获取（配合框架或 `use`）、流式 SSR 里的选择性 hydration。

**6. useSyncExternalStore 解决什么问题？**
外部 store 在并发渲染下可能出现“撕裂”（tearing）：同一次渲染里不同组件读到不同版本的数据。它要求 store 提供 `getSnapshot`，让每次渲染拿到一致的快照。

**7. useId 有什么用，为什么不能用随机数生成 id？**
生成在 SSR 和客户端**一致**的唯一 id，给 `label` / `aria` 用。随机数会导致服务端和客户端生成的 id 不同，hydration 直接对不上。

### React 19

**1. React 19 带来了哪些新特性？**
Actions 系列（`useActionState`、`useFormStatus`、`useOptimistic`）、`use()`、ref 直接作 prop、RSC 进内核、文档元数据、资源预加载 API、更好的错误提示，同时移除了一批旧 API。

**2. Actions 是什么，解决了表单处理的什么问题？**
把“提交”变成一等公民：给表单 `action` 传一个异步函数，React 自动管提交中状态、错误、乐观更新、成功后的表单重置。省掉了 `useState` 一堆 loading/error 和手写 `useEffect`。

**3. React Server Components 是什么，和 SSR 有什么区别？**
RSC 是**在服务端执行、不向客户端发送 JS** 的组件，可以直接读数据库、拿敏感配置。SSR 只是“服务端先渲染出 HTML，再到客户端 hydration 成可交互组件”。RSC 削减的是客户端 JS，SSR 优化的是首屏。

**4. Server Actions 是什么，和普通 API 请求有什么区别？**
服务端函数，客户端像调本地函数一样调用（内部走 RPC），不用手写接口路由。区别是它天然在服务端执行、可以直接访问数据层，但必须做参数校验和权限检查，防止被构造请求。

**5. use() 怎么用，为什么它可以条件调用？**
`use(promise)` 读 Promise、`use(Context)` 读上下文。它本质是“读”，不占用 Hook 的顺序槽位（不是注册型 Hook），所以可以写在 `if` 和循环里。

**6. useActionState 怎么用，和 useFormStatus 有什么区别？**
`useActionState(action, initialState)` 返回 `[state, formAction, isPending]`，管的是**这次 action 的结果和状态**；`useFormStatus` 是让**子组件**读父级表单的提交状态，不用层层传 props。

**7. useOptimistic 怎么实现乐观更新？**
`useOptimistic(state, reducer)`，提交时先用 reducer 算出“乐观值”渲染，等 action 结束真实数据回来，自动回退到真实值；失败时也回退。

**8. React 19 的 Context Provider 写法有什么变化？**
可以直接写 `<Context value={...}>`，不用再写 `<Context.Provider>`，少一层嵌套。

**9. React 19 怎么在组件里直接写 title 和 meta？**
直接在组件里渲染 `<title>`、`<meta>`、`<link>`，React 会把它们提升到 `document.head`，SSR 下也能正确合并。

### 升级与版本

**1. React 19 的资源预加载 API 有哪些？**
`preload`、`preinit`、`prefetchDNS`、`preconnect`、`preloadModule`、`preinitModule`，分别对应图片/样式/字体、脚本、DNS、连接、模块的提前准备。

**2. React 19 移除了哪些旧 API，升级要注意什么？**
移除 `ReactDOM.render`、`ReactDOM.hydrate`、`unmountComponentAtNode`、字符串 ref、函数组件的 `defaultProps`、旧版 context。升级路径：先升到 18 清掉警告 → 跑通测试 → 检查第三方库兼容性 → 再升 19。

**3. React Compiler 的工作原理是什么，启用后要注意什么？**
编译期分析组件和 Hook，找出可以复用的计算和引用，自动插入记忆化缓存（`useMemoCache`），以前手写的 `useMemo` / `useCallback` 大部分可以不写。前提是代码符合 Rules of React：渲染必须纯、数据不可变、Hook 规则不能破；否则编译器会跳过那段。

**4. React 19 的 hydration 错误信息有什么改进？**
不再只丢一句 “Text content does not match”，而是把服务端和客户端不一致的具体内容 diff 出来，并提示可能的来源（比如非法嵌套、随机数、日期时区）。

**5. React 15、16、17、18、19 各版本的关键变化是什么？**
15：栈协调，同步不可中断。16：Fiber、Error Boundary、Fragment、Portals。17：事件挂到 root、新 JSX 转换、移除事件池。18：并发渲染、自动批处理、`useId`。19：Actions、RSC、`use()`、移除旧 API。

**6. 现在新项目应该选 React 18 还是 19？**
新项目直接 19，它向下兼容大部分 18 的写法，还白拿 Actions 和更好的报错；只有依赖链还没跟上（比如某些库锁死 `forwardRef` 行为）时才先停留 18。

**7. React 19 和 Next.js 15 的关系是什么？**
Next.js 15 用 React 19，并在 App Router 里提供 RSC 和 Server Actions 的落地支持。React 提供能力，Next 提供路由、构建和部署这一层。

**8. React Server Components 和客户端组件的边界怎么划分？**
需要 state、事件、浏览器 API 的用 `'use client'`；数据获取、敏感逻辑、纯展示的大块内容放服务端。原则是把客户端边界尽量往叶子推，别让整页都变成客户端组件。

## 七、路由、SSR 与工程化

### 路由

**1. React Router 的原理是什么？**
监听 URL 变化（History API 的 `popstate`，或 hash 的 `hashchange`），拿当前 location 去匹配路由配置，渲染对应组件，全程不刷新页面。location、navigate 通过 Context 提供给整棵树。

**2. BrowserRouter 和 HashRouter 有什么区别，各自原理是什么？**
BrowserRouter 用 History API（`pushState`），URL 干净，但刷新或直达深层路径时服务端要 fallback 到 `index.html`。HashRouter 用 `#` 后面的部分，浏览器不会把它发给服务端，所以不用配置后端，兼容性好，但 URL 不好看、对 SEO 不友好。

**3. history.pushState 和 replaceState 有什么区别？**
`pushState` 新增一条历史记录，可以后退回去；`replaceState` 替换当前这条，后退不会回到被替换的页面。常用于登录后重定向、避免表单重复提交。

**4. React Router 的路由匹配和渲染流程是怎样的？**
解析 location → 按路由表匹配（静态段、动态段 `:`、通配 `*`，嵌套路由逐层匹配）→ 把 params 传给匹配到的元素 → URL 变化重新匹配并渲染。v6 用 `<Outlet>` 占位嵌套子路由。

**5. React Router 怎么做路由守卫和权限控制？**
包一层 `RequireAuth` 组件：读登录态，没登录就 `<Navigate to="/login">`；或者用 loader 在渲染前拦截并重定向。菜单和按钮权限另按角色过滤，别只做路由级。

**6. React Router v6 相比 v5 有哪些变化？**
`<Routes>` + `<Route element>` 取代 `component` / `render`；嵌套路由改用 `<Outlet>`；`useHistory` 换成 `useNavigate`；路由配置更集中；6.4 之后加入 loader / action / errorElement。

**7. 什么是前端路由，和传统多页应用有什么区别？**
前端路由靠改 URL（History / hash）切换组件，不向服务端请求新页面；多页应用每次跳转都由服务端返回一份新 HTML，整页刷新。

### SSR 与 Next.js

**1. 什么是 SSR，React 的 SSR 流程是怎样的？**
服务端把组件渲染成 HTML 字符串（`renderToString` / `renderToPipeableStream`）发给浏览器，浏览器先显示内容，再由客户端 `hydrate` 挂上事件和状态。

**2. SSR、CSR、SSG、ISR 怎么选？**
内容型、SEO 重要：SSG / ISR。需要个性化且首屏要快：SSR。后台系统、交互重、不需要 SEO：CSR。

**3. Next.js 的 App Router 和 Pages Router 有什么区别？**
App Router 基于 RSC，支持嵌套布局、流式渲染、Server Actions、`'use client'` 边界；Pages Router 是传统模型，数据靠 `getServerSideProps` / `getStaticProps`。

**4. Next.js 的数据获取方式有哪些？**
服务端组件里直接 `async/await` 取数；Server Actions 处理写操作；客户端用 React Query / SWR；Pages Router 里用 `getServerSideProps`（每次请求）和 `getStaticProps`（构建时）。

**5. React 项目怎么做 SEO？**
SSR/SSG 输出可抓取内容；每个页面独立 `title` / `meta`；语义化标签；`sitemap.xml` / `robots.txt`；结构化数据；canonical 防止重复收录。

**6. React 项目怎么做国际化？**
`react-i18next` / `react-intl`；文案抽成资源文件按 locale 加载；路由加语言前缀；日期数字按 locale 格式化；布局考虑 RTL。

**7. React 项目怎么做错误监控和埋点？**
错误：Error Boundary 兜渲染错误 + `window.onerror` / `unhandledrejection` 兜外部错误，统一上报 Sentry。埋点：封装统一的 `track()`，页面曝光用 `IntersectionObserver`，点击用事件委托或组件包装。

### 工程化与跨端

**1. React 项目怎么做单元测试，测试什么？**
测行为不测实现：纯函数逻辑、自定义 Hook（`renderHook`）、组件的渲染结果和用户交互（RTL）、边界和异常。别去断言 state 和内部方法。

**2. React Testing Library 和 Enzyme 有什么区别？**
RTL 从用户视角查 DOM、驱动交互，不依赖组件内部实现，对 React 18 支持好；Enzyme 依赖组件实例和 `shallow`，React 18 之后基本不维护了。

**3. Webpack 和 Vite 在 React 项目里怎么选？**
新项目选 Vite：开发期不打包、冷启动和 HMR 快，生产用 Rollup。老项目、需要复杂自定义 loader 或迁移成本高的，继续 Webpack。

**4. React 项目怎么做环境变量和配置管理？**
`.env` 文件加前缀（`VITE_`、`NEXT_PUBLIC_`）才会暴露给客户端；敏感配置只放服务端；区分构建期注入和运行时配置（运行时更好，一份产物多环境）。

**5. React 项目怎么做微前端？**
常见方案：qiankun（沙箱 + 生命周期）、Module Federation（运行时共享模块）、iframe（隔离最彻底）。要处理样式隔离、JS 全局污染、主子应用通信、公共依赖去重。

**6. React Native 的跨端原理是什么？**
JS 层用 React 写组件，通过 Bridge / JSI 调用原生 UI 和 API，最终渲染成原生控件，所以性能接近原生，但通信有成本。

**7. React Native 和 Flutter 有什么区别？**
RN 用 JS + 原生控件，生态和热更新好，但性能受桥接和原生差异影响；Flutter 用 Dart + 自绘引擎，UI 一致性和性能更强，代价是包体积和学习成本。

**8. React Native 的 ScrollView 和 FlatList 有什么区别？**
`ScrollView` 会一次性渲染所有子元素，适合少量内容；`FlatList` 虚拟化，只渲染可见项，支持分页和回收，长列表必须用。

**9. React 项目从开发到上线的完整流程是怎样的？**
需求与设计 → 开发（分支规范、单测）→ code review → CI（lint / test / build）→ 预发与灰度 → 上线 → 监控告警和回滚预案。

**10. React 项目里 CSS 方案怎么选？**
CSS Modules：隔离简单、成本低，通用首选。CSS-in-JS：动态主题方便，有运行时成本、SSR 要抽样式。Tailwind：原子类无命名冲突，可读性和定制要权衡。Sass/Less：只是预处理器，和隔离无关。






