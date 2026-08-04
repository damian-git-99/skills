# Plugin Installation

Notes on installing this repo as a plugin in **opencode** and **Pi**, kept separate from the `README.md` — this repo is a fork and we want to avoid merge conflicts with upstream.

> Every example uses `~/skills` as the placeholder for where the repo is cloned. Replace it with your actual path (e.g. `/home/user/skills`, `/work/skills`, `C:\Users\you\skills`).

## opencode

In the opencode config (`~/.config/opencode/opencode.json` or your project's `opencode.json`), add the plugin entry pointing to the cloned repo:

```json
{
  "plugin": [
    "matt-skills@file:///home/user/skills"
  ]
}
```

Point the `file://` URL to wherever you cloned the repo:

```json
{
  "plugin": [
    "matt-skills@file:///home/user/code/skills"
  ]
}
```

The plugin (`.opencode/plugins/skills.js`) automatically registers the skills from `skills/engineering` and `skills/productivity`, the agents from `agents/*.md`, and the commands from `command/*.md`.

## Pi

The root `package.json` declares `"keywords": ["pi-package"]` and a `"pi"` section pointing at the extensions and skills. Install it with `pi install` passing the path to the cloned repo:

```bash
pi install /home/user/skills
```

For a different location:

```bash
pi install /home/user/code/skills
```

Installing it as a Pi package automatically loads the `extensions/matt-workflow.ts` extension, which injects the Matt workflow routing into the system prompt.