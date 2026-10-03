# 小荷包 · 学生理财 PWA

一个为大学生设计的手机端记账与月度预算工具。支持浏览器安装、离线使用、本机数据保存、分类统计和记录编辑。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开开发服务器地址。手机部署到 HTTPS 地址后，可以通过浏览器的“添加到主屏幕”安装。

## GitHub Pages 发布

推送到 `main` 分支后，仓库内的 GitHub Actions 会自动构建并发布 `dist-pages`。首次发布时，在仓库的 **Settings → Pages → Build and deployment** 中确认 Source 为 **GitHub Actions**。

## 已实现

- 月度总预算、分类预算与剩余额度
- 快速记一笔与六个学生常用分类
- 月度切换、分类占比与消费提示
- 最近记录编辑和删除
- 本机 `localStorage` 保存
- PWA 清单、应用图标和离线缓存
