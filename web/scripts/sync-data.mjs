#!/usr/bin/env node
// Copies the Python pipeline's ../data/*.csv + ideas.md into ./data so they
// get bundled into the Vercel deployment (serverless functions can't read
// ../data — that's outside the deployed project). Run after re-scraping
// locally, then commit + redeploy to refresh the live dashboard's data.
//
// Usage: node scripts/sync-data.mjs   (or: pnpm sync-data)

import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "..", "data");
const DEST = join(__dirname, "..", "data");

const PATTERNS = [/^companies\.csv$/, /^trend_(share|counts|movers)_.+\.csv$/, /^ideas\.md$/];

mkdirSync(DEST, { recursive: true });

let copied = 0;
for (const name of readdirSync(SRC)) {
  if (!PATTERNS.some((re) => re.test(name))) continue;
  const srcPath = join(SRC, name);
  if (!statSync(srcPath).isFile()) continue;
  copyFileSync(srcPath, join(DEST, name));
  copied++;
  console.log(`  copied ${name}`);
}

console.log(`Synced ${copied} files from ${SRC} -> ${DEST}`);
