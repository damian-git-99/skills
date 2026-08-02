Quickstart:

```bash
npx skills add mattpocock/skills --skill=next-ticket
```

```bash
npx skills update next-ticket
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/next-ticket)

## What it does

`next-ticket` finds the next unblocked ticket for a feature and hands it to `/implement` — the assembly line for working through a PRD one ticket at a time. It scans the feature's local ticket files (`.scratch/<slug>/issues/`), walks them in numeric order, and returns the first `ready-for-agent` ticket whose blockers are all `done`.

Its defining constraint: **the scanning happens in a sub-agent, so ticket discovery costs the parent context nothing** — it filters active features with a single `rg`, delegates the scan, and reports back only the winner.

## When to reach for it

You invoke this by typing `/next-ticket <feature-slug>`, or just `/next-ticket` when you want it to pick the feature for you.

Reach for it each time you finish a ticket and want the next one — it's the cadence of the pipeline: implement, done, next ticket, implement, done. If you prefer to pick tickets by hand or work from a different tracker, this skill is simply not needed.

## Where it fits

A chain step in the ticket pipeline, feeding `/implement`: `to-tickets → next-ticket → implement`. It is the hands that find the work; [implement](https://aihero.dev/skills-implement) does the building, and [stack-pr](https://aihero.dev/skills-stack-pr) turns finished batches of tickets into stacked PRs. When you're unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
