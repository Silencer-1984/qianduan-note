import { defineConfig } from 'vitepress'

// 部署到 GitHub 项目页（https://<user>.github.io/<repo>/）时，构建要带 base。
// 本地构建默认 '/'；CI 里通过 BASE_PATH 环境变量传入 '/<repo>/'。
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: '前端面试复习',
  description: '9 章前端面试复习提纲：结论优先，2–3 小时通读',
  base,
  // GitHub Pages 不支持无扩展名路由的重写，关掉 cleanUrls，URL 变成 /react.html
  cleanUrls: false,
  lastUpdated: false,
  // 产物放到仓库根的 dist/，避免藏在 .vitepress 隐藏目录里找不到
  outDir: '../dist',
  srcExclude: ['7.Event Loop事件循环.md', '面试总结.md', 'README.md'],

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }]],

  // 文件名带空格和中文，映射成短路径，不改动源文件命名
  rewrites: {
    '01 JS语言核心.md': 'js-core.md',
    '02 异步与事件循环.md': 'async.md',
    '03 浏览器与渲染.md': 'browser.md',
    '04 网络与安全.md': 'network.md',
    '05 框架原理.md': 'framework.md',
    '06 Vue.md': 'vue.md',
    '07 React.md': 'react.md',
    '08 工程化与TypeScript.md': 'engineering.md',
    '09 算法扩展包.md': 'algorithm.md'
  },

  markdown: {
    lineNumbers: true
  },

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '怎么用', link: '/#怎么用' },
      { text: '语言与运行时', link: '/js-core' },
      { text: '框架', link: '/framework' },
      { text: '算法扩展', link: '/algorithm' }
    ],

    sidebar: [
      {
        text: '语言与运行时',
        items: [
          { text: '01 JS 语言核心', link: '/js-core' },
          { text: '02 异步与事件循环', link: '/async' },
          { text: '03 浏览器与渲染', link: '/browser' },
          { text: '04 网络与安全', link: '/network' }
        ]
      },
      {
        text: '框架',
        items: [
          { text: '05 框架原理', link: '/framework' },
          { text: '06 Vue', link: '/vue' },
          { text: '07 React', link: '/react' }
        ]
      },
      {
        text: '工程与扩展',
        items: [
          { text: '08 工程化与 TypeScript', link: '/engineering' },
          { text: '09 算法扩展包', link: '/algorithm' }
        ]
      }
    ],

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清除查询',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
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
})
