type SkeletonBoxProps = {
  className?: string;
};

export function SkeletonBox({ className = "" }: SkeletonBoxProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gray-200 ${className}`}
      aria-hidden="true"
    />
  );
}