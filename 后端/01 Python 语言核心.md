# Python 语言核心

## 核心语法与机制

### 2.1 可变与不可变（原题 2、4）⭐

**一句话**：不可变对象（int、float、str、tuple）一旦创建就不能改，任何"修改"都是创建新对象；可变对象（list、dict、set）可以原地改。

| | 可变（list / dict / set） | 不可变（int / str / tuple） |
|---|---|---|
| 能否原地修改 | 能 | 不能 |
| 作为函数参数 | **函数内修改会影响外部** | 不会 |
| 能否做 dict 的 key | 不能 | 能 |
| 典型坑 | 默认参数、浅拷贝共享 | 无 |

**面试会怎么问**：
> "为什么 list 不能当字典的 key？"

**答**：字典靠哈希定位，key 必须**哈希值稳定**。list 可变，内容一变哈希就变，字典就找不到它了。tuple 不可变所以可以当 key——但注意**如果 tuple 里包了 list，它同样不可哈希**。

**和你简历的连接**：你在前端用 Immer 做不可变更新，这个思路和 Python 的不可变对象是一回事——**用"创建新值"代替"原地修改"，让变化可追踪**。这个类比讲出来很加分。

---

### 2.2 浅拷贝与深拷贝（原题 10）⭐⭐

**一句话**：
- **浅拷贝**：新建外层容器，但里面的元素还是原来的引用。改嵌套的可变对象会互相影响。
- **深拷贝**：递归复制到底，完全独立。

```python
import copy

a = [[1, 2], [3, 4]]
b = a.copy()          # 浅拷贝
b[0][0] = 99
print(a)              # [[99, 2], [3, 4]] ← a 也变了！

c = copy.deepcopy(a)
c[0][0] = 1
print(a)              # a 不受影响
```

**为什么这是必背**：这是 AI 写 Python 最容易埋的雷之一。它经常给你 `b = a.copy()`，你以为复制了，其实内层共享。

**追问**：
- *`a[:]`、`list(a)`、`a.copy()` 有什么区别？* → 都是浅拷贝，语义基本一样。
- *什么时候必须用 deepcopy？* → 嵌套结构且需要完全独立时；但 deepcopy 性能差，能用不可变结构或重新构造就别用。

---

### 2.3 装饰器（原题 15）⭐⭐

**一句话**：装饰器是"接收函数、返回函数"的高阶函数，`@deco` 等价于 `func = deco(func)`。

```python
import functools
import time

def timer(func):
    @functools.wraps(func)          # 保留原函数的名字和文档
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} 耗时 {time.time()-start:.3f}s")
        return result
    return wrapper

@timer
def slow():
    time.sleep(1)
```

**为什么和你的项目强相关**：**FastAPI 的 `Depends` 就是装饰器思路的延伸**——把"鉴权、取数据库连接、分页参数"这些横切逻辑声明在函数签名上，框架负责注入。

**追问**：
- *为什么必须用 `functools.wraps`？* → 不加的话，被装饰函数的 `__name__`、`__doc__` 会变成 `wrapper`，调试和框架识别都会出问题。
- *带参数的装饰器怎么写？* → 三层嵌套：最外层收参数，中间层收函数，最内层是 wrapper。

---

### 2.4 上下文管理器与 with（原题 13、16）⭐⭐

**一句话**：`with` 保证资源**一定会被释放**，即使中途抛异常。

```python
with open("a.txt", "w") as f:
    f.write("hi")           # 无论是否抛异常，文件都会关闭
```

**自己实现**：类里定义 `__enter__` 和 `__exit__`；或者用 `contextlib.contextmanager` + `yield` 写生成器版本。

```python
from contextlib import contextmanager

@contextmanager
def db_session():
    session = SessionLocal()
    try:
        yield session            # yield 之前是进入逻辑
        session.commit()
    except Exception:
        session.rollback()       # 异常时回滚
        raise
    finally:
        session.close()          # 一定会关闭
```

**为什么和你的项目强相关**：FastAPI 的 `Depends` 支持 `yield`，写法和上面**完全一样**——请求开始时建连接，请求结束后关闭。面试官问 "FastAPI 里依赖的清理逻辑什么时候执行"，答案就是"响应完成之后"。

**追问**：
- *`__exit__` 的返回值有什么用？* → 返回 `True` 会**吞掉异常**，一般不这么写，除非你确定要抑制。

---

### 2.5 GIL（原题 6）⭐⭐

**一句话**：CPython 有全局解释器锁，**同一进程内同一时刻只有一个线程执行 Python 字节码**。

