import { ReactNode } from "react";

interface DashboardHeroStat {
  label: string;
  value: string | number;
  caption?: string;
  icon?: ReactNode;
}

interface DashboardHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  stats: DashboardHeroStat[];
  actions?: ReactNode;
}

export default function DashboardHero({
  eyebrow,
  title,
  description,
  stats,
  actions
}: DashboardHeroProps) {
  return (
    <section className="rounded-[30px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-5 text-white shadow-soft sm:p-6 lg:p-7">
      <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-200">{description}</p>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article key={item.label} className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
            {item.icon ? (
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                {item.icon}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-slate-200">{item.label}</p>
              <p className="mt-1 text-2xl font-extrabold">{item.value}</p>
              {item.caption ? <p className="mt-1 text-xs text-slate-200">{item.caption}</p> : null}
            </div>
          </article>
        ))}
      </div>

      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}
