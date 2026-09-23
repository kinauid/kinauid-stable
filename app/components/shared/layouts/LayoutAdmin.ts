import React, { useEffect, useState, createElement, Fragment } from "react";
import type { ReactNode } from "react";
import { NavLink, useLocation, useFetcher } from "react-router";
import { UI, Modal } from "~/builder";
import { BRAND_NAME, BRAND_TAGLINE } from "~/constants/brand";
import { PageSkeleton } from "~/components/shared/widgets/PageSkeleton";
import { useUIStore } from "~/components/shared/store/ui";
import { buildEncryptedUrl, decryptCompactState } from "~/utils/cryptoState";
import { FloatingBugReportWidget } from "~/components/feature/FloatingBugReportWidget";

import {
  NAVIGATION_GROUPS,
  type NavGroup,
  type NavLinkItem,
  type SubMenuItem,
} from "~/constants/navigation";

export type { NavGroup, NavLinkItem, SubMenuItem };
export { NAVIGATION_GROUPS };

export interface LayoutAdminProps {
  children: ReactNode;
  pathname: string;
  isNavigating?: boolean;
  user?: any;
}

/**
 * Check if target href matches current location (including encrypted query state)
 */
function isUrlActive(
  targetHref: string,
  currentPathname: string,
  currentSearch: string,
): boolean {
  const [targetPath, targetSearch] = targetHref.split("?");
  if (currentPathname !== targetPath) {
    return false;
  }
  // If target has no query params, but pathname matches:
  // e.g. targetHref = "/app/order-list", pathname = "/app/order-list"
  if (!targetSearch) {
    return true;
  }

  const targetParams = new URLSearchParams(targetSearch);
  const targetCipher = targetParams.get("q");
  const currentParams = new URLSearchParams(currentSearch);
  const currentCipher = currentParams.get("q");

  if (targetCipher && currentCipher) {
    if (targetCipher === currentCipher) return true;
    const targetDecrypted = decryptCompactState<any>(targetCipher, {});
    const currentDecrypted = decryptCompactState<any>(currentCipher, {});
    if (targetDecrypted && currentDecrypted) {
      return Object.keys(targetDecrypted).every(
        (key) => targetDecrypted[key] === currentDecrypted[key],
      );
    }
  }

  // Graceful fallback: If current page is on default state without cipher, check default tab match
  if (targetCipher && !currentCipher) {
    const targetDecrypted = decryptCompactState<any>(targetCipher, {});
    if (
      targetDecrypted &&
      (targetDecrypted.tab === "all" || targetDecrypted.tab === "reguler")
    ) {
      return true;
    }
  }

  return currentSearch === targetSearch;
}

