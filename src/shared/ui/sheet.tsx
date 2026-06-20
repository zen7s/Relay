"use client";

import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { cn } from "@/shared/lib";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
      <SheetPrimitive.Content
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(21rem,88vw)] flex-col border-r bg-background shadow-2xl outline-none data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-4 right-4 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none">
          <X className="size-4" />
          <span className="sr-only">Close navigation</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
};
