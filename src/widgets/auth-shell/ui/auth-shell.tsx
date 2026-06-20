import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import { ThemeSwitcher } from "@/features/theme-switcher";
import { RelayLogo } from "@/shared/ui";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const benefits = [
  "One workspace for projects, tasks, and decisions",
  "Clear ownership without process overhead",
  "Built for focused product and creative teams",
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(30rem,0.82fr)]">
      <section className="relative hidden overflow-hidden border-r bg-sidebar p-10 lg:flex lg:flex-col xl:p-14">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_25%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_65%)]"
        />
        <RelayLogo className="relative" />

        <div className="relative my-auto max-w-xl py-16">
          <p className="text-sm font-medium text-primary">Move work forward</p>
          <h2 className="mt-4 text-4xl leading-tight font-semibold tracking-tight text-balance xl:text-5xl">
            The calm place where focused teams get aligned.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Relay keeps the plan, the work, and the handoff visible—without
            turning collaboration into another full-time job.
          </p>
          <ul className="mt-9 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="size-[1.1rem] text-primary" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-muted-foreground">
          Designed for teams that value momentum
          <ArrowUpRight className="size-3.5" />
        </p>
      </section>

      <section className="relative flex min-h-dvh items-center justify-center px-5 py-20 sm:px-8">
        <div className="absolute top-5 left-5 lg:hidden">
          <RelayLogo />
        </div>
        <div className="absolute top-4 right-4">
          <ThemeSwitcher />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-7">
            <p className="text-sm font-medium text-primary">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          {children}

          {footer ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
