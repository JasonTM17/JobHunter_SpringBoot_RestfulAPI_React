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
      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft lg:min-h-[700px] lg:grid-cols-[1.02fr,0.98fr]">
        <aside className="border-r border-slate-200 bg-slate-50 p-6 text-slate-950 sm:p-8 lg:min-h-[700px] lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-[#b51d1a]">
            <img src="/logo-mark.svg" alt="Jobhunter" className="h-4 w-4" />
            Jobhunter
          </div>

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-wide text-[#b51d1a]">{eyebrow}</p>
          <h2 className="mt-3 max-w-lg text-3xl font-extrabold leading-tight sm:text-[38px]">{asideTitle}</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">{asideDescription}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              Công ty thật
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              Hồ sơ rõ ràng
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              Ứng tuyển nhanh
            </span>
          </div>

          <div className="mt-8 grid gap-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </aside>

        <article className="p-5 sm:p-7 lg:p-10">{children}</article>
      </section>
    </main>
  );
}
