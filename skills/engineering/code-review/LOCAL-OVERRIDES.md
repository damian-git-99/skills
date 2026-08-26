# Local Overrides

## Reviewer Dispatch

Send both review sub-agent calls in one parallel tool message.

- Use the dedicated `code-reviewer-standards` and `code-reviewer-spec` sub-agents.
- Give each sub-agent fresh, read-only context.
- In Pi, use the built-in `reviewer` sub-agent for both axes. Keep both calls fresh and read-only because Pi's `reviewer` can edit files by default, while this skill only reports findings.
