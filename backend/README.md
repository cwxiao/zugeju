# Backend

这个目录现在已经是“来整”后端工程。 

当前约定：

1. 技术栈为 Java 21 + Spring Boot 3。
2. 数据库为 PostgreSQL。
3. 数据访问使用 MyBatis。
4. 数据库版本脚本使用 Flyway。
5. 详细设计文档见 `../doc/` 目录。

当前已落地的最小可联调能力：

1. `POST /api/auth/wechat-login`
2. `POST /api/activities`
3. `GET /api/activities/mine/ongoing`
4. `GET /api/activities/{id}`
5. `GET /actuator/health`

## 本地启动

先启动 PostgreSQL 和 Redis：

```bash
docker compose up -d
```

再启动后端：

```bash
mvn spring-boot:run
```

默认配置：

1. 服务端口：`8080`
2. 数据库：`jdbc:postgresql://localhost:5433/play_minipro`
3. 用户名：`play`
4. 密码：`play1234`
5. Redis：`localhost:6379`

如需覆盖，可通过环境变量设置：

1. `DB_URL`
2. `DB_USERNAME`
3. `DB_PASSWORD`
4. `JWT_SECRET`
5. `REDIS_HOST`
6. `REDIS_PORT`
7. `REDIS_PASSWORD`

## 联调说明

### 1. 登录

请求：

```json
{
	"code": "mock-login-code",
	"nickname": "阿强",
	"avatarUrl": "https://example.com/avatar.png"
}
```

说明：

当前 `wechat-login` 先使用本地 mock 逻辑，根据 `code` 生成稳定 `openId`，这样前端不需要等微信正式登录配置也能先联调业务 token。

如果你已经有微信小程序 `AppSecret`，可直接打开真实登录：

1. 设置环境变量 `WECHAT_MINI_APP_SECRET`
2. 可选设置 `WECHAT_MINI_APP_ID`，默认已使用当前项目 `appid`
3. 如要强制关闭 mock，可设置 `WECHAT_MOCK_LOGIN_ENABLED=false`

后端会按微信官方流程调用 `https://api.weixin.qq.com/sns/jscode2session`。

登录成功后，后端会把会话写入 Redis，并将 `sessionId` 写进 JWT。接口校验时会同时校验 JWT 签名和 Redis 会话，并在访问时自动续期，所以小程序本地 token 继续可用，但服务端现在可以主动控制登录态是否有效。

### 2. 鉴权

除登录和健康检查外，其余接口都要带：

```text
Authorization: Bearer <token>
```

### 3. 创建活动

可直接按 `../doc/06-后端接口详细文档.md` 中的创建活动请求体联调，当前后端已接收核心字段并入库。