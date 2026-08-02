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

1. **Before the status change**: **delegate the branch setup to a sub-agent** — do not load
   `/stack-pr` into your own context and do not run any stack commands yourself. Launch a
   read-only-fast sub-agent (the platform equivalent of OpenCode's `explore` / Pi's `scout`)
   with this task:

   > Read the skill at `skills/engineering/stack-pr/SKILL.md` and the ticket file `<ticket
   > path>`. Run the **branch setup** operation (guard, init on the first ticket of a feature,
   > or add/checkout for a new batch — as the skill's Operations 1-3 describe). Leave the
   > working tree clean on the correct branch. Return: the exact branch you're on (verified
   > with `git branch --show-current`), what you created (feature branch / stack / batch
   > branch), and any error.

   The sub-agent leaves the branch ready for coding; it must not write code. Its returned
   branch is authoritative — if it reports an error or an unexpected branch, stop and surface
   it to the user instead of starting to code.

   Only after the sub-agent confirms the branch is ready do you change the ticket status to
   `in-progress` (see Ticket lifecycle) and start coding — never before, or the dirty tree
   trips the guard.

2. **After a successful commit**: if the ticket has `**Open PR:** true`, load `/stack-pr` and
   run its **submit** — push the branch, create the batch PR, and give it a real title.

Tickets without `**Feature:**` skip all of this — no branch juggling, no PR.
