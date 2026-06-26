# AI408 后端接口文档（MVP）

> 说明：以下接口以 `REST + JSON + JWT` 为基础，接口前缀统一为 `/api/v1`。  
> 请求体示例默认使用 `{ "data": {...} }` 包裹，若后端网关不需要外层 `data`，可直接平铺字段。

## 一、通用约定

### 1.1 基础信息

- `Content-Type: application/json`
- `Authorization: Bearer <accessToken>`
- 登录成功后返回 `accessToken` 和 `refreshToken`
- 列表分页统一使用 `page.pageSize`、`page.pageIndex`

### 1.2 统一响应结构

| 参数 | 说明 | 类型 | 备注 |
| --- | --- | --- | --- |
| `code` | 状态码 | string | `200` 表示成功 |
| `message` | 提示信息 | string | 例如：`处理成功` |
| `data` | 返回数据 | object / array / null | 成功时返回业务数据 |

### 1.3 分页结构

| 参数 | 说明 | 类型 | 备注 |
| --- | --- | --- | --- |
| `page.pageSize` | 每页数量 | int | 默认 `20` |
| `page.pageIndex` | 页号 | int | 默认 `1` |
| `data.pageIndex` | 当前页 | int | 响应字段 |
| `data.pageSize` | 每页数量 | int | 响应字段 |
| `data.pageCount` | 总页数 | int | 响应字段 |
| `data.recordCount` | 总记录数 | int | 响应字段 |
| `data.records` | 列表数据 | List | 响应字段 |

### 1.4 枚举说明

| 枚举 | 值 | 说明 |
| --- | --- | --- |
| `subjectCode` | `DS` | 数据结构 |
| `subjectCode` | `CO` | 计算机组成原理 |
| `subjectCode` | `OS` | 操作系统 |
| `subjectCode` | `CN` | 计算机网络 |
| `subjectCode` | `MOCK` | 整套模考 |
| `questionType` | `single` | 单选题 |
| `questionType` | `multiple` | 多选题 |
| `questionType` | `essay` | 综合大题 |
| `sessionMode` | `sequence` | 顺序练习 |
| `sessionMode` | `mock` | 模拟考试 |
| `sessionMode` | `wrongBook` | 错题练习 |
| `sessionMode` | `favorites` | 收藏练习 |
| `questionStatus` | `new` | 未做 |
| `questionStatus` | `correct` | 正确 |
| `questionStatus` | `wrong` | 错误 |
| `favoriteImportance` | `0` | 未收藏 |
| `favoriteImportance` | `1` | 重要 |
| `favoriteImportance` | `2` | 非常重要 |
| `importStatus` | `pending` | 待处理 |
| `importStatus` | `running` | 导入中 |
| `importStatus` | `success` | 成功 |
| `importStatus` | `failed` | 失败 |

---

## 二、用户系统

### 2.1 发送验证码

服务接口地址 `POST https://<host>/api/v1/auth/send-code`  编号 `AUTH-01`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `mobile` | 手机号 | varchar(20) | 必填 |
| `scene` | 场景 | varchar(20) | 默认 `login` |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `expireSeconds` | 验证码有效期 | int | 默认 300 |

#### 调用示例

```json
{
  "data": {
    "mobile": "13800138000",
    "scene": "login"
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "expireSeconds": 300
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40001",
  "message": "手机号格式错误",
  "data": null
}
```

### 2.2 手机号验证码登录

服务接口地址 `POST https://<host>/api/v1/auth/login`  编号 `AUTH-02`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `mobile` | 手机号 | varchar(20) | 必填 |
| `code` | 验证码 | varchar(10) | 必填 |
| `deviceId` | 设备标识 | varchar(100) | 选填 |
| `clientType` | 客户端类型 | varchar(20) | 默认 `web` |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `accessToken` | 访问令牌 | varchar(500) | JWT |
| `refreshToken` | 刷新令牌 | varchar(500) | JWT |
| `expiresIn` | 过期时间 | int | 秒 |
| `user.id` | 用户ID | varchar(50) | 用户唯一标识 |
| `user.mobile` | 手机号 | varchar(20) | 用户手机号 |
| `user.nickname` | 昵称 | varchar(50) | 用户昵称 |
| `user.avatarUrl` | 头像 | varchar(255) | 头像地址 |
| `user.role` | 角色 | varchar(20) | `student` / `admin` |

