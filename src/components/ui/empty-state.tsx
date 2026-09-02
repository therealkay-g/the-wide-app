import * as React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({ className, icon, title, description, action, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12 text-center", className)}
      {...props}
    >
      <div className="mb-4 text-muted-foreground">
        {icon ?? <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export { EmptyState };
