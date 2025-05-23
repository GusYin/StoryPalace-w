import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import SkeletonHeader from "~/components/header-skeleton";
import Spinner from "~/components/spinner";
import { auth } from "~/firebase/firebase";

// Allowed redirect paths for security
const ALLOWED_PATHS = [
  "/order-summary/basic/monthly",
  "/order-summary/basic/yearly",
  "/order-summary/premium/monthly",
  "/order-summary/premium/yearly",
];

export default function AuthRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Validate and parse redirect path
        const redirectPath = decodeURIComponent(
          searchParams.get("redirect") || "/"
        );

        // Security check
        if (ALLOWED_PATHS.includes(redirectPath)) {
          navigate(redirectPath);
        } else {
          navigate("/"); // Fallback for invalid paths
          toast.error("Invalid subscription path");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-white">
      <SkeletonHeader />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[.7px] flex items-center justify-center">
        <Spinner />{" "}
      </div>
    </div>
  );
}
