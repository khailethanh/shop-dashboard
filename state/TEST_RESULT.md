# Test Result — 2026-07-07T01:55:36Z

## build
STATUS: SKIPPED
BUILD_CMD not set

## test
STATUS: FAIL
smoke-test: crashed — Error: net::ERR_CONNECTION_REFUSED at http://localhost:19999/login
    at navigate (/workspace/node_modules/puppeteer-core/lib/cjs/puppeteer/cdp/Frame.js:189:27)
    at async Deferred.race (/workspace/node_modules/puppeteer-core/lib/cjs/puppeteer/util/Deferred.js:36:20)
    at async CdpFrame.goto (/workspace/node_modules/puppeteer-core/lib/cjs/puppeteer/cdp/Frame.js:155:25)
    at async CdpPage.goto (/workspace/node_modules/puppeteer-core/lib/cjs/puppeteer/api/Page.js:580:20)
    at async login (/workspace/scripts/smoke-test.js:72:3)
    at async main (/workspace/scripts/smoke-test.js:92:5)

## lint
STATUS: SKIPPED
LINT_CMD not set

## overall
STATUS: FAIL
