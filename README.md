# Procurement — 公司采购平台

跟 Project Hub 同一套系统（登录、权限、Section、栏位模板、筛选、日历、导出、封存/还原全部一样），但**数据、用户名单、后端完全独立**：

- 网址：<https://asana-sec.github.io/procurement/>
- **Super admin（3 位）**：`sam.secov@gmail.com`、`szesian.mitosc@gmail.com`、`eileen.secov@gmail.com`（写在 `assets/core.js` 的 SUPER_ADMINS）
- Project Hub 的账号**不会**自动带过来，要在 Procurement 的 Users & access 另外加
- 使用手册：平台左下角 **Help** 直接打开 Project Hub 的手册（操作完全一样）

## 预设 Section（第一次登录按「Create the standard sections」自动建好）

| Section | 流程（Stage / Status） | 截止日期栏 |
|---|---|---|
| **Purchase Requisitions** | Draft → Submitted → Approved / Rejected → Sourcing → PO Issued / Cancelled | Required on site by |
| **Supplier RFQ & Quotations** | To Do → RFQ Sent → Quotes Received → Evaluation → Recommended → Approved / Cancelled | Quote closing date |
| **Purchase Orders** | Draft → Pending Approval → Issued → Acknowledged → Partially Delivered → Delivered → Closed / Cancelled | Delivery due |
| **Supplier Invoices & Payments** | Received → Verified (PO / GRN matched) → Approved for Payment → Paid / Disputed | Payment due |
| **Supplier Register** | Under Evaluation → Approved / On Probation → Blacklisted / Inactive | Registration / licence expiry |

- 关联：Quotation 和 PO 可以连到 PR；Invoice 连到 PO
- 卡太久会自动出现提醒标签（例如 PR 在 Submitted 超过 1 天、PO 在 Pending Approval 超过 2 天）
- 栏位、阶段、提醒天数都能在线上 **Customize columns** 修改

## 上线步骤（Sam 做，约 5 分钟）

Google 登录的 Client ID **沿用 Project Hub 那个**（同一个网域 asana-sec.github.io），不用再去 Google Cloud 建。只要建一个新的后端：

1. 打开 <https://script.google.com/>（用 `sam.secov@gmail.com`）→ **New project**，项目名改成 `Procurement API`
2. 把 `apps-script/Code.gs` 的全部内容贴进 `Code.gs`
3. 左侧 Files 旁边按 **+ → Script**，命名为 `Core`，把 `assets/core.js` 的全部内容贴进去
4. 左侧 ⚙️ **Project Settings** → Time zone 选 `(GMT+08:00) Kuala Lumpur`
5. 回到 `Code.gs`，函数选单选 **setup** → **Run** → 授权（未验证的应用 → Advanced → Go to Procurement API）
   - 会新建 **Procurement — Data**（Google Sheet）、**Procurement — Files**（Drive 文件夹）和 **Procurement** 日历
6. **Deploy → New deployment** → Web app，Execute as **Me**，Who has access **Anyone** → 复制 **Web app URL**（结尾 `/exec`）交给小助
7. 小助填进 `config.js` 推上线后，打开网址登录 → **Create the standard sections** → Users & access 加同事

> 以后 Code.gs 或 core.js 有更新，两个文件都要重新贴，再 **Deploy → Manage deployments → ✏️ → New version**，网址不变。

## 本机测试

```bash
py -3 -m http.server 8766
```

打开 `http://localhost:8766/?demo`：演示模式，示例账号包括 Farah（Purchasing）、Ali（PM）、Siti（Finance）、Kumar（Store）、Raj（Site，没有 Section 权限）。

## 跟 Project Hub 的差别

| 项目 | Project Hub | Procurement |
|---|---|---|
| 网址 | `/project-hub/` | `/procurement/` |
| 后端 / Sheet / Drive / 日历 | Project Hub API | Procurement API（独立） |
| 浏览器存档键名 | `projecthub_*` | `procurement_*`（同网域，互不干扰） |
| 主色 | 蓝 | 绿 |
| 封存文件 | 两边格式相同，Project Hub 的封存文件也可以还原进 Procurement，反之亦然 |

## 文件结构

| 文件 | 用途 |
|---|---|
| `index.html` | 网页入口 |
| `config.js` | 设定（API 网址、Client ID、名称） |
| `assets/core.js` | 权限与数据规则：网页和后端共用（后端贴成 Core.gs） |
| `assets/templates.js` | 5 个采购 Section 的预设模板 |
| `assets/app.js` | 全部画面和操作 |
| `assets/api.js` | 数据层（演示模式示例数据 / Google 后端） |
| `assets/archive.js` | 封存 / 备份 / 还原 |
| `assets/style.css` | 样式 |
| `apps-script/Code.gs` | Google 后端 |
