#!/usr/bin/env node
// One-time migration: move pre-auth (un-namespaced) curation/favorites blobs
// to a specific user's namespaced paths, now that multi-user auth is live.
// Reads secrets only from .env.local internally — never printed or passed
// as a CLI argument. Run once per user being migrated, then can be deleted.
//
// Usage: node scripts/migrate-curation.mjs <email>

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { list, put, del } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim().replace(/^"(.*)"$/, "$1");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/migrate-curation.mjs <email>");
  process.exit(1);
}

async function findUserId(email) {
  const res = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` } },
  );
  if (!res.ok) throw new Error(`Clerk API error: ${res.status} ${await res.text()}`);
  const users = await res.json();
  if (users.length === 0) throw new Error(`No Clerk user found for ${email}`);
  return users[0].id;
}

const OLD_PREFIXES = [
  "curation/companies/",
  "curation/ideas/",
  "curation/favorites-companies/",
  "curation/favorites-ideas/",
];

function newPathname(oldPathname, userId) {
  // curation/companies/foo.json -> curation/{userId}/companies/foo.json
  const parts = oldPathname.split("/");
  return `curation/${encodeURIComponent(userId)}/${parts[1]}/${parts[2]}`;
}

async function migrate(userId) {
  let migrated = 0;
  for (const prefix of OLD_PREFIXES) {
    const { blobs } = await list({ prefix, mode: "expanded" });
    for (const blob of blobs) {
      const res = await fetch(blob.url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      });
      const content = await res.text();
      const target = newPathname(blob.pathname, userId);
      await put(target, content, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      await del(blob.pathname);
      console.log(`  ${blob.pathname} -> ${target}`);
      migrated++;
    }
  }
  return migrated;
}

const userId = await findUserId(email);
console.log(`Migrating data for ${email} -> ${userId}`);
const count = await migrate(userId);
console.log(`Done. Migrated ${count} items.`);
