import { useEffect, useState, type ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { pageSeo } from "@/lib/site";

function EditorRoute() {
  const [EditorApp, setEditorApp] = useState<ComponentType | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // The editor imports Remotion and browser media APIs. Load it only after
    // hydration so these browser-only dependencies cannot crash SSR for /editor.
    import("@/App")
      .then(({ default: App }) => {
        if (!cancelled) setEditorApp(() => App);
      })
      .catch((error) => {
        console.error("Failed to load the video editor:", error);
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Editor could not load</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Please refresh the page. If the problem continues, try opening the editor in a new tab.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Reload editor
          </button>
        </div>
      </main>
    );
  }

  if (!EditorApp) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-300">
        Loading Editsfield AI editor…
      </main>
    );
  }

  return <EditorApp />;
}

export const Route = createFileRoute("/editor")({
  head: () =>
    pageSeo({
      title: "Editsfield AI — AI Video Editor",
      description:
        "Edit videos with AI in your browser. Editsfield AI is a fast, simple, and creative AI video editor.",
      path: "/editor",
      type: "website",
    }),
  component: EditorRoute,
});
