import { useState, useEffect } from "react";
import AuthHeader from "./auth-header";
import UnauthHeader from "./unauth-header";
import { auth } from "~/firebase/firebase";
import SkeletonHeader from "./skeleton-header";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(user?.emailVerified === true);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <SkeletonHeader />;
  }

  return isLoggedIn ? <AuthHeader /> : <UnauthHeader />;
};

export default Header;
