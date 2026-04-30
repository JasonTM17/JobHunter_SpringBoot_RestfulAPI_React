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
    <section className="overflow-hidden rounded-lg border border-rose-200 bg-white shadow-soft">
      <div className="h-1.5 bg-[#b51d1a]" />
      <div className="p-5 sm:p-6 lg:p-7">
        <p className="inline-flex rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#b51d1a]">
          {eyebrow}
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <article key={item.label} className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              {item.icon ? (
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#b51d1a] shadow-sm">
                  {item.icon}
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-950">{item.value}</p>
                {item.caption ? <p className="mt-1 text-xs text-slate-500">{item.caption}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
