# MamaPedia 项目技术文档

## 部署信息
- **GitHub Repo**: https://github.com/TiNa18922/mamapedia
- **Netlify URL**: https://mamapedia.netlify.app
- **Cloudflare Worker Proxy**: mamapedia-proxy.golightly2004.workers.dev

---

## 会员体系

| 等级 | 价格 | AI 咨询 | Marktplatz 发帖 | 其他 |
|---|---|---|---|---|
| Free | €0 | ❌ | ❌ | Kalender、Community |
| Premium | €4.99/月 | 3次/月 | 5条/月 | Kalender、Community |
| VIP | €7.99/月 | 无限制 | 无限制 + 置顶 | Kalender、Community + 认证徽章 |
| Business | €29.99/月 | 无限制 | 无限制 + 置顶 | 商家入驻目录 + 认证徽章 |

---

## Stripe 配置

### 账户
- **Dashboard**: https://dashboard.stripe.com
- **模式**: 沙盒（测试）→ 上线前切换到真实账户

### 产品 & Payment Links（沙盒测试）

| 产品 | Stripe 产品名 | 价格 | Payment Link |
|---|---|---|---|
| Premium 订阅 | MamaPedia Premium | €4.99/月 | *(待补充)* |
| VIP 订阅 | MamaPedia VIP | €7.99/月 | *(待补充)* |
| 商家入驻 | MamaPedia Business | €29.99/月 | https://buy.stripe.com/test_bJeeV6dS9e2w8HZ9kr93y00 |

> ⚠️ 以上为沙盒测试链接，正式上线后替换为真实链接

### Webhook（待配置）
- **Endpoint**: `https://mamapedia-proxy.golightly2004.workers.dev/stripe-webhook`
- **监听事件**: `checkout.session.completed`, `customer.subscription.deleted`

---

## GitHub Actions

| Workflow | 文件 | 触发时间 | 功能 |
|---|---|---|---|
| Marktplatz 同步 | `sync_marktplatz.yml` | 每天 9:00 CEST | Google Sheet → marktplatz_data.json |

---

## 待办事项
- [ ] 创建 Premium & VIP Payment Links（Stripe）
- [ ] 配置 Stripe Webhook → Cloudflare Worker
- [ ] Cloudflare Worker 扩展：接收 Webhook + KV 存储付费状态
- [ ] App UI：会员升级页面 + 权限控制逻辑
- [ ] KAL_EVENTS 78条活动内容多语言翻译（EN/ZH/ES）
- [ ] 切换 Stripe 到真实账户（正式上线前）
