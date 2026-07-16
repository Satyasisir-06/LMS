import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { QueryProvider } from "./providers/query-provider";
import { ThemeProvider } from "./providers/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { getPublicServerEnv, type PublicEnv } from "./lib/supabase/env";
import { Logo } from "./components/ui/logo";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Outfit:wght@100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=JetBrains+Mono:wght@400;500;600&display=swap",
  },
];

export async function loader() {
  return data({ ENV: getPublicServerEnv() });
}

const themeScript = `(function(){try{var t=localStorage.getItem('athenaeum-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`;

function EnvScript({ env }: { env: PublicEnv }) {
  const json = JSON.stringify(env).replace(/</g, "\\u003c");
  return (
    <script
      dangerouslySetInnerHTML={{ __html: `window.ENV = ${json};` }}
    />
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();
  return (
    <QueryProvider>
      <ThemeProvider>
        <EnvScript env={ENV} />
        <Outlet />
        <Toaster />
      </ThemeProvider>
    </QueryProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "An unexpected error occurred";
  let detail = "Please try again, or return to the dashboard.";
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  if (isRouteErrorResponse(error)) {
    message = is404 ? "Page not found" : `${error.status} — ${error.statusText}`;
    detail = is404
      ? "The page you're looking for has wandered off the shelves."
      : error.data || detail;
  } else if (import.meta.env.DEV && error instanceof Error) {
    detail = error.message;
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(203,168,104,0.12),transparent_60%)]" />
      <Logo className="relative" />
      <div className="relative">
        <p className="font-serif text-6xl text-gold-gradient">{is404 ? "404" : "Error"}</p>
        <h1 className="mt-3 font-serif text-2xl text-ink-800 dark:text-ivory">
          {message}
        </h1>
        <p className="mt-2 max-w-md text-sm text-mist">{detail}</p>
      </div>
      <a
        href="/"
        className="relative rounded-xl border border-gold-400/30 px-5 py-2.5 text-sm text-ink-800 transition-colors hover:bg-gold-400/10 dark:text-ivory"
      >
        Return to Athenaeum
      </a>
    </main>
  );
}
