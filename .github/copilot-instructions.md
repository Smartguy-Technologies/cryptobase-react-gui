# Copilot / VS Code Agent Instructions

These rules apply to any AI agent operating in this repository, including
GitHub Copilot, Copilot Chat, Copilot coding agents, and any other VS Code
agent integration.

## Branch Rules — READ FIRST

This repository has two long-lived branches with very different purposes:

- **`main`** — Mirrors the upstream (Edge) repository. It exists **only** to
  stay in sync with upstream changes. It is off-limits for client work.
- **`client-brand`** — The working branch for this client's fork. All
  client-requested features, fixes, branding changes, and day-to-day
  development happen here or on branches cut from it.

### Hard rules

1. **Never commit to `main`.** Do not `git commit` while `main` is checked
   out, and do not create branches whose intended merge target is `main`.
2. **Never push to `main`.** This includes `git push`, `git push --force`,
   `git push origin HEAD:main`, or any equivalent. Do not open pull
   requests that target `main`.
3. **Never merge, rebase, cherry-pick, or squash anything onto `main`.**
   Updates to `main` come exclusively from syncing with the upstream
   repository and are performed manually by the maintainer.
4. **Never reset, rewrite, or delete `main`**, locally or remotely. Do not
   run `git reset`, `git rebase`, `git branch -f`, `git push --force`, or
   `git branch -D` against `main`.
5. **Default to `client-brand`.** When starting new work, branch from
   `client-brand`. When opening a pull request, target `client-brand`
   unless the user explicitly says otherwise.
6. **If the user asks you to modify `main`, stop and confirm.** Explain
   these rules and ask them to restate the request, or to perform the
   operation themselves.

### What "on `main`" means

Treat the following as `main` for the purposes of these rules:

- The local branch named `main`
- `origin/main` and any other remote-tracking ref for `main`
- Any PR whose base branch is `main`

### Safe operations on `main`

Read-only operations are fine: `git log main`, `git diff main...`,
`git show main:path/to/file`, checking out `main` to inspect it, etc.
Just do not modify it or push to it.

## Repository Conventions

See `AGENTS.md` at the repository root for package manager, build, lint,
test, code style, and commit-message conventions. Those rules apply in
addition to the branch rules above.
