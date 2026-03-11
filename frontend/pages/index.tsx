import { useEffect, useMemo, useState } from "react";

type Company = {
  id: number;
  name: string;
  logo: string;
  description?: string;
  address?: string;
};

type ApiPayload = {
  data?: {
    result?: Company[];
  };
  result?: Company[];
};

const FALLBACK_COMPANIES: Company[] = [
  { id: 1, name: "Amazon.com, Inc", logo: "1716687538974-amzon.jpg" },
  { id: 2, name: "Apple Inc.", logo: "1716687768336-apple.jpg" },
  { id: 3, name: "Google LLC", logo: "1716687909879-google.png" },
  { id: 4, name: "Lazada Viet Nam", logo: "1716688017004-lazada.png" },
  { id: 5, name: "Netflix Inc", logo: "1716688067538-netflix.png" },
  { id: 6, name: "Adobe Photoshop", logo: "1716688187365-photoshop.png" },
  { id: 7, name: "Tap doan Adobe", logo: "1716688251710-pr.jpg" },
  { id: 8, name: "Shopee", logo: "1716688292011-shopee.png" },
  { id: 9, name: "Tiki", logo: "1716688336563-tiki.jpg" },
  { id: 10, name: "Tiktok", logo: "1716688386288-tiktok.jpg" }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const COMPANIES_API = `${API_BASE_URL}/api/v1/companies?page=1&size=100`;
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL ?? API_BASE_URL;

function parseCompanies(payload: ApiPayload): Company[] {
  if (Array.isArray(payload?.data?.result)) return payload.data.result;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

function makeLogoUrl(logo: string): string {
  if (!logo) return "";
  if (/^https?:\/\//i.test(logo)) return logo;
  if (logo.startsWith("/storage/")) return `${STORAGE_BASE_URL}${logo}`;
  if (logo.startsWith("storage/")) return `${STORAGE_BASE_URL}/${logo}`;
  if (logo.startsWith("/")) return `${STORAGE_BASE_URL}${logo}`;
  return `${STORAGE_BASE_URL}/storage/company/${logo}`;
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "NA"
  );
}

export default function HomePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [status, setStatus] = useState("Loading companies...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCompanies() {
      try {
        const res = await fetch(COMPANIES_API);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json: ApiPayload = await res.json();
        const parsed = parseCompanies(json);

        if (!mounted) return;

        if (parsed.length === 0) {
          setCompanies(FALLBACK_COMPANIES);
          setStatus("No company data from API, using fallback logo list from DB.");
          setIsError(false);
          return;
        }

        setCompanies(parsed);
        setStatus("Loaded companies from backend API.");
        setIsError(false);
      } catch (error) {
        if (!mounted) return;
        setCompanies(FALLBACK_COMPANIES);
        setStatus(`API error, using fallback logo list from DB. ${(error as Error).message}`);
        setIsError(true);
      }
    }

    loadCompanies();
    return () => {
      mounted = false;
    };
  }, []);

  const logoNames = useMemo(() => companies.map((company) => company.logo).filter(Boolean), [companies]);

  return (
    <main className="page">
      <div className="hero">
        <h1>Jobhunter Frontend (React + Next.js)</h1>
        <p>
          Logo rule: backend DB logo is mapped to <code>/storage/company/&lt;logoFile&gt;</code>.
          Put image files with exact same names.
        </p>
        <p className={isError ? "status error" : "status"}>{status}</p>
      </div>

      <section className="panel">
        <h2>Logo file names in DB</h2>
        <ul>
          {logoNames.length > 0 ? (
            logoNames.map((logo) => (
              <li key={logo}>
                <code>{logo}</code>
              </li>
            ))
          ) : (
            <li>
              <code>(empty)</code>
            </li>
          )}
        </ul>
      </section>

      <section className="grid">
        {companies.map((company) => {
          const logoUrl = makeLogoUrl(company.logo);
          return (
            <article className="card" key={company.id}>
              <div className="logoWrap">
                {logoUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt={`${company.name} logo`}
                      onError={(event) => {
                        const image = event.currentTarget;
                        image.style.display = "none";
                        const fallback = image.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "grid";
                      }}
                    />
                    <div className="fallback" style={{ display: "none" }}>
                      {initials(company.name)}
                    </div>
                  </>
                ) : (
                  <div className="fallback">{initials(company.name)}</div>
                )}
              </div>

              <h3>{company.name}</h3>
              <p>
                DB logo: <code>{company.logo || "(empty)"}</code>
              </p>
              <p>
                Render URL: <code>{logoUrl || "(none)"}</code>
              </p>
            </article>
          );
        })}
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px 18px 40px;
          background: linear-gradient(145deg, #e8f6f4 0%, #f4f8ff 42%, #f9fbfe 100%);
          color: #12223a;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .hero {
          max-width: 1100px;
          margin: 0 auto 16px;
          padding: 20px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #e7edf5;
          box-shadow: 0 12px 28px rgba(16, 42, 73, 0.06);
        }

        h1 {
          margin: 0 0 8px;
          font-size: clamp(1.4rem, 2vw + 1rem, 2rem);
          line-height: 1.2;
        }

        h2 {
          margin: 0 0 8px;
          font-size: 1rem;
        }

        p {
          margin: 8px 0;
          color: #4f617b;
        }

        .status {
          font-weight: 600;
          color: #0f766e;
        }

        .status.error {
          color: #b42318;
        }

        .panel {
          max-width: 1100px;
          margin: 0 auto 18px;
          padding: 16px 20px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #e7edf5;
        }

        .panel ul {
          margin: 0;
          padding-left: 18px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 8px 14px;
        }

        code {
          font-family: Consolas, "Courier New", monospace;
          background: #edf2fb;
          border-radius: 6px;
          padding: 2px 6px;
          color: #0f2b50;
        }

        .grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }

        .card {
          border: 1px solid #e6edf6;
          border-radius: 14px;
          padding: 12px;
          background: #ffffff;
          box-shadow: 0 10px 20px rgba(18, 40, 69, 0.05);
        }

        .card h3 {
          margin: 10px 0 6px;
          font-size: 1rem;
          line-height: 1.35;
        }

        .card p {
          margin: 6px 0;
          font-size: 0.9rem;
        }

        .logoWrap {
          height: 120px;
          border: 1px solid #e5ebf4;
          border-radius: 10px;
          background: #f9fcff;
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .logoWrap img {
          max-width: 92%;
          max-height: 92%;
          object-fit: contain;
        }

        .fallback {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          background: #def4f1;
          color: #0f766e;
          display: grid;
          place-items: center;
          font-weight: 700;
        }
      `}</style>
    </main>
  );
}
