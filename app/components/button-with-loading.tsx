import type { ReactNode } from "react";
import Spinner from "./spinner";

export default function ButtonWithLoading({
  isLoading,
  onClick,
  children,
  className = "",
  disabled = false,
  description = "Checking...", // Default value set here
}: {
  isLoading: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  description?: string; // Corrected prop name
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`cursor-pointer ${className}`}
    >
      {isLoading ? (
        <div className="flex justify-center items-center">
          <Spinner className="mr-3" /> {description}{" "}
        </div>
      ) : (
        children
      )}
    </button>
  );
}
