import React, {
  createElement,
  useState,
  useEffect,
  type ReactElement,
} from "react";
import { useLocation, useFetcher } from "react-router";
import { UI, Modal } from "~/builder";
import { BRAND_NAME } from "~/constants/brand";
import { APP_VERSION } from "~/constants/version";

export interface FloatingBugReportWidgetProps {
  user?: any;
}

export function FloatingBugReportWidget(
  props: FloatingBugReportWidgetProps,
): ReactElement {
  const { user } = props || {};
  const [isOpen, setIsOpen] = useState(false);
  const [copiedRoute, setCopiedRoute] = useState(false);
  const location = useLocation();
  const fetcher = useFetcher();

  // Dynamic session fallback
  const userName = user?.user_name || user?.name || "Staff Kinau";
  const userEmail = user?.user_email || user?.email || "staff@kinau.id";
  const userPhone = user?.phone || "";

  // Live full URL route detection (including full search/encrypted query params)
  const [currentFullRoute, setCurrentFullRoute] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentFullRoute(window.location.pathname + window.location.search);
    } else {
      setCurrentFullRoute(location.pathname + (location.search || ""));
    }
  }, [location.pathname, location.search, isOpen]);

  const isSubmitting = fetcher.state === "submitting";

  // Auto-close on successful creation
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).success) {
      setIsOpen(false);
    }
  }, [fetcher.data]);

  const handleCopyRoute = () => {
    if (typeof navigator !== "undefined" && currentFullRoute) {
      navigator.clipboard.writeText(window.location.origin + currentFullRoute);
      setCopiedRoute(true);
      setTimeout(() => setCopiedRoute(false), 2000);
    }
  };

  return createElement(
    "div",
    { className: "select-none" },
    // 1. Fixed Floating Trigger Button (Bottom Right)
    createElement(
      "div",
      { className: "fixed bottom-10 right-2 z-40 group" },
      createElement(
        "button",
        {
          type: "button",
          onClick: () => setIsOpen(true),
          "aria-label": "Laporkan Bug / Kendala Sistem",
          className:
            "flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#103557] to-[#0d2740] hover:from-[#164e78] hover:to-[#103557] text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer",
        },
        createElement(
          "div",
          { className: "relative flex items-center justify-center" },
          UI.Icon("Bug", { size: 18, className: "text-amber-300" }),
          createElement("span", {
            className:
              "absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#103557] animate-pulse",
          }),
        ),
      ),
      // Hover Tooltip
      createElement(
        "div",
        {
          className:
            "absolute bottom-full right-0 mb-2 hidden group-hover:flex items-center gap-1.5 bg-slate-900 text-white text-[10px] font-semibold py-1.5 px-2.5 rounded-lg shadow-md whitespace-nowrap pointer-events-none",
        },
        UI.Icon("Bug", { size: 11, className: "text-amber-300" }),
        "Lapor Bug & Aduan",
      ),
    ),

    // 2. Report Bug & Aduan Modal with Live Route & Version Detection
    Modal(
      {
        open: isOpen,
        onClose: () => setIsOpen(false),
        title: "Laporkan Bug / Aduan Sistem",
        description: `Bantu tim IT ${BRAND_NAME} mendeteksi dan menyelesaikan kendala teknis dengan cepat.`,
        size: "md",
      },
      createElement(
        fetcher.Form,
        {
          method: "post",
          action: "/app/system/tickets",
          onSubmit: () => {
            // Close modal shortly after submission trigger
            setTimeout(() => setIsOpen(false), 500);
          },
          className: "space-y-4 pt-1 font-sans text-xs",
        },
        createElement("input", {
          type: "hidden",
          name: "intent",
          value: "create-bug-report",
        }),
        createElement("input", {
          type: "hidden",
          name: "targetRoute",
          value: currentFullRoute,
        }),
        createElement("input", {
          type: "hidden",
          name: "appVersion",
          value: APP_VERSION,
        }),

        // Live Diagnostic Banner (Route & Version)
        createElement(
          "div",
          {
            className:
              "p-3 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2 shadow-inner",
          },
          createElement(
            "div",
            { className: "flex items-center justify-between" },
            createElement(
              "div",
              {
                className:
                  "flex items-center gap-2 text-[11px] font-bold text-emerald-400",
              },
              createElement(
                "span",
                { className: "relative flex h-2 w-2" },
                createElement("span", {
                  className:
                    "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75",
                }),
                createElement("span", {
                  className:
                    "relative inline-flex rounded-full h-2 w-2 bg-emerald-500",
                }),
              ),
              "Live Diagnostics",
              createElement(
                "span",
                {
                  className:
                    "px-1.5 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono rounded-md font-semibold tracking-wide shadow-2xs",
                },
                APP_VERSION,
              ),
            ),
            createElement(
              "button",
              {
                type: "button",
                onClick: handleCopyRoute,
                className:
                  "text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer",
              },
              UI.Icon(copiedRoute ? "Check" : "Copy", { size: 11 }),
              copiedRoute ? "Tersalin" : "Salin URL",
            ),
          ),
          createElement(
            "div",
            {
              className:
                "font-mono text-[11px] text-white break-all bg-slate-950 p-2 rounded-lg border border-slate-800 select-all max-h-16 overflow-y-auto scrollbar-thin",
            },
            currentFullRoute || "/",
          ),
          createElement(
            "div",
            {
              className:
                "flex items-center justify-between text-[10px] text-slate-400 leading-tight pt-0.5",
            },
            createElement(
              "span",
              null,
              "Route aktif & parameter otomatis direkam.",
            ),
            createElement(
              "span",
              {
                className:
                  "font-mono text-slate-300 flex items-center gap-1 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60",
              },
              UI.Icon("Cpu", { size: 10, className: "text-emerald-400" }),
              `Build: ${APP_VERSION}`,
            ),
          ),
        ),

        // Subject / Title
        createElement(
          "div",
          { className: "space-y-1" },
          createElement(
            "label",
            { className: "font-bold text-slate-700 block" },
            "Subjek / Ringkasan Kendala *",
          ),
          createElement("input", {
            type: "text",
            name: "title",
            required: true,
            placeholder: "Contoh: Tombol simpan tidak merespon / Error 500...",
            className:
              "w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-[#103557] focus:ring-1 focus:ring-[#103557] outline-hidden shadow-2xs",
          }),
        ),

        // Category & Priority
        createElement(
          "div",
          { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
          createElement(
            "div",
            { className: "space-y-1" },
            createElement(
              "label",
              { className: "font-bold text-slate-700 block" },
              "Kategori Masalah",
            ),
            createElement(
              "select",
              {
                name: "category",
                defaultValue: "ui_bug",
                className:
                  "w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-[#103557] outline-hidden shadow-2xs cursor-pointer",
              },
              createElement(
                "option",
                { value: "ui_bug" },
                "UI / Layout Glitch",
              ),
              createElement(
                "option",
                { value: "data_error" },
                "Error Data / HTTP 500",
              ),
              createElement(
                "option",
                { value: "performance" },
                "Performa Lambat / Hang",
              ),
              createElement(
                "option",
                { value: "feature_request" },
                "Usulan Fitur / Request",
              ),
              createElement("option", { value: "other" }, "Lainnya"),
            ),
          ),
          createElement(
            "div",
            { className: "space-y-1" },
            createElement(
              "label",
              { className: "font-bold text-slate-700 block" },
              "Tingkat Prioritas",
            ),
            createElement(
              "select",
              {
                name: "priority",
                defaultValue: "medium",
                className:
                  "w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-[#103557] outline-hidden shadow-2xs cursor-pointer",
              },
              createElement("option", { value: "low" }, "Low (Rendah)"),
              createElement("option", { value: "medium" }, "Medium (Sedang)"),
              createElement("option", { value: "high" }, "High (Mendesak)"),
              createElement(
                "option",
                { value: "critical" },
                "Critical (Sistem Down)",
              ),
            ),
          ),
        ),

        // Description
        createElement(
          "div",
          { className: "space-y-1" },
          createElement(
            "label",
            { className: "font-bold text-slate-700 block" },
            "Detail Deskripsi Kendala *",
          ),
          createElement("textarea", {
            name: "description",
            rows: 3,
            required: true,
            placeholder:
              "Jelaskan kronologi kejadian, tombol apa yang ditekan, atau pesan error yang muncul...",
            className:
              "w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-[#103557] focus:ring-1 focus:ring-[#103557] outline-hidden shadow-2xs resize-none",
          }),
        ),

        // Reporter Contacts (Pre-filled)
        createElement(
          "div",
          {
            className:
              "grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200",
          },
          createElement(
            "div",
            { className: "space-y-1" },
            createElement(
              "label",
              { className: "text-[11px] font-bold text-slate-600 block" },
              "Nama Pelapor",
            ),
            createElement("input", {
              type: "text",
              name: "reporterName",
              defaultValue: userName,
              className:
                "w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden",
            }),
          ),
          createElement(
            "div",
            { className: "space-y-1" },
            createElement(
              "label",
              { className: "text-[11px] font-bold text-slate-600 block" },
              "Email Pelapor",
            ),
            createElement("input", {
              type: "email",
              name: "reporterEmail",
              defaultValue: userEmail,
              className:
                "w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden font-mono",
            }),
          ),
          createElement(
            "div",
            { className: "space-y-1" },
            createElement(
              "label",
              { className: "text-[11px] font-bold text-slate-600 block" },
              "No. WhatsApp (PIC)",
            ),
            createElement("input", {
              type: "text",
              name: "reporterPhone",
              defaultValue: userPhone,
              placeholder: "0812...",
              className:
                "w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden font-mono",
            }),
          ),
        ),

        // Action Buttons
        createElement(
          "div",
          {
            className:
              "flex items-center justify-end gap-2 pt-2 border-t border-slate-100",
          },
          createElement(
            "button",
            {
              type: "button",
              onClick: () => setIsOpen(false),
              className:
                "px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer",
            },
            "Batal",
          ),
          createElement(
            "button",
            {
              type: "submit",
              disabled: isSubmitting,
              className:
                "px-5 py-2 bg-[#103557] hover:bg-[#164e78] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer",
            },
            UI.Icon("Send", { size: 13 }),
            isSubmitting ? "Mengirim..." : "Kirim Laporan",
          ),
        ),
      ),
    ),
  );
}
