import { useEffect, type ReactNode } from "react";
import { Outlet, useNavigate } from "react-router";
import { auth } from "~/firebase/firebase";

type AdminRouteProps = {
  children: ReactNode;
};

export default function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      await user.reload();

      if (!user.emailVerified) {
        navigate("/verify-email");
        return;
      }

      const idToken = await user.getIdTokenResult();
      const claims = idToken.claims;
      if (!claims.admin) {
        navigate("/");
        return;
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Outlet />
      {children}
    </>
  );
}
