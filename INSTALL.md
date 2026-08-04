# Plugin Installation

Notes on installing this repo as a plugin in **opencode** and **Pi**, kept separate from the `README.md` — this repo is a fork and we want to avoid merge conflicts with upstream.

Every example uses `~/skills` as the placeholder for where the repo is cloned locally, and `git:github.com/damian-git-99/skills` for the remote (this fork). Replace them with your actual paths / repo.

## opencode

### From a local clone

In the opencode config (`~/.config/opencode/opencode.json` or your project's `opencode.json`), add a plugin entry pointing at the cloned repo:

```json
{
  "plugin": [
    "matt-skills@file:///home/user/skills"
  ]
}
```

Point the `file://` URL to wherever you cloned the repo.

### Directly from git (no clone needed)

OpenCode resolves `@git+<url>` specs and clones the repo automatically. Use the `git` protocol form:

```json
{
  "plugin": [
    "matt-skills@git+https://github.com/damian-git-99/skills.git"
  ]
}
```

The `matt-skills` part is just the package name OpenCode uses to reference the plugin; it matches the `name` in the repo's `package.json` (`mattpocock-skills` is the upstream one — use yours if different). The plugin (`.opencode/plugins/skills.js`) automatically registers the skills from `skills/engineering` and `skills/productivity`, the agents from `agents/*.md`, and the commands from `command/*.md`.

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