import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const ENTRY =
  "fix(auth): the bug was in the code I wrote to fix the bug. reverted both. it works now. do not ask how";

const OUT_DIR = "/output";
const OUT_FILE = "/output/entry.txt";
const MAX_CHARS = 139;

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Fail fast on control characters, a BOM, or an over-long UTF-8 byte length.
if (/[\u0000-\u001f\u007f]/.test(ENTRY)) fail("entry contains control characters");
if (ENTRY.charCodeAt(0) === 0xfeff) fail("entry starts with a BOM");
if (Buffer.byteLength(ENTRY, "utf8") > 560) fail("entry exceeds 560 UTF-8 bytes");

// Gate: 1-139 chars, single line, not only whitespace.
if ([...ENTRY].length < 1 || [...ENTRY].length > MAX_CHARS) {
  fail(`entry is ${[...ENTRY].length} chars, gate is 1-${MAX_CHARS}`);
}
if (ENTRY.trim().length === 0) fail("entry is only whitespace");
if (ENTRY.includes("\n") || ENTRY.includes("\r")) fail("entry must be a single line");

// Empty /output's CONTENTS only; /output itself is a mounted directory.
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
for (const name of readdirSync(OUT_DIR)) {
  rmSync(`${OUT_DIR}/${name}`, { recursive: true, force: true });
}

writeFileSync(OUT_FILE, ENTRY, "utf8");

// Read back and verify: exact bytes, valid UTF-8, sha256.
const readBack = readFileSync(OUT_FILE, "utf8");
if (readBack !== ENTRY) fail("read-back mismatch");
const hash = createHash("sha256").update(readBack, "utf8").digest("hex");
console.log(`wrote ${OUT_FILE} (${[...ENTRY].length} chars, sha256 ${hash})`);
