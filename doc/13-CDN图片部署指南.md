# 小程序装饰图 CDN 迁移部署指南

## 一、背景

小程序中的装饰图（角色、手柄、耳机、啤酒、游戏封面）从工程包迁移至服务器 CDN 拉取，解决部分机型 webp 不兼容问题，同时减小代码包体积。

## 二、需要上传的图片及目标 URL

将以下 5 个文件上传至服务器，确保最终可通过对应 URL 访问：

| 文件名 | 目标 URL |
|--------|---------|
| `ui-character.png` | `https://ywsfs.cn/static/img/ui-character.png` |
| `ui-controller.png` | `https://ywsfs.cn/static/img/ui-controller.png` |
| `ui-headset.png` | `https://ywsfs.cn/static/img/ui-headset.png` |
| `ui-beer-skewer.png` | `https://ywsfs.cn/static/img/ui-beer-skewer.png` |
| `xuantianzhen.jpg` | `https://ywsfs.cn/static/img/xuantianzhen.jpg` |

> 图片源文件在项目的 `frontend/img/` 目录下（png 版本可通过 `git checkout 0481c36 -- frontend/img/` 恢复）。

## 三、服务器操作步骤

### 1. 创建静态文件目录

```bash
sudo mkdir -p /var/www/ywsfs/static/img
```

### 2. 上传图片到服务器

从本地用 scp 传输：

```bash
scp ui-character.png ui-controller.png ui-headset.png ui-beer-skewer.png xuantianzhen.jpg root@ywsfs.cn:/var/www/ywsfs/static/img/
```

或者直接在服务器上从 git 仓库拉取后复制：

```bash
# 在服务器上进入项目目录
cd /path/to/play_minipro
git pull
# 从 git 历史恢复 png 文件
git checkout 0481c36 -- frontend/img/ui-character.png frontend/img/ui-controller.png frontend/img/ui-headset.png frontend/img/ui-beer-skewer.png
# 复制到静态目录
cp frontend/img/ui-character.png /var/www/ywsfs/static/img/
cp frontend/img/ui-controller.png /var/www/ywsfs/static/img/
cp frontend/img/ui-headset.png /var/www/ywsfs/static/img/
cp frontend/img/ui-beer-skewer.png /var/www/ywsfs/static/img/
cp frontend/img/xuantianzhen.jpg /var/www/ywsfs/static/img/
```

### 3. 配置 Nginx 静态路由

在 ywsfs.cn 的 nginx 配置文件中（通常在 `/etc/nginx/sites-enabled/` 或 `/etc/nginx/conf.d/`），**在已有的 location 规则之前**添加：

```nginx
# 小程序 CDN 静态图片资源
location /static/img/ {
    alias /var/www/ywsfs/static/img/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin *;
}
```

> **注意**：这段要放在 `location /` 等规则之前，确保 `/static/img/` 路径优先匹配。

### 4. 检查并重载 Nginx

```bash
sudo nginx -t        # 检查配置语法是否正确
sudo nginx -s reload # 重载配置使其生效
```

### 5. 验证图片可访问

在浏览器中依次打开以下链接，确认能看到图片：

- https://ywsfs.cn/static/img/ui-character.png
- https://ywsfs.cn/static/img/ui-controller.png
- https://ywsfs.cn/static/img/ui-headset.png
- https://ywsfs.cn/static/img/ui-beer-skewer.png
- https://ywsfs.cn/static/img/xuantianzhen.jpg

全部能正常显示即服务器端配置完成。

## 四、微信公众平台配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入 **开发管理 → 开发设置 → 服务器域名**
3. 在 **downloadFile 合法域名** 中添加：`https://ywsfs.cn`
4. 保存

> `<image>` 标签使用网络 URL 时走 downloadFile 通道，必须配置白名单才能加载。如果已有该域名则无需重复添加。

## 五、代码中 CDN 配置说明

所有 CDN 图片 URL 集中管理在 `frontend/utils/cdn.js`：

```js
const CDN_BASE = 'https://ywsfs.cn/static/img'

module.exports = {
  UI_CHARACTER: `${CDN_BASE}/ui-character.png`,
  UI_CONTROLLER: `${CDN_BASE}/ui-controller.png`,
  UI_HEADSET: `${CDN_BASE}/ui-headset.png`,
  UI_BEER_SKEWER: `${CDN_BASE}/ui-beer-skewer.png`,
  XUANTIANZHEN: `${CDN_BASE}/xuantianzhen.jpg`
}
```

如需更换 CDN 域名，只需修改 `CDN_BASE` 一行即可。

各页面通过 `const cdn = require('../../utils/cdn')` 引入，在 data 中挂载为 `cdnImg`，wxml 中使用 `{{cdnImg.XXX}}` 引用。

## 六、保留在工程包中的图片

以下两张首屏必需图片仍打包在工程里，不走 CDN：

- `brand-logo.png`（品牌 logo，34KB）
- `city-bg.png`（页面底纹，21KB）

## 七、故障排查

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| 小程序中图片空白 | 未配置 downloadFile 域名 | 在公众平台添加 `https://ywsfs.cn` |
| 浏览器能访问但小程序不行 | HTTPS 证书问题 | 确保证书有效且未过期 |
| 图片加载慢 | 服务器带宽不足 | 考虑使用 OSS/CDN 加速 |
| 部分图片 404 | 文件名大小写不匹配 | 检查服务器文件名与 cdn.js 中一致 |
