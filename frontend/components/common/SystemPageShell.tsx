import Link from "next/link";
import { ReactNode } from "react";

type Action = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "accent";
};

interface SystemPageShellProps {
  label: string;
  code: string;
  title: string;
  description: string;
  primaryAction: Action;
  secondaryAction?: Action;
  tertiaryAction?: Action;
  panelTitle: string;
  panelDescription?: string;
  panelItems: string[];
  tone?: "slate" | "amber";
  notice?: ReactNode;
}

function actionClassName(variant: Action["variant"] = "secondary") {
  if (variant === "primary") {
    return "rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800";
  }

  if (variant === "accent") {
    return "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100";
  }

  return "rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100";
}

export default function SystemPageShell({
  label,
  code,
  title,
  description,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  panelTitle,
  panelDescription,
  panelItems,
  tone = "slate",
  notice
}: SystemPageShellProps) {
  const toneBadgeClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-600";

  const panelClass =
    tone === "amber"
      ? "border-amber-200 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-700 text-white"
      : "border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white";

  return (
    <main className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1180px] items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-[36px] border border-slate-200 bg-white/95 p-6 shadow-soft backdrop-blur sm:p-8 lg:grid-cols-[1.2fr,0.8fr] lg:p-10">
        <article className="flex flex-col justify-between">
          <div>
            <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneBadgeClass}`}>{label}</p>
            <p className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{code}</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
            {notice ? <div className="mt-4">{notice}</div> : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryAction.href} className={actionClassName(primaryAction.variant ?? "primary")}>
              {primaryAction.label}
            </Link>
            {secondaryAction ? (
              <Link href={secondaryAction.href} className={actionClassName(secondaryAction.variant)}>
                {secondaryAction.label}
              </Link>
            ) : null}
            {tertiaryAction ? (
              <Link href={tertiaryAction.href} className={actionClassName(tertiaryAction.variant ?? "accent")}>
                {tertiaryAction.label}
              </Link>
            ) : null}
          </div>
        </article>

        <aside className={`rounded-[28px] border p-6 shadow-sm ${panelClass}`}>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
            Điều hướng nhanh
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight">{panelTitle}</h2>
          {panelDescription ? <p className="mt-3 text-sm leading-6 text-white/80">{panelDescription}</p> : null}
          <ul className="mt-6 grid gap-3">
            {panelItems.map((item) => (
              <li key={item} className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm leading-6 text-white/90">
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
