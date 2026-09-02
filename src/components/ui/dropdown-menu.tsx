"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DropdownMenuItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items?: DropdownMenuItem[];
  children?: React.ReactNode;
}

function DropdownMenu({ trigger, items, children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDetailsElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (ref.current.open) {
          ref.current.open = false;
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <details ref={ref} className="relative" onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {trigger}
      </summary>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {items?.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick?.();
                setOpen(false);
                if (ref.current) ref.current.open = false;
              }}
              disabled={item.disabled}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                item.destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              {item.icon && <span className="h-4 w-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
          {children}
        </div>
      )}
    </details>
  );
}

export { DropdownMenu };
