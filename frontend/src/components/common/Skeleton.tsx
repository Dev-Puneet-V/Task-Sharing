import React from "react";

interface SkeletonProps {
  height?: string;
  width?: string;
  className?: string;
  variant?: "rectangular" | "circular" | "text";
  animation?: "pulse" | "wave" | "none";
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  height = "1.2em",
  width = "100%",
  className = "",
  variant = "rectangular",
  animation = "pulse",
  count = 1,
}) => {
  const baseClasses = "bg-gray-200 relative overflow-hidden";
  const variantClasses = {
    rectangular: "rounded",
    circular: "rounded-full",
    text: "rounded h-4",
  };
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
    none: "",
  };

  const items = Array(count).fill(0);

  return (
    <div className="space-y-2">
      {items.map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
          style={{ height, width }}
        />
      ))}
    </div>
  );
};

export default Skeleton;
