# Chat API 前端联调文档

## 文档说明

本文档面向前端联调用途，整理聊天模块当前已经开放的 3 个 HTTP 接口：

- `POST /api/v1/chat/sessions`
- `GET /api/v1/chat/sessions`
- `GET /api/v1/chat/sessions/{session_id}/messages`

文档内容已经基于当前后端真实实现核对，适合直接用于接口对接、页面联调和错误处理落地。

对应后端代码位置：

- 路由注册：`route/chat_routes.go`
- 处理器实现：`handler/chat.go`
- 统一响应结构：`handler/response.go`

## 通用约定

### Base URL

```text
/api/v1
```

### 鉴权方式

这 3 个接口都在 JWT 鉴权保护下，必须携带请求头：

```http
Authorization: Bearer <your-jwt-token>
```

如果接口返回 `401`，通常表示：

- 未登录
- token 已过期
- token 格式错误
- token 无效

### Content-Type

- `POST /chat/sessions`：建议显式携带 `Content-Type: application/json`
- `GET` 接口：一般不需要额外指定 `Content-Type`

### 统一响应结构

所有接口都使用统一响应包裹结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

响应字段说明：

- `code`：业务状态码，成功时固定为 `0`
- `message`：成功时通常为 `success`，失败时为后端错误提示
- `data`：真正的业务数据载荷

### 前端成功判断建议

建议同时判断：

1. HTTP 状态码是否为 `200`
2. 响应体中的 `code` 是否为 `0`

### 前端失败处理建议

建议优先按 HTTP 状态码处理，再展示后端 `message`：

- `400`：参数错误或业务校验失败
- `401`：未授权，需要重新登录
- `403`：无权限访问指定资源
- `500`：服务端内部错误

## 1. 创建聊天会话

### 创建接口信息

- 方法：`POST`
- 路径：`/api/v1/chat/sessions`
- 用途：创建一个新的聊天会话

### 适用场景

- 用户点击“新建聊天”
- 用户开始一段新的叙事会话
- 用户希望显式绑定某个世界观、角色或分支

### 创建接口请求头示例

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### 请求体字段

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `world_id` | `number` | 否 | 关联世界观 ID |
| `character_id` | `number` | 否 | 关联角色 ID |
| `branch_id` | `number` | 否 | 关联世界线分支 ID |
| `title` | `string` | 否 | 会话标题 |
| `session_type` | `string` | 否 | 会话类型，默认 `chat` |

### 默认值规则

- 当 `title` 未传或为空时，后端默认写入 `新的对话`
- 当 `session_type` 未传或为空时，后端默认写入 `chat`
- 当前接口支持空请求体，前端可以直接传 `{}` 创建默认会话

### 请求示例 1：创建默认聊天会话

```http
POST /api/v1/chat/sessions HTTP/1.1
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{}
```

### 请求示例 2：创建叙事会话

```http
POST /api/v1/chat/sessions HTTP/1.1
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "world_id": 1,
  "character_id": 2,
  "branch_id": 3,
  "title": "酒馆调查",
  "session_type": "narrative"
}
```

