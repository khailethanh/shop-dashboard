# Loop Engineering — Project Memory

This project is driven by an automated design → implement → test → review →
deploy loop, running entirely inside a sandboxed Docker container (see
`run.sh`, `docker/agent.Dockerfile`, `orchestrator.sh`). If you are an agent
working in this repo — main session or subagent — follow the contract below
exactly so the loop stays coherent across separate, stateless `claude -p`
calls.

## Execution environment

- The orchestrator and every subagent run **inside** a sandbox container
  built from `docker/agent.Dockerfile`, not on the host. That sandbox is the
  reason `PERMISSION_MODE=bypassPermissions` is the default in
  `loop.config` — there is no interactive human to approve prompts, and the
  blast radius is contained to this container, the mounted project
  directory, and the mounted Docker socket.
- The Docker socket (`/var/run/docker.sock`) is mounted from the host so
  the coder agent can build and run the **app's own container** as a
  sibling of the sandbox, not nested inside it. Any `docker build` /
  `docker compose` command run from in here talks to the **host's** Docker
  daemon.
- Practical consequence: if a docker-compose file you write uses bind
  mounts (`volumes:`), the host paths must be real host paths, not paths
  inside this sandbox container. Use the `HOST_PROJECT_DIR` env var (set by
  `run.sh`) for any bind mount that needs to reference this project's
  source — do not hardcode `/workspace/...`. Prefer `COPY` at build time
  over bind mounts for the app image whenever possible; it sidesteps this
  issue entirely and matches how the image will run in the user's
  day-to-day use (open browser, app is just running).

## State files (single source of truth)

- `state/REQUIREMENTS.md` — what to build. Human-owned. Never edit this.
- `state/DESIGN.md` — architecture and key decisions, including the
  container's internal listen port. Owned by `architect`.
- `state/TASKS.md` — checklist of implementation tasks. Each line:
  `- [ ] task description` (todo), `- [~]` (in progress), `- [x]` (done),
  `- [!]` (blocked — must include a one-line reason after the task).
- `state/TEST_RESULT.md` — latest build/test/lint output. Owned by
  `orchestrator.sh`'s `run_tests()` (not a model call — see phase contract).
- `state/REVIEW_LOG.md` — append-only verdict history. Owned by `reviewer`.
- `state/PORT.txt` — the host port assigned to this app. Owned by
  `orchestrator.sh`'s deploy phase only. Agents must not edit it; read it if
  you need to report the URL back.
- `state/status.txt` — machine-readable, owned by `orchestrator.sh` only.
  Agents must not edit it.

## Containerized deployment requirement (mandatory for every project)

Every project built through this loop must end up runnable as a single
`docker compose up -d`. Concretely, the architect must always include these
in `TASKS.md`, and the coder must implement them like any other task:

1. A `Dockerfile` that builds the app into a self-contained image.
2. A `docker-compose.yml` at the project root that:
   - Exposes the app via `"${APP_PORT}:<container_internal_port>"` —
     `APP_PORT` is injected by the orchestrator's deploy phase, **never**
     hardcode a host port.
   - Picks one fixed `<container_internal_port>` (the port the app listens
     on *inside* the container) and records it in `DESIGN.md` — that one can
     be hardcoded since it never touches the host.
   - Includes a `healthcheck:` so the deploy phase can confirm the app is
     actually up, not just that the container started.
3. The app reading its listen port from an env var (commonly `PORT`) rather
   than a hardcoded value in source — `docker-compose.yml` sets that env var
   to the fixed internal port from point 2.

## Phase contract (do not cross these lines)

1. **architect** may edit `state/DESIGN.md` and `state/TASKS.md` only. Never
   touches source code. Must always include the containerization tasks
   above.
