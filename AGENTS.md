# LMS Frontend Agent Guide

## Project overview
- This repository is a Next.js 16.1.6 + React 19 frontend for the Genuine English LMS.
- Routing uses the App Router under `src/app`, with public pages in `src/app/(public)` and authenticated dashboards under `/student/dashboard` and `/teacher/dashboard`.
- The backend API contract source of truth is `docs/api/swagger.json`.
- Generated API helpers live in `src/generated/api-types.ts` and `src/generated/api-paths.ts`.
- The main runtime API base is `NEXT_PUBLIC_API_URL`, with local fallbacks to `http://localhost:5251` in existing helpers.
- Live classroom features integrate Azure Communication Services through `@azure/communication-calling`, `@azure/communication-chat`, and `@azure/communication-common`.

## Architecture
- Keep `src/app/**` thin. Most route files either re-export a feature page or unwrap async `params` and pass primitives into feature pages.
- Public catalog and marketing pages are server-rendered async pages that call `fetch(..., { next: { revalidate: 300 } })` through `src/lib/public.ts` and `src/lib/courses.ts`.
- Most authenticated screens are client components in `src/features/**/pages` that fetch data in `useEffect` and manage state locally.
- There is no Next middleware, no route handlers, no server actions, and no cookie/session auth layer in this repo.
- Dashboard access control is enforced in the client layouts in `src/app/student/dashboard/layout.tsx` and `src/app/teacher/dashboard/layout.tsx`.

## Project structure
- `src/app`: App Router layouts, route groups, and thin page entrypoints.
- `src/features`: Domain code organized by role/feature (`account`, `public`, `student`, `teacher`, `live-classroom`, `materials`).
- `src/features/*/pages`: Screen-level client components used by route entrypoints.
- `src/features/*/api*.ts`: Endpoint calls plus DTO normalization/mapping.
- `src/components`: Shared UI primitives and generic reusable components.
- `src/components/auth`: Auth-specific cards, inputs, and buttons.
- `src/context`: Shared context providers, currently `ConfirmContext`.
- `src/hooks`: Shared hooks, currently auth session and current user profile.
- `src/lib`: Cross-cutting utilities for auth, HTTP, config, navigation, public data, and device identity.
- `src/generated`: Auto-generated OpenAPI types and path helpers. Do not edit manually.
- `tests`: Vitest unit/integration coverage with shared mocks and setup helpers.

## Coding standards
- Use TypeScript with the existing `@/*` path alias and follow the current strict typing style.
- Match the current split between route wrappers, feature pages, feature APIs, and small mapping helpers.
- Prefer small coercion helpers like `readString`, `readNumber`, `readBoolean`, `unwrapEntity`, and `unwrapCollection` when consuming backend payloads.
- Keep route files minimal and move behavior into feature modules.
- Follow existing naming: `*Page`, `*Modal`, `*Section`, `*ApiError`, `get*`, `create*`, `update*`, `delete*`.
- Reuse current helper utilities instead of creating parallel abstractions for the same domain.

## UI and styling conventions
- Styling is Tailwind CSS v4 utility-first. Global CSS is intentionally small and lives in `src/app/globals.css`.
- Match the current visual language: white cards, `bg-slate-*` surfaces, rounded `2xl/3xl` shapes, subtle shadows, and brand blues like `#1B3B8B` and `#2F4EA2`.
- Public pages sometimes add richer gradients and hero treatments, but dashboard UI stays restrained and card-based.
- Use `lucide-react` for icons and `recharts` for analytics and reporting visuals.
- Preserve explicit hover, focus, disabled, and empty-state styling patterns.
- Do not introduce CSS Modules, styled-components, Emotion, or a new design system.

## Data fetching and state management
- There is no React Query, SWR, Redux, Zustand, or other centralized client-state library here.
- Use local React state with `useState`, `useEffect`, `useMemo`, and `useCallback`.
- Shared state is minimal and currently handled through `ConfirmProvider` and `CurrentUserProfileProvider`.
- Public data is fetched with `fetch` in server-compatible helpers.
- Authenticated feature data should go through feature API modules that use `apiClient` from `src/lib/http.ts`.
- Loading, error, and empty states are handled inside each page/component rather than by a shared async framework.

