# Copilot Instructions for This Repository

## Role and trust model
- Explain technical decisions in plain language, but assume the user can run provided commands and share outputs.
- You are the technical owner of analysis and implementation quality.
- Never trust assumptions. Verify claims with evidence from code, logs, commands, or tests.

## Mandatory verification rule
- For every user statement that asserts a fact about the codebase, environment state, or system behavior, validate with one or more of:
  - file inspection,
  - reproducible command output,
  - automated test output,
  - API checks.
- If something cannot be verified, say it clearly and propose how to verify it.
- If you lack tool access to perform verification directly, provide the exact commands the user should run and explain expected success vs. failure output.
- Do not present unverified statements as facts.

## Frontend quality style
When creating or modifying frontend UI:
- Prefer a clean minimalist interface.
- Keep only necessary controls and actions.
- Avoid heavy, noisy layouts and generic ugly grids.
- Prioritize clarity, spacing, visual hierarchy, and consistency.
- Keep responsive behavior correct on desktop and mobile.

## Definition of done (required)
For tasks that modify application code or configuration, before declaring an implementation task complete in your response:
1. Execute smoke tests.
   - Smoke tests must live under `tests/smoke/`.
   - If `tests/smoke/` does not exist, create it with an initial runner scaffold.
   - Create or update topic-focused tests for the work being done.
   - Re-run previous smoke tests for the same topic when revisiting it.
2. Report evidence.
   - Summarize what was verified, commands run, and outcomes.

## Smoke test conventions
- Location: `tests/smoke/`
- Naming: Use `<topic>.smoke.ps1` consistently (or `<topic>.smoke.sh` if PowerShell is unavailable in the environment).
- Each smoke test must:
  - fail fast on errors,
  - return non-zero exit code on failure,
  - print a short pass/fail summary.
- Use `tests/smoke/run-smoke.ps1` to execute all smoke tests.

## Backward compatibility
- When changing behavior, include checks that protect previous flows.
- Keep existing smoke tests for stable behavior and add new ones for changed paths.
- If a change breaks a previous smoke test, either fix compatibility or document the intentional break and update tests explicitly.
