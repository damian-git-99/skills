---
name: setup-stack
description: "Ask whether to use stacked PRs for a feature's tickets, estimate sizes, group tickets into batches, and annotate them with the metadata /stack-pr needs."
disable-model-invocation: true
---

# Setup Stack

Decide, right after `/to-tickets`, whether a feature's tickets will ship as **stacked PRs** —
and if so, group them into batches and annotate each ticket so `/implement` + `/stack-pr` can
run on autopilot. Run this once per feature, before `/next-ticket`.

## Process

### 1. Determine the feature

If the user passed a slug (e.g. `/setup-stack login-system`), use it. If not, list active
features under `.scratch/` and ask which one — or use the single one if there's only one.
No features → stop.

### 2. Ask the questions

**Do you want stacked PRs for `<slug>`?**

- **No** → stop here. Tickets stay untouched; the pipeline runs exactly as before.

**How many lines max per PR?** Default options 400 / 800 / 1000, plus custom. 800 is the
recommended default.

### 3. Estimate lines per ticket

Read each ticket and apply this heuristic table. Rough is fine — it only needs to decide
grouping, not bill hours:

| Signal in the ticket | Lines |
|----------------------|-------|
| "create" + new file / component / service / module / route | +150 |
| "modificar" / "refactorizar" / "ajustar" algo existente | +75 |
| Each file path mentioned (`src/...`, `app/...`, `.tsx`, `.go`, etc.) | +50 |
| Each test mentioned ("test", "spec", "prueba", "coverage") | +40 |
| Each type / interface / schema / migration | +25 |
| Each API endpoint or route | +20 |

Present the per-ticket estimates in numeric order.

### 4. Group into batches

Walk tickets in numeric order, accumulating estimated lines. Close a batch when adding the
next ticket would exceed the threshold — a single oversized ticket becomes its own batch.

Present the result:

```
batch-1: tickets 001-003  (~750 lines)
batch-2: tickets 004-006  (~820 lines)
batch-3: tickets 007-008  (~600 lines)
```

Ask: **OK with these batches?**
- **Yes** → continue.
- **Re-group manually** → the user tells you the new grouping (e.g. "muevo el 004 al batch 1"),
  re-run the grouping, confirm again.

### 5. Annotate the tickets

Write three fields into each ticket file (string-append near the top, under any existing
`**Status:**` line):

```markdown
**Feature:** feat/<slug>
**PR Batch:** <N>
**Open PR:** true|false
```

`**Open PR:** true` goes **only** on the last ticket of each batch — that's the trigger that
makes `/implement` submit the batch's PR. Every other ticket gets `false`.

If a ticket already carries `**Feature:**`, ask before overwriting (it may be from a previous
setup run — re-running is the way to change batches).

### 6. Report

Summarize the batches with their ticket ranges, estimated lines, and which tickets will open
a PR. Tell the user the flow is ready: `/next-ticket` → `/implement`, and `/stack-pr` handles
branches and PRs automatically.

## Edge cases

- **Single ticket per batch** (a ticket bigger than the threshold): fine — it's a one-ticket
  PR. The field `**Open PR:** true` still goes on it.
- **Ticket already annotated**: ask before overwriting; re-running `/setup-stack` is the
  supported way to change batch groupings later.
- **No tickets found**: stop — `/to-tickets` may not have run yet.

## What this skill does NOT do

- Does not create branches or stacks — `/stack-pr` does that when `/implement` starts the
  first ticket (it guards: on `main`, clean tree).
- Does not estimate or group tickets that were already annotated — it asks first.
- Does not create, close, or delete tickets — only annotates.
- No GitHub support yet — local `.scratch/` ticket files only.
