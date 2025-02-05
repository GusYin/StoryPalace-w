import { useEffect, type ReactNode } from "react";
import { Outlet, redirect } from "react-router";
import { AuthProvider } from "~/firebase/auth-context";
import { auth } from "~/firebase/firebase";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        redirect("/home");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <Outlet />
      {children}
    </AuthProvider>
  );
}
