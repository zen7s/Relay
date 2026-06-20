"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/shared/ui";

export function CreateProjectButton(props: ButtonProps) {
  return (
    <Button
      onClick={() =>
        toast.info("Project creation will be connected in the next stage")
      }
      {...props}
    >
      <Plus className="size-4" />
      New project
    </Button>
  );
}
