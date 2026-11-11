/**
 * 多分类章节数据源：构建时扫描三个领域目录下的 `NN 标题.md`。
 *
 * 新增文件只要按 `NN 标题.md` 命名放进 前端/、后端/、大模型/ 任一目录，
 * 就会自动获得短路径、侧边栏条目、顶部导航入口和首页目录行。
 *
 * 前端 01–09 沿用历史短路径（js-core 等），保证线上旧链接不失效。
 */
import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FILE_RE = /^(\d{2})\s+(.+)\.md$/

export const CATEGORIES = [
  { dir: '前端', label: '前端', prefix: 'fe' },
  { dir: '后端', label: '后端', prefix: 'be' },
  { dir: '大模型', label: '大模型', prefix: 'ai' }
]

const LEGACY_SLUGS = {
  '前端/01 JS语言核心.md': 'js-core',
  '前端/02 异步与事件循环.md': 'async',
  '前端/03 浏览器与渲染.md': 'browser',
  '前端/04 网络与安全.md': 'network',
  '前端/05 框架原理.md': 'framework',
  '前端/06 Vue.md': 'vue',
  '前端/07 React.md': 'react',
  '前端/08 工程化与TypeScript.md': 'engineering',
  '前端/09 算法扩展包.md': 'algorithm'
}

const LEGACY_TITLES = {
  '前端/01 JS语言核心.md': '01 JS 语言核心',
  '前端/02 异步与事件循环.md': '02 异步与事件循环',
  '前端/03 浏览器与渲染.md': '03 浏览器与渲染',
  '前端/04 网络与安全.md': '04 网络与安全',
  '前端/05 框架原理.md': '05 框架原理',
  '前端/06 Vue.md': '06 Vue',
  '前端/07 React.md': '07 React',
  '前端/08 工程化与TypeScript.md': '08 工程化与 TypeScript',
  '前端/09 算法扩展包.md': '09 算法扩展包'
}

export function getChapters() {
  const out = []
  for (const cat of CATEGORIES) {
    let files = []
    try {
      files = readdirSync(resolve(srcDir, cat.dir)).filter((f) => FILE_RE.test(f)).sort()
    } catch {
      continue
    }
    for (const file of files) {
      const [, num, rawTitle] = file.match(FILE_RE)
      const rel = `${cat.dir}/${file}`
      out.push({
        dir: cat.dir,
        label: cat.label,
        num,
        file,
        rel,
        slug: LEGACY_SLUGS[rel] || `${cat.prefix}-${num}`,
        title: LEGACY_TITLES[rel] || `${num} ${rawTitle}`
      })
    }
  }
  return out
}

export function buildRewrites(chapters) {
  return Object.fromEntries(chapters.map((c) => [c.rel, `${c.slug}.md`]))
}

export function buildSidebar(chapters) {
  return CATEGORIES.map((cat) => ({
    text: cat.label,
    items: chapters
      .filter((c) => c.dir === cat.dir)
      .map((c) => ({ text: c.title, link: `/${c.slug}` }))
  })).filter((g) => g.items.length > 0)
}

export function buildNav(chapters) {
  return [
    { text: '首页', link: '/' },
    ...CATEGORIES.map((cat) => {
      const first = chapters.find((c) => c.dir === cat.dir)
      return first ? { text: cat.label, link: `/${first.slug}` } : null
    }).filter(Boolean)
  ]
}

// 首页目录用；cleanUrls: false，链接要带 .html
export function buildCategories(chapters) {
  return CATEGORIES.map((cat) => ({
    label: cat.label,
    items: chapters
      .filter((c) => c.dir === cat.dir)
      .map((c) => ({ title: c.title, link: `/${c.slug}.html` }))
  })).filter((g) => g.items.length > 0)
}
