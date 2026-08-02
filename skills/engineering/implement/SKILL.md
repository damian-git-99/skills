---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.

## Ticket lifecycle

If the work is scoped to a ticket file (a `.md` file under `.scratch/`, passed to you directly
or referenced by the user), update its status in the file using a simple string-replace edit:

1. **Before starting**: change `**Status:** ready-for-agent` to `**Status:** in-progress`.
2. **After a successful commit**: change `**Status:** in-progress` to `**Status:** done`.

Do not modify the parent spec or PRD issue — only the ticket file itself.

## Stacked PRs

If the ticket carries `**Feature:**` metadata, the work participates in a stacked-PR pipeline
(one small PR per batch of tickets, managed via the `gh-stack` extension):

1. **Before starting** (alongside the status change): load `/stack-pr` and run its **branch
   setup** — it ensures the correct `feat/<slug>-batch-N` branch exists and is checked out,
   creating the feature branch and initializing the stack on the first ticket of a feature.
2. **After a successful commit**: if the ticket has `**Open PR:** true`, load `/stack-pr` and
   run its **submit** — push the branch, create the batch PR, and give it a real title.

Tickets without `**Feature:**` skip all of this — no branch juggling, no PR.
