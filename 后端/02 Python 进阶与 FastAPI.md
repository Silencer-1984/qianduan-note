# Python 进阶与 FastAPI

## ⭐⭐ Python 的 GIL 是什么？影响是什么？

**参考答案**：CPython 的全局解释器锁，同一进程内同一时刻只有一个线程执行 Python 字节码。
- **CPU 密集型**：多线程无法并行，要用**多进程**。
- **IO 密集型**：线程等 IO 时会释放 GIL，多线程仍然有效；异步 IO 更轻量。
- 所以 FastAPI 里调 LLM API 这种 IO 密集任务，**异步收益最大**。

**追问**：
- *GIL 会取消吗？* → Python 3.13 有实验性的 free-threaded 构建，但生态兼容需要时间；短期多进程仍是主流。

## ⭐ 装饰器原理？

**参考答案**：装饰器是**接收函数、返回函数**的高阶函数，`@decorator` 等价于 `func = decorator(func)`，靠**闭包**保存原函数引用。常见用途：日志、计时、鉴权、缓存（`functools.lru_cache`）。要用 `functools.wraps` 保留元信息。

## ⭐ FastAPI 的依赖注入（Depends）怎么用？

**参考答案**：`Depends` 声明依赖，FastAPI 在请求时解析并注入。典型用途：数据库 session、当前用户鉴权、分页参数。依赖可以嵌套，也可以带 `yield` 做资源清理（请求结束后自动关闭连接）。

**追问**：
- *`yield` 依赖的清理逻辑什么时候执行？* → 响应完成后执行，适合关连接、回滚事务。

## ⭐⭐ FastAPI 里 async def 和普通 def 路由有什么区别？

**参考答案**：
- `async def` 路由在**事件循环**里执行；里面若有同步阻塞调用（requests、time.sleep、阻塞式 DB 驱动），会卡住整个 worker。
- 普通 `def` 路由，FastAPI 会丢到**线程池**执行，不会阻塞事件循环——但线程池有上限。
- 结论：**要么全程异步（httpx、asyncpg），要么用普通 def 让框架进线程池；不要 async 里混同步阻塞调用。**

**追问**：
- *怎么发现代码里有阻塞调用？* → 压测看吞吐、监控事件循环延迟、审查 IO 库是否异步版本。

## ⭐ Pydantic 在 FastAPI 里的作用？

**参考答案**：请求体校验（类型、范围、必填）、`response_model` 控制输出字段（防止敏感字段泄漏）、自动生成 OpenAPI 文档、错误信息结构化。它是"接口契约"的落地方式。

**追问**：
- *response_model 为什么重要？* → 同时做**过滤**和**序列化**：不在模型里的字段会被丢掉，避免把密码哈希、内部字段返回给前端。

## ⭐ FastAPI 怎么部署？workers 开多少？

**参考答案**：`uvicorn` 直接跑，或 `gunicorn -k uvicorn.workers.UvicornWorker` 做进程管理。每个 worker 是独立进程 + 独立事件循环。
- workers 常见起点是 CPU 核数，IO 密集型可适当多开。
- 配合健康检查、优雅关闭、连接池大小（每个 worker 各持池，别把数据库连接打满）。

**追问**：
- *为什么不建议在容器里开很多 worker？* → 容器 CPU 限额下多进程会争抢；通常用编排横向扩副本，而不是单容器开满 worker。
