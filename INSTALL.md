# Plugin Installation

Notes on installing this repo as a plugin in **OpenCode V2** and **Pi**. This file stays separate from the `README.md` to avoid merge conflicts with upstream.

Every example uses `~/skills` as the placeholder for where the repo is cloned locally, and `git:github.com/damian-git-99/skills` for the remote (this fork). Replace them with your actual paths / repo.

## opencode

### From a local clone

In the OpenCode config (`~/.config/opencode/opencode.json` or your project's `opencode.json`), add a plugin entry pointing at the cloned repo:

```json
{
  "plugins": [
    "file:///home/user/skills"
  ]
}
```

Point the `file://` URL to wherever you cloned the repo.

### Directly from git (no clone needed)

OpenCode resolves npm-compatible Git package specifications and clones the repo automatically. Use a GitHub shortcut or Git URL:

```json
{
  "plugins": [
    "github:damian-git-99/skills"
  ]
}
```

The plugin entrypoint (`opencode-plugin.js`) registers the promoted skills from `skills/engineering` and `skills/productivity`, plus commands from `command/*.md`. It lives outside `.opencode/plugins/` so it is not auto-loaded a second time when the package is configured as a plugin. Agents live in `.opencode/agents/` and are discovered by OpenCode V2 as native agent files. When using this repo as a plugin from another project, copy or symlink those agent files into that project's `.opencode/agents/`; the V2 plugin API cannot add new agents.

## Pi

The root `package.json` declares `"keywords": ["pi-package"]` and a `"pi"` section pointing at the extensions and skills.

### From a local clone

```bash
pi install /home/user/skills
```

### Directly from git (no clone needed)

Use the `git:` protocol shorthand:

```bash
pi install git:github.com/damian-git-99/skills
```

Installing it as a Pi package automatically loads the `extensions/matt-workflow.ts` extension, which injects the Matt workflow routing into the system prompt. The Pi install also registers the skills themselves (the repo's `"pi"` section points at the skills directories).
