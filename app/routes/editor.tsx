import React, { lazy, Suspense } from "react";

export function meta() {
  return [
    { title: "Visual Page Editor — Athenaeum" },
    { name: "description", content: "Visual drag and drop page editor built with Puck." },
  ];
}

/**
 * Puck editor is a client-only dependency (drag-and-drop, canvas rendering).
 * We lazy-load the entire editor module so Rolldown/Vite doesn't attempt
 * to statically resolve @puckeditor/core during the SSR build — which fails
 * on Vercel's deployment environment.
 */
const LazyEditor = lazy(() => import("./editor-client"));

export default function EditorRoute() {
  // SSR fallback: show a loading placeholder since Puck can only run in the browser.
  if (typeof window === "undefined") {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
          <p className="mt-4 text-sm text-stone-400">Loading Visual Editor…</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-sans">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
            <p className="mt-4 text-sm text-stone-400">Loading Visual Editor…</p>
          </div>
        </div>
      }
    >
      <LazyEditor />
    </Suspense>
  );
}
