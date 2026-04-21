# Edge React GUI - Agent Guidelines

## Branch Rules (applies to all agents)

This fork has two long-lived branches:

- **`main`** — Tracks the upstream (Edge) repository. Do **not** touch it.
- **`client-brand`** — The working branch for this client. All new work
  goes here or on branches cut from it.

**Never** commit, push, merge, rebase, cherry-pick, reset, force-push, or
delete `main` (local or remote). Never open a PR that targets `main`.
Default to branching from and PR'ing into `client-brand`. If a user
request conflicts with these rules, stop and confirm before acting.

Read-only operations against `main` (log, diff, show, checkout to inspect)
are fine.

See `.github/copilot-instructions.md` for the full version of these rules.

## Package Manager

- **Use Yarn v1** instead of npm for all package management and script execution
- `yarn install` - Install dependencies
- `yarn add <package>` - Add new dependency
- `yarn add -D <package>` - Add dev dependency

## Build/Test/Lint Commands

- `yarn lint` - Run ESLint on entire codebase
- `yarn fix` - Auto-fix linting issues and deduplicate yarn
- `yarn test` - Run Jest tests (single run)
- `yarn watch` - Run Jest tests in watch mode
- `yarn test --testNamePattern="test name"` - Run specific test by name
- `yarn verify` - Run lint, typechain, tsc, and test (full verification)
- `yarn precommit` - Full pre-commit check (localize, lint-staged, tsc, test)
- `tsc` - TypeScript type checking (via package.json script)

## Code Style Guidelines

- **Formatting**: Prettier with single quotes, no semicolons, no trailing commas, 80 char width
- **Imports**: Use `simple-import-sort` plugin for automatic import sorting
- **Types**: TypeScript required, no `allowJs`, prefer explicit types over `any`
- **React**: Use functional components with hooks, prefer `useHandler` over `useCallback`
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Files**: `.tsx` for React components, `.ts` for utilities/hooks
- **Error Handling**: Use proper error boundaries, avoid throwing in render
- **Text Components**: Use `EdgeText`, `Paragraph`, `SmallText`, `WarningText` instead of raw text
- **Hooks**: Custom hooks in `src/hooks/`, follow `use*` naming convention
- **Testing**: Jest with React Native Testing Library, tests in `__tests__/` directories

## Git Conventions

### Commit Messages

- **Subject**: Imperative mood, capitalize first letter, max 50 chars, no period
- **Body**: Explain what/why (not how), wrap at 72 chars, separate from subject with blank line
- **Clean commits**: Each commit should be standalone, build successfully, and improve code
- **Rebasing**: Use interactive rebase to split, squash, and reorder commits before PR

### Pull Requests

- **Future commits**: Use "future! branch-name" for feature dependencies not yet merged
- **Draft PRs**: Mark PRs with future commits as draft until dependencies are merged
- **Fixup commits**: Use `git commit --fixup <hash>` for PR feedback, then squash with `git rebase -i --autosquash`

### Branch Dependencies

- Create pseudo-merge commits with "future! branch-name" for dependent features
- Use `git rebase --onto` to update dependent branches when base changes
- Remove future commits by rebasing onto master once dependencies are merged