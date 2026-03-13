import { useEffect, useState } from "react";
import { getInitials, resolveCompanyLogo } from "../../utils/format";

interface CompanyLogoProps {
  name?: string | null;
  logo?: string | null;
  size?: "sm" | "md" | "lg";
  rounded?: "md" | "full";
  className?: string;
}

const sizeClassMap: Record<NonNullable<CompanyLogoProps["size"]>, string> = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16"
};

export default function CompanyLogo({
  name,
  logo,
  size = "md",
  rounded = "md",
  className = ""
}: CompanyLogoProps) {
  const [broken, setBroken] = useState(false);
  const src = resolveCompanyLogo(logo);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const roundedClass = rounded === "full" ? "rounded-full" : "rounded-lg";
  const rootSize = sizeClassMap[size];

  if (src && !broken) {
    return (
      <div className={`${rootSize} ${roundedClass} overflow-hidden border border-slate-200 bg-white ${className}`}>
        <img
          src={src}
          alt={name ?? "Logo công ty"}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${rootSize} ${roundedClass} grid place-items-center border border-rose-200 bg-gradient-to-br from-rose-100 to-rose-200 text-xs font-bold text-rose-800 ${className}`}
      aria-label="Logo mặc định"
    >
      {getInitials(name)}
    </div>
  );
}
