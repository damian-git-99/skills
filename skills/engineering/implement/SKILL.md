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