#### 调用示例

```json
{
  "data": {
    "mobile": "13800138000",
    "code": "123456",
    "deviceId": "web-001",
    "clientType": "web"
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 7200,
    "user": {
      "id": "u_10001",
      "mobile": "13800138000",
      "nickname": "408 学员",
      "avatarUrl": "",
      "role": "student"
    }
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40002",
  "message": "验证码错误或已过期",
  "data": null
}
```

### 2.3 刷新 Token

服务接口地址 `POST https://<host>/api/v1/auth/refresh`  编号 `AUTH-03`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `refreshToken` | 刷新令牌 | varchar(500) | 必填 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `accessToken` | 新访问令牌 | varchar(500) | JWT |
| `refreshToken` | 新刷新令牌 | varchar(500) | JWT |
| `expiresIn` | 过期时间 | int | 秒 |

#### 调用示例

```json
{
  "data": {
    "refreshToken": "eyJhbGciOi..."
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "accessToken": "eyJhbGciOi.new...",
    "refreshToken": "eyJhbGciOi.new...",
    "expiresIn": 7200
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40101",
  "message": "登录已过期",
  "data": null
}
```

### 2.4 获取当前用户信息

服务接口地址 `GET https://<host>/api/v1/users/me`  编号 `USER-01`

#### 请求参数

无。

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `id` | 用户ID | varchar(50) | 用户唯一标识 |
| `mobile` | 手机号 | varchar(20) | 用户手机号 |
| `nickname` | 昵称 | varchar(50) | 用户昵称 |
| `avatarUrl` | 头像 | varchar(255) | 头像地址 |
| `role` | 角色 | varchar(20) | `student` / `admin` |
| `createdAt` | 创建时间 | datetime | 创建时间 |

#### 调用示例

`GET /api/v1/users/me`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "id": "u_10001",
    "mobile": "13800138000",
    "nickname": "408 学员",
    "avatarUrl": "",
    "role": "student",
    "createdAt": "2026-06-26 10:00:00"
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40100",
  "message": "未登录",
  "data": null
}
```

### 2.5 修改用户信息

服务接口地址 `PATCH https://<host>/api/v1/users/me`  编号 `USER-02`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `nickname` | 昵称 | varchar(50) | 选填 |
| `avatarUrl` | 头像地址 | varchar(255) | 选填 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `id` | 用户ID | varchar(50) | 用户唯一标识 |
| `nickname` | 昵称 | varchar(50) | 更新后的昵称 |
| `avatarUrl` | 头像地址 | varchar(255) | 更新后的头像 |

#### 调用示例

```json
{
  "data": {
    "nickname": "AI408 学员",
    "avatarUrl": "https://example.com/avatar.png"
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "id": "u_10001",
    "nickname": "AI408 学员",
    "avatarUrl": "https://example.com/avatar.png"
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "42201",
  "message": "昵称长度超出限制",
  "data": null
}
```

### 2.6 学习概览

服务接口地址 `GET https://<host>/api/v1/users/me/study-summary`  编号 `USER-03`

#### 请求参数

无。

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `answeredCount` | 已答题数 | int | 总答题量 |
| `correctCount` | 正确题数 | int | 答对数量 |
| `wrongCount` | 错题数 | int | 错题数量 |
| `favoriteCount` | 收藏数 | int | 收藏数量 |
| `todayWrongCount` | 今日新增错题 | int | 当日新增 |
| `todayFavoriteCount` | 今日新增收藏 | int | 当日新增 |
| `progressRate` | 全局进度 | int | 百分比 |
| `sessionSeconds` | 本次练习时长 | int | 秒 |

