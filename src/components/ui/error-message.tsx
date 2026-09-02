import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string | null;
}

function ErrorMessage({ className, message, ...props }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className
      )}
      {...props}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export { ErrorMessage };
