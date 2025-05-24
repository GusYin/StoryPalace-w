const Spinner = ({ className }: React.SVGProps<SVGSVGElement>) => (
  <div
    className={`animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full ${className}`}
  ></div>
);
export default Spinner;
