# Bangumi Rating Card

把原 `qq-bangumi-bot-leo` 中的 Bangumi 风格评分卡单独拆成静态网页。

- 标题、日期、话数、ID、封面直接读取 Bangumi 条目。
- 1～10 分人数可一键导入 Bangumi，也可清空后手动填写。
- 平均分、总票数、柱状图、评分文字会随人数即时重算。
- Bangumi 排名可单独开关；手填评分时可以不显示排名。
- 评分卡主体 CSS 与 `rate_emo.gif` 来自旧工具实现。
- 可直接保存评分卡为 PNG。

## 使用

直接打开 `index.html`，输入 Bangumi 条目 ID 或条目链接即可。

页面是纯静态网页，无构建步骤。读取 Bangumi 数据和导出 PNG 时需要联网。

## 简单验证

如本机安装 Node.js：

```bash
node tests/logic.test.js
```
