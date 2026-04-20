# shadcn/ui monorepo template

This template is for creating a monorepo with shadcn/ui.

## Usage

```bash
pnpm dlx shadcn@latest init
```

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Testing

This project uses **Vitest** for unit/integration testing and **Playwright** for E2E testing.

### Running Tests

- **All Unit Tests**: `pnpm test` (Uses Turbo to run tests across all packages)
- **Watch Mode (Root)**: `pnpm test:watch`
- **UI Mode**: `pnpm test:ui`
- **E2E Tests**: `pnpm test:e2e`

### Writing Tests

- Add unit tests using `.test.ts` or `.spec.ts` files.
- Add E2E tests in the `apps/web/e2e/` directory.

## Tailwind

Your `tailwind.config.ts` and `globals.css` are already set up to use the components from the `ui` package.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```
