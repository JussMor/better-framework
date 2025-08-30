#!/usr/bin/env node
// Wrapper that filters out pnpm flags (like --filter) forwarded into package scripts
// and then runs tsup with the remaining args.

const { spawnSync } = require('child_process');

function filterArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') {
      // stop processing pnpm flags; include rest
      out.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('--filter')) {
      // skip this flag and optional value
      if (a.includes('=')) continue;
      // next token might be filter value; skip it
      i++;
      continue;
    }
    // Skip other pnpm-specific flags that shouldn't be forwarded
    if (a.startsWith('--workspace') || a.startsWith('--filter=')) {
      continue;
    }
    out.push(a);
  }
  return out;
}

const rawArgs = process.argv.slice(2);
const args = filterArgs(rawArgs);

// Always run tsup from local node_modules/.bin
const cmd = require('path').join(__dirname, '..', 'node_modules', '.bin', 'tsup');

// Fallback to global if local not found
const which = require('fs').existsSync(cmd) ? cmd : 'tsup';

const res = spawnSync(which, args, { stdio: 'inherit' });
process.exit(res.status);