### 创建接口成功响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "session": {
      "id": 12,
      "user_id": 1,
      "world_id": 1,
      "character_id": 2,
      "branch_id": 3,
      "title": "酒馆调查",
      "session_type": "narrative",
      "status": "active",
      "last_message_at": "2026-05-25T14:14:55Z",
      "message_count": 0,
      "input_token_total": 0,
      "output_token_total": 0,
      "created_at": "2026-05-25T14:14:55Z",
      "updated_at": "2026-05-25T14:14:55Z"
    }
  }
}
```

### 响应字段重点说明

- `session.id`：会话主键，后续查询消息列表时会用到
- `session.title`：如果前端未传，后端会补成 `新的对话`
- `session.session_type`：如果前端未传，后端会补成 `chat`
- `session.message_count`：新会话刚创建时通常是 `0`
- `session.last_message_at`：新建时会初始化为创建时间，用于列表排序

### 创建接口错误码处理建议

#### 创建接口 `400 Bad Request`

含义：

- JSON 格式错误
- 业务校验失败

常见场景：

- `character_id` 不存在
- `world_id` 不存在或不合法
- `character_id` 不属于指定 `world_id`

前端建议：

- 弹出后端返回的 `message`
- 保留当前表单输入，避免用户重复填写

#### 创建接口 `401 Unauthorized`

含义：

- 未登录或 token 无效

前端建议：

- 清理失效登录态
- 跳转登录页
- 登录成功后回到原页面

#### 创建接口 `403 Forbidden`

含义：

- 无权绑定指定世界观或资源

前端建议：

- 提示“当前资源无权限访问”
- 引导用户重新选择可访问的世界观或角色

## 2. 获取会话列表

### 列表接口信息

- 方法：`GET`
- 路径：`/api/v1/chat/sessions`
- 用途：分页获取当前登录用户的聊天会话列表

### 排序规则

后端按最近活跃时间倒序返回，也就是：

- 最近有消息的会话优先展示
- 没有新消息但刚创建的会话也能出现在前面

### Query 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `page` | `number` | 否 | `1` | 页码，从 1 开始 |
| `limit` | `number` | 否 | `10` | 每页数量，最大 `100` |

### 列表接口请求示例

```http
GET /api/v1/chat/sessions?page=1&limit=10 HTTP/1.1
Authorization: Bearer <your-jwt-token>
```

### 列表接口成功响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sessions": [
      {
        "id": 12,
        "user_id": 1,
        "world_id": 1,
        "character_id": 2,
        "branch_id": 3,
        "title": "酒馆调查",
        "session_type": "narrative",
        "status": "active",
        "last_message_at": "2026-05-25T14:30:12Z",
        "message_count": 8,
        "input_token_total": 1200,
        "output_token_total": 2600,
        "created_at": "2026-05-25T14:14:55Z",
        "updated_at": "2026-05-25T14:30:12Z"
      },
      {
        "id": 11,
        "user_id": 1,
        "title": "新的对话",
        "session_type": "chat",
        "status": "active",
        "last_message_at": "2026-05-25T13:00:00Z",
        "message_count": 0,
        "input_token_total": 0,
        "output_token_total": 0,
        "created_at": "2026-05-25T13:00:00Z",
        "updated_at": "2026-05-25T13:00:00Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 10
  }
}
```

### 前端展示建议

会话列表项可优先使用以下字段：

- 标题：`title`
- 类型标签：`session_type`
- 最后活跃时间：`last_message_at`
- 消息数：`message_count`

分页器可直接使用：

- `total`
- `page`
- `limit`

### 列表接口错误码处理建议

#### 列表接口 `400 Bad Request`

含义：

- 查询参数格式错误

常见场景：

- `page` 不是数字
- `limit` 不是数字

前端建议：

- 调用层对分页参数做数值兜底
- 发生错误时提示“分页参数错误”

#### 列表接口 `401 Unauthorized`

含义：

- 未登录或 token 已失效

前端建议：

- 统一跳转登录流程

#### 列表接口 `500 Internal Server Error`

含义：

- 服务端查询失败

前端建议：

- 提示“会话列表加载失败，请稍后重试”
- 保留当前页面状态，允许用户点击重试

## 3. 获取会话消息列表

### 消息接口信息

- 方法：`GET`
- 路径：`/api/v1/chat/sessions/{session_id}/messages`
- 用途：分页读取指定会话中的历史消息

### 消息排序规则

后端按 `sequence_no ASC` 正序返回，前端可以直接按返回顺序渲染，不需要再自行排序。

### Path 参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session_id` | `number` | 是 | 会话 ID |

### 消息接口 Query 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `page` | `number` | 否 | `1` | 页码 |
| `limit` | `number` | 否 | `20` | 每页数量，最大建议 `100` |

### 消息接口请求示例

```http
GET /api/v1/chat/sessions/12/messages?page=1&limit=20 HTTP/1.1
Authorization: Bearer <your-jwt-token>
```