2. **coder** may edit source code and `state/TASKS.md` (flip exactly one
   task's status). Never edits `DESIGN.md`, `TEST_RESULT.md`, or
   `REVIEW_LOG.md`.
3. **tester (orchestrator bash)** — orchestrator chạy trực tiếp
   BUILD_CMD/TEST_CMD/LINT_CMD, không qua model, ghi output thật vào
   TEST_RESULT.md. Reviewer đọc output thật này để đưa ra verdict.
4. **reviewer** reads `DESIGN.md`, `TASKS.md`, the latest `git diff`, and
   `TEST_RESULT.md`, then appends one block to `REVIEW_LOG.md`. Never edits
   source code or any other state file.
5. **deploy** (deterministic, run by `orchestrator.sh` itself, not an LLM
   call) only runs after a final `PASS` with no open tasks. It allocates a
   free host port via `scripts/find_free_port.sh`, writes it to
   `state/PORT.txt`, and runs `docker compose up -d --build`.

## Required verdict format (orchestrator.sh parses this exactly)

```
## Iteration N
VERDICT: PASS | FAIL | DESIGN_CHANGE
ACTION: next_task | fix_code | fix_design
SUMMARY: <one line>
ISSUES:
- <issue 1, or "none">
TARGET_FILES:
- <path of a file that needs fixing, or "none">
```

`N` must match the iteration number given in the prompt. `VERDICT` must be
exactly `PASS`, `FAIL`, or `DESIGN_CHANGE` — nothing else, no extra words on
that line.

`ACTION` is a required field — orchestrator.sh parses it (not just VERDICT)
to decide the next step: `next_task` moves on, `fix_code` re-runs the coder
with the reviewer's exact issues/target files injected into its prompt, and
`fix_design` re-runs the architect before the coder continues. A missing or
unrecognized `ACTION` is treated as FAIL, not as an implicit PASS.

## Provider routing and escalation

Each phase is called via `claude -p` (full tool access preserved). The model
and provider are chosen at runtime by `scripts/model_router.sh`, driven by
`loop.config` — agents never hardcode a model themselves.

- `ARCHITECT_DEFAULT_PROVIDER` / `CODER_DEFAULT_PROVIDER` / `TESTER_DEFAULT_PROVIDER` /
  `REVIEWER_DEFAULT_PROVIDER` — set to `"local"` (Ollama) or `"cloud"` (Anthropic).
- When `provider=local`, `orchestrator.sh` sets `ANTHROPIC_BASE_URL=$OLLAMA_BASE_URL`
  and `ANTHROPIC_AUTH_TOKEN=ollama` before invoking `claude -p`, pointing it at
  the local Ollama endpoint. `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN` are
  explicitly unset (`env -u`) for cloud calls so they can never leak between phases.
- `FAIL_ESCALATE_THRESHOLD` — if a phase accumulates this many consecutive
  failures (process exit error, or reviewer returning FAIL), `model_router.sh`
  automatically routes that phase to cloud for the next call, regardless of its
  default provider.
- **Diagnosing persistent local failures**: if coder is repeatedly scored
  FAIL by the reviewer with notes like "nothing was implemented" — even after
  escalation — the local model (`OLLAMA_MODEL`) does not have sufficient
  tool-calling capability for that role. (This no longer applies to tester —
  it's plain bash now, not a model call.) Fix: either swap `OLLAMA_MODEL` for
  a stronger model in `loop.config`, or set that phase's
  `DEFAULT_PROVIDER` to `"cloud"` permanently.

## General rules

- One task per coder run. Don't silently start a second task even if the
  first one was quick.
- If blocked, mark the task `[!]` with a one-line reason in `TASKS.md`
  instead of looping silently or inventing a workaround that contradicts
  `DESIGN.md`.
- Commit after every coder run with a message referencing the task.
- Reviewer must be skeptical by default: a PASS requires the diff to actually
  match what `DESIGN.md` describes and `TEST_RESULT.md` to show passing
  tests/build — not just "looks plausible." A missing or broken
  `docker-compose.yml`/`Dockerfile` is grounds for FAIL on its own.