| 任务类型 | 多线程有用吗 | 该用什么 |
|---|---|---|
| CPU 密集（计算、图像处理） | ❌ 没用，抢锁反而更慢 | 多进程 |
| IO 密集（网络、文件、数据库） | ✅ 有用，等 IO 时会释放 GIL | 多线程或异步 |

**为什么这是必背**：它直接解释了你简历上"FastAPI 异步收益最大"的原因——**调 LLM API 是纯 IO 等待，异步能让几百个请求同时挂在网络上**，而不是排队。

**追问**：
- *GIL 会取消吗？* → Python 3.13 有实验性无 GIL 构建（PEP 703），3.14 有文档化的自由线程支持，但生态兼容需要时间。短期多进程还是主流。
- *那 asyncio 能绕过 GIL 吗？* → 不是"绕过"，是**单线程内用协程切换**，避免了线程切换开销，只对 IO 密集有效。

---

### 2.6 async / await（原题 39）⭐⭐⭐

**一句话**：`async def` 定义协程，`await` 把控制权交回事件循环，等 IO 完成再回来——**单线程也能并发处理大量 IO**。

```python
import asyncio
from openai import AsyncOpenAI

client = AsyncOpenAI()

async def ask(prompt: str) -> str:
    r = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    return r.choices[0].message.content

async def main():
    prompts = ["a", "b", "c"]
    # 并发发起，总耗时约等于最慢的那一个，而不是三个之和
    results = await asyncio.gather(*(ask(p) for p in prompts))
    return results

asyncio.run(main())
```

**必须记住的三句话**：
1. **`async def` 里不能有阻塞调用**（`requests`、`time.sleep`、同步数据库驱动）——会把整个事件循环卡死。
2. **普通 `def` 路由**，FastAPI 会自动丢进线程池，不会阻塞事件循环。
3. **不要混用**：要么全程异步（httpx / asyncpg），要么老老实实用 `def`。

**追问**：
- *`asyncio.gather` 和 `asyncio.wait` 的区别？* → gather 收集结果并按顺序返回，默认一个失败全失败；wait 拿到的是已完成/未完成的集合，适合需要分别处理的情况。
- *怎么限制并发数？* → `asyncio.Semaphore(n)`，防止一次打出去几百个请求把下游打挂。
- *超时怎么处理？* → `asyncio.wait_for(coro, timeout=10)`。

---

### 2.7 异常处理（原题 8、14）⭐

**一句话**：`try / except / else / finally` 四个块各管一段。

| 块 | 什么时候执行 |
|---|---|
| `try` | 正常逻辑 |
| `except` | 对应异常发生时 |
| `else` | **try 里没有异常时**（和 except 互斥） |
| `finally` | **无论是否异常都执行**（清理资源） |

**`KeyError` 的三种处理**（这是原题 8，很实用）：

```python
# 1. get：取不到返回默认值，不会写入字典
value = d.get("k", 0)

# 2. try/except：需要区分"没有这个键"和"值本身有问题"时用
try:
    value = d["k"]
except KeyError:
    value = 0

# 3. in 判断：逻辑最清晰，但会查两次（一次判断一次取值）
value = d["k"] if "k" in d else 0
```

**追问**：
- *为什么不建议写裸 `except:`？* → 它会连 `KeyboardInterrupt`、`SystemExit` 都吞掉，程序该停的时候停不下来。至少写 `except Exception as e`，并记日志。
- *`else` 有什么实际意义？* → 把"没有异常才做的事"和"可能抛异常的代码"分开，避免把 else 里的异常误捕。

---

### 2.8 lambda / 迭代器 / 生成器（原题 33）⭐

**三者的关系**：

| 概念 | 是什么 | 关键点 |
|---|---|---|
| **lambda** | 匿名函数，只能写一个表达式 | 只适合极简逻辑，复杂的别用 |
| **迭代器** | 实现了 `__iter__` 和 `__next__` 的对象 | `for` 循环背后就是它在工作 |
| **生成器** | 含 `yield` 的函数，返回生成器对象 | **惰性求值，一次只出一个值** |

```python
# 列表：一次性把所有元素算出来放进内存
squares = [x * x for x in range(10_000_000)]     # 占内存

# 生成器：用到才算，内存恒定
squares = (x * x for x in range(10_000_000))     # 省内存
```

**为什么实用**：处理大文件、大表、流式响应时，生成器是标准做法。你项目里 LLM 流式输出（`stream=True`）本质就是生成器模式。

