/**
 * 从两份 LLM 生成的原始题库里抽取「知识本体」，按领域重新归档。
 *
 * 源材料（只读，整理后移到 _source/ 备份）：
 *   大模型知识/技能八股题库.md   Q1–Q14 属大模型，Q15–Q26 前端（弃），Q27–Q40 后端
 *   后端/Python面试复习笔记.md    ## 2–5 语言核心，## 6–7 陷阱，其余是备考引导（弃）
 *
 * 可重复执行：先生成目标文件，再把原始文件移入 _source/。
 * 用法：node scripts/build-knowledge.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, rmdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readLines = (p) => readFileSync(resolve(root, p), 'utf8').split(/\r?\n/)
const slice = (a, from, to) => a.slice(from - 1, to).join('\n').trim()

const llm = readLines('大模型知识/技能八股题库.md')
const py = readLines('后端/Python面试复习笔记.md')

function questions(lines, from, to) {
  const out = new Map()
  let cur = null
  for (const line of lines.slice(from - 1, to)) {
    const m = line.match(/^## Q(\d+)\s+(.+)$/)
    if (m) {
      cur = Number(m[1])
      out.set(cur, [line])
    } else if (cur) {
      out.get(cur).push(line)
    }
  }
  for (const [k, v] of out) {
    while (v.length && (v.at(-1).trim() === '' || v.at(-1).trim() === '---')) v.pop()
    out.set(k, v.join('\n'))
  }
  return out
}

function writeGroup(dir, file, title, nums, pool) {
  let body = `# ${title}\n\n`
  for (const n of nums) {
    const q = pool.get(n)
    if (!q) throw new Error(`缺少题目 Q${n}`)
    body += q.replace(/^## Q\d+\s+/, '## ').trim() + '\n\n'
  }
  mkdirSync(resolve(root, dir), { recursive: true })
  writeFileSync(resolve(root, dir, file), body.trimEnd() + '\n', 'utf8')
  console.log(`  ${dir}/${file}  (${nums.length} 题)`)
}

console.log('=== 大模型（Q1–Q14）===')
const llmQs = questions(llm, 21, 197)
writeGroup('大模型', '01 Agent 框架与工具调用.md', 'Agent 框架与工具调用', [1, 2, 3, 4, 11], llmQs)
writeGroup('大模型', '02 RAG 与评估.md', 'RAG 与评估', [5, 6, 13], llmQs)
writeGroup('大模型', '03 安全、成本与可靠性.md', '安全、成本与可靠性', [7, 8, 9, 10, 12, 14], llmQs)

console.log('=== 后端（Q27–Q40 从大模型题库搬来）===')
const beQs = questions(llm, 312, 434)
writeGroup('后端', '02 Python 进阶与 FastAPI.md', 'Python 进阶与 FastAPI', [27, 28, 29, 30, 31, 32], beQs)
writeGroup('后端', '03 数据与部署.md', '数据与部署', [33, 34, 35, 36, 37, 38, 39, 40], beQs)

console.log('=== 后端（Python 复习笔记的知识本体）===')
let core = slice(py, 48, 357)
  .replace(/^## 2\. 必背 11 题.*$/m, '## 核心语法与机制')
  .replace(/^## 3\. 会用即可 7 题.*$/m, '## 常用内置能力')
  .replace(/^## 4\. 知道概念就行 2 题.*$/m, '## 进阶概念')
  .replace(/^## 5\. AI 四题简版.*$/m, '## AI 相关概念')
writeFileSync(resolve(root, '后端/01 Python 语言核心.md'), `# Python 语言核心\n\n${core}\n`, 'utf8')
console.log('  后端/01 Python 语言核心.md')

let pit = slice(py, 358, 502)
  .replace(/^## 6\. ⭐ 核心新增：.*$/m, '## 常见陷阱 10 例')
  .replace(/^## 7\. 原题里的错误示范.*$/m, '## 错误示范')
writeFileSync(resolve(root, '后端/04 常见陷阱.md'), `# 常见陷阱\n\n${pit}\n`, 'utf8')
console.log('  后端/04 常见陷阱.md')

console.log('=== 原始材料归档到 _source/ ===')
mkdirSync(resolve(root, '_source'), { recursive: true })
for (const [src, name] of [
  ['大模型知识/技能八股题库.md', '技能八股题库.md'],
  ['后端/Python面试复习笔记.md', 'Python面试复习笔记.md']
]) {
  const from = resolve(root, src)
  if (existsSync(from)) {
    renameSync(from, resolve(root, '_source', name))
    console.log(`  ${src} → _source/${name}`)
  }
}
try { rmdirSync(resolve(root, '大模型知识')) } catch { /* 非空则保留 */ }
console.log('完成')
