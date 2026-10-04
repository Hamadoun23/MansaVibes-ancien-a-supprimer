"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Mic, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/nav";
import { AssistantProvider, useAssistant } from "@/components/assistant/Assistant";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Modal } from "@/components/ui/Modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AssistantProvider>
      <Shell>{children}</Shell>
    </AssistantProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { open: openAssistant } = useAssistant();
  const [moreOpen, setMoreOpen] = useState(false);

  const isOwner = user?.role !== "tailleur";
  const secondary = SECONDARY_NAV.filter((item) => !item.ownerOnly || isOwner);
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:border-r md:border-line-soft md:bg-bg-card">
        <div className="flex items-center gap-3 px-5 py-6">
          <Image src="/brand/vp-logo-noir.png" alt="" width={34} height={34} className="dark:invert" />
          <div>
            <p className="serif text-lg leading-none">Mansa Vibes</p>
            <p className="mt-1 text-xs text-muted">Atelier</p>
          </div>
        </div>
        <div className="space-y-2 px-3">
          <button
            onClick={openAssistant}
            className="flex h-12 w-full items-center gap-3 rounded-xl bg-gold px-4 text-sm font-semibold text-[#111110]"
          >
            <Mic size={18} /> Assistant vocal
          </button>
          {isOwner && (
            <Link
              href="/orders/new"
              className="flex h-11 w-full items-center gap-3 rounded-xl bg-bg-sunken px-4 text-sm font-semibold"
            >
              <Plus size={18} /> Nouvelle commande
            </Link>
          )}
        </div>
        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {[...PRIMARY_NAV, ...secondary].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.href}>
                {i === PRIMARY_NAV.length && <div className="mx-2 my-3 border-t border-line-soft" />}
                <Link
                  href={item.href}
                  className={clsx(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-sm",
                    isActive(item.href) ? "bg-bg-sunken font-semibold text-ink" : "text-ink-soft hover:bg-bg-sunken"
                  )}
                >
                  <Icon size={18} strokeWidth={isActive(item.href) ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-line-soft px-5 py-4">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-muted">{user?.role === "tailleur" ? "Tailleur" : "Gérant"}</p>
          <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs text-ink-soft hover:text-danger">
            <LogOut size={14} /> Se déconnecter
          </button>
        </div>
      </aside>

      <main className="pb-nav min-w-0 flex-1 md:pb-10">{children}</main>

      <InstallPrompt />

      {/* Mobile bottom bar: 2 tabs · mic · 2 tabs */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-bg-card/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5 items-end px-1 pt-1.5">
          {PRIMARY_NAV.slice(0, 2).map((item) => (
            <TabLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
          <div className="flex justify-center">
            <button
              onClick={openAssistant}
              aria-label="Assistant vocal"
              className="-mt-7 grid h-16 w-16 place-items-center rounded-full border-4 border-bg bg-gold text-[#111110] shadow-lg active:scale-95"
            >
              <Mic size={26} />
            </button>
          </div>
          <TabLink item={PRIMARY_NAV[2]} active={isActive(PRIMARY_NAV[2].href)} />
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 py-1.5 text-[0.68rem] text-ink-soft"
          >
            <MoreHorizontal size={22} strokeWidth={1.8} />
            Plus
          </button>
        </div>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Plus">
        <div className="grid grid-cols-3 gap-2.5">
          {secondary.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 rounded-2xl bg-bg-sunken px-2 py-4 text-center text-xs font-medium text-ink-soft"
              >
                <Icon size={22} strokeWidth={1.7} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-bg-sunken px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-muted">{user?.phone}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-danger">
            <LogOut size={16} /> Sortir
          </button>
        </div>
      </Modal>
    </div>
  );
}

function TabLink({ item, active }: { item: (typeof PRIMARY_NAV)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex flex-col items-center gap-1 py-1.5 text-[0.68rem]",
        active ? "font-semibold text-ink" : "text-ink-soft"
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
      {item.label}
    </Link>
  );
}
