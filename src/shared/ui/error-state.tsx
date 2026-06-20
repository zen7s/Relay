import { TriangleAlert } from "lucide-react";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";

type ErrorStateProps = React.ComponentProps<"div"> & {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

function ErrorState({
  title = "Something went wrong",
  description = "We could not load this content. Please try again.",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      <div className="mb-4 grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button className="mt-5" size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
