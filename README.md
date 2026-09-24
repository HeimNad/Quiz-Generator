# MathGen — 数学练习题生成器

Generates printable math worksheets (PDF) with answer keys: arithmetic, fractions, decimals,
rounding, comparison, percent and Grade 1 counting.

## Development

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # vitest: generators + a PDF build for every preset
pnpm lint
pnpm typecheck
pnpm build
```

## How it fits together

```
lib/
  random.ts               Seedable RNG — generators never call Math.random
  presets.ts              Home page cards: a problem type + config overrides
  problems/
    types.ts              ProblemType interface
    registry.ts           PROBLEM_TYPES — every type is listed here
    shared.ts             Ranges, dedup loop, number formatting
    <type>/index.ts       One folder per problem type
  pdf/
    tokens.ts             Structured question pieces (number, fraction, operator, blank…)
    draw.ts               Equation and 竖式 drawing
    build.ts              Page layout: grid sheets, card sheets, answer keys
    assets.ts             Font + logo, loaded once
components/quiz/
  QuizEditor.tsx          Editor state: config, generated batches, PDF actions
  panels/                 Settings panel per problem type
```

A problem type owns everything about itself:

- **config** — its settings, with `defaultConfig`
- **generate(config, rng)** — returns structured problems (operands, blanks, shapes…), never
  pre-formatted strings
- **layout** — how the PDF prints them:
  - `grid`: return question/answer tokens; the PDF lays them out in columns
    (optionally 竖式 via `vertical`)
  - `card`: full-width cards with custom drawing (e.g. counting shapes); `section` starts a new page
    when it changes

The editor sidebar shows the shared settings (count, copies, header) and renders the type's own panel.

## Adding a problem type

1. Create `lib/problems/<name>/index.ts` exporting `defineProblemType({ id, label, defaultConfig, generate, tags, layout })`.
2. Register it in `lib/problems/registry.ts`.
3. Add `components/quiz/panels/<Name>Panel.tsx` and register it in `components/quiz/panels/index.ts`
   (TypeScript reports a missing panel).
4. Add a preset in `lib/presets.ts` so it shows on the home page.
5. Add tests next to the generator. `lib/presets.test.ts` already builds a PDF for every preset.
