# 朋友组局微信小程序 Java 后端落地文档

## 1. 文档目标

本文件用于把当前后端方案明确收口到 Java 技术栈，并给出一套适合你这个项目的落地方式。

目标不是讨论抽象优劣，而是解决三个实际问题：

1. Java 后端怎么选技术栈。
2. 现有 PostgreSQL 设计怎么映射到 Java。
3. 组局、回执、结算、统计这些核心业务如何在 Spring Boot 中组织。

## 2. 推荐技术栈

建议组合：

1. Java 21
2. Spring Boot 3
3. Spring Web
4. Spring Validation
5. Spring Security + JWT
6. PostgreSQL
7. MyBatis 或 MyBatis-Plus
8. Flyway
9. Redis
10. Lombok，可选
11. MapStruct，可选

为什么这样选：

1. Spring Boot 足够成熟，适合你这种明确业务型系统。
2. PostgreSQL 对复杂查询、JSONB、事务都很稳。
3. MyBatis 比 JPA 更适合你这里大量状态流转、统计 SQL、排行榜 SQL。
4. Flyway 适合你把 [05-PostgreSQL建表.sql](05-PostgreSQL%E5%BB%BA%E8%A1%A8.sql) 真正变成数据库版本脚本。

## 3. 推荐项目结构

建议包结构：

```text
com.playminipro
├─ common
│  ├─ config
│  ├─ exception
│  ├─ response
│  ├─ security
│  └─ util
├─ auth
│  ├─ controller
│  ├─ service
│  ├─ dto
│  └─ mapper
├─ activity
│  ├─ controller
│  ├─ service
│  ├─ dto
│  ├─ entity
│  └─ mapper
├─ invite
│  ├─ controller
│  ├─ service
│  ├─ dto
│  ├─ entity
│  └─ mapper
├─ expense
│  ├─ controller
│  ├─ service
│  ├─ dto
│  ├─ entity
│  └─ mapper
├─ settlement
│  ├─ controller
│  ├─ service
│  ├─ dto
│  ├─ entity
│  └─ mapper
├─ stats
│  ├─ controller
│  ├─ service
│  ├─ job
│  └─ mapper
└─ ranking
   ├─ controller
   ├─ service
   ├─ job
   └─ mapper
```

## 4. 核心模块职责

### 4.1 auth 模块

负责：

1. 微信 code2Session 登录。
2. 用户创建或更新。
3. JWT 签发与解析。

### 4.2 activity 模块

负责：

1. 活动创建。
2. 活动编辑。
3. 席位和成员管理。
4. 活动状态流转。

### 4.3 invite 模块

负责：

1. 分享链接生成。
2. 查看行为记录。
3. 同意入局。
4. 婉拒入局。
5. 婉拒原因记录。
6. 邀请反馈聚合。

这是你项目里很关键的一个独立模块，不建议并到 activity 模块里写成一锅。

### 4.4 expense 模块

负责：

1. 费用新增。
2. 费用审核。
3. 分摊对象写入。
4. 费用列表查询。

### 4.5 settlement 模块

负责：

1. 活动结算发起。
2. AA 计算。
3. 请客模式计算。
4. 转账路径生成。
5. 收付款确认。

### 4.6 stats 和 ranking 模块

负责：

1. 用户统计聚合。
2. 用户画像查询。
3. 熟人圈排行生成。
4. 榜单快照刷新。

## 5. 数据访问建议

### 5.1 为什么更推荐 MyBatis

你这个项目不是标准后台 CRUD，特点是：

1. 状态流转多。
2. 聚合查询多。
3. 排行榜 SQL 多。
4. 邀请回执统计逻辑多。
5. 结算逻辑里经常要做精细 SQL 查询和事务控制。

这种项目用 MyBatis 往往比 JPA 更直接。

### 5.2 建议做法

1. 简单列表和单表查询可以用 MyBatis-Plus。
2. 复杂统计、排行榜、结算查询用自定义 SQL。
3. 所有数据库脚本用 Flyway 管理。

## 6. 事务设计建议

### 6.1 必须事务的操作

1. 创建活动时，同时插入活动表和发起人成员表。
2. 同意入局时，同时更新邀请状态、写事件、插入成员。
3. 婉拒时，同时更新邀请状态和写事件。
4. 发起结算时，同时写结算单、结算明细、转账路径。

### 6.2 不建议放大事务的操作

1. 推送通知。
2. 排行榜刷新。
3. 用户画像更新。
4. 日志扩展写入。

这些应该通过异步任务或消息机制延后处理。

## 7. 实时回执建议

发起人最关心的是：

1. 谁点进来看过。
2. 谁同意了。
3. 谁婉拒了。
4. 婉拒原因是什么。

Java 实现建议：

1. 首版用短轮询接口即可。
2. 活动详情页每 3 到 5 秒拉取一次 `rsvp-stats` 和 `invite-feedback`。
3. 如果后续对实时性要求更高，再加 Spring WebSocket。

## 8. 安全与权限建议

1. 所有接口统一走 JWT 鉴权。
2. 发起人权限在 Service 层再次校验，不只靠前端。
3. 婉拒原因明细仅发起人可见。
4. 结算相关接口必须校验活动状态和操作者身份。

## 9. 你这个项目用 Java 的利弊判断

### 9.1 更适合 Java 的原因

1. 你后面大概率会做正式后端，而不只是玩具项目。
2. 业务规则多，Java 分层会更稳定。
3. 后续如果接支付、后台、报表、风控，Java 更顺。

### 9.2 Java 的成本

1. 初始搭建比 Node 更重。
2. 接口变更节奏快时，开发手感会偏稳重而不是灵活。
3. 如果团队只有前端背景，Java 上手成本更高。

## 10. 当前建议结论

如果你决定后端用 Java，那我认为是成立的，而且对你这个项目并不违和。

关键前提只有一个：

不是因为“Java 听起来更正式”才用它，而是你准备按长期可维护的正式项目方式推进。

从当前文档来看，PostgreSQL 设计、接口设计、邀请链路和结算模型都可以直接沿用，不需要推翻，只需要把实现层映射到 Spring Boot 即可。