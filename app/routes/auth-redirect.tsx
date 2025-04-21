import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { auth } from "~/firebase/firebase";

// Allowed redirect paths for security
const ALLOWED_PATHS = [
  "/subscribe-plan/basic/monthly",
  "/subscribe-plan/basic/yearly",
  "/subscribe-plan/premium/monthly",
  "/subscribe-plan/premium/yearly",
];

export default function AuthRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await user.reload();

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
    <div>
      <ToastContainer position="bottom-right" />
      Loading...
    </div>
  );
}
