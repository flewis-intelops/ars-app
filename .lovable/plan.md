## Plan: Drop in ARS prototype as-is

The project is TanStack Start (React 19 + Vite 7 + Tailwind v4) with `lucide-react` already installed. No UI library is in play for the prototype itself. I will wire your `App.jsx` in unchanged and render it at `/`.

### Steps

1. **Copy the file verbatim**
   - `code--copy user-uploads://ars_poc_integrated_V3.jsx` → `src/App.jsx`
   - No edits, no refactor, no style changes, no font changes.

2. **Render `<App />` at the root route**
   - Replace `src/routes/index.tsx` body with:
     ```tsx
     import { createFileRoute } from "@tanstack/react-router";
     import App from "@/App.jsx";

     export const Route = createFileRoute("/")({ component: App });
     ```
   - This satisfies "no router yet — just render `<App />` directly" within the TanStack shell that already exists. Adding a plain `main.tsx` would break the project's bootstrap.

3. **Neutralize global page styling so the prototype's white background + centered phone frame renders correctly**
   - The root layout (`src/routes/__root.tsx`) and `src/styles.css` set a dark/themed background by default. I'll check them and, only if they impose a background or padding that overrides the prototype's intended white canvas, scope a minimal override (e.g., `body { background: #fff; }`) — without touching the prototype file or its inline styles.

### Explicitly NOT doing

- No shadcn / Material / Chakra usage in the prototype path.
- No refactor of inline `style={{}}` to Tailwind.
- No color, font, radius, or layout changes.
- No backend, auth, login, signup, settings, or name field.
- No splitting `App.jsx` into multiple files.
- Not removing the in-component `<style>` block with the Google Fonts `@import`.

### Notes / caveats

- The project uses TypeScript strict mode, but `.jsx` files compile fine alongside it — no type annotations will be added to your file.
- `routeTree.gen.ts` regenerates automatically; I won't touch it.
- If after load the preview shows the prototype but with a dark page background instead of white, that's the only thing I'll adjust — via a scoped CSS rule, not by editing `App.jsx`.

### Verification

After the changes, I'll load the preview and confirm: dark 390×800 phone frame centered on white grid background, "ARS" amber wordmark, "S-7421" top-right, the four cards, red classification banners top/bottom, pulsing red duress button bottom-right.