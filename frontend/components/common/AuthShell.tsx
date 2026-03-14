import { ReactNode } from "react";

interface AuthShellProps {
  eyebrow: string;
  asideTitle: string;
  asideDescription: string;
  highlights: string[];
  children: ReactNode;
}

export default function AuthShell({
  eyebrow,
  asideTitle,
  asideDescription,
  highlights,
  children
}: AuthShellProps) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1240px] items-start px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
      <section className="relative isolate mx-auto grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 shadow-soft backdrop-blur lg:min-h-[700px] lg:grid-cols-[1.08fr,0.92fr]">
        <aside className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-slate-100 sm:p-8 lg:min-h-[700px] lg:p-10">
          <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-rose-100">
              <img src="/favicon.svg" alt="Jobhunter" className="h-4 w-4" />
              Jobhunter
            </div>

            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">{eyebrow}</p>
            <h2 className="mt-3 max-w-lg text-3xl font-extrabold leading-tight sm:text-[38px]">{asideTitle}</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200">{asideDescription}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                Công ty thật
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                Hồ sơ rõ ràng
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                Ứng tuyển nhanh
              </span>
            </div>

            <div className="mt-8 grid gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-slate-100"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <article className="relative p-5 sm:p-7 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-rose-50/80 to-transparent" />
          <div className="relative">{children}</div>
        </article>
      </section>
    </main>
  );
}