**追问**：
- *生成器能重复遍历吗？* → **不能**，遍历完就空了。要重复用就转成 list（回到占内存）或者重新生成。
- *`yield` 和 `return` 的区别？* → `return` 结束函数返回一个值；`yield` 暂停函数、交出一个值，下次调用从暂停处继续。

---

## 常用内置能力

### 3.1 推导式（原题 5）
```python
[x * 2 for x in nums if x > 0]          # 列表
{k: v for k, v in pairs}                # 字典
{x for x in nums}                       # 集合
(x for x in nums)                       # ⚠️ 这是生成器，不是元组
tuple(x for x in nums)                  # 才是元组
```
**记住**：圆括号包推导式 = 生成器表达式，不是元组。这个坑面试常考。

### 3.2 collections（原题 11）
| 工具 | 用途 |
|---|---|
| `Counter` | 计数：`Counter(["a","b","a"])` → `{"a":2,"b":1}` |
| `defaultdict` | 免去"键不存在就初始化"的样板代码 |
| `deque` | 双端队列，头尾插入删除 O(1)，适合做队列/滑动窗口 |
| `OrderedDict` | 记住插入顺序（3.7+ 普通 dict 也有序了，所以用得少了） |

### 3.3 类与 `__init__`（原题 3）
`__init__` 是**实例化后**的初始化方法，不是真正意义上的构造函数（真正创建对象的是 `__new__`）。面试答"构造函数"通常也能过，但知道这个区别更稳。

### 3.4 内存管理（原题 9）
**两句话**：
- 主要靠**引用计数**：对象引用数为 0 就回收。
- 引用计数处理不了**循环引用**（A 引用 B，B 引用 A），所以有个**循环垃圾回收器**定期清理，可以用 `gc` 模块查看和控制。

### 3.5 三元运算符（原题 35）
```python
result = "及格" if score >= 60 else "不及格"
```
**提醒**：嵌套三层以上就别用了，可读性比行数重要。

### 3.6 LRU 缓存（原题 36）
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive(n):
    ...
```
**原理**：有序字典 + 超出容量时淘汰最久未使用的项。这个数据结构就是你项目里"LLM 结果缓存"的简化版——**面试时可以顺势带一句**："我们做 LLM 缓存时也考虑过类似的淘汰策略，key 里带提示词版本号。"

### 3.7 Python 是什么语言（原题 1）
解释型、动态类型、跨平台、生态丰富。这题是暖场题，答三句就够，别展开。

---

## 进阶概念

### 4.1 猴子补丁（原题 12）
**一句话**：运行时替换类或模块的属性和方法。测试里 mock 就靠这个思路（`unittest.mock.patch`）。
**风险**：全局副作用、可读性差、协作时容易"猜不到代码为什么变了"。**生产代码基本别用**。

### 4.2 元类（原题 17）
**一句话**：元类是"创建类的类"，可以控制类怎么被创建（`__new__` / `__init__` 里改类的定义）。
**实际用途**：ORM（Django Model、SQLAlchemy）用它把类定义自动映射成表结构；框架用它注册组件。
**面试答法**："我平时不会直接写元类，但知道它是 ORM 这类框架的底层机制。"——**够用了，别硬答**。

---

## AI 相关概念

深度内容在另外两份文件，这里只给"面试最低应答"。

### 5.1 LLM 是什么（原题 37）
在海量文本上训练的深度神经网络，能理解和生成文本。**应用层关键认知**：它是概率模型，会给"看起来合理"的错误答案，所以要靠 RAG、结构化输出、校验来兜。

### 5.2 RAG（原题 38）
检索 + 生成：先从知识库检索相关片段，再把片段作为上下文交给模型回答。
**四个关键决策**：切分策略、embedding 模型、检索方式（向量 / 关键词 / 混合）、是否重排。
**⚠️ 原题示例代码用的是旧版 LangChain API**，现在 `RetrievalQA` 已经过时，别照着背。

### 5.3 Embedding（原题 40）
把文本映射成稠密向量，语义相近向量距离近。**实际注意**：要归一化后再算余弦相似度；embedding 模型换了，**旧向量库必须全量重建**（这是生产里最容易踩的坑）。

### 5.4 AI Agent（原题 41）
LLM + 工具 + 记忆 + 规划。核心循环是 `思考 → 调工具 → 观察结果 → 继续`。
**⚠️ 原题代码用的是 `create_openai_functions_agent`，新版 LangChain 已换成 `create_tool_calling_agent`**，而且更推荐用 LangGraph 编排。这正好说明：**照着旧教程抄代码会踩坑，要核对版本**。

---
