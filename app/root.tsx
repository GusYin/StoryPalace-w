import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import localforage from "localforage";
import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";

localforage.config({
  name: "story-palace",
  storeName: "app_cache_v1",
  version: 1.0,
  description: "Application cache for stories and media",
});

// Cache cleanup function
const cleanExpiredCache = async () => {
  try {
    const keys = await localforage.keys();
    const now = Date.now();
    const TTL = 24 * 60 * 60 * 1000; // 24 hours

    for (const key of keys) {
      const item = await localforage.getItem<{ timestamp: number }>(key);
      if (item && now - item.timestamp > TTL) {
        await localforage.removeItem(key);
      }
    }
  } catch (error) {
    console.error("Cache cleanup failed:", error);
  }
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&Dosis:wght@200..800&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize cache cleanup
    const initializeCache = async () => {
      try {
        await localforage.ready();
        console.log("LocalForage initialized");
        await cleanExpiredCache();

        // Set up periodic cleanup (every 6 hours)
        const cleanupInterval = setInterval(
          cleanExpiredCache,
          6 * 60 * 60 * 1000 // Every 6 hours
        );

        return () => clearInterval(cleanupInterval);
      } catch (error) {
        console.error("LocalForage initialization failed:", error);
      }
    };

    initializeCache();
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
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
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
