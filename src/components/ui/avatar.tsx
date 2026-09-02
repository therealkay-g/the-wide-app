import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-xl",
};

export function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  className,
}: AvatarProps) {
  const initials =
    (firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "");
  const displayInitials = initials.toUpperCase() || "?";

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName ?? ""} ${lastName ?? ""}`}
        className={cn(
          "rounded-full object-cover ring-2 ring-white dark:ring-gray-900",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-[#0B6E4F] text-white font-semibold ring-2 ring-white dark:ring-gray-900",
        sizeClasses[size],
        className
      )}
    >
      {displayInitials}
    </div>
  );
}
