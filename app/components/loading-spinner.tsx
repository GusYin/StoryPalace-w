interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text = "Loading...",
  color = "text-blue-600",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className={`animate-spin rounded-full border-solid ${color} ${sizeClasses[size]}`}
        style={{ borderTopColor: "transparent" }}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && <span className={`${color} font-medium`}>{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
