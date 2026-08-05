#!/usr/bin/env bash
set -uo pipefail

# Checks that every promoted skill (engineering/, productivity/) is in sync
# with the rest of the repo:
#   - every skill has a command in command/ named after it
#   - every command maps back to a real skill (catches renames/deletions)
#   - every skill appears in README.md and .claude-plugin/plugin.json
#   - every command's description matches its skill's frontmatter description
# Usage: bash scripts/check-sync.sh   (exit 0 = in sync, non-zero = fixes needed)

REPO="$(cd "$(dirname "$0")/.." && pwd)"
errors=0

# Commands that are repo maintenance, not backed by a skill
REPO_COMMANDS=("check-sync")

description_of() {
  grep -m1 '^description:' "$1" \
    | sed -e 's/^description:[[:space:]]*//' \
          -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

for bucket in engineering productivity; do
  for skill_dir in "$REPO"/skills/$bucket/*/; do
    [ -d "$skill_dir" ] || continue
    name="$(basename "$skill_dir")"
    skill_md="$skill_dir/SKILL.md"

    if [ ! -f "$REPO/command/$name.md" ]; then
      echo "MISSING: skills/$bucket/$name has no command/$name.md"
      errors=$((errors + 1))
    else
      skill_desc="$(description_of "$skill_md")"
      cmd_desc="$(description_of "$REPO/command/$name.md")"
      if [ "$skill_desc" != "$cmd_desc" ]; then
        echo "DRIFTED: command/$name.md description no longer matches skills/$bucket/$name/SKILL.md"
        errors=$((errors + 1))
      fi
    fi

    if ! grep -q "skills/$bucket/$name/SKILL.md" "$REPO/README.md"; then
      echo "MISSING: skills/$bucket/$name has no README.md entry"
      errors=$((errors + 1))
    fi

    if ! grep -q "\"./skills/$bucket/$name\"" "$REPO/.claude-plugin/plugin.json"; then
      echo "MISSING: skills/$bucket/$name missing from .claude-plugin/plugin.json"
      errors=$((errors + 1))
    fi
  done
done

for cmd in "$REPO"/command/*.md; do
  [ -f "$cmd" ] || continue
  name="$(basename "$cmd" .md)"
  if [[ " ${REPO_COMMANDS[*]} " != *" $name "* ]] \
    && [ ! -d "$REPO/skills/engineering/$name" ] \
    && [ ! -d "$REPO/skills/productivity/$name" ]; then
    echo "ORPHAN: command/$name.md has no matching skill (renamed or deleted?)"
    errors=$((errors + 1))
  fi
done

if [ "$errors" -eq 0 ]; then
  echo "All synced: every promoted skill has a matching command, README entry, and plugin.json entry."
else
  echo "$errors issue(s) found — fix them and re-run."
fi

exit "$errors"
