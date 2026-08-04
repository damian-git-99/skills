---
name: next-ticket
description: "Find the next unblocked ticket for a feature and hand it off to /implement."
disable-model-invocation: true
---

# Next Ticket

Find the next available ticket for a feature and pass it to `/implement`.

Works with local ticket files only (GitHub support to come).

## Process

### 1. Determine the feature

If the user passed a feature slug as an argument (e.g. `/next-ticket login-system`), use it directly.

If they didn't, find features that still have active tickets. A single `rg` filters out completed
features without reading any files:

```bash
rg "^\*\*Status:\*\* (ready-for-agent|in-progress)" .scratch/*/issues/ --files-with-matches
```

This returns only directories whose tickets aren't all finished. Only tickets carrying
`**Status:**` (the `/to-tickets` format, bold) count as active. `/wayfinder` decision tickets
use a bare `Status: resolved|closed` (no bold) and never match — they are decisions, not
deliverables, so a feature holding only them is not active. Then:

- **One active feature**: use it automatically.
- **Multiple active features**: list them and ask which one to work on.
- **None**: stop. Say "No features with pending tickets."

### 2. Find the next ticket (sub-agent)

Launch a fast, read-only sub-agent (called `explore` in OpenCode, `scout` in Pi, or the platform
equivalent) to scan the tickets without polluting the parent's context. Give it this task:

> Scan `.scratch/<slug>/issues/` and find the first unblocked `ready-for-agent` ticket.
>
> 1. Run `rg "^\*\*Status:\*\*|^Status:|^\*\*Blocked by:\*\*" .scratch/<slug>/issues/` to
>    extract status and blocker lines from all files in one call. Note the two formats:
>    `/to-tickets` writes `**Status:**` (bold); `/wayfinder` decision tickets write a bare
>    `Status:` (no bold).
> 2. Classify each file's status:
>    - `**Status:** ready-for-agent` → implementable candidate.
>    - `**Status:** in-progress` → being worked on elsewhere; skip.
>    - `**Status:** done` → finished; skip.
>    - `Status: resolved` or `Status: closed` (wayfinder, no bold) → decision settled or
>      closed; skip — not implementable work.
>    - No status line at all → wayfinder decision ticket; skip.
> 3. Walk the candidates in numeric order (by `NN` prefix). For each `ready-for-agent` ticket:
>    check that every referenced blocker is finished (`done`, `resolved`, or `closed`). The
>    first one where all blockers are finished is the winner.
> 4. Read the winning ticket file fully.
> 5. Return: the ticket file path, ticket number, title, and a one-line summary of what to build.
>
> If no candidate is found, return why: all finished (done/resolved/closed), all blocked (list
> what each is waiting for), all in-progress, or directory empty.

The sub-agent's result is all you need — do not re-read or re-scan ticket files yourself.

### 3. Act on the result

The sub-agent returns one of:

**Found a ticket**: present what the sub-agent returned — ticket number, title, and summary.
Then load `/implement` and pass it the ticket file path. `/implement` will mark it `in-progress`
before starting.

**All tickets done**: say "This PRD is complete. All tickets are finished (done, resolved, or closed)."

**All remaining tickets blocked**: present the list the sub-agent returned — which tickets are
blocked and what each is waiting for.

**No tickets / empty directory**: say the issues directory is empty — something may have gone
wrong with `/to-tickets`.

### 4. Edge cases

- **An `in-progress` ticket exists**: the sub-agent skips it — assume another session is
  working on it. If the sub-agent reports all remaining tickets are `in-progress`, warn the user.
- **Corrupt or unparseable ticket**: a file that looks like a `/to-tickets` ticket (has
  `**Status:**` or `**Blocked by:**`) but can't be parsed — the sub-agent skips it and reports
  which file. Warn the user and continue. Wayfinder decision tickets (no bold fields) are not
  corrupt — they're just not implementable; skip silently.

### 5. What this skill does NOT do

- Does not modify ticket status — that's `/implement`'s job.
- Does not create, close, or delete tickets.
- Does not support GitHub issues yet — local `.scratch/` files only.