#### 调用示例

`GET /api/v1/users/me/study-summary`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "answeredCount": 128,
    "correctCount": 103,
    "wrongCount": 25,
    "favoriteCount": 36,
    "todayWrongCount": 4,
    "todayFavoriteCount": 2,
    "progressRate": 31,
    "sessionSeconds": 831
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "999",
  "message": "处理失败",
  "data": null
}
```

---

## 三、题库导入

### 3.1 下载导入模板

服务接口地址 `GET https://<host>/api/v1/admin/questions/template`  编号 `IMPORT-01`

#### 请求参数

无。

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `templateUrl` | 模板文件地址 | varchar(255) | 下载地址 |
| `version` | 模板版本 | varchar(20) | 例如 `v1` |

#### 调用示例

`GET /api/v1/admin/questions/template`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "templateUrl": "https://<host>/files/ai408-question-template.xlsx",
    "version": "v1"
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40300",
  "message": "无权限访问",
  "data": null
}
```

### 3.2 导入题库

服务接口地址 `POST https://<host>/api/v1/admin/questions/import`  编号 `IMPORT-02`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `file` | 导入文件 | file | Excel / CSV |
| `importType` | 导入类型 | varchar(20) | 默认 `replace` / `append` |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `jobId` | 导入任务ID | varchar(50) | 用于查询任务 |
| `status` | 任务状态 | varchar(20) | `pending` / `running` / `success` / `failed` |
| `totalCount` | 总条数 | int | 文件总记录数 |
| `successCount` | 成功条数 | int | 导入成功数量 |
| `failedCount` | 失败条数 | int | 导入失败数量 |

> 请求方式建议使用 `multipart/form-data`，`file` 为上传文件字段，`importType` 为表单字段。

#### 调用示例

```text
file: ai408_questions.xlsx
importType: append
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "jobId": "job_20260626001",
    "status": "running",
    "totalCount": 1200,
    "successCount": 0,
    "failedCount": 0
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "42202",
  "message": "文件格式不正确",
  "data": null
}
```

### 3.3 查询导入任务结果

服务接口地址 `GET https://<host>/api/v1/admin/questions/imports/{jobId}`  编号 `IMPORT-03`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `jobId` | 导入任务ID | varchar(50) | 路径参数 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `jobId` | 导入任务ID | varchar(50) | 任务标识 |
| `status` | 任务状态 | varchar(20) | 导入状态 |
| `totalCount` | 总条数 | int | 总记录数 |
| `successCount` | 成功条数 | int | 成功导入数 |
| `failedCount` | 失败条数 | int | 失败导入数 |
| `errorFileUrl` | 错误文件地址 | varchar(255) | 失败明细下载 |
| `updatedAt` | 更新时间 | datetime | 最近更新时间 |

#### 调用示例

`GET /api/v1/admin/questions/imports/job_20260626001`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "jobId": "job_20260626001",
    "status": "success",
    "totalCount": 1200,
    "successCount": 1198,
    "failedCount": 2,
    "errorFileUrl": "https://<host>/files/import-error-job_20260626001.xlsx",
    "updatedAt": "2026-06-26 11:00:00"
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40401",
  "message": "导入任务不存在",
  "data": null
}
```

### 3.4 题库导入字段规范

| 字段名 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `question_code` | 是 | varchar(50) | 题目标识，建议全局唯一 |
| `subject_code` | 是 | varchar(20) | `DS` / `CO` / `OS` / `CN` / `MOCK` |
| `question_type` | 是 | varchar(20) | `single` / `multiple` / `essay` |
| `title` | 是 | varchar(255) | 题目标题 |
| `stem` | 是 | text | 题干内容 |
| `options_json` | 否 | json string | 单选/多选题必填，格式为数组 |
| `answer_json` | 是 | json string | 标准答案，单选/多选为数组 |
| `analysis` | 否 | text | 解析 |
| `note` | 否 | text | 备注 |
| `tags` | 否 | json string | 标签数组 |
| `new_type` | 否 | int / boolean | 是否新题型 |
| `steps_json` | 否 | json string | 综合大题步骤数组 |
| `difficulty` | 否 | int | 难度等级 |
| `sort_no` | 否 | int | 排序号 |
| `source` | 否 | varchar(50) | 来源，如历年真题、院校题等 |

#### 题型规则

| 题型 | 规则 |
| --- | --- |
| 单选题 | `options_json` 至少 2 项，`answer_json` 只能有 1 个选项 |
| 多选题 | `options_json` 至少 2 项，`answer_json` 可有多个选项 |
| 综合大题 | `steps_json` 建议必填，`answer_json` 可存参考答案或关键点 |

---

## 四、题库与科目查询

### 4.1 科目列表

服务接口地址 `GET https://<host>/api/v1/subjects`  编号 `QBANK-01`