## API integration rules
- Treat `docs/api/swagger.json` as the source of truth for request/response shapes and available endpoints.
- If Swagger changes, regenerate `src/generated/api-types.ts` and `src/generated/api-paths.ts` with `npm run generate:api-types`.
- Never hand-edit generated files.
- Prefer `resolveApiPath` and `buildApiPath` for endpoints that already exist in generated helpers.
- Use `apiClient` for authenticated calls so Authorization and refresh-token behavior remain consistent.
- Use plain `fetch` only where the codebase already does: public server-side reads and a few auth/account flows.
- Normalize backend DTOs inside feature API files before they reach UI components.
- Preserve the defensive response-shape handling already in place. The current frontend expects inconsistent wrappers like `data`, `items`, `results`, mixed casing, and legacy field aliases.
- Be careful with path casing. Swagger-generated helpers currently include paths like `/api/v1/Auth/*` and `/api/v1/Users/*`, while some existing code hardcodes lowercase variants. Do not change casing casually without checking both Swagger and runtime behavior.

## Forms, validation, and error handling
- Use `react-hook-form` with `zod` where the repo already does: teacher quiz authoring and teacher live-session forms.
- Simpler forms currently use controlled inputs with manual validation. Match the surrounding pattern instead of forcing a form-library rewrite.
- Surface field errors inline and request errors through `ErrorAlert` or local message banners/lists.
- Use feature-specific error classes such as `StudentApiError`, `UserApiError`, `MaterialsApiError`, and `AdminApiError` instead of leaking raw axios errors into UI code.
- Use `useConfirm()` for destructive or irreversible actions like logout, deletion, and password reset confirmation.

## Authentication and authorization
- Auth is client-side only. Tokens and role are stored in `localStorage` via `src/lib/auth.ts`.
- `src/lib/http.ts` attaches bearer tokens and refreshes on `401` using the stored refresh token plus the generated device ID from `src/lib/device.ts`.
- Dashboard layouts decode JWT claims client-side and redirect with `router.replace(...)` when access is missing, expired, or mismatched.
- There is no middleware-based protection and no cookie-based server auth. Do not assume SSR auth state exists.
- Existing 401/403 handling often logs the user out and redirects to `/login`; preserve that behavior unless the task explicitly changes the auth model.

## Common codebase patterns
- `src/app/**/page.tsx` commonly acts as a wrapper around `src/features/**/pages`.
- Feature API modules both call the backend and map raw responses into UI-safe shapes.
- Public course pages use `src/lib/courses.ts`, which can fall back to static demo course data when no public API base URL is available.
- Search for actual usage before editing shared UI. This repo contains parallel primitives in `src/components` and `src/components/auth`.
- Verify active imports before touching similarly named files. Some files are legacy or placeholders.
- The routed teacher materials screen is `src/features/teacher/materials/pages/TeacherMaterialsPage.tsx`, not the placeholder `src/features/teacher/pages/TeacherMaterialsPage.tsx`.
- `src/components/auth/ResetPasswordForm.tsx` is currently unused.
- `src/app/forgot-password/page.tsx` currently renders `src/components/auth/ForgotPasswordForm.tsx`, and that form uses a mock request rather than the real password-reset API helper.

## Development workflow
- Install dependencies with `npm install`.
- Start local development with `npm run dev`.
- Build production assets with `npm run build`.
- Run linting with `npm run lint`.
- Run tests with `npm run test` or `npm run test:coverage`.
- Regenerate API types with `npm run generate:api-types`.
- Tests use Vitest + Testing Library + jsdom, with shared setup in `tests/setup/setupTests.tsx` and reusable mocks in `tests/mocks`.

## Do and don’t rules
- Do keep changes localized to the active feature folder and current route entrypoint.
- Do match the existing client/server boundary instead of moving data fetching across it without a reason.
- Do reuse generated API types/path helpers when available.
- Do preserve defensive normalization until Swagger and real responses prove simplification is safe.
- Do add or update Vitest coverage when changing UI logic, DTO normalization, quiz flows, enrollment flows, materials flows, or auth behavior.
- Don’t introduce React Query, Redux, Zustand, SWR, Formik, CSS Modules, styled-components, or a new UI framework.
- Don’t hand-edit `src/generated/api-types.ts` or `src/generated/api-paths.ts`.
- Don’t assume backend response wrappers or property names are stable just because one screen works.
- Don’t implement new auth behavior around cookies, middleware, or server actions unless the task is explicitly an architectural change.
- Don’t edit an unused duplicate file just because its name looks right. Confirm it is actually routed or imported first.

## Output expectations for AI agents
- Inspect the target route, the feature page, the related feature API module, and the generated Swagger helpers before making changes.
- Base endpoint and DTO decisions on `docs/api/swagger.json`, then confirm how the current frontend maps those contracts in practice.
- Keep summaries concrete: state what changed, which files were touched, which commands/tests were run, and any remaining risks or legacy/mock paths that still exist.
- If API behavior changed, explicitly note whether generated types were regenerated and which Swagger paths or schemas were involved.
