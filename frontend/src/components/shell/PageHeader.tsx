"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <div className="pt-safe sticky top-0 z-30 bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 md:px-8">
        {back && (
          <button
            onClick={() => router.back()}
            aria-label="Retour"
            className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bg-card text-ink"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="serif truncate text-2xl leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