#### 请求参数

无。

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `subjectCode` | 科目编码 | varchar(20) | 枚举值见通用约定 |
| `subjectName` | 科目名称 | varchar(50) | 中文名称 |
| `shortName` | 简称 | varchar(50) | 用于 Tab 展示 |
| `totalCount` | 题目总数 | int | 该科目总题数 |
| `doneCount` | 已做题数 | int | 学习进度 |
| `wrongCount` | 错题数 | int | 错题统计 |

#### 调用示例

`GET /api/v1/subjects`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": [
    {
      "subjectCode": "DS",
      "subjectName": "数据结构",
      "shortName": "数据结构",
      "totalCount": 642,
      "doneCount": 318,
      "wrongCount": 24
    }
  ]
}
```

#### 响应内容（失败）

```json
{
  "code": "999",
  "message": "处理失败",
  "data": null
}
```

### 4.2 题库分页查询

服务接口地址 `POST https://<host>/api/v1/questions/page`  编号 `QBANK-02`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `page.pageSize` | 每页数量 | int | 默认 `20` |
| `page.pageIndex` | 页号 | int | 默认 `1` |
| `params.subjectCode` | 科目 | varchar(20) | 选填 |
| `params.keyword` | 关键词 | varchar(100) | 题干/标题模糊查询 |
| `params.questionType` | 题型 | varchar(20) | `single` / `multiple` / `essay` |
| `params.tag` | 标签 | varchar(50) | 选填 |
| `params.newType` | 新题型 | int | `0/1` |
| `params.questionStatus` | 做题状态 | varchar(20) | `new` / `correct` / `wrong` |
| `params.inWrongBook` | 是否在错题本 | int | `0/1` |
| `params.inFavorites` | 是否在收藏中 | int | `0/1` |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `pageIndex` | 页号 | int | 当前页 |
| `pageSize` | 每页数量 | int | 每页条数 |
| `pageCount` | 总页数 | int | 总页数 |
| `recordCount` | 总记录数 | int | 总条数 |
| `records.id` | 题目ID | varchar(50) | 主键 |
| `records.subjectCode` | 科目编码 | varchar(20) | 科目 |
| `records.questionType` | 题型 | varchar(20) | `single` / `multiple` / `essay` |
| `records.title` | 题目标题 | varchar(255) | 标题 |
| `records.tag` | 标签 | varchar(50) | 如单选、多选、综合大题 |
| `records.newType` | 是否新题型 | boolean | 是否标记 |
| `records.questionStatus` | 用户状态 | varchar(20) | `new` / `correct` / `wrong` |
| `records.favoriteImportance` | 收藏等级 | int | `0/1/2` |
| `records.inWrongBook` | 是否在错题本 | boolean | 错题标记 |

#### 调用示例

