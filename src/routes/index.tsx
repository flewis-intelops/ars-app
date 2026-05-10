import { createFileRoute } from "@tanstack/react-router";
// @ts-expect-error - JSX prototype file, no type declarations
import App from "@/App.jsx";

export const Route = createFileRoute("/")({
  component: App,
});
