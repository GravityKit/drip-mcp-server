#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const tests = [
  'src/tests/drip-client.test.js',
  'src/tests/server-tools.test.js',
  'src/tests/server-e2e.test.js',
];

// Resolve package root robustly from this file's location so it works
// when invoked from repo root or from the package directory.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, '..', '..');
const nodeBin = process.execPath; // Use the exact Node executable running this script

let passed = 0;
let failed = 0;

async function runInProcess(scriptAbsPath) {
  const originalExit = process.exit;
  const originalCwd = process.cwd();
  try {
    // Prevent test modules from exiting the whole runner
    process.exit = (code = 0) => {
      throw new Error(`__TEST_EXIT__:${code}`);
    };
    process.chdir(cwd);
    await import(pathToFileURL(scriptAbsPath).href);
    return true;
  } catch (err) {
    const msg = String(err && err.message || err);
    if (msg.startsWith('__TEST_EXIT__:')) {
      const code = Number(msg.split(':')[1] || '1');
      return code === 0;
    }
    return false;
  } finally {
    process.exit = originalExit;
    try { process.chdir(originalCwd); } catch {}
  }
}

function runTest(script) {
  return new Promise((resolve) => {
    let counted = false;
    const finish = (ok) => {
      if (counted) return; counted = true;
      if (ok) passed++; else failed++;
      resolve();
    };

    const scriptAbs = path.resolve(cwd, script);
    const proc = spawn(nodeBin, [scriptAbs], { cwd, stdio: 'inherit' });
    proc.on('error', async () => {
      // Fallback to in-process import when spawning is restricted
      const ok = await runInProcess(scriptAbs);
      finish(ok);
    });
    proc.on('close', (code) => finish(code === 0));
  });
}

(async () => {
  for (const t of tests) {
    await runTest(t);
  }
  console.log(`\n📊 Unit tests summary: ✅ ${passed}  ❌ ${failed}`);
  process.exit(failed ? 1 : 0);
})();
