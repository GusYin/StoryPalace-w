import type { ReactNode } from "react";
import { redirect } from "react-router";
import { useAuth } from "~/firebase/auth-context";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return redirect("/home");
  }

  return <>{children}</>;
}
