import { useNavigate } from "react-router";
import { type User } from "firebase/auth";
import { StoryPalaceLogoBlack } from "./icons/story-palace-logo-black";
import { useEffect, useState } from "react";
import { auth } from "~/firebase/firebase";

const UnauthHeader = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const doGetStarted = () => {
    if (user) {
      if (user.emailVerified) navigate("/my-account");
      else navigate("/verify-email");
    }

    // If no user, we stay on this page.
  };

  const doLogin = () => {
    if (user) {
      if (user.emailVerified) navigate("/my-account");
      else navigate("/verify-email");
    } else navigate("/login");
  };

  return (
    <>
      {/* Sticky Navigation Bar */}
      <nav className="drop-shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] font-dosis text-lg font-semibold sticky h-[64px] top-0 bg-white drop-shadow-sm z-50 relative">
        {/* Left-aligned Logo */}
        <button
          className="cursor-pointer absolute top-1/2 -translate-y-1/2 left-4 sm:left-6 lg:left-8"
          onClick={() => navigate("/")}
        >
          {/* logo */}
          <span className="flex items-center">
            <StoryPalaceLogoBlack className="h-8" />{" "}
            <p className="hidden md:block ml-2 tracking-tight font-fraunces text-2xl font-semibold">
              Story Palace
            </p>
          </span>
        </button>

        {/* Right-aligned Auth Buttons */}
        <div className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 flex space-x-4 items-center">
          <button
            onClick={() => navigate("/library")}
            className="cursor-pointer hover:text-blue-600"
          >
            Library
          </button>
          <button
            onClick={doLogin}
            className="cursor-pointer hover:text-blue-600"
          >
            Login
          </button>
          <button
            type="button"
            onClick={doGetStarted}
            className="cursor-pointer text-white bg-custom-teal hover:bg-teal-700 focus:outline-hidden focus:ring-4 focus:ring-green-300 font-medium rounded-full px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            Get started
          </button>
        </div>
      </nav>
    </>
  );
};

export default UnauthHeader;