### 消息接口成功响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "messages": [
      {
        "id": 101,
        "session_id": 12,
        "user_id": 1,
        "world_id": 1,
        "character_id": 2,
        "sequence_no": 1,
        "role": "user",
        "message_type": "text",
        "status": "done",
        "content": "我走进酒馆，观察四周。",
        "content_format": "plain",
        "model_name": "",
        "provider": "human",
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "latency_ms": 0,
        "created_at": "2026-05-25T14:20:00Z",
        "updated_at": "2026-05-25T14:20:00Z"
      },
      {
        "id": 102,
        "session_id": 12,
        "user_id": 1,
        "world_id": 1,
        "character_id": 2,
        "sequence_no": 2,
        "role": "assistant",
        "message_type": "text",
        "status": "done",
        "content": "酒馆里弥漫着麦酒与潮湿木头混杂的气味，角落里几名佣兵正低声交谈。",
        "content_format": "plain",
        "model_name": "deepseek-chat",
        "provider": "deepseek",
        "prompt_tokens": 356,
        "completion_tokens": 128,
        "latency_ms": 0,
        "created_at": "2026-05-25T14:20:03Z",
        "updated_at": "2026-05-25T14:20:03Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20,
    "session_id": 12
  }
}
```

### 消息接口响应字段重点说明

- `messages`：当前页消息数组
- `total`：该会话消息总数
- `page`：当前页码
- `limit`：当前页大小
- `session_id`：当前会话 ID

单条消息重点字段：

- `role`：消息角色，常见值为 `user`、`assistant`
- `content`：消息正文
- `sequence_no`：消息在会话内的稳定顺序号
- `status`：消息状态，当前常见值为 `done`
- `extra`：扩展信息，可能在部分 AI 消息中出现，前端按需读取

### 消息接口错误码处理建议

#### 消息接口 `400 Bad Request`

含义：

- `session_id` 格式错误
- 查询参数格式错误
- 业务参数异常

常见场景：

- 路径中的 `session_id` 不是数字

前端建议：

- 检查路由参数拼接逻辑
- 检查分页参数是否被错误传成字符串或非法值

#### 消息接口 `401 Unauthorized`

含义：

- 未登录或 token 失效

前端建议：

- 统一走登录失效处理

#### 消息接口 `403 Forbidden`

含义：

- 当前用户无权访问该会话

常见场景：

- 用户尝试访问别人的会话

前端建议：

- 提示“该会话不存在或无权限访问”
- 页面回退到会话列表页

## 推荐联调顺序

建议前后端按以下顺序联调：

1. 调用 `POST /api/v1/chat/sessions` 创建一个新会话
2. 从响应中拿到 `session.id`
3. 调用 `GET /api/v1/chat/sessions`，确认新会话能出现在列表中
4. 调用 `GET /api/v1/chat/sessions/{session_id}/messages`，确认会话详情页能正常取数

如果会话刚创建且还没有任何消息，返回空数组是正常现象：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "messages": [],
    "total": 0,
    "page": 1,
    "limit": 20,
    "session_id": 12
  }
}
```

## 前端调用建议

### 创建普通聊天

如果只是新建一个普通聊天会话，直接发送：

```json
{}
```

不需要强制传标题，也不需要强制传 `session_type`。

### 会话列表展示

建议做以下兜底：

- 标题显示：`title || "新的对话"`
- 时间显示：优先使用 `last_message_at`
- 空列表时展示“暂无会话”

### 消息列表渲染

后端已经按正序返回消息，前端可直接使用：

```ts
messages.forEach(renderMessage)
```

不建议前端再额外做一次升序排序，以免引入不必要的二次处理。

### 错误提示区分

建议不要把所有错误都提示成“系统错误”，至少区分：

- `400`：参数错误或业务校验失败
- `401`：登录失效
- `403`：无权限访问
- `500`：服务异常，请稍后重试

## 推荐前端类型定义

```ts
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface ChatSession {
  id: number
  user_id: number
  world_id?: number
  character_id?: number
  branch_id?: number
  title: string
  session_type: string
  status: string
  summary?: string
  last_message_at: string
  message_count: number
  input_token_total: number
  output_token_total: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  session_id: number
  user_id: number
  world_id?: number
  character_id?: number
  branch_id?: number
  sequence_no: number
  role: string
  message_type: string
  status: string
  content: string
  content_format: string
  model_name?: string
  provider?: string
  prompt_tokens: number
  completion_tokens: number
  latency_ms: number
  reply_to_message_id?: number
  error_message?: string
  extra?: Record<string, unknown>
  created_at: string
  updated_at: string
}
```

## 文档更新说明

本文档基于当前后端实现整理，已经覆盖以下真实行为：

- 创建会话接口支持空请求体
- 会话列表接口支持分页并返回分页信息
- 消息列表接口按稳定顺序正序返回
- 所有接口都需要 JWT 鉴权

如果后续聊天模块增加“发送消息”“删除会话”“重命名会话”等接口，建议继续在本文档中追加对应章节，保持前端联调口径统一。
