# MathGen — 数学练习题生成器

生成可打印的数学练习卷（PDF，附答案页）。线上地址：https://mathgen.heimnad.com

## 支持的题型

| 题型 | 例子 |
| --- | --- |
| 四则运算（整数 / 小数） | `23 + 45 =`、`100 - 34 =`、求未知数 `5 + ___ = 12`、竖式 |
| 十位个位加法 | TENS / ONES 表格 + 十位棒和个位方块图示，可选是否进位 |
| 分数运算 | `3/4 + 1/6 =`、分数与整数混合、三项加减 |
| 比大小 | `63 ( ) 71` |
| 四舍五入 | `Round 347 to the nearest 10` |
| 百分数 | `25% of 80`、`3/4 = ___%`、`0.5 = ___%` |
| 数数（一年级） | 数图形、填缺数、顺数 / 倒数 |
| 英文数字 | `Write 93 in words`、`Write the number: fourteen` |

## 开发

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # vitest：每个题型的出题逻辑 + 每个预设生成一次完整 PDF
pnpm lint
pnpm typecheck
pnpm build
```

推送到 `main` 后 GitHub Actions 会依次跑 lint、类型检查、测试和构建。部署用 `vercel --prod`。

## 代码结构

```
lib/
  random.ts               可设种子的随机数，出题代码不直接用 Math.random
  presets.ts              首页卡片：一个题型 + 覆盖的部分配置
  problems/
    types.ts              ProblemType 接口
    registry.ts           题型注册表 PROBLEM_TYPES
    shared.ts             数值范围、去重生成、数字格式化
    <题型>/index.ts        每个题型一个目录
  pdf/
    tokens.ts             结构化题面（数字、分数、运算符、空格…）
    draw.ts               横式、竖式绘制
    build.ts              页面排版：网格、卡片、答案页
    assets.ts             字体和 logo，只加载一次
components/quiz/
  QuizEditor.tsx          编辑页状态：配置、生成的题目、下载 / 打印
  panels/                 每个题型的设置面板
```

每个题型自己负责和自己有关的全部内容：

- **config**：这个题型的设置项和 `defaultConfig`
- **generate(config, rng)**：返回结构化的题目（操作数、空格位置、图形……），不拼接成字符串
- **layout**：题目在 PDF 里怎么印
  - `grid`：返回题目和答案的 token，PDF 按列排版。可选：
    - `vertical` 竖式
    - `columns` 每行几列
    - `answerColumns` 答案页每行几列
  - `card`：整行卡片，自己绘制（比如数图形、十位棒）；`section` 变化时另起一页

编辑页侧边栏只放公共设置（题目数量、份数、表头），中间渲染当前题型自己的设置面板。

## 新增一个题型

1. 新建 `lib/problems/<名字>/index.ts`，用 `defineProblemType({ id, label, defaultConfig, generate, tags, layout })` 导出。
2. 在 `lib/problems/registry.ts` 里注册。
3. 新建 `components/quiz/panels/<名字>Panel.tsx`，在 `components/quiz/panels/index.ts` 里注册（漏了 TypeScript 会报错）。
4. 在 `lib/presets.ts` 加一个预设，首页才会出现。
5. 在出题代码旁边加测试。`lib/presets.test.ts` 会自动给每个预设生成一次 PDF。
