---
description: Verify every promoted skill has a command, and every command maps back to a skill.
---
Run the repo's sync checker and fix whatever it flags:

1. Run `bash scripts/check-sync.sh` from the repo root.
2. Fix every issue it reports:
   - **MISSING** — create the missing `command/<name>.md` (description copied from the skill's frontmatter, body: "Load and follow the `<name>` skill for this task — read its SKILL.md and apply its workflow to the current situation."), add the README.md entry, or add the `plugin.json` entry.
   - **DRIFTED** — copy the skill's current description into its command.
   - **ORPHAN** — the skill was renamed or deleted; rename the command to match, or remove it.
3. Re-run `bash scripts/check-sync.sh` until it exits 0.
4. If a skill was added, renamed, removed, or changed buckets, also re-read `skills/engineering/ask-matt/SKILL.md` and update its map so the router stays accurate.
