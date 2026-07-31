// Generates public/sw.js from scripts/sw.template.js, stamping the cache
// names with a per-build identifier. Without this the service worker keeps
// fixed cache names (static-v1 / dynamic-v1), so its activate handler never
// evicts anything and returning users are served a stale app shell forever.
//
// Runs via the `prebuild` npm script, which fires before `next build` both
// locally and on Vercel.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const templatePath = join(root, 'scripts', 'sw.template.js');
const outputPath = join(root, 'public', 'sw.js');

// VERCEL_GIT_COMMIT_SHA is set by Vercel's own builder; GITHUB_SHA covers
// `vercel build` running inside GitHub Actions, where the former is absent.
// The timestamp keeps local builds unique.
const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
const buildId = sha ? sha.slice(0, 12) : `local-${Date.now()}`;

const template = await readFile(templatePath, 'utf8');

if (!template.includes('__BUILD_ID__')) {
  throw new Error(`${templatePath} is missing the __BUILD_ID__ placeholder`);
}

await writeFile(outputPath, template.replaceAll('__BUILD_ID__', buildId));

console.log(`[build-sw] wrote public/sw.js (build ${buildId})`);
