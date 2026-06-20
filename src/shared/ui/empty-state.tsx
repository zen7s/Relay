import { FolderPlus } from "lucide-react";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";

type EmptyStateProps = React.ComponentProps<"div"> & {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
};

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = <FolderPlus className="size-5" />,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      <div className="mb-4 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionLabel ? (
        <Button className="mt-5" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
