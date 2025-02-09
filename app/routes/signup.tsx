import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { StoryPalaceLogo } from "~/components/icons/story-palace-logo";
import { createUserWithEmailAndPw } from "~/firebase/firebase";

const SignUpPage = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await createUserWithEmailAndPw(email, password);

      if (user.user.emailVerified) {
        navigate("/dashboard");
      } else {
        navigate("/verify-email");
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation Bar */}
      <nav className="sticky h-[64px] top-0 bg-white shadow-sm z-50 relative">
        {/* Logo positioned absolutely */}
        <div className="absolute top-[15px] bottom-[14px]">
          <StoryPalaceLogo />
        </div>

        {/* Navigation buttons container */}
        <div className="container mx-auto px-4 pt-[15px] pb-[14px] flex justify-end items-center">
          <div className="flex space-x-4">
            <button className="hover:text-blue-600">Cart</button>
            <button className="hover:text-blue-600">Login</button>
            <button
              type="button"
              className="text-white bg-custom-teal hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-16 flex flex-col items-center">
        <div className="max-w-md w-full space-y-6">
          {/* Headings */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Create an Account
            </h1>
            <p className="mt-2 text-xl text-blue-600">
              Welcome to Story Palace
            </p>
            <p className="mt-2 text-gray-600">
              Create your account to start your adventure
            </p>
          </div>

          {/* Sign Up Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              <div>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? "Creating an account..." : "Create Account"}
            </button>

            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Login
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;
