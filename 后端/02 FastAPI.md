# FastAPI 接口开发

## FastAPI 和 Flask / Django 的区别？适合什么场景？

三者定位不同：Flask 是微框架、Django 是全家桶、FastAPI 是**以 API 契约为中心**的异步框架。

| | Flask | Django | FastAPI |
|---|---|---|---|
| 定位 | 微框架，组件自己拼 | ORM / Admin / 模板 / 认证全自带 | 只做 API 层，其余自己选 |
| 校验 | 手写或装扩展 | Form / DRF Serializer | Pydantic 原生，类型即契约 |
| 异步 | 后补，生态参差 | 逐步支持 | 原生 async |
| 文档 | 需扩展 | 需 DRF | 自动生成 `/docs`、`/openapi.json` |

怎么选：要快速有后台管理和权限体系选 Django；已有 Flask 生态或极小服务选 Flask；**给前端/移动端提供接口、要类型校验和自动文档、要调 LLM 这类 IO 密集服务**选 FastAPI。

一个实际差别：FastAPI 不自带 ORM 和 Admin，数据库层一般配 SQLAlchemy，认证、限流也要自己接 —— 灵活但要多做决定。

## FastAPI 怎么做参数校验？校验失败返回什么？

用 Pydantic 模型声明请求体，类型注解本身就是校验规则：

```python
from pydantic import BaseModel, Field

class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    user_id: int

@app.post("/chat")
async def chat(body: ChatIn):
    ...
```

三个位置：路径/查询参数用函数签名注解，请求体用 `BaseModel`，更细的约束用 `Field` 或 `Annotated`。

校验失败返回 **HTTP 422**（不是 400），body 是结构化的 `detail` 数组，带 `loc`（哪个字段）、`msg`（原因）、`type`：

```json
{"detail":[{"loc":["body","message"],"msg":"String should have at least 1 characters","type":"string_too_short"}]}
```

422 表示「请求格式没问题、语义校验没过」，前端要按它做字段级错误提示。反过来，**把参数直接写成 `message: str` 而不包模型，它会变成查询参数** —— 长文本和敏感内容就进了 URL 和访问日志。

## async def 和 def 接口有什么区别？怎么选？

- `async def`：在事件循环里跑，遇到 `await` 交出控制权；**里面不能有任何同步阻塞调用**（`requests`、`time.sleep`、同步数据库驱动），否则整个 worker 被卡住。
- `def`：FastAPI 自动丢进线程池执行，不阻塞事件循环，但线程池有上限。

怎么选：全程异步 IO（`httpx.AsyncClient`、`asyncpg`、异步 Redis）用 `async def`；只有同步库可用就老实用 `def`；纯 CPU 计算两者都不合适，丢任务队列或多进程。

一条硬规则：**不要在 `async def` 里混同步阻塞调用**。这是 AI 生成接口最常见的错误，本文最后一题那段代码就踩了。

## 什么是依赖注入？你用它解决过什么问题？

`Depends` 把「接口需要的公共东西」声明在函数签名上，框架在请求时解析并注入，而不是接口里自己创建：

```python
def get_db():
    with SessionLocal() as db:
        yield db          # 响应完成后自动关闭

@app.post("/chat")
async def chat(body: ChatIn, db=Depends(get_db), user=Depends(current_user)):
    ...
```

主要解决三类重复：

- 数据库连接的获取与清理 —— `yield` 依赖的清理逻辑在**响应完成后**执行；
- 鉴权 —— 把「取当前用户」做成依赖，需要登录的接口挂上即可；
- 公共参数 —— 分页、租户 ID、请求上下文。

依赖可以嵌套，同一次请求里同一个依赖默认只解析一次；测试时用 `app.dependency_overrides` 换掉真实依赖，不用改接口代码。

## response_model 的作用？为什么要区分输入输出模型？

`response_model` 同时做**过滤**和**序列化**：只输出模型声明的字段，多余字段被丢掉。

```python
class UserOut(BaseModel):
    id: int
    name: str

@app.get("/me", response_model=UserOut)
async def me(): ...
```

输入输出模型要分开，原因很实在：

- 输入模型（如 `UserCreate`）含密码，输出模型不能有 `password_hash`、内部状态、上游原始响应；
- 数据库实体常有 `created_at`、软删除标记等不该暴露的字段；
- 契约稳定：前端只依赖输出模型，内部改表结构不会动到接口。

它还参与 OpenAPI 生成，`/docs` 里能直接看到响应结构。**不写 `response_model` 时按返回值原样序列化**，这就是「直接 `return r.json()` 会暴露上游响应结构」的原因。

## 怎么做认证？JWT 流程讲一下。

流程四步：

1. 客户端拿账号密码换 token（`POST /login`）；
2. 服务端校验通过后签发 JWT（`header.payload.signature`），payload 放 `sub`（用户 ID）和 `exp`（过期时间）；
3. 之后请求带 `Authorization: Bearer <token>`；
4. 用 `Depends` 配合 `HTTPBearer` / `OAuth2PasswordBearer` 取出 token，验签、验过期，解析出当前用户注入接口。

三个必须记住的点：

- JWT 是**签名不是加密**，payload 只是 Base64 编码，别放密码、手机号等敏感信息；
- 无状态，服务端不存 session，所以**注销或改密后旧 token 仍然有效**直到过期。常见做法是 access token 短有效期 + refresh token，或维护黑名单/令牌版本号；
- 签名密钥放环境变量，密码用哈希库存储校验，绝不写进代码或提交到 Git。

