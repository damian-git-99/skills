---
name: stack-pr
description: "Create and manage stacked PRs — one small PR per batch of tickets — using the gh-stack extension."
disable-model-invocation: true
---

# Stack PR

Create and manage stacked PRs for ticket batches using the `gh-stack` extension. Loaded by
`/implement` when a ticket carries `**Feature:**` metadata, and invoked directly for sync, merge,
and the final feature PR.

Requires `gh` authenticated, the extension installed (`gh extension install github/gh-stack`),
and stacked PRs enabled on the repository (otherwise `gh stack submit` exits with code 9).

## Branch model

```
main ← feat/<slug> ← feat/<slug>/batch-1 ← feat/<slug>/batch-2 ← ...
```

- `feat/<slug>` is the **feature branch** — the safe zone that accumulates merged batches.
  Nothing touches `main` until the very end.
- Each `feat/<slug>/batch-N` holds one batch of tickets; its PR targets `feat/<slug>` and its
  diff shows only that batch (its base is the previous branch).
- Merge method: **squash** — one commit per batch on `feat/<slug>`, one commit per feature on
  `main`.

## Ticket metadata

A ticket opts into the stacked flow via three fields:

| Field | Meaning |
|-------|---------|
| `**Feature:** feat/<slug>` | Opts in. The feature branch name. |
| `**PR Batch:** N` | Which batch this ticket belongs to. |
| `**Open PR:** true` | Only on the LAST ticket of a batch — triggers submit. |

## Operations

### 1. Guard — before starting a new feature

Verify the starting point before creating anything:

```bash
git branch --show-current    # must be main
git status --porcelain       # must be empty
```

If either fails, stop and report. Do not touch anything.

### 2. Init — first ticket of batch 1

```bash
git checkout -b feat/<slug> main
gh stack init --base feat/<slug> feat/<slug>/batch-1
```

### 3. Branch setup — start of every ticket

Called by `/implement` before it codes a ticket with `**Feature:**`:

- Already on the ticket's `feat/<slug>/batch-N` → nothing to do.
- New batch → `gh stack add feat/<slug>/batch-N` (creates it on top of the current branch).
- Unsure where you are → `gh stack view --json` and inspect `currentBranch` and `branches`.

### 4. Submit — last ticket of a batch (`**Open PR:** true`)

```bash
gh stack push
gh stack submit --auto
gh stack view --json
```

Then give the new PR a real title (auto-titles are the branch name humanized):

```bash
gh pr edit <number> --title "feat(<slug>): tickets NNN-MMM — <summary>"
```

Find `<number>` from `gh stack view --json` — the OPEN PR whose branch was just created.

Annotate the ticket file with the PR URL (`**PR:** <url>`), then report:

> PR #N creada: <url> — revisar y mergear cuando quieras.

### 5. Sync — after a batch PR is merged

```bash
gh stack sync --prune
```

Fast-forwards `feat/<slug>` with the merged batch and rebases the remaining branches onto it.

### 6. Merge a batch — when the user approves

```bash
gh stack merge <pr-number> --yes --squash
```

Merges everything up to and including PR `<pr-number>` (bottom to top), all-or-nothing.

### 7. Final PR — feature complete, QA passed

```bash
git checkout feat/<slug>
git pull origin feat/<slug>
gh pr create --base main --head feat/<slug> \
  --title "feat(<slug>): <summary>" \
  --body "Batches 1..N mergeados en feat/<slug>. QA OK."
```

## Edge cases

- **Exit code 9** on submit → stacked PRs not enabled on the repo. Tell the user to enable them.
- **User starts the next batch before merging the current PR**: fine — the stack continues on
  top regardless (branch N+1 already contains batch N's code). Only sync/cleanup waits on the
  merge.
- **Interactive prompts hang agents**: never run `gh stack` without the flags above — always
  `--auto`, `--json`, and branch names as arguments.
- **Multiple remotes**: `remote.pushDefault` must be configured, or pass `--remote origin`.

## What this skill does NOT do

- Does not decide batching or write ticket metadata — that's `/setup-stack` (or manual).
- Does not merge without the user asking.
- Does not touch ticket statuses — that's `/implement`'s job.
