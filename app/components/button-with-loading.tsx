import type { ReactNode } from "react";

export default function ButtonWithLoading({
  isLoading,
  onClick,
  children,
  className = "",
  disabled = false,
}: {
  isLoading: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`cursor-pointer ${className}`}
    >
      {isLoading ? (
        <div className="flex justify-center items-center">
          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
            <path
              className="fill-current text-gray-600"
              d="M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8c0-4.336 3.663-8 8-8V2C6.579 2 2 6.58 2 12c0 5.421 4.579 10 10 10z"
            />
          </svg>
          Checking...
        </div>
      ) : (
        children
      )}
    </button>
  );
}
