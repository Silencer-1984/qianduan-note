# Python 语言核心

## 语言特性与解释器

### Python 是什么类型的语言？有哪些特点和优缺点？

解释型、动态类型、强类型、面向对象的高级通用语言，同时支持函数式和过程式写法。

- 优点：语法简洁、开发效率高、生态最全（数据/AI/Web/运维）、当胶水语言易与 C 扩展集成；
- 缺点：GIL 限制多线程并行、裸循环性能差、动态类型让大型项目重构和静态检查更吃力、内存开销偏高。

### Python 是强类型还是弱类型？怎么理解它的动态类型？（字节跳动 / 滴滴）

强类型：`1 + "1"` 直接抛 `TypeError`，不做隐式转换；
动态类型：类型绑定在**对象**上而不是变量上，变量只是指向对象的名字，可以随时重新绑定到任何类型，类型检查发生在运行时。

### Python 的虚拟环境有什么用，为什么要用？（百度 / 腾讯）

项目隔离，解决不同项目依赖同一包的不同版本、以及避免污染系统 Python 权限的问题，也让依赖可复现。常用 `python -m venv .venv` 配 `requirements.txt`，或 Poetry / uv / conda 做锁定与解析。

### Python 和 JavaScript 有什么区别？（京东 / 腾讯）

都是动态脚本语言。

- Python 强类型、JS 弱类型（`1 + "1"` 得 `"11"`）；
- Python 用缩进分块，JS 用花括号；
- 并发模型不同，JS 是单线程事件循环（Node 靠 libuv 线程池补 IO），Python 是多线程 + GIL，另有一套 asyncio；
- 继承上 JS 是原型链，Python 是基于类的多继承；
- 生态上 JS 主导前端/Node，Python 主导数据、AI 与后端脚本。

### Python 有哪些基本数据类型？（华为 / 字节跳动 / 小米）

- 数值：`int` / `float` / `complex` / `bool`
- 序列：`str` / `list` / `tuple` / `range`
- 映射：`dict`
- 集合：`set` / `frozenset`
- 空值：`None`（`NoneType`）

可变：`list` / `dict` / `set` / `bytearray`
不可变：`int` / `float` / `complex` / `bool` / `str` / `tuple` / `frozenset`

### list 和 tuple（元组）的区别是什么，什么时候用元组？（华为）

核心是可变性：list 可增删改，tuple 创建后不能改，因而可哈希、能当 dict 的 key，且内存更紧凑、创建更快。用途上：tuple 表达「一条固定结构的记录」（坐标、数据库一行、函数多返回值、作为常量），list 表达「同类型的可变集合」。另外 tuple 没有 `append` 等方法，也不会被意外修改，适合做只读约定。

一个语法细节：`(1)` 只是带括号的整数，不是元组；单元素元组要写 `(1,)`，空元组是 `()`。**决定元组的是逗号，不是括号**。

### `is` 和 `==` 有什么区别？函数传参传的是什么？

`==` 比较**值**是否相等（走 `__eq__`），`is` 比较是不是**同一个对象**（内存身份）。

```python
a = [1, 2]
b = [1, 2]
a == b   # True
a is b   # False
```

判断空值一律写 `is None`：`None` 是单例，也不会被自定义 `__eq__` 干扰。小整数和短字符串有缓存，`is` 可能碰巧为 `True`，**不要拿它比值**。

这套「名字指向对象」的模型也解释了函数传参：Python 传的是**对象引用**，不是值拷贝。

```python
def f(xs):
    xs.append(1)     # 改的是同一个对象，外部能看到
    xs = []          # 只让局部名字指向别处，外部不受影响

a = []
f(a)
print(a)             # [1]
```

传 `int` / `str` 时因为对象不可变，看起来才像「值传递」。严谨说法是「传递对象引用」：既不是纯值传递，也不是 C++ 那种引用别名。

### 函数默认参数写 `[]` 会怎样？怎么改？

默认参数在**函数定义时**求值一次，所有调用共享同一个列表：

```python
def add(x, bucket=[]):
    bucket.append(x)
    return bucket

add(1)   # [1]
add(2)   # [1, 2]  ← 不是新列表
```

改成 `bucket=None`，函数内 `if bucket is None: bucket = []`。这个坑在 AI 生成的 Python 里很常见，读代码时看到可变默认值要先打个问号。

