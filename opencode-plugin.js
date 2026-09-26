/**
 * Matt Pocock Skills — OpenCode V2 plugin.
 *
 * Registers the promoted skills shipped by this repo.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Plugin } from '@opencode/plugin';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const resolveRootPath = (relativePath) => path.join(repoRoot, relativePath);

// Parse the simple nested mappings used by the agent frontmatter in this repo.
const parseScalar = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
    return value.slice(1, -1);
  }
  return value;
};

const parseYamlFrontmatter = (yaml) => {
  const result = {};
  const stack = [{ indent: -1, value: result }];

  for (const rawLine of yaml.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const content = line.trim();
    const colon = content.indexOf(':');
    if (colon < 0) continue;

    const key = content.slice(0, colon).trim()
      .replace(/^"(.*)"$/, '$1')
      .replace(/^'(.*)'$/, '$1');
    const rawValue = content.slice(colon + 1).trim();

    while (stack.length > 1 && stack.at(-1).indent >= indent) stack.pop();

    if (!rawValue) {
      const child = {};
      stack.at(-1).value[key] = child;
      stack.push({ indent, value: child });
    } else {
      stack.at(-1).value[key] = parseScalar(rawValue);
    }
  }

  return result;
};

const extractFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content.trim() };
  return {
    frontmatter: parseYamlFrontmatter(match[1]),
    body: match[2].trim(),
  };
};

const markdownFiles = (directory) => {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return markdownFiles(entryPath);
      return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : [];
    })
    .sort();
};

const registerSkills = async (ctx) => {
  const skillRoots = [
    resolveRootPath('skills/engineering'),
    resolveRootPath('skills/productivity'),
  ];
  const skills = skillRoots.flatMap((root) => markdownFiles(root))
    .filter((file) => path.basename(file) === 'SKILL.md')
    .map((file) => {
      const source = fs.readFileSync(file, 'utf8');
      const { frontmatter, body } = extractFrontmatter(source);
      const id = path.basename(path.dirname(file));

      return {
        id,
        name: frontmatter.name || id,
        description: frontmatter.description,
        autoinvoke: frontmatter['disable-model-invocation'] !== true
          && frontmatter.metadata?.['opencode/autoinvoke'] !== false,
        path: file,
        content: body,
      };
    });

  await ctx.skill.transform((editor) => {
    for (const skill of skills) editor.add(skill);
  });
};

export default Plugin.define({
  id: 'mattpocock.skills',
  async setup(ctx) {
    await registerSkills(ctx);
  },
});
