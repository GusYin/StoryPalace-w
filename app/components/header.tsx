import { useState, useEffect } from "react";
import AuthHeader from "./auth-header";
import UnauthHeader from "./unauth-header";
import { auth } from "~/firebase/firebase";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!user || !user.emailVerified);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return isLoggedIn ? <AuthHeader /> : <UnauthHeader />;
};

export default Header;
