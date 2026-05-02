# GitHub Copilot Instructions for PlayCard

## Project
- Stack: Next.js 14, TypeScript, MongoDB(Mongoose), Zustand, Socket.io
- Entry points:
  - App: `src/app`
  - API: `src/app/api`
  - Models: `src/lib/models`
  - Store: `src/store`

## Rules
- Use `@/` alias for imports (`@/` -> `src/`).
- Keep API response shape consistent: `{ success, data | message }`.
- For route handlers:
  - `export const dynamic = 'force-dynamic';`
  - call `dbConnect()`
  - wrap handlers with `withApiLogging`
- Keep tests next to target files (`*.test.ts`).

## Commands
- Dev: `npm run dev`
- Test: `npm run test:run`
- Typecheck: `npm run typecheck`
- Build: `npm run build`

## Git / PR
- Branch naming:
  - `feature/SPM-[번호]-[slug]`
  - `fix/SPM-[번호]-[slug]`
- Commit message:
  - `feat|fix|docs|test|refactor|chore: ... (SPM-[번호])`
- PR body must include:
  - test results
  - impacted files
  - `Linear: SPM-[번호]`

## GH CLI in Local
- Prefer this wrapper so `.env.local` `GH_TOKEN` is used first:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\gh-with-env.ps1 <gh args>`
