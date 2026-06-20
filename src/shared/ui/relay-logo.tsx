import { cn } from "@/shared/lib";

type RelayLogoProps = React.ComponentProps<"div"> & {
  compact?: boolean;
};

function RelayLogo({ compact = false, className, ...props }: RelayLogoProps) {
  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Relay"
      {...props}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-[0.65rem] bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20">
        R
      </span>
      {compact ? null : (
        <span className="text-base font-semibold tracking-tight">Relay</span>
      )}
    </div>
  );
}

export { RelayLogo };
