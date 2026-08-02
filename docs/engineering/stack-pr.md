Quickstart:

```bash
npx skills add mattpocock/skills --skill=stack-pr
```

```bash
npx skills update stack-pr
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/stack-pr)

## What it does

`stack-pr` turns a feature's ticket batches into **stacked PRs** — one small PR per batch instead of one unreadable 5000-line PR at the end. Each batch lives on its own branch (`feat/<slug>/batch-N`) chained on top of the previous one, so every PR's diff shows only that batch's changes. The chain roots on a feature branch (`feat/<slug>`) that accumulates merged batches as a safe zone for QA — `main` is not touched until a single final PR at the end.

Its defining constraint: **the diff of each PR is only its own batch, because each branch is based on the previous one** — reviewers see small, reviewable deltas while the code accumulates upward.

## When to reach for it

You invoke this by typing `/stack-pr` — or rather, `/implement` loads it for you when the ticket it's working on carries `**Feature:**` metadata. That metadata opts a ticket into the stacked flow: `/implement` calls `/stack-pr` for branch setup before coding, and for submit after the last ticket of a batch.

Reach for it directly when you want to sync after a merge, merge an approved batch, or open the final feature PR to `main` after QA passes. If your feature doesn't need per-batch PRs — the diff is small, one PR is fine — simply don't add the metadata and the whole machinery stays silent.

## Prerequisites

- `gh` authenticated, and the `gh-stack` extension installed (`gh extension install github/gh-stack`).
- **Stacked PRs enabled on the repository** — otherwise `gh stack submit` exits with code 9.
- Tickets annotated with batch metadata (`**Feature:**`, `**PR Batch:**`, `**Open PR:** true` on the last ticket of each batch) — currently written by hand, or by `/setup-stack` when it ships.

## The safe zone

The model is a deliberate choice over plain stacked PRs straight into `main`: every batch PR targets `feat/<slug>`, not `main`. That gives you a place where the whole feature is assembled, testable, and QA-able before anything reaches the trunk. Only when all batches are merged and QA passes does `/stack-pr` open the final PR — `feat/<slug>` → `main` — which merges with **squash**, so the feature lands as one clean commit per batch on the feature branch and one per feature on `main`. If a batch is bad, `main` never knows.

## Where it fits

A chain step in the ticket pipeline, between `/implement` and the final merge: `next-ticket → implement → stack-pr` — with `/implement` driving it automatically per ticket, and you driving it directly for sync, merge, and the final PR. Its neighbour is [next-ticket](https://aihero.dev/skills-next-ticket), which feeds tickets to `/implement` one at a time. When you're unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