### `*args` / `**kwargs` 是什么？什么时候用？

`*args` 把多余的位置参数收成 tuple，`**kwargs` 把多余的关键字参数收成 dict。常用于包装/转发调用、装饰器、给框架传可选配置；调用侧 `f(*xs)` / `f(**d)` 是对应的拆包写法。

定义顺序固定为 `def f(a, *args, kw=1, **kwargs)`，写错会直接语法报错。

### dict 的 key 为什么要求可哈希？

dict 靠哈希值定位槽位，要求 key 的哈希**稳定**。可变对象内容一变哈希就变，字典就找不到它了，所以 `list` / `dict` / `set` 不能当 key；`str` / `int` / `tuple` 可以。

注意 tuple 里如果嵌了 list，同样不可哈希。实际要用「一组值」当 key 时，用 tuple 而不是 list，或先 `json.dumps(..., sort_keys=True)` 生成稳定字符串。

### GIL 是什么？为什么多线程有时「没用」？

GIL（全局解释器锁）是 CPython 里的一把锁：**同一个进程中，同一时刻只有一个线程在执行 Python 代码**。

| 任务类型 | 多线程有用吗 | 通常怎么做 |
|---|---|---|
| CPU 密集（大量计算、图像处理） | 没用，线程抢锁反而更慢 | 多进程，或交给 numpy 这类 C 扩展 |
| IO 密集（等接口、等数据库、读写文件） | 有用，等 IO 时会释放锁 | 多线程 / 异步 |

- 它是 **CPython 解释器的实现**，不是 Python 语言的规定；PyPy 就没有 GIL。
- 它**不等于「Python 不能并发」**：IO 等待期间锁会放开，一个 Web 服务同时挂几百个请求没问题 —— 这也是调 LLM 接口用异步收益大的原因。

## 常用数据结构与写法

### 浅拷贝、深拷贝和共享引用有哪些坑？

浅拷贝只新建外层容器，内层元素还是原来的引用；深拷贝递归复制到底，完全独立。

```python
import copy

a = [[1, 2]]
b = a.copy()
b[0][0] = 9        # a 也变成 [[9, 2]]

c = copy.deepcopy(a)  # c 与 a 完全独立
```

嵌套结构（多层配置、请求体、批量参数）要独立修改时，用 `copy.deepcopy` 或干脆重新构造一份。`a[:]`、`list(a)`、`dict(a)` 都是浅拷贝。

同一套「共享引用」问题还有两个高频现场：

**用乘法创建二维数组**

```python
grid = [[0] * 3] * 3
grid[0][0] = 1
# [[1, 0, 0], [1, 0, 0], [1, 0, 0]] ← 三行一起变
```

`*` 复制的是**同一个内层 list 的引用**，不是三个新列表。正确写法是 `[[0] * 3 for _ in range(3)]`（内层 `[0] * 3` 安全，因为元素是不可变的 int）。

**边遍历边删元素**

```python
nums = [1, 2, 3, 4, 5]
for n in nums:
    if n < 4:
        nums.remove(n)
print(nums)          # [2, 4, 5] ← 2 被跳过了
```

`for` 背后是下标递增，删掉当前元素后后面的元素前移，下一个就被跳过。要过滤就生成新列表（`[n for n in nums if n >= 4]`），或者遍历副本 `for n in list(nums)`。

### `json.dumps` 和前端 `JSON.stringify` 有什么差别？

- `json.dumps` 默认把非 ASCII 转成 `\uXXXX`，接口要返回中文得写 `ensure_ascii=False`；
- Python 的 `None` / `True` / `False` 对应 `null` / `true` / `false`，但 `datetime`、`Decimal`、`bytes` **不能直接序列化**，要先转字符串或传 `default=`；
- dict 的 key 只能是 str / int / float / bool / None，其它类型会被强转或报错。

前后端联调时这几处最容易对不上，属于真实项目里天天遇到的差异。

## 工程常识

### `if __name__ == "__main__":` 是干嘛的？

模块被直接运行时 `__name__` 是 `"__main__"`，被 import 时是模块名。这行让「脚本入口」只在直接执行时触发，避免 import 就跑去建表、起服务、发请求。

