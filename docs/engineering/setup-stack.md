Quickstart:

```bash
npx skills add mattpocock/skills --skill=setup-stack
```

```bash
npx skills update setup-stack
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/setup-stack)

## What it does

`setup-stack` is the decision point for stacked PRs, run once per feature right after `/to-tickets`. It asks whether the feature's tickets will ship as one PR per batch, asks for a size threshold (400 / 800 / 1000 lines), estimates each ticket's size with a rough heuristic, groups them into batches that fit the threshold, and — once you approve — annotates every ticket with the metadata (`**Feature:**`, `**PR Batch:**`, `**Open PR:**`) that `/implement` and `/stack-pr` read to run the rest of the pipeline on autopilot.

Its defining constraint: **one decision at creation time, converted into durable metadata** — the whole stacked-PR pipeline after this is just reading what was written here, never asking again.

## When to reach for it

You invoke this by typing `/setup-stack <feature-slug>` — the agent won't reach for it on its own.

Reach for it immediately after `/to-tickets` when you want a feature reviewed in small PRs instead of one giant one. Say **no** at the first question and nothing changes: no metadata is written, and the pipeline behaves exactly as before. If you re-run it later, it asks before overwriting existing annotations — re-running is the supported way to change batch groupings.

## The estimate is a grouping tool, not a bill

The per-ticket line estimates come from a simple signal table (new files +150, modified code +75, each file path +50, each test +40, each type/schema +25, each endpoint +20). Precision doesn't matter — the estimate only exists to put tickets into reviewable chunks, and you can re-group manually before anything is written. What matters is the result: every PR stays inside the threshold you picked, so no review ever comes back as "5000 lines, good luck."

## Where it fits

A run-once setup step between ticket creation and the assembly line: `to-tickets → setup-stack → next-ticket → implement → stack-pr`. Its neighbour is [stack-pr](https://aihero.dev/skills-stack-pr), which consumes the metadata this skill writes, and [to-tickets](https://aihero.dev/skills-to-tickets), which produces the tickets it annotates. When you're unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
