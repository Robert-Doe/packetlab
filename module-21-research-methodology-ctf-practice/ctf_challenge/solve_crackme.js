/**
 * solve_crackme.js
 *
 * Node port of solve_crackme.py -- same single-byte XOR brute-force
 * technique, searching for a flag{...}-shaped string.
 *
 * Usage:
 *   node solve_crackme.js crackme            # find and print the flag
 *   node solve_crackme.js crackme --verify    # also run ./crackme <flag>
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const FLAG_PATTERN = /flag\{[^}]{1,80}\}/;

function xorBytes(data, key) {
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ key;
  return out;
}

function findFlag(data) {
  for (let key = 1; key < 256; key++) {
    const decoded = xorBytes(data, key);
    const match = decoded.toString("latin1").match(FLAG_PATTERN);
    if (match) return { key, flag: match[0] };
  }
  return { key: null, flag: null };
}

function main() {
  const binPath = process.argv[2];
  const verify = process.argv.includes("--verify");
  if (!binPath) {
    console.log("Usage: node solve_crackme.js <path-to-crackme-binary> [--verify]");
    process.exit(1);
  }

  const data = fs.readFileSync(binPath);
  console.log(`[solve_crackme] loaded ${data.length} bytes from ${binPath}`);
  console.log("[solve_crackme] brute-forcing single-byte XOR keys for a flag{...} pattern...");

  const { key, flag } = findFlag(data);
  if (!flag) {
    console.log(
      "[solve_crackme] no flag found under single-byte XOR. The real challenge may use a different obfuscation scheme."
    );
    process.exit(1);
  }

  console.log(`[solve_crackme] found it. key=0x${key.toString(16).padStart(2, "0")}  flag=${JSON.stringify(flag)}`);

  if (verify) {
    const execPath = binPath.includes("/") || binPath.includes("\\") ? binPath : `./${binPath}`;
    console.log(`[solve_crackme] verifying against the actual binary: ${execPath} ${flag}`);
    const result = spawnSync(execPath, [flag], { encoding: "utf8" });
    console.log(`[solve_crackme] binary said: ${(result.stdout || "").trim()}`);
    const ok = result.status === 0;
    console.log(`[solve_crackme] exit code: ${result.status} (${ok ? "CONFIRMED CORRECT" : "NOT CONFIRMED"})`);
  }
}

main();