写 CLI、本地调试脚本、数据迁移脚本时基本都要加。

### Python 的模块和包怎么组织？相对导入是什么？

一个 `.py` 是一个模块，带 `__init__.py` 的目录是包（3.3+ 支持隐式命名空间包，但项目里显式写更稳）。

`from . import x` 是相对导入，只能在包内部用；直接 `python 某文件.py` 跑包内模块会报 `ImportError: attempted relative import with no known parent package`，改用 `python -m 包.模块` 从包外启动。这类报错大半是**运行方式不对**，不是代码写错。

### 类型注解有什么用？运行时会检查吗？

`def f(x: int) -> str` 只是标注，**运行时不校验**，`f("a")` 照样能进函数。价值在编辑器补全、静态检查（mypy / pyright）和可读性。

真正做运行时校验的是 Pydantic / FastAPI：它们读注解去解析和校验请求体，所以在 Web 项目里写注解是有实际效果的。注解不等于类型系统，这是最常被混淆的一点。

### 同步阻塞和异步有什么区别？为什么调 LLM API 适合异步？

同步调用发起后就占着线程等结果；异步在等 IO 时把控制权交回事件循环，让同一个线程去处理别的请求。

调 LLM、数据库、HTTP 接口几乎全是等待，异步能让很多请求同时挂着，吞吐明显更好；CPU 密集计算则没有收益。

一条硬规则：`async def` 里不能放 `requests`、`time.sleep`、同步数据库驱动，会把整个事件循环卡住。

## 写项目绕不开的语法

### 装饰器是什么？`@` 语法做了什么？

装饰器是「接收函数、返回新函数」的高阶函数，`@deco` 等价于 `func = deco(func)`，在**函数定义时**执行一次。

```python
import functools

def log(func):
    @functools.wraps(func)          # 保留 __name__ / __doc__
    def wrapper(*args, **kwargs):
        print(f"call {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log
def add(a, b):
    return a + b
```

不加 `functools.wraps` 的话，被装饰函数的名字和文档会变成 `wrapper`，日志、调试、以及框架按函数名注册路由时都会出问题。带参数的装饰器是三层嵌套：外层收参数、中层收函数、内层是 wrapper。

写项目时到处都是它：FastAPI 的 `@app.get`、pytest 的 `@pytest.fixture`、`@lru_cache`、`@classmethod`。

### 闭包是什么？`nonlocal` 解决什么问题？

闭包是「函数记住了定义时所在作用域的变量」——外层函数已经返回，内层函数还能读写那些变量。

```python
def counter():
    n = 0
    def inc():
        nonlocal n        # 声明要修改外层的 n
        n += 1
        return n
    return inc
```

不写 `nonlocal`，`n += 1` 会被当成在 `inc` 里新建一个局部变量，直接抛 `UnboundLocalError`；只读取不赋值则不需要它。

这条规则**不限于闭包**：函数体内只要给某个名字赋过值，Python 就把它当成局部变量，哪怕外面有同名全局变量；只有读、不赋值时才会往外一层找。想改外层函数的变量用 `nonlocal`，想改模块级的用 `global`。

最容易踩的是**循环里创建闭包**：

```python
funcs = [lambda: i for i in range(3)]
[f() for f in funcs]   # [2, 2, 2]，不是 [0, 1, 2]
```

闭包捕获的是变量本身而不是当时的值，循环结束时 `i` 已是 2。用默认参数 `lambda i=i: i` 把值固定下来。

### 可迭代对象、迭代器、生成器有什么区别？

- **可迭代对象**：实现了 `__iter__`，能放进 `for`（list、dict、str、文件对象）。
- **迭代器**：实现了 `__next__`，`for` 循环背后就是不断 `next()` 直到 `StopIteration`。
- **生成器**：函数里带 `yield`，调用时返回生成器对象，**惰性求值，用到才算一个**。

```python
squares = [x * x for x in range(10**7)]   # 一次性算完，占内存
squares = (x * x for x in range(10**7))   # 生成器表达式，内存恒定
```

两个实际点：生成器**遍历完就空了** —— 迭代器自己持有「走到哪了」的状态，不会自动重置，要复用得重新生成或转成 list；`(x for x in ...)` 是生成器表达式，不是元组。处理大文件、分页接口、LLM 流式输出都是这个模式。

