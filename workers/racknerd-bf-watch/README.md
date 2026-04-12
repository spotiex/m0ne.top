# RackNerd Black Friday Watcher

独立的 Cloudflare Worker，用来监控 RackNerd 黑五套餐页面和具体下单页。

它只做两件事：

- 发现新的黑五套餐链接
- 检测已有黑五套餐是否新增你关注的美西机房

当前默认关注：

- `Los Angeles (DC-02)`
- `San Jose`
- `Seattle`

## 目录

```text
workers/racknerd-bf-watch/
├── package.json
├── README.md
├── tsconfig.json
├── wrangler.jsonc
└── src/
    ├── cloudflare-email.d.ts
    └── index.ts
```

## 工作方式

1. Cron 定时抓取 `SEED_URLS` 中配置的黑五页面。
2. 从页面里提取黑五套餐购买链接。
3. 继续访问这些套餐下单页，提取机房选项。
4. 把机房名称归一化后，与上次 KV 快照比对。
5. 只有以下情况才发邮件：
   - 新的黑五套餐已经包含目标机房
   - 已有黑五套餐新增了目标机房

## 配置

编辑 [wrangler.jsonc](/Users/minet/Code/vps/m0ne.top/workers/racknerd-bf-watch/wrangler.jsonc)：

- `kv_namespaces[0].id` / `preview_id`
- `send_email[0].destination_address`
- `vars.SEED_URLS`
- `vars.FROM_EMAIL`
- `vars.TO_EMAIL`

### `SEED_URLS`

建议只放黑五入口页，避免监控范围扩散。例如：

```json
[
  "https://my.racknerd.com/index.php?rp=/store/blackfriday2025",
  "https://www.racknerd.com/BlackFriday/",
  "https://my.racknerd.com/cart.php?a=add&pid=999"
]
```

如果你已经知道某些具体黑五套餐的购买链接，也可以直接放进去。

### `WATCH_LOCATIONS`

默认值：

```json
["LA-DC-02", "Los Angeles (DC-02)", "San Jose", "Seattle"]
```

代码会自动归一化成：

- `Los Angeles (DC-02)`
- `San Jose`
- `Seattle`

## 邮件通知

当前实现使用 Cloudflare 的 `send_email` 绑定。你需要：

1. 在 Cloudflare 中配置 Email Routing
2. 为 Worker 配置 `send_email` 绑定
3. 确保 `FROM_EMAIL` 是允许发送的地址

邮件内容会列出：

- 变更类型
- 套餐标题
- 新出现的目标机房
- 套餐链接
- 来源页面

## 部署步骤

1. 安装依赖：

```bash
cd workers/racknerd-bf-watch
npm install
```

2. 创建 KV：

```bash
npx wrangler kv namespace create STATE_KV
npx wrangler kv namespace create STATE_KV --preview
```

3. 把返回的 namespace id 写入 [wrangler.jsonc](/Users/minet/Code/vps/m0ne.top/workers/racknerd-bf-watch/wrangler.jsonc)

4. 配置 `send_email` 和 `vars`

5. 本地手动触发：

```bash
npx wrangler dev
```

然后访问：

```text
/run
```

调试时建议先用：

```text
/run?dry=1&debug=1
```

这会执行完整抓取，但不会写入 KV，也不会发邮件，同时会返回当前识别到的产品和机房。

6. 部署：

```bash
npx wrangler deploy
```

## 注意点

- 这个版本优先假设 RackNerd 页面里的套餐链接和机房选项能从 HTML 中直接提取。
- 如果后续发现机房选项是动态渲染的，再升级到 Browser Rendering。
- 第一次运行只会建立快照，不会因为“已有内容”重复告警；只有相对上一次状态出现新增时才会发邮件。
- 当前默认黑五入口已改为 `https://my.racknerd.com/index.php?rp=/store/blackfriday2025`。
- 当前默认还会抓取官方黑五落地页 `https://www.racknerd.com/BlackFriday/`，用于提高发现产品链接的成功率。
- 代码内置了 5 个当前 KVM 黑五套餐的已知 slug 回退：
  - `1 GB KVM VPS (Black Friday 2025)`
  - `2.5 GB KVM VPS (Black Friday 2025)`
  - `4 GB KVM VPS (Black Friday 2025)`
  - `6 GB KVM VPS (Black Friday 2025)`
  - `8 GB KVM VPS (Black Friday 2025)`
- `Santa Clara` 会被归一化为 `San Jose`，因为 RackNerd 官方的 San Jose 机房地址位于 Santa Clara。