```json
{
  "data": {
    "page": {
      "pageSize": 20,
      "pageIndex": 1
    },
    "params": {
      "subjectCode": "DS",
      "questionType": "single",
      "keyword": "",
      "newType": 0
    }
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "pageIndex": 1,
    "pageSize": 20,
    "pageCount": 3,
    "recordCount": 42,
    "records": [
      {
        "id": "ds-1",
        "subjectCode": "DS",
        "questionType": "single",
        "title": "顺序表的主要优点是？",
        "tag": "单选",
        "newType": false,
        "questionStatus": "correct",
        "favoriteImportance": 0,
        "inWrongBook": false
      }
    ]
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "999",
  "message": "处理失败",
  "data": null
}
```

### 4.3 题目详情

服务接口地址 `GET https://<host>/api/v1/questions/{id}`  编号 `QBANK-03`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `id` | 题目ID | varchar(50) | 路径参数 |
| `view` | 查看模式 | varchar(20) | 默认 `practice`，可传 `review` |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `id` | 题目ID | varchar(50) | 主键 |
| `subjectCode` | 科目编码 | varchar(20) | 科目 |
| `questionType` | 题型 | varchar(20) | 题型 |
| `title` | 标题 | varchar(255) | 题目标题 |
| `stem` | 题干 | text | 题目内容 |
| `options` | 选项 | List | 单选/多选返回 |
| `answer` | 标准答案 | array / string | `view=review` 时返回 |
| `analysis` | 解析 | text | `view=review` 时返回 |
| `steps` | 步骤 | List | 综合大题返回 |
| `tags` | 标签 | List<string> | 题目标签 |
| `newType` | 是否新题型 | boolean | 标记 |

#### 调用示例

`GET /api/v1/questions/ds-1?view=practice`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "id": "ds-1",
    "subjectCode": "DS",
    "subjectName": "数据结构",
    "questionType": "single",
    "title": "顺序表的主要优点是？",
    "stem": "在 408 常考的数据结构里，顺序表最突出的特点是什么？",
    "options": [
      { "key": "A", "text": "插入删除更快" },
      { "key": "B", "text": "随机访问方便" },
      { "key": "C", "text": "空间利用率极高" },
      { "key": "D", "text": "无需预分配空间" }
    ],
    "answer": [],
    "analysis": "",
    "steps": [],
    "tags": ["单选"],
    "newType": false,
    "note": "顺序表核心优点是随机访问。"
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40402",
  "message": "题目不存在",
  "data": null
}
```

---

## 五、做题闭环

### 5.1 创建练习会话

服务接口地址 `POST https://<host>/api/v1/practice/sessions`  编号 `PRACTICE-01`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `mode` | 练习模式 | varchar(20) | `sequence` / `mock` / `wrongBook` / `favorites` |
| `subjectCode` | 科目编码 | varchar(20) | 选填，顺序练习/模考时建议传 |
| `limit` | 题目数量 | int | 选填 |
| `questionIds` | 指定题目ID列表 | array | 选填 |
| `source` | 来源 | varchar(20) | 选填，如首页入口、错题本入口 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `sessionId` | 会话ID | varchar(50) | 练习会话标识 |
| `mode` | 练习模式 | varchar(20) | 会话模式 |
| `subjectCode` | 科目编码 | varchar(20) | 当前科目 |
| `totalCount` | 题目总数 | int | 会话题量 |
| `currentQuestionId` | 当前题目ID | varchar(50) | 首题或当前题 |
| `answeredCount` | 已答数量 | int | 当前进度 |
| `questionBriefList` | 题号列表 | List | 用于进度面板 |
| `currentQuestion` | 当前题目详情 | object | 初始加载可直接返回 |

#### 调用示例

```json
{
  "data": {
    "mode": "sequence",
    "subjectCode": "DS",
    "limit": 20
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "sessionId": "sess_10001",
    "mode": "sequence",
    "subjectCode": "DS",
    "totalCount": 20,
    "currentQuestionId": "ds-1",
    "answeredCount": 0,
    "questionBriefList": [
      {
        "questionId": "ds-1",
        "orderNo": 1,
        "questionStatus": "new",
        "newType": false
      }
    ],
    "currentQuestion": {
      "id": "ds-1",
      "questionType": "single",
      "title": "顺序表的主要优点是？"
    }
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "999",
  "message": "处理失败",
  "data": null
}
```

