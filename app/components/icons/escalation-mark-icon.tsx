export const EscalationMarkIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    className={`${className}`}
    width="83"
    height="83"
    viewBox="0 0 83 83"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Circle background */}
    <path
      d="M41.5 75.9167C60.1625 75.9167 75.4167 60.6625 75.4167 41.5C75.4167 22.3375 60.1625 7.08333 41.5 7.08333C22.8375 7.08333 7.58333 22.3375 7.58333 41.5C7.58333 60.6625 22.8375 75.9167 41.5 75.9167Z"
      fill="#B3261E"
    />
    {/* White exclamation mark */}
    <path
      d="M41.5 52.2917C39.675 52.2917 38.2083 53.7583 38.2083 55.5833C38.2083 57.4083 39.675 58.875 41.5 58.875C43.325 58.875 44.7917 57.4083 44.7917 55.5833C44.7917 53.7583 43.325 52.2917 41.5 52.2917ZM44.7917 44.7917H38.2083V24.125H44.7917V44.7917Z"
      fill="white"
    />
  </svg>
);