### `with` 是干嘛的？自己怎么实现一个上下文管理器？

`with` 保证资源一定被释放，即使中途抛异常：

```python
with open("a.txt") as f:
    data = f.read()
```

自己实现有两种：类里定义 `__enter__` / `__exit__`，或者用 `contextlib.contextmanager` + `yield`：

```python
from contextlib import contextmanager

@contextmanager
def session():
    conn = get_conn()
    try:
        yield conn          # yield 之前是进入逻辑
    finally:
        conn.close()        # 一定会执行
```

FastAPI 里 `yield` 式依赖（请求开始建连接、响应结束后关闭）就是这个写法。

### `try / except` 怎么写才不出事？

- 不要写裸 `except:`：它会连 `KeyboardInterrupt`、`SystemExit` 一起吞掉，程序该停时停不下来；至少写 `except Exception as e`。
- `finally` 放清理逻辑，无论是否异常都执行；`else` 只在 try 没抛异常时跑，用来把「成功路径」和「可能抛错的代码」分开。
- 捕获后要换一种异常抛出去时，用 `raise NewError(...) from e` 保留原始堆栈，线上排错全靠这条链。
- 只捕获你能处理的类型，捕获太宽会把真 bug 藏起来。

### `if not x` 有什么坑？怎么判断「参数没传」？

Python 里 `0`、`""`、`[]`、`{}`、`None` 都是假值，所以 `if not items:` 分不清「空列表」和「压根没传」。

```python
def handle(items=None):
    if items is None:      # 只判断「没传」
        items = []
```

判断有没有传用 `is None` / `is not None`，判断容器空不空再单独处理。另一处常见错误是把「合法的空结果」当成失败：`[]` / `{}` / `0` 都是假值，`if data:` 判不了「有数据但恰好是 0」。

## 类与线上实践

### `@dataclass` 是什么，什么时候用？

定义「主要用来装数据」的类时，手写 `__init__`、`__repr__`、`__eq__` 很啰嗦，`dataclass` 帮你按字段生成：

```python
from dataclasses import dataclass, field

@dataclass
class User:
    id: int
    name: str
    tags: list[str] = field(default_factory=list)
```

三个实用点：

- 类型注解是**必需的**，dataclass 靠它决定有哪些字段；
- 可变默认值必须写 `field(default_factory=list)`，直接写 `= []` 会踩和默认参数一样的共享坑；
- 配置对象、接口 DTO、内部数据结构用它最省事；需要运行时校验时换 Pydantic 的 `BaseModel`，它会按注解真正校验请求体。

### 实例属性和类属性有什么区别？有什么坑？

实例属性写在 `self.x` 里，每个对象一份；类属性写在类体里，所有实例**共享同一份**。

```python
class Handler:
    cache = []          # 类属性，所有实例共用这一个 list

    def add(self, x):
        self.cache.append(x)

a, b = Handler(), Handler()
a.add(1)
print(b.cache)          # [1] ← b 也跟着变了
```

坑就在类属性是可变对象时：一个实例改了，其它实例全受影响。要每份独立就放进 `__init__`（`self.cache = []`）。

查找顺序是「实例 → 类 → 父类」；`self.cache = ...` 是给实例新建属性、遮蔽类属性，并不会改到类属性本身。

### 为什么线上项目用 `logging` 而不是 `print`？

`print` 只能写到标准输出，没法分级、没法按环境开关、也带不上上下文。

```python
import logging

logger = logging.getLogger(__name__)

logger.info("task started: %s", task_id)
try:
    ...
except Exception:
    logger.exception("task failed")   # 自动带完整堆栈
```

实际差别：

- 有 `DEBUG / INFO / WARNING / ERROR` 级别，线上把级别调成 `WARNING` 就能关掉调试输出，不用删代码；
- 能带时间戳、模块名、请求 ID，也能同时写文件或推到日志系统；
- `logger.exception` 自动记录堆栈，排查线上问题基本靠它；
- `print` 在异步/多进程里输出顺序乱，还可能被缓冲吞掉。

别用 f-string 拼日志（`logger.info(f"...{obj}")`）：字符串每次都会算，哪怕该级别已被关掉；用 `%s` 占位交给 logger 延迟格式化。