### 5.2 查询会话详情

服务接口地址 `GET https://<host>/api/v1/practice/sessions/{id}`  编号 `PRACTICE-02`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `id` | 会话ID | varchar(50) | 路径参数 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `sessionId` | 会话ID | varchar(50) | 主键 |
| `mode` | 练习模式 | varchar(20) | 会话模式 |
| `status` | 会话状态 | varchar(20) | `progressing` / `finished` |
| `totalCount` | 题目总数 | int | 会话题量 |
| `answeredCount` | 已答数量 | int | 当前进度 |
| `questionBriefList` | 题号列表 | List | 进度面板数据 |
| `currentQuestion` | 当前题目 | object | 当前答题内容 |

#### 调用示例

`GET /api/v1/practice/sessions/sess_10001`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "sessionId": "sess_10001",
    "mode": "sequence",
    "status": "progressing",
    "totalCount": 20,
    "answeredCount": 6,
    "currentQuestion": {
      "id": "ds-7",
      "questionType": "single",
      "title": "队列的基本操作是？"
    },
    "questionBriefList": [
      { "questionId": "ds-1", "orderNo": 1, "questionStatus": "correct", "newType": false },
      { "questionId": "ds-2", "orderNo": 2, "questionStatus": "wrong", "newType": false }
    ]
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40403",
  "message": "会话不存在",
  "data": null
}
```

### 5.3 提交答案

服务接口地址 `POST https://<host>/api/v1/practice/sessions/{id}/answers`  编号 `PRACTICE-03`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `id` | 会话ID | varchar(50) | 路径参数 |
| `questionId` | 题目ID | varchar(50) | 必填 |
| `answer` | 用户答案 | array | 单选/多选统一传数组 |
| `elapsedSeconds` | 作答耗时 | int | 选填 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `questionId` | 题目ID | varchar(50) | 当前题目 |
| `isCorrect` | 是否正确 | boolean | 判题结果 |
| `questionStatus` | 题目状态 | varchar(20) | `correct` / `wrong` |
| `correctAnswer` | 标准答案 | array | 标准答案 |
| `analysis` | 解析 | text | 判题后返回 |
| `inWrongBook` | 是否进入错题本 | boolean | 错题自动入库 |
| `nextQuestionId` | 下一题ID | varchar(50) | 可选 |

#### 调用示例

```json
{
  "data": {
    "questionId": "ds-1",
    "answer": ["B"],
    "elapsedSeconds": 18
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "questionId": "ds-1",
    "isCorrect": true,
    "questionStatus": "correct",
    "correctAnswer": ["B"],
    "analysis": "顺序表支持按下标随机访问。",
    "inWrongBook": false,
    "nextQuestionId": "ds-2"
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "42203",
  "message": "答案格式不正确",
  "data": null
}
```

### 5.4 大题步骤批改

服务接口地址 `PATCH https://<host>/api/v1/practice/sessions/{id}/essay-steps`  编号 `PRACTICE-04`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `id` | 会话ID | varchar(50) | 路径参数 |
| `questionId` | 题目ID | varchar(50) | 必填 |
| `steps` | 步骤状态 | array | 布尔数组，按步骤顺序传递 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `questionId` | 题目ID | varchar(50) | 当前题目 |
| `stepStatus` | 步骤状态 | array | 更新后的步骤数组 |
| `allDone` | 是否完成 | boolean | 全部步骤是否完成 |
| `questionStatus` | 题目状态 | varchar(20) | 完成后通常为 `correct` |

#### 调用示例

```json
{
  "data": {
    "questionId": "os-2",
    "steps": [true, false, false]
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "questionId": "os-2",
    "stepStatus": [true, false, false],
    "allDone": false,
    "questionStatus": "new"
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "42204",
  "message": "步骤数组长度不匹配",
  "data": null
}
```

