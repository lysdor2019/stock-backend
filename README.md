# 股票数据后端 — 部署指南

这是一个轻量后端，作用是：你的扫描工具调用它 → 它去 Yahoo Finance 拉实时数据 → 返回给你。
因为请求从服务器发出（不是浏览器），所以没有 CORS 限制，能拿到真正的实时数据。

整个部署过程约 15 分钟，**不需要写代码**，跟着做就行。

---

## 第一步：注册 GitHub 账号（如果已有可跳过）

1. 打开 https://github.com/signup
2. 用邮箱注册一个账号，验证邮箱

## 第二步：把这个文件夹传到 GitHub

1. 登录 GitHub 后，点右上角 `+` → `New repository`
2. Repository name 填 `stock-backend`，选 `Public`，点 `Create repository`
3. 在新页面里点 `uploading an existing file` 链接
4. 把这个文件夹里的所有文件拖进去（`api/stocks.js`、`package.json`、`vercel.json`、`README.md`）
   - 注意：`api` 是个文件夹，要保持 `api/stocks.js` 这个结构
5. 点 `Commit changes`

## 第三步：注册 Vercel 并部署

1. 打开 https://vercel.com/signup
2. 选 `Continue with GitHub`（用刚才的 GitHub 账号登录，最方便）
3. 登录后点 `Add New...` → `Project`
4. 找到刚才的 `stock-backend` 仓库，点 `Import`
5. 什么都不用改，直接点 `Deploy`
6. 等约 1 分钟，看到 `Congratulations` 就成功了

## 第四步：拿到你的后端地址

部署成功后，Vercel 会给你一个网址，长这样：

```
https://stock-backend-xxxx.vercel.app
```

你的数据接口就是在这个地址后面加 `/api/stocks`，完整地址：

```
https://stock-backend-xxxx.vercel.app/api/stocks?symbols=NVDA,AAPL
```

## 第五步：测试

把上面那个完整地址（换成你自己的）粘到浏览器打开。
如果看到一堆 JSON 数据（price、pe、roe 等），说明后端工作正常！

---

## 完成后

把你的后端地址（`https://stock-backend-xxxx.vercel.app` 这部分）发给我，
我会把扫描工具的前端改成调用你的后端，这样工具里的数据就是真·实时的了。

---

## 常见问题

**Q: 要花钱吗？**
A: 不用。Vercel 免费额度对个人用足够（每月几十万次请求）。

**Q: Yahoo 接口会失效吗？**
A: 这是非官方接口，偶尔可能调整。如果哪天不灵了，告诉我，换个数据源即可。

**Q: 安全吗？**
A: 这个后端只读取公开的股价数据，不碰任何账号或敏感信息。仓库设为 Public 也没问题。
