import Image from "next/image";
import Link from "next/link";

interface AppLogoProps {
  compact?: boolean;
  href?: string;
  inverted?: boolean;
}

export function AppLogo({
  compact = false,
  href = "/dashboard",
  inverted = false,
}: AppLogoProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 rounded-[var(--radius-md)]"
      aria-label="FitPulse home"
    >
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-white shadow-sm">
        <Image src="/assets/logo.png" alt="" width={23} height={23} className="object-contain" />
      </span>
      {!compact && (
        <span className={`text-lg font-bold tracking-[-0.03em] ${inverted ? "text-white" : "text-[var(--foreground)]"}`}>
          Fit<span className={inverted ? "text-[var(--lime-green)]" : "text-[var(--primary-600)]"}>Pulse</span>
        </span>
      )}
    </Link>
  );
}