### 5.5 结束练习

服务接口地址 `POST https://<host>/api/v1/practice/sessions/{id}/finish`  编号 `PRACTICE-05`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `id` | 会话ID | varchar(50) | 路径参数 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `sessionId` | 会话ID | varchar(50) | 主键 |
| `durationSeconds` | 练习时长 | int | 秒 |
| `answeredCount` | 已答数量 | int | 答题总数 |
| `correctCount` | 正确数 | int | 正确题数 |
| `wrongCount` | 错题数 | int | 错题数 |
| `accuracy` | 正确率 | int | 百分比 |
| `reviewId` | 复盘ID | varchar(50) | 结束后用于跳转 |

#### 调用示例

`POST /api/v1/practice/sessions/sess_10001/finish`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "sessionId": "sess_10001",
    "durationSeconds": 1250,
    "answeredCount": 20,
    "correctCount": 16,
    "wrongCount": 4,
    "accuracy": 80,
    "reviewId": "review_10001"
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40901",
  "message": "会话已结束",
  "data": null
}
```

### 5.6 复盘结果

服务接口地址 `GET https://<host>/api/v1/practice/sessions/{id}/review`  编号 `PRACTICE-06`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `id` | 会话ID | varchar(50) | 路径参数 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `accuracy` | 正确率 | int | 百分比 |
| `durationSeconds` | 练习时长 | int | 秒 |
| `answeredCount` | 答题总数 | int | 总题数 |
| `wrongCount` | 错题数 | int | 错题数量 |
| `wrongQuestionIds` | 错题ID列表 | array | 便于回顾 |
| `weakPoints` | 薄弱点列表 | array | 推荐突破点 |
| `subjectStats` | 科目统计 | array | 按科目复盘 |

#### 调用示例

`GET /api/v1/practice/sessions/sess_10001/review`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "accuracy": 80,
    "durationSeconds": 1250,
    "answeredCount": 20,
    "wrongCount": 4,
    "wrongQuestionIds": ["ds-2", "co-2"],
    "weakPoints": ["树的遍历", "Cache 写策略"],
    "subjectStats": [
      { "subjectCode": "DS", "subjectName": "数据结构", "correctCount": 8, "wrongCount": 2 }
    ]
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "40404",
  "message": "复盘结果不存在",
  "data": null
}
```

---

## 六、错题与收藏（支撑前端页，可作为附录实现）

### 6.1 错题本列表

服务接口地址 `POST https://<host>/api/v1/me/wrong-book/page`  编号 `STATE-01`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `page.pageSize` | 每页数量 | int | 默认 `20` |
| `page.pageIndex` | 页号 | int | 默认 `1` |
| `params.subjectCode` | 科目 | varchar(20) | 选填 |
| `params.questionType` | 题型 | varchar(20) | 选填 |
| `params.keyword` | 关键词 | varchar(100) | 选填 |
| `params.groupBy` | 分组方式 | varchar(20) | `subject` / `tag` / `type` |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `records.questionId` | 题目ID | varchar(50) | 题目唯一标识 |
| `records.title` | 标题 | varchar(255) | 题目标题 |
| `records.subjectName` | 科目 | varchar(50) | 科目名称 |
| `records.tag` | 标签 | varchar(50) | 题型标签 |
| `records.wrongAt` | 错题时间 | datetime | 最近一次答错时间 |

#### 调用示例

```json
{
  "data": {
    "page": {
      "pageSize": 20,
      "pageIndex": 1
    },
    "params": {
      "subjectCode": "DS",
      "groupBy": "subject"
    }
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "pageIndex": 1,
    "pageSize": 20,
    "pageCount": 1,
    "recordCount": 2,
    "records": [
      {
        "questionId": "ds-2",
        "title": "二叉树遍历",
        "subjectName": "数据结构",
        "tag": "多选",
        "wrongAt": "2026-06-26 09:10:00"
      }
    ]
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "999",
  "message": "处理失败",
  "data": null
}
```

