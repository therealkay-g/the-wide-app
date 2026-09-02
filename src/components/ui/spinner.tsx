import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 24, ...props }, ref) => (
    <div ref={ref} role="status" className={cn("flex items-center justify-center", className)} {...props}>
      <Loader2 className="animate-spin text-muted-foreground" size={size} />
      <span className="sr-only">Loading...</span>
    </div>
  )
);
Spinner.displayName = "Spinner";

export { Spinner };
