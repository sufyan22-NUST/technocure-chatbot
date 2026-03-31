/**
 * components/ui/Spinner.tsx
 * Accessible, Tailwind-animated loading spinner.
 * Accepts an optional `size` prop (defaults to "md").
 */

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "w-3 h-3 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-7 h-7 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-gray-300 border-t-blue-600 animate-spin ${SIZE_MAP[size]} ${className}`}
    />
  );
}
