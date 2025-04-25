interface LoadingSpinnerProps {
  loading: boolean;
}

const FullScreenLoadingSpinnerTeal: React.FC<LoadingSpinnerProps> = ({
  loading = true,
}) => {
  return (
    <>
      {loading ? (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[.7px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-teal"></div>
        </div>
      ) : null}
    </>
  );
};

export default FullScreenLoadingSpinnerTeal;
