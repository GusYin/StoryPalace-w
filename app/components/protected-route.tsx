import { useEffect, type ReactNode } from "react";
import { Outlet, useNavigate } from "react-router";
import { auth } from "~/firebase/firebase";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user || !user.emailVerified) {
        navigate("/");
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
