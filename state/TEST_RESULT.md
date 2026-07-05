# Test Result — 2026-07-05T20:49:47Z

## build
STATUS: SKIPPED
BUILD_CMD not set

## test
STATUS: FAIL
node:internal/modules/cjs/loader:1210
  throw err;
  ^

Error: Cannot find module './src/app.js'
Require stack:
- /workspace/[eval]
    at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)
    at Module._load (node:internal/modules/cjs/loader:1038:27)
    at Module.require (node:internal/modules/cjs/loader:1289:19)
    at require (node:internal/modules/helpers:182:18)
    at [eval]:1:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:118:14
    at [eval]-wrapper:6:24
    at runScript (node:internal/process/execution:101:62)
    at evalScript (node:internal/process/execution:133:3) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ '/workspace/[eval]' ]
}

Node.js v20.20.2

## lint
STATUS: SKIPPED
LINT_CMD not set

## overall
STATUS: FAIL
