import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
  useLocation,
  useNavigation,
  useRouteError,
  type LoaderFunctionArgs,
  type LinksFunction,
} from "react-router";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { APP_VERSION } from "~/constants/version";
import Swal from "sweetalert2";
import { getFlashMessage, type FlashMessage } from "~/lib/flash.server";
import { getThemeFromRequest, type Theme } from "~/lib/theme.server";
import { getSessionData, type SessionData } from "~/lib/session.server";
import { getLanguageFromRequest, type SupportedLanguage } from "~/utils/i18n";
import { renderRootLayout, renderRootErrorBoundary } from "~/features/root";
import stylesheet from "~/index.css?url";

export const links: LinksFunction = () => [
  { rel: "icon", type: "image/png", href: "/head-icon-kinau.png?v=2" },
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico?v=2" },
  { rel: "shortcut icon", type: "image/x-icon", href: "/favicon.ico?v=2" },
  { rel: "apple-touch-icon", href: "/head-icon-kinau.png?v=2" },
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap",
  },
];

export interface RootLoaderData {
  flash?: FlashMessage | null;
  theme: Theme;
  lang: SupportedLanguage;
  user: SessionData | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { flash, headers } = await getFlashMessage(request);
  const theme = getThemeFromRequest(request);
  const lang = getLanguageFromRequest(request);
  const user = await getSessionData(request);
  return Response.json({ flash, theme, lang, user }, { headers });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<RootLoaderData>("root");
  const theme = data?.theme || "light";
  const lang = data?.lang || "id";

  return (
    <html
      lang={lang}
      className={theme === "dark" ? "dark" : ""}
      data-theme={theme}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/head-icon-kinau.png?v=2"
        />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/head-icon-kinau.png?v=2" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var match = document.cookie.match(/(?:^|;\\s*)theme=(dark|light)(?:;|$)/);
                  var t = match ? match[1] : (localStorage.getItem('theme') || 'light');
                  if (t === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased font-sans selection:bg-[var(--primary)] selection:text-white">
        {children}
        {/* Version Badge — fixed bottom-right edge, all pages */}
        <div
          title={`Kinau ID ${APP_VERSION}`}
          style={{
            position: "fixed",
            bottom: "8px",
            right: "8px",
            zIndex: 9997,
            pointerEvents: "none",
            userSelect: "none",
            fontFamily: "ui-monospace, monospace",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            lineHeight: 1,
            color: "rgba(100,116,139,0.7)",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(148,163,184,0.3)",
            borderRadius: "999px",
            padding: "3px 7px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {APP_VERSION}
        </div>

        <Toaster
          position="bottom-right"
          richColors
          theme={theme === "dark" ? "dark" : "light"}
          closeButton
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const loaderData = useLoaderData<RootLoaderData>();
  const flash = loaderData?.flash;
  const user = loaderData?.user;
  const location = useLocation();
  const navigation = useNavigation();

  // Flash observer effect
  useEffect(() => {
    if (!flash) return;

    if (flash.type === "error" && flash.title) {
      Swal.fire({
        title: flash.title,
        text: flash.message,
        icon: "error",
        customClass: {
          popup:
            "!rounded-[24px] !bg-[var(--card)] !text-[var(--foreground)] !border !border-[var(--border)]",
          confirmButton:
            "!rounded-[1000px] !bg-[var(--primary)] !text-white !px-6 !py-2 font-semibold",
        },
      });
    } else if (flash.type === "success") {
      toast.success(flash.message);
    } else if (flash.type === "error") {
      toast.error(flash.message);
    } else if (flash.type === "warning") {
      toast.warning(flash.message);
    } else {
      toast.info(flash.message);
    }
  }, [flash]);

  const isNavigating = navigation.state === "loading";

  return renderRootLayout({
    children: <Outlet />,
    flash,
    pathname: location.pathname,
    isNavigating,
    user,
  });
}

export function ErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();
  const data = useRouteLoaderData<RootLoaderData>("root");
  return renderRootErrorBoundary(error, location.pathname, data?.user);
}