## 怎么实现流式输出？前后端怎么配合？

服务端用 `StreamingResponse` 包一个异步生成器，逐块 `yield`：

```python
from fastapi.responses import StreamingResponse

@app.post("/stream")
async def stream(body: ChatIn):
    async def gen():
        async for chunk in llm_client.stream(body.message):
            yield f"data: {chunk}\n\n"     # SSE 格式：data 行 + 空行分隔

    return StreamingResponse(gen(), media_type="text/event-stream")
```

前后端配合：

- **SSE**（`text/event-stream`）：服务端单向推。浏览器 `EventSource` 只能 GET，要带请求体就用 `fetch` + `response.body.getReader()` 逐块读。
- 也可以直接返回 chunked 文本流，前端同样用 `ReadableStream` 读。
- 响应头带上 `Cache-Control: no-cache`，Nginx 反代要设 `X-Accel-Buffering: no`，否则代理会把流攒起来一次性发出，「流式」就没了。

生成器里同样不能放同步阻塞调用；客户端断开时要能收尾，别把上游连接挂死。

## 生产环境怎么部署？（Docker + Uvicorn/Gunicorn、环境变量、反向代理）

典型链路：**Nginx（TLS / 反代）→ Gunicorn（管进程）→ UvicornWorker（跑 ASGI）→ FastAPI**。

```bash
gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000
```

- **worker 数**：从 CPU 核数起步，IO 密集可适当多开。容器有 CPU 限额时别按宿主机核数算，更常见的是**单容器少 worker + 横向扩副本**。每个 worker 是独立进程、独立事件循环、独立连接池 —— 这直接决定了**全局变量不能用来存状态**。
- **环境变量**：密钥、数据库地址、`ENV` 全部运行时注入（Pydantic `BaseSettings` 读取），不进镜像、不进 Git；`.env` 只用于本地开发。
- **Docker**：先装依赖再拷代码以复用层缓存、非 root 用户运行、多阶段构建减小体积（分层细节见「数据与部署」）。
- **反向代理**：Nginx 负责 TLS、超时、`client_max_body_size`、透传真实 IP；流式接口要关缓冲。
- 另外补上 `/healthz` 健康检查、优雅关闭、结构化日志。

## 如果 AI 帮你写了一个接口，你上线前会检查什么？

这是一段很典型的 AI 生成代码，几乎把常见错误集齐了：

```python
from fastapi import FastAPI
import requests, sqlite3

app = FastAPI()
OPENAI_KEY = "sk-abc123"
history = []

@app.post("/chat")
async def chat(message: str, user_id):
    history.append(message)
    r = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_KEY}"},
        json={"model": "gpt-4o", "messages": [{"role": "user", "content": message}]},
    )
    conn = sqlite3.connect("db.sqlite")
    conn.execute(f"INSERT INTO logs VALUES ('{user_id}', '{message}')")
    return r.json()
```

至少十处问题：

| # | 问题 | 后果 / 改法 |
|---|---|---|
| 1 | API Key 硬编码 | 提交到 Git 即泄露 → 环境变量 / 密钥管理 |
| 2 | `history` 全局变量 | 所有用户对话混在一起、多 worker 各持一份、无限增长撑爆内存 → 状态放 DB / Redis，按用户隔离 |
| 3 | `message: str` 没用请求体模型 | 变成查询参数，长文本和敏感内容进 URL 与访问日志 → Pydantic `BaseModel` |
| 4 | `user_id` 无类型注解、无认证 | 没有校验，任何人可冒充任何用户 → 加类型 + `Depends` 取当前用户 |
| 5 | `async def` 里用 `requests` | 阻塞事件循环，并发直接崩 → `httpx.AsyncClient` + `await`，或改成 `def` 走线程池 |
| 6 | 外部请求没有 timeout | 对方卡住，你的接口跟着无限等 → 设超时，配合重试与退避 |
| 7 | 没检查 `r.status_code`，也没 try/except | 限流 429 / 上游报错时把对方错误原样透传 → 判状态、捕获异常、转成自己的错误响应 |
| 8 | f-string 拼 SQL | SQL 注入 → 参数化 `execute(sql, (user_id, message))` 或用 ORM |
| 9 | 连接没 commit、没 close | 数据可能没写进去、连接泄漏 → `with` / `yield` 依赖 / 连接池 |
| 10 | 每次请求新建连接，直接返回 `r.json()` | 性能差；暴露上游响应结构，字段随上游变动 → 复用客户端与连接池 + `response_model` |

由此可以固化成一份上线前清单：

- [ ] **安全**：密钥、认证、SQL/命令注入、CORS、响应有没有泄露内部字段
- [ ] **正确性**：有没有漏 `await`、`async def` 里有没有阻塞调用、可变默认参数
- [ ] **健壮性**：超时、重试、异常处理、输入长度限制、限流
- [ ] **资源管理**：连接是否关闭、HTTP 客户端是否复用、有没有无限增长的数据
- [ ] **状态**：有没有依赖全局变量，多进程部署会不会不一致
- [ ] **版本**：有没有混用 Pydantic v1/v2、用了已废弃的 API
- [ ] **可验证性**：能不能用 `/docs` 或 `TestClient` 把它跑起来验证

这十处错误对应的正确写法，前面八题基本都覆盖了：请求体模型、`Depends`、`response_model`、异步客户端、环境变量与部署形态。看 AI 代码时按这份清单逐条过，比逐行读更快也不容易漏。
