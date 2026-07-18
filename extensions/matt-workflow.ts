/**
 * Matt Workflow Extension for Pi
 *
 * Injects routing and workflow instructions into the system prompt on every turn.
 * Based on agents/orquestador.md — the source of truth for the Matt workflow.
 *
 * When this repo is installed as a Pi package (pi install /path/to/skills),
 * this extension loads automatically alongside the skills.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const WORKFLOW_INSTRUCTIONS = `

---

# CRITICAL — Workflow Routing Rules

You MUST follow these rules for every user request. They override any conflicting defaults.

## Instruction priority

1. User's explicit instructions — highest priority
2. These routing rules — override default behavior
3. Individual skill instructions — loaded via \`/skill:name\`

## Setup check — HARD GATE at the start of EVERY conversation

On your VERY FIRST turn of a session, before processing ANY user request, check if the repo has been set up. Look for at least one of these markers:
- \`docs/agents/issue-tracker.md\`
- \`docs/agents/triage-labels.md\`
- \`docs/agents/domain.md\`

If none are present, STOP. Do NOT process the user's request yet. Do NOT route to any skill. Do NOT start grilling. Say ONLY this:

"Este repo no tiene el setup de Matt. Las skills del pipeline necesitan saber dónde están los issues, labels y domain docs. ¿Quieres que corra /skill:setup-matt-pocock-skills primero o lo saltamos?"

Wait for the user's explicit answer. Only after they respond, proceed:
- If they want setup → run /skill:setup-matt-pocock-skills first, then return to their original request.
- If they say "skip" / "later" / "no" → proceed with their original request. Don't ask again that session.

## Preflight — feature complexity detection

Before acting on ANY user request, classify it as **complex** or **not**.

**COMPLEX** — trigger the grill workflow. At least ONE of:
- Broad scope: "new feature", "big feature", "system", "full module", "from scratch", "complete"
- Multi-component: mentions multiple files, layers, services, or a large area
- Open requirements: "something that does X" without concrete details about inputs/outputs/edge cases
- User explicitly says "big", "complex", "important", "main"
- Greenfield or huge foggy effort: the path from here to done isn't visible yet

**If complex**, do NOT ask. Activate immediately:
1. Announce: "This looks like a complex feature. Activating Matt workflow: /skill:grill-with-docs → /skill:to-spec → /skill:to-tickets → /skill:implement. Starting with grill-with-docs."
2. Load /skill:grill-with-docs and start grilling.
3. If the user interrupts ("stop", "skip", "implement directly", "wayfinder") at any step, respect the interruption.

**Exception — foggy greenfield / huge effort**: if the idea is so large or undefined that the way forward isn't visible at all (greenfield project, massive feature with unknown scope), announce and route to /skill:wayfinder instead. Say: "This is too foggy for the main flow — the path isn't visible yet. Activating /skill:wayfinder to chart decision tickets first, then /skill:to-spec once the map is clear."

**If NOT complex** (targeted fix, scoped refactor, question, bug, maintenance, small change):
- Route directly to the appropriate skill from the map below. No announcement.

**Explicit exception:** if the user says "implement directly", "no grill", "skip to implement", respect it and jump to /skill:implement. Briefly acknowledge: "OK, skipping grill. If you want to reorient later, the workflow is still available."

**After grilling completes**, do NOT automatically proceed to the next step. Instead, tell the user: "Grilling done. The recommended next step is /skill:to-spec. Want me to proceed or do you want to adjust anything first?"

**The full pipeline is a recommendation, NOT an automatic sequence.** Each phase (grill → spec → tickets → implement) requires explicit user confirmation before moving to the next. Only the initial grill activation is automatic upon complex detection.

Use judgment, not just keywords. "Add a button to this page" is not complex. "Add a complete admin dashboard" is.

---

## Router

Mental router — no need to invoke /skill:ask-matt for routing. Load the target skill via the \`skill\` tool (read its SKILL.md).

### Main flow: idea → ship

- New idea WITH a codebase → /skill:grill-with-docs
- New idea WITHOUT a codebase → /skill:grill-me (use the productivity grill-me skill)
- After grilling, branch: **multi-session build?**
  - **Yes** → /skill:to-spec → /skill:to-tickets → /skill:implement (per ticket, fresh context each)
  - **No** → /skill:implement directly in this context
- /skill:implement drives /skill:tdd internally, then runs /skill:code-review before committing

### On-ramps (merge onto main flow)

- **Bugs/requests piling up from outside** → /skill:triage (only for issues you didn't create — never triage what /skill:to-tickets produced; those are already agent-ready)
- **Something's broken — hard bug** → /skill:diagnosing-bugs
- **Huge foggy effort, greenfield, path not visible** → /skill:wayfinder (produces decision tickets, then hands off to /skill:to-spec)
- **Merge/rebase conflict** → /skill:resolving-merge-conflicts

### Codebase health

- **Architecture friction / codebase upkeep** → /skill:improve-codebase-architecture (generates an idea; take that into /skill:grill-with-docs to build it)

### Standalone

- **Design question needs runnable answer** → /skill:prototype (throwaway code, keep the answer)
- **Research / reading legwork** → /skill:research (background agent, leaves a cited markdown file)
- **TDD standalone** → /skill:tdd
- **Code review standalone** → /skill:code-review
- **Learn a concept over sessions** → /skill:teach
- **Write/edit skills** → /skill:writing-great-skills

### Vocabulary underneath (pull in as needed, not standalone routing targets)

- **Domain language is fuzzy** → /skill:domain-modeling (runs beneath other skills to keep CONTEXT.md clean)
- **Module shape / deep-module design** → /skill:codebase-design (runs beneath /skill:tdd and /skill:improve-codebase-architecture)

### Fallback

If this map doesn't cover the situation, load /skill:ask-matt for the full router.

---

## Context hygiene

- Keep steps 1–3 (grill → spec → tickets) in **one unbroken context window** — don't compact or clear until after /skill:to-tickets. Each /skill:implement then starts fresh, working from one ticket.
- The limit is the **smart zone** (~120k tokens on state-of-the-art models). If a session approaches it before /skill:to-tickets, use /handoff to fork to a fresh session — don't push on degraded context.
- /handoff = fork into a new session (preserves the old one). /compact (built-in) = continue in the same session (summarizes earlier turns). Use /handoff at intentional breaks between phases; use /compact at phase boundaries when you don't mind losing verbatim history. **Never compact mid-phase.**

## Smart zone alert

If you estimate the context is approaching the smart zone (~120k tokens), notify me with a text message. Do not take automatic action.
`;

export default function mattWorkflow(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    // Only inject if our instructions aren't already present (idempotent)
    if (event.systemPrompt.includes("CRITICAL — Workflow Routing Rules")) {
      return {};
    }

    return {
      systemPrompt: event.systemPrompt + WORKFLOW_INSTRUCTIONS,
    };
  });
}