### 6.2 收藏题目列表

服务接口地址 `POST https://<host>/api/v1/me/favorites/page`  编号 `STATE-02`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `page.pageSize` | 每页数量 | int | 默认 `20` |
| `page.pageIndex` | 页号 | int | 默认 `1` |
| `params.subjectCode` | 科目 | varchar(20) | 选填 |
| `params.questionType` | 题型 | varchar(20) | 选填 |
| `params.keyword` | 关键词 | varchar(100) | 选填 |
| `params.groupBy` | 分组方式 | varchar(20) | `subject` / `tag` / `type` |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `records.questionId` | 题目ID | varchar(50) | 题目唯一标识 |
| `records.title` | 标题 | varchar(255) | 题目标题 |
| `records.subjectName` | 科目 | varchar(50) | 科目名称 |
| `records.favoriteImportance` | 收藏等级 | int | `1` / `2` |
| `records.favoriteAt` | 收藏时间 | datetime | 最近收藏时间 |

#### 调用示例

```json
{
  "data": {
    "page": {
      "pageSize": 20,
      "pageIndex": 1
    },
    "params": {
      "groupBy": "subject"
    }
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "pageIndex": 1,
    "pageSize": 20,
    "pageCount": 1,
    "recordCount": 3,
    "records": [
      {
        "questionId": "mock-2",
        "title": "408 中常见的题型有哪些？",
        "subjectName": "整套模考",
        "favoriteImportance": 2,
        "favoriteAt": "2026-06-26 09:30:00"
      }
    ]
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "999",
  "message": "处理失败",
  "data": null
}
```

### 6.3 更新题目状态

服务接口地址 `PATCH https://<host>/api/v1/me/question-states/{questionId}`  编号 `STATE-03`

#### 请求参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `questionId` | 题目ID | varchar(50) | 路径参数 |
| `favoriteImportance` | 收藏等级 | int | `0/1/2` |
| `note` | 备注 | text | 选填 |
| `inWrongBook` | 是否进入错题本 | boolean | 选填 |

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `questionId` | 题目ID | varchar(50) | 主键 |
| `favoriteImportance` | 收藏等级 | int | 更新后结果 |
| `inWrongBook` | 错题状态 | boolean | 更新后结果 |
| `note` | 备注 | text | 更新后结果 |

#### 调用示例

```json
{
  "data": {
    "favoriteImportance": 2,
    "note": "这道题很重要",
    "inWrongBook": true
  }
}
```

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "questionId": "mock-2",
    "favoriteImportance": 2,
    "inWrongBook": true,
    "note": "这道题很重要"
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "42205",
  "message": "状态参数不合法",
  "data": null
}
```

### 6.4 清空错题本 / 收藏

服务接口地址 `DELETE https://<host>/api/v1/me/wrong-book`  编号 `STATE-04`

服务接口地址 `DELETE https://<host>/api/v1/me/favorites`  编号 `STATE-05`

#### 请求参数

无。

#### 响应参数

| 参数 | 参数说明 | 参数类型 | 数据说明 |
| --- | --- | --- | --- |
| `clearedCount` | 清理数量 | int | 清空条数 |

#### 调用示例

`DELETE /api/v1/me/wrong-book`

#### 响应内容（成功）

```json
{
  "code": "200",
  "message": "处理成功",
  "data": {
    "clearedCount": 36
  }
}
```

#### 响应内容（失败）

```json
{
  "code": "999",
  "message": "处理失败",
  "data": null
}
```

---

## 七、建议的 MVP 实施顺序

1. 先做用户系统：验证码、登录、刷新 Token、获取当前用户。
2. 再做题库导入：模板、导入任务、任务查询。
3. 然后做做题闭环：会话创建、题目详情、提交答案、复盘。
4. 最后补错题本与收藏列表，支撑前端复盘页。
