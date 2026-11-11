---
layout: home

hero:
  name: 全栈面试知识库
  text: 前端 / 后端 / 大模型
  tagline: 结论优先、按领域归档，只留会被问到的东西
  actions:
    - theme: brand
      text: 从前端开始
      link: /js-core
    - theme: alt
      text: 大模型专题
      link: /ai-01

features:
  - title: 结论先行
    details: 每条先给一句话结论，再补真实场景和坑，不背课文。
  - title: 按领域归档
    details: 前端、后端、大模型各自成章，新增文件自动进目录和搜索。
  - title: 可检索
    details: 本地搜索做了中文双字切分，直接搜「闭包」「GIL」「RAG」都能召回。
---

<script setup>
import { useData, withBase } from 'vitepress'

const { theme } = useData()
const categories = theme.value.categories || []
</script>

## 分类目录

<div v-for="cat in categories" :key="cat.label">
  <h3>{{ cat.label }}</h3>
  <p>
    <a v-for="c in cat.items" :key="c.link" :href="withBase(c.link)" style="display:inline-block;margin-right:1.25rem;margin-bottom:.4rem">{{ c.title }}</a>
  </p>
</div>

## 说明

- 三个目录按领域分类，新增章节只要按 `NN 标题.md` 命名放进对应目录即可，会自动出现在侧边栏、顶部导航、首页目录和搜索里。
- 前端 9 章沿用原有短路径，线上旧链接保持不变。
- 原始素材归档在 `_source/`，不进站点。
