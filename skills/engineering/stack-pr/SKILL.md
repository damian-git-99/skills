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
main ← feat/<slug> ← feat/<slug>-batch-1 ← feat/<slug>-batch-2 ← ...
```

- `feat/<slug>` is the **feature branch** — the safe zone that accumulates merged batches.
  Nothing touches `main` until the very end.
- Each `feat/<slug>-batch-N` holds one batch of tickets; its PR targets `feat/<slug>` and its
  diff shows only that batch (its base is the previous branch).
- Merge method: **squash** — one commit per batch on `feat/<slug>`, one commit per feature on
  `main`.

> **Naming rule — hyphen, never slash:** git's `check-ref-format` forbids one ref being a
> prefix of another, so `feat/<slug>` and `feat/<slug>/batch-N` can never coexist. The batch
> branches must be `feat/<slug>-batch-N` (hyphen). Do not "fix" this back to a slash — it
> fails at `git checkout` time, not at push time.

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
git branch --show-current                     # must be main
git status --porcelain                        # must be empty, except .scratch/ edits
```

Ticket status edits under `.scratch/` are part of the pipeline, not dirt — a tree whose only
changes are there passes the guard:

```bash
git status --porcelain | grep -v "^ M .scratch/"   # must be empty
```

If either check fails, stop and report. Do not touch anything.

### 2. Init — first ticket of batch 1, or a fresh stack generation

```bash
git checkout -b feat/<slug> main        # only if feat/<slug> doesn't exist yet
gh stack init --base feat/<slug> feat/<slug>-batch-1
git push -u origin feat/<slug>
```

On the very first generation, also create the **final PR** — the feature's progress tracker,
born as a draft with an empty diff so reviewers are never notified:

```bash
gh pr create --base main --head feat/<slug> --draft \
  --title "feat(<slug>): <summary>" --body "<batch checklist — nothing checked>"
```

Skip this on later generations — the final PR already exists. Init is also how you start a
**new stack generation**. A stack is consumed once every branch in it is merged — `add` then
refuses to hang anything off it ("All branches in this stack have been merged"). Start a
fresh stack on the same feature branch (see Operation 3).

### 3. Branch setup — start of every ticket

Called by `/implement` before it codes a ticket with `**Feature:**`:

- Already on the ticket's `feat/<slug>-batch-N` → nothing to do.
- New batch → first check whether the current stack is still alive:

  ```bash
  gh stack view --json
  ```

  - **Any branch with `isMerged: false`** (or `pr.state == "OPEN"`) → the stack is alive:
    `gh stack add feat/<slug>-batch-N` (hangs off the current branch).
  - **Every branch `isMerged: true`**, or the command reports "not in a stack" → the stack is
    consumed: `gh stack init --base feat/<slug> feat/<slug>-batch-N` (fresh stack rooted on
    the feature branch).
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

> PR #N created: <url> — review and merge whenever you're ready.

### 5. Sync — after a batch PR is merged

```bash
gh stack sync --prune
```

Fast-forwards `feat/<slug>` with the merged batch and rebases the remaining branches onto it.

Then update the final PR's progress checklist (the tracker created in Operation 2).
Regenerate the whole body from this template — never hand-edit it:

```markdown
## Summary

<feature summary>

## Batches

- [x] Batch 1 (tickets 001-003) — #12
- [ ] Batch 2 (tickets 004-006)

<add "All batches merged — ready for QA." once everything is checked>
```

For each batch branch `feat/<slug>-batch-N`, look up its PR state
(`gh pr list --head feat/<slug>-batch-N --json number,state`) — merged/closed means checked,
no PR yet means unchecked, and the PR number goes on the line. Then:

```bash
FINAL_PR=$(gh pr list --base main --head feat/<slug> --state open --json number -q '.[0].number')
gh pr edit "$FINAL_PR" --body "$BODY"
```

If no final PR exists (the feature started before this change), skip the update.

### 6. Merge a batch — when the user approves

```bash
gh stack merge <pr-number> --yes --squash
```

Merges everything up to and including PR `<pr-number>` (bottom to top), all-or-nothing.

### 7. Final PR — feature complete, QA passed

The final PR already exists (created in Operation 2); nothing is created here. Close out:

1. Verify every batch is checked in the final PR's checklist — nothing still open.
2. Mark it ready for review:

   ```bash
   gh pr ready "$FINAL_PR"
   ```

3. On approval, merge with squash: `gh pr merge "$FINAL_PR" --squash`.

## Edge cases

- **Exit code 9** on submit → stacked PRs not enabled on the repo. Tell the user to enable them.
- **"All branches in this stack have been merged"** from `add` → the stack is consumed.
  Regenerate: `gh stack init --base feat/<slug> feat/<slug>-batch-N` — never retry `add`.
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
