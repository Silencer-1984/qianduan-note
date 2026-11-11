import { defineConfig } from 'vitepress'
import {
  getChapters,
  buildRewrites,
  buildSidebar,
  buildNav,
  buildCategories
} from './chapters.mjs'

// 项目页 https://<user>.github.io/<repo>/ 需要带 base；CI 通过 BASE_PATH 注入。
const base = process.env.BASE_PATH || '/'

// 源目录 = 项目根，按 前端/ 后端/ 大模型/ 三个领域目录扫描。
const chapters = getChapters()

// themeConfig.categories / chapters 是首页用的自定义字段，断言避开类型收窄。
const config = {
  lang: 'zh-CN',
  title: '全栈面试知识库',
  description: '前端 / 后端 / 大模型三领域面试知识体系',
  base,
  cleanUrls: false,
  lastUpdated: false,
  outDir: './dist',
  srcExclude: [
    'README.md',
    '算法概念.md',
    'node_modules/**',
    'dist/**',
    '.github/**',
    'scripts/**',
    '_source/**',
    '文档转网页/**',
    '前端/面试总结.md',
    '前端/7.Event Loop事件循环.md'
  ],

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }]],

  // 中文/空格文件名映射成短路径；前端 9 章沿用历史短名，保证线上旧 URL 不变
  rewrites: buildRewrites(chapters),

  markdown: {
    lineNumbers: true
  },

  themeConfig: {
    categories: buildCategories(chapters),
    nav: buildNav(chapters),
    sidebar: buildSidebar(chapters),

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索知识库', buttonAriaLabel: '搜索知识库' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清除查询',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        },
        miniSearch: {
          options: {
            // 中文按「整段 + 相邻双字」切词，否则默认分词器召回很差
            tokenize: (text: string) => {
              const tokens: string[] = []
              for (const raw of text.split(/[^A-Za-z0-9\u4e00-\u9fa5]+/)) {
                if (!raw) continue
                tokens.push(raw)
                if (/[\u4e00-\u9fa5]/.test(raw)) {
                  for (let i = 0; i < raw.length - 1; i++) {
                    tokens.push(raw.slice(i, i + 2))
                  }
                }
              }
              return tokens
            }
          }
        }
      }
    }
  }
}

export default defineConfig(config as any)