function SidebarNavItem({
  item,
  pathname,
  isCollapsed,
}: {
  item: NavLinkItem;
  pathname: string;
  isCollapsed: boolean;
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isParentActive =
    item.href === "/app/dashboard"
      ? pathname === "/app/dashboard"
      : item.children && item.children.length > 0
        ? Boolean(
            item.children.some((child) =>
              isUrlActive(child.href, pathname, location.search),
            ),
          )
        : isUrlActive(item.href, pathname, location.search);

  // ── Collapsed Mode with Floating Popover ──
  if (isCollapsed) {
    return createElement(
      "div",
      { className: "relative group flex justify-center py-1 select-none" },
      createElement(
        NavLink,
        {
          to: item.href,
          end: item.href === "/app/dashboard",
          className: ({ isActive }: { isActive: boolean }) =>
            `w-10 h-10 rounded-xl flex items-center justify-center transition-all no-underline cursor-pointer ${
              isActive || isParentActive
                ? "bg-white text-[#103557] font-bold shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] border border-[#E5E7EB]"
                : "text-slate-500 hover:text-[#111827] hover:bg-slate-200/60"
            }`,
        },
        UI.Icon(item.icon, {
          size: 18,
          className: isParentActive ? "text-[#103557]" : "text-slate-500",
        }),
      ),
      createElement(
        "div",
        {
          className:
            "absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex flex-col bg-white border border-[#E5E7EB] shadow-xl rounded-xl py-2 px-3 min-w-[180px] z-50 pointer-events-none group-hover:pointer-events-auto",
        },
        createElement(
          "div",
          {
            className:
              "text-xs font-bold text-[#111827] pb-1 border-b border-slate-100 mb-1 flex items-center justify-between",
          },
          createElement("span", null, item.label),
          item.badge
            ? createElement(
                "span",
                {
                  className:
                    "text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold",
                },
                item.badge,
              )
            : null,
        ),
        item.children && item.children.length > 0
          ? item.children.map((sub) => {
              const active = isUrlActive(sub.href, pathname, location.search);
              return createElement(
                NavLink,
                {
                  key: sub.label,
                  to: sub.href,
                  className: `text-[11px] py-1 px-2 rounded-lg no-underline transition-colors flex items-center justify-between ${
                    active
                      ? "bg-[#EFF6FF] text-[#103557] font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`,
                },
                createElement("span", null, sub.label),
                sub.badge
                  ? createElement(
                      "span",
                      {
                        className:
                          "text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600",
                      },
                      sub.badge,
                    )
                  : null,
              );
            })
          : createElement(
              "span",
              { className: "text-[11px] text-slate-400" },
              "Akses Cepat Modul",
            ),
      ),
    );
  }

  // ── Expanded Link with Sub-menu Accordion ──
  if (item.children && item.children.length > 0) {
    const isExpanded = open || isParentActive;

    return createElement(
      "div",
      { className: "space-y-0.5 select-none" },
      createElement(
        "button",
        {
          type: "button",
          onClick: () => setOpen(!open),
          className: `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            isParentActive
              ? "bg-white text-[#103557] font-bold border border-[#E5E7EB] shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]"
              : "text-slate-600 hover:text-[#111827] hover:bg-slate-200/60"
          }`,
        },
        createElement(
          "div",
          { className: "flex items-center gap-2.5 min-w-0 flex-1" },
          UI.Icon(item.icon, {
            size: 16,
            className: isParentActive ? "text-[#103557]" : "text-slate-500",
          }),
          createElement("span", { className: "truncate text-xs" }, item.label),
        ),
        createElement(
          "div",
          { className: "flex items-center gap-1.5 shrink-0 ml-1" },
          item.badge
            ? createElement(
                "span",
                {
                  className: `text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                    isParentActive
                      ? "bg-[#EFF6FF] text-[#103557] border border-blue-200"
                      : "bg-white text-slate-600 border border-[#E5E7EB]"
                  }`,
                },
                item.badge,
              )
            : null,
          createElement(
            "span",
            {
              className: `transition-transform duration-200 text-slate-400 ${
                isExpanded ? "rotate-90 text-[#103557]" : "rotate-0"
              }`,
            },
            UI.Icon("ChevronRight", { size: 14 }),
          ),
        ),
      ),
      isExpanded
        ? createElement(
            "div",
            {
              className:
                "pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-slate-200 ml-4",
            },
            item.children.map((sub) => {
              const active = isUrlActive(sub.href, pathname, location.search);
              return createElement(
                NavLink,
                {
                  key: sub.label,
                  to: sub.href,
                  className: `flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium no-underline transition-all ${
                    active
                      ? "bg-[#EFF6FF] text-[#103557] font-bold border border-blue-100"
                      : "text-slate-600 hover:text-[#111827] hover:bg-slate-100/70"
                  }`,
                },
                createElement("span", { className: "truncate" }, sub.label),
                sub.badge
                  ? createElement(
                      "span",
                      {
                        className: `text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          active
                            ? "bg-[#103557] text-white"
                            : "bg-slate-200/70 text-slate-600"
                        }`,
                      },
                      sub.badge,
                    )
                  : null,
              );
            }),
          )
        : null,
    );
  }

  // ── Expanded Link Without Children ──
  return createElement(
    "div",
    { className: "space-y-0.5 select-none" },
    createElement(NavLink, {
      to: item.href,
      end: item.href === "/app/dashboard",
      className: ({ isActive }: { isActive: boolean }) =>
        `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all no-underline cursor-pointer outline-hidden ${
          isActive
            ? "bg-white text-[#103557] font-bold border border-[#E5E7EB] shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]"
            : "text-slate-600 hover:text-[#111827] hover:bg-slate-200/60"
        }`,
      children: ({ isActive }: { isActive: boolean }) =>
        createElement(
          Fragment,
          null,
          createElement(
            "div",
            { className: "flex items-center gap-2.5 min-w-0 flex-1" },
            UI.Icon(item.icon, {
              size: 16,
              className: isActive ? "text-[#103557]" : "text-slate-500",
            }),
            createElement(
              "span",
              { className: "truncate text-xs" },
              item.label,
            ),
          ),
          item.badge
            ? createElement(
                "span",
                {
                  className: `text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ml-1.5 shrink-0 ${
                    isActive
                      ? "bg-[#EFF6FF] text-[#103557] border border-blue-200"
                      : "bg-white text-slate-600 border border-[#E5E7EB]"
                  }`,
                },
                item.badge,
              )
            : null,
        ),
    }),
  );
}

function LayoutAdminComponent({
  children,
  pathname,
  isNavigating = false,
  user,
}: LayoutAdminProps): React.ReactElement {
  const {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    toggleSidebarCollapsed,
    setSidebarOpen,
  } = useUIStore();
  const location = useLocation();
  const fetcher = useFetcher();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Hydration-safe live clock updating every second on client only
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-hide mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  // Auto-hide mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  // Extract dynamic user session data
  const displayName = user?.user_name || user?.name || "Staff Kinau";
  const displayEmail = user?.user_email || user?.email || "admin@kinau.id";
  const displayRole =
    user?.user_role || user?.role || "Super Admin (Full Access)";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";

  // Find current breadcrumb info
  let activeGroupTitle = "UTAMA";
  let activePageTitle = "Performa Perusahaan";
  let activePageIcon = "LayoutDashboard";

  for (const group of NAVIGATION_GROUPS) {
    for (const item of group.items) {
      if (item.children) {
        for (const sub of item.children) {
          const matchSub = isUrlActive(sub.href, pathname, location.search);
          if (matchSub) {
            activeGroupTitle = group.groupTitle;
            activePageTitle = `${item.label} / ${sub.label}`;
            activePageIcon = item.icon;
            break;
          }
        }
      }
      const match =
        item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href.split("?")[0]);
      if (match) {
        activeGroupTitle = group.groupTitle;
        activePageTitle = item.label;
        activePageIcon = item.icon;
        break;
      }
    }
  }

  const handleSidebarHeaderClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    } else {
      toggleSidebarCollapsed();
    }
  };

  const handleLogout = () => {
    fetcher.submit(null, { method: "post", action: "/_auth/logout" });
  };

  // Nav content rendering
  const navContent = NAVIGATION_GROUPS.map((group, gIdx) => {
    const items = group.items.map((item) =>
      React.createElement(SidebarNavItem, {
        key: item.label,
        item,
        pathname,
        isCollapsed: sidebarCollapsed,
      }),
    );

    return createElement(
      "div",
      { className: "space-y-1", key: `${group.groupTitle}-${gIdx}` },
      !sidebarCollapsed
        ? createElement(
            "div",
            {
              className:
                "px-3 pt-3 pb-1 text-[10px] font-bold font-mono uppercase tracking-wider text-[#9CA3AF]",
            },
            group.groupTitle,
          )
        : createElement("div", {
            className: "w-6 h-[1px] bg-slate-200 mx-auto my-2",
          }),
      createElement("div", { className: "space-y-0.5" }, ...items),
    );
  });

  // 1. Sidebar Component
  const sidebarElement = createElement(
    "aside",
    {
      className: `
        bg-[#F8FAFC] flex flex-col justify-between shrink-0 font-sans text-xs select-none z-50 py-2 overflow-y-auto overflow-x-hidden scrollbar-thin transition-[width,transform] duration-200 ease-in-out
        fixed inset-y-0 left-0 shadow-2xl lg:shadow-none lg:static lg:inset-auto lg:h-full
        ${sidebarOpen ? "translate-x-0 w-72 px-2" : "-translate-x-full lg:translate-x-0"}
        ${sidebarCollapsed ? "lg:w-16 w-16 px-1" : "lg:w-64 w-72 px-2"}
      `,
    },
    // Top Header & Logo (Matching Kinau Reference)
    createElement(
      "div",
      { className: "space-y-3.5 shrink-0" },
      createElement(
        "div",
        {
          className: `flex items-center ${
            sidebarCollapsed
              ? "justify-center flex-col gap-2"
              : "justify-between px-1"
          } pt-1`,
        },
        createElement(
          NavLink,
          {
            to: "/app/dashboard",
            className:
              "flex items-center no-underline cursor-pointer group py-0.5 min-w-0",
          },
          !sidebarCollapsed
            ? createElement(
                "div",
                {
                  className:
                    "h-8 max-w-[150px] flex items-center justify-start overflow-hidden",
                },
                createElement("img", {
                  src: "/kinau-logo.png",
                  alt: BRAND_NAME,
                  className: "h-7 w-auto object-contain",
                }),
              )
            : createElement(
                "div",
                {
                  className:
                    "w-9 h-9 rounded-xl bg-white p-1 border border-[#E5E7EB] flex items-center justify-center shadow-2xs overflow-hidden shrink-0",
                },
                createElement("img", {
                  src: "/head-icon-kinau.png",
                  alt: BRAND_NAME,
                  className: "w-full h-full object-contain",
                }),
              ),
        ),
        createElement(
          "button",
          {
            type: "button",
            onClick: handleSidebarHeaderClick,
            title: sidebarCollapsed
              ? "Perluas Sidebar"
              : "Kecilkan / Sembunyikan Sidebar",
            className:
              "p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer",
          },
          UI.Icon(sidebarCollapsed ? "ChevronRight" : "Sidebar", { size: 16 }),
        ),
      ),
      !sidebarCollapsed
        ? createElement(
            "div",
            { className: "px-0.5" },
            createElement(
              "div",
              { className: "relative flex items-center" },
              UI.Icon("Search", {
                size: 13,
                className: "absolute left-3 text-[#9CA3AF] pointer-events-none",
              }),
              createElement("input", {
                type: "text",
                placeholder: "Cari modul, pesanan, PIC...",
                className:
                  "w-full pl-8 pr-8 py-2 text-xs bg-[#FFFFFF] text-[#111827] placeholder-[#9CA3AF] rounded-xl border border-[#E5E7EB] focus:border-[#103557] focus:outline-hidden transition-colors shadow-2xs",
                readOnly: true,
              }),
              UI.Icon("Edit3", {
                size: 12,
                className:
                  "absolute right-3 text-[#9CA3AF] pointer-events-none",
              }),
            ),
          )
        : null,
    ),
    // Scrollable Nav Groups
    createElement(
      "div",
      {
        className:
          "flex-1 overflow-y-auto overflow-x-hidden px-0.5 py-3 space-y-2 scrollbar-thin",
      },
      ...navContent,
    ),
    // Bottom Section
    createElement(
      "div",
      { className: "space-y-3 shrink-0 pt-2 border-t border-[#E5E7EB]/60" },
      !sidebarCollapsed
        ? createElement(
            Fragment,
            null,
            createElement(
              "div",
              {
                className:
                  "p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-2.5 shadow-2xs select-none",
              },
              createElement(
                "div",
                { className: "flex items-center justify-between" },
                createElement(
                  "div",
                  {
                    className:
                      "flex items-center gap-1.5 text-xs font-bold text-[#111827]",
                  },
                  UI.Icon("Flame", { size: 13, className: "text-[#D97706]" }),
                  createElement("span", null, "Workshop Kinau"),
                  createElement(
                    "span",
                    {
                      className:
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]",
                    },
                    "Aktif",
                  ),
                ),
              ),
              createElement(
                "div",
                { className: "flex flex-col gap-1" },
                createElement(
                  "div",
                  {
                    className:
                      "flex items-center justify-between text-[11px] font-semibold text-[#111827]",
                  },
                  createElement("span", null, "4.250 / 5.000 Pcs"),
                  createElement("span", { className: "text-[#6B7280]" }, "85%"),
                ),
                createElement(
                  "div",
                  {
                    className:
                      "w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden",
                  },
                  createElement("div", {
                    className:
                      "w-[85%] h-full bg-gradient-to-r from-[#103557] to-[#10B981] rounded-full",
                  }),
                ),
              ),
              createElement(
                "p",
                { className: "text-[11px] text-[#6B7280] leading-tight" },
                "Antrean produksi ID Card, Lanyard, & Jersey Sublimasi berjalan optimal.",
              ),
              createElement(
                NavLink,
                {
                  to: "/app/order-list",
                  className:
                    "w-full block py-2 px-3 text-center bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-xs transition-all no-underline cursor-pointer",
                },
                "Lihat Antrean Produksi",
              ),
            ),
            // Profile Button with dynamic session data
            createElement(
              "button",
              {
                type: "button",
                onClick: () => setProfileModalOpen(true),
                className:
                  "w-full p-2.5 rounded-2xl bg-[#FFFFFF] hover:bg-slate-50 border border-[#E5E7EB] shadow-2xs flex items-center justify-between text-left transition-colors cursor-pointer",
              },
              createElement(
                "div",
                { className: "flex items-center gap-2.5 min-w-0" },
                createElement(
                  "div",
                  {
                    className:
                      "w-8 h-8 rounded-full overflow-hidden bg-[#EFF6FF] border border-[#BFDBFE] shrink-0 flex items-center justify-center font-bold text-xs text-[#103557]",
                  },
                  initials,
                ),
                createElement(
                  "div",
                  { className: "min-w-0" },
                  createElement(
                    "div",
                    {
                      className:
                        "text-xs font-bold text-[#111827] truncate leading-tight",
                    },
                    displayName,
                  ),
                  createElement(
                    "div",
                    {
                      className:
                        "text-[10px] text-[#6B7280] truncate font-mono",
                    },
                    displayEmail,
                  ),
                ),
              ),
              UI.Icon("ChevronsUpDown", {
                size: 14,
                className: "text-[#9CA3AF] shrink-0",
              }),
            ),
          )
        : createElement(
            "div",
            { className: "flex flex-col items-center gap-2 py-1" },
            createElement(
              "button",
              {
                type: "button",
                onClick: () => setProfileModalOpen(true),
                title: `${displayName} (${displayEmail}) — Opsi Profil / Logout`,
                className:
                  "w-9 h-9 rounded-xl overflow-hidden bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center font-bold text-xs text-[#103557] shadow-2xs hover:scale-105 transition-transform cursor-pointer",
              },
              initials,
            ),
          ),
    ),
  );

  // 2. Responsive Top Header Bar with (Beri Saran Lainnya | Tanggal & Waktu Berjalan | Icon Notif)
  const headerElement = createElement(
    "header",
    {
      className:
        "h-14 px-4 sm:px-6 md:px-8 border-b border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-between shrink-0 font-sans text-xs select-none sticky top-0 z-30 relative",
    },
    // Top loading progress bar during navigation transitions
    isNavigating
      ? createElement("div", {
          className:
            "absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#103557] via-[#3B82F6] to-[#10B981] animate-pulse z-40",
        })
      : null,

    // Left: Mobile Hamburger & Dynamic Breadcrumbs
    createElement(
      "div",
      { className: "flex items-center gap-2 sm:gap-3 min-w-0" },
      createElement(
        "button",
        {
          type: "button",
          onClick: toggleSidebar,
          "aria-label": "Buka Menu Sidebar",
          className:
            "lg:hidden p-2 -ml-1.5 rounded-xl text-[#103557] hover:bg-slate-100 transition-colors cursor-pointer shrink-0",
        },
        UI.Icon("Menu", { size: 18 }),
      ),
      createElement(
        "div",
        {
          className:
            "flex items-center gap-1.5 sm:gap-2 text-xs text-[#6B7280] min-w-0 truncate",
        },
        createElement(
          NavLink,
          {
            to: "/app/dashboard",
            className:
              "hover:text-[#111827] transition-colors cursor-pointer no-underline text-[#6B7280] font-medium hidden sm:inline",
          },
          activeGroupTitle,
        ),
        createElement(
          "span",
          { className: "text-[#D1D5DB] hidden sm:inline" },
          "/",
        ),
        createElement(
          "div",
          {
            className:
              "flex items-center gap-1.5 font-bold text-[#111827] truncate",
          },
          UI.Icon(activePageIcon, {
            size: 14,
            className: "text-[#103557] shrink-0",
          }),
          createElement("span", { className: "truncate" }, activePageTitle),
        ),
      ),
    ),

    // Right: Status Badge | Tanggal & Waktu Berjalan | Icon Notif
    createElement(
      "div",
      { className: "flex items-center gap-2 sm:gap-3.5 shrink-0" },

      // 1. Status Workshop
      // createElement(
      //   'div',
      //   {
      //     className:
      //       'hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
      //   },
      //   createElement('span', { className: 'w-2 h-2 rounded-full bg-[#10B981] animate-pulse' }),
      //   createElement('span', null, 'Workshop Online')
      // ),

      // 2. Tanggal & Waktu Berjalan Realtime (Hydration-Safe)
      createElement(
        "div",
        {
          className:
            "hidden sm:flex flex-col items-end px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl leading-tight select-none",
          suppressHydrationWarning: true,
        },
        createElement(
          "div",
          {
            className:
              "flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800",
            suppressHydrationWarning: true,
          },
          UI.Icon("Clock", { size: 11, className: "text-slate-400" }),
          createElement(
            "span",
            { suppressHydrationWarning: true },
            mounted && currentTime
              ? currentTime.toLocaleTimeString("id-ID", { hour12: false }) +
                  " WIB"
              : "--:--:-- WIB",
          ),
        ),
        createElement(
          "div",
          {
            className: "text-[10px] text-slate-500 font-medium",
            suppressHydrationWarning: true,
          },
          mounted && currentTime
            ? currentTime.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Workshop Kinau",
        ),
      ),

      // 3. Icon Notifikasi
      createElement(
        "button",
        {
          type: "button",
          title: "Notifikasi Workshop",
          onClick: () => alert("Belum ada notifikasi baru hari ini."),
          className:
            "p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors cursor-pointer border border-transparent hover:border-[#E5E7EB] relative",
        },
        UI.Icon("Bell", { size: 16 }),
        createElement("span", {
          className:
            "absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white",
        }),
      ),
    ),
  );

  // 3. Main Stage Content Area (No max-w-7xl, Full Width)
  const mainStage = createElement(
    "main",
    {
      className:
        "flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden bg-[#FFFFFF]",
    },
    isNavigating
      ? createElement(PageSkeleton)
      : createElement(
          "div",
          { className: "p-4 sm:p-6 md:p-8 space-y-6 w-full" },
          children as React.ReactElement,
        ),
  );

  // 4. Inset Floating Main Container
  const mainPanel = createElement(
    "div",
    {
      className:
        "flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FFFFFF] lg:rounded-2xl border-0 lg:border border-[#E5E7EB] shadow-xs",
    },
    headerElement,
    mainStage,
  );

  return createElement(
    "div",
    {
      className:
        "flex h-screen w-full bg-[#F8FAFC] lg:p-2.5 lg:gap-2.5 text-[#111827] font-sans overflow-hidden select-none relative",
    },
    sidebarOpen
      ? createElement("div", {
          onClick: () => setSidebarOpen(false),
          className:
            "fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300",
        })
      : null,
    sidebarElement,
    mainPanel,
    createElement(FloatingBugReportWidget, { user }),

    // Profile & Logout Modals with dynamic session data
    Modal(
      {
        open: profileModalOpen,
        onClose: () => setProfileModalOpen(false),
        title: "Profil Pengguna & Sesi",
        description: "Informasi akun staff dan hak akses operasional.",
        size: "sm",
      },
      createElement(
        "div",
        { className: "space-y-4 pt-1" },
        createElement(
          "div",
          {
            className:
              "flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200",
          },
          createElement(
            "div",
            {
              className:
                "w-12 h-12 rounded-full bg-[#103557] text-white flex items-center justify-center font-bold text-sm shadow-sm",
            },
            initials,
          ),
          createElement(
            "div",
            { className: "min-w-0" },
            createElement(
              "h4",
              { className: "font-bold text-sm text-slate-900 truncate" },
              displayName,
            ),
            createElement(
              "p",
              { className: "text-xs text-slate-500 font-mono truncate" },
              displayEmail,
            ),
            createElement(
              "span",
              {
                className:
                  "inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase",
              },
              displayRole,
            ),
          ),
        ),
        createElement(
          "div",
          { className: "space-y-2" },
          createElement(
            NavLink,
            {
              to: "/dashboard/admin/manage",
              onClick: () => setProfileModalOpen(false),
              className:
                "w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 no-underline transition-colors cursor-pointer",
            },
            createElement(
              "div",
              { className: "flex items-center gap-2" },
              UI.Icon("UserCog", { size: 16, className: "text-slate-500" }),
              createElement("span", null, "Kelola Akun & Hak Akses (RBAC)"),
            ),
            UI.Icon("ChevronRight", { size: 14, className: "text-slate-400" }),
          ),
          createElement(
            "button",
            {
              type: "button",
              onClick: () => {
                setProfileModalOpen(false);
                setLogoutConfirmOpen(true);
              },
              className:
                "w-full flex items-center justify-between p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-xs font-bold text-rose-700 transition-colors cursor-pointer",
            },
            createElement(
              "div",
              { className: "flex items-center gap-2" },
              UI.Icon("LogOut", { size: 16, className: "text-rose-600" }),
              createElement("span", null, "Keluar / Logout dari Sistem"),
            ),
            UI.Icon("ChevronRight", { size: 14, className: "text-rose-400" }),
          ),
        ),
      ),
    ),

    // Logout Confirmation Modal
    Modal(
      {
        open: logoutConfirmOpen,
        onClose: () => setLogoutConfirmOpen(false),
        title: "Konfirmasi Logout",
        description:
          "Apakah Anda yakin ingin mengakhiri sesi dan keluar dari akun ini?",
        size: "sm",
      },
      createElement(
        "div",
        { className: "space-y-4 pt-2" },
        createElement(
          "div",
          {
            className:
              "flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800",
          },
          UI.Icon("AlertTriangle", {
            size: 20,
            className: "text-amber-600 shrink-0",
          }),
          createElement(
            "p",
            null,
            "Seluruh sesi yang sedang aktif akan dibersihkan dari peramban.",
          ),
        ),
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
              onClick: () => setLogoutConfirmOpen(false),
              className:
                "px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer",
            },
            "Batal",
          ),
          createElement(
            "button",
            {
              type: "button",
              onClick: handleLogout,
              className:
                "px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer",
            },
            "Ya, Logout",
          ),
        ),
      ),
    ),
  );
}

export function renderLayoutAdmin(props: LayoutAdminProps): React.ReactElement {
  return React.createElement(LayoutAdminComponent, props);
}
