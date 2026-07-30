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

This returns only directories whose tickets aren't all `done`. Then:

- **One active feature**: use it automatically.
- **Multiple active features**: list them and ask which one to work on.
- **None**: stop. Say "No hay features con tickets pendientes."

### 2. Find the next ticket (sub-agent)

Launch a fast, read-only sub-agent (called `explore` in OpenCode, `scout` in Pi, or the platform
equivalent) to scan the tickets without polluting the parent's context. Give it this task:

> Scan `.scratch/<slug>/issues/` and find the first unblocked `ready-for-agent` ticket.
>
> 1. Run `rg "^\*\*Status:\*\*|^\*\*Blocked by:\*\*" .scratch/<slug>/issues/` to extract status
>    and blocker lines from all tickets in one call.
> 2. Parse each ticket's Status (`ready-for-agent`, `in-progress`, or `done`) and Blocked by
>    (`"None — can start immediately"` or a list like `#01, #02`).
> 3. Walk the files in numeric order (by `NN` prefix). For each `ready-for-agent` ticket:
>    check that every referenced blocker has `Status: done`. The first one where all blockers
>    are done is the winner.
> 4. Read the winning ticket file fully.
> 5. Return: the ticket file path, ticket number, title, and a one-line summary of what to build.
>
> If no ticket is found, return why: all done, all blocked (list what each is waiting for),
> or directory empty.

The sub-agent's result is all you need — do not re-read or re-scan ticket files yourself.

### 3. Act on the result

The sub-agent returns one of:

**Found a ticket**: present what the sub-agent returned — ticket number, title, and summary.
Then load `/implement` and pass it the ticket file path. `/implement` will mark it `in-progress`
before starting.

**All tickets done**: say "Este PRD está completo. Todos los tickets tienen Status: done."

**All remaining tickets blocked**: present the list the sub-agent returned — which tickets are
blocked and what each is waiting for.

**No tickets / empty directory**: say the issues directory is empty — something may have gone
wrong with `/to-tickets`.

### 4. Edge cases

- **An `in-progress` ticket exists**: the sub-agent skips it — assume another session is
  working on it. If the sub-agent reports all remaining tickets are `in-progress`, warn the user.
- **Corrupt or unparseable ticket**: the sub-agent skips it and reports which file couldn't
  be read. Warn the user and continue.

### 5. What this skill does NOT do

- Does not modify ticket status — that's `/implement`'s job.
- Does not create, close, or delete tickets.
- Does not support GitHub issues yet — local `.scratch/` files only.
