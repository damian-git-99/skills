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
3. After EACH phase, STOP and ask whether to proceed: "Grilling done. Sigo con /skill:to-spec?" → "Spec lista. Sigo con /skill:to-tickets?" → "Tickets ready. Arranco /skill:implement con el primer ticket?"
4. If the user says "automatic", "seguí sin preguntar", or "keep going" → chain the remaining phases without asking.
5. /skill:to-tickets → /skill:implement is an especially important gate: each ticket deserves a fresh session. Never skip it unless the user explicitly overrides.
6. If the user interrupts ("stop", "skip", "implement directly", "wayfinder") at any step, respect the interruption.

**Exception — foggy greenfield / huge effort**: if the idea is so large or undefined that the way forward isn't visible at all (greenfield project, massive feature with unknown scope), announce and route to /skill:wayfinder instead. Say: "This is too foggy for the main flow — the path isn't visible yet. Activating /skill:wayfinder to chart decision tickets first, then /skill:to-spec once the map is clear."

**If NOT complex** (targeted fix, scoped refactor, question, bug, maintenance, small change):
- Read \`skills/engineering/ask-matt/SKILL.md\` and route per its map. No announcement.

**Explicit exception:** if the user says "implement directly", "no grill", "skip to implement", respect it and jump to /skill:implement. Briefly acknowledge: "OK, skipping grill. If you want to reorient later, the workflow is still available."

Use judgment, not just keywords. "Add a button to this page" is not complex. "Add a complete admin dashboard" is.

---

## Map — source of truth

The full map of skills and flows lives in \`skills/engineering/ask-matt/SKILL.md\` (the phase-boundary decision tree is \`PHASE-BOUNDARIES.md\` beside it). Whenever you need to route, read that file and follow its map. Never restate its routes here — ask-matt is the single source of truth; this file only holds the gates and guards.

The one flow this orchestrator activates itself, without consulting the map:
- Complex feature → /skill:grill-with-docs → /skill:to-spec → /skill:to-tickets → /skill:implement (each ticket in a fresh session)
- Foggy greenfield → /skill:wayfinder, then merge onto the main flow at /skill:to-spec once the map is clear

**Key rule:** every phase gate asks by default. grill → spec → tickets → implement all require confirmation. Only skip gates if the user explicitly says "automatic" or "keep going".

## Context hygiene

- Keep grill → spec → tickets in **one unbroken context window** — don't compact or clear until after /skill:to-tickets. Each /skill:implement then starts fresh, working from one ticket.
- The limit is the **smart zone** (~150k tokens on state-of-the-art models). If a session approaches it before /skill:to-tickets, don't push on degraded context.
- At phase boundaries the default is /compact. Use /handoff only when something must travel (a new harness, a new directory, a colleague, or a side task forked mid-phase). **Never compact mid-phase** — the decision happens at the boundary.

## Smart zone alert

If you estimate the context is approaching the smart zone (~150k tokens), notify me with a text message. Do not take automatic action.
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
