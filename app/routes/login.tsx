import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import UnauthHeader from "~/components/header-unauth";
import { signInWithEmailAndPw } from "~/firebase/firebase";

export default function Login() {
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
      const user = await signInWithEmailAndPw(email, password);

      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get("redirect");

      if (user.user.emailVerified) {
        redirect
          ? navigate(`/auth-redirect?redirect=${encodeURIComponent(redirect)}`)
          : navigate("/my-account");
      } else {
        navigate(
          `/verify-email${
            redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""
          }`
        );
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function doSignup(): void {
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get("redirect");

    navigate(
      `/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation Bar */}
      <UnauthHeader />

      {/* Main Content */}
      <main className="text-black container mx-auto px-4 mt-[60px] flex flex-col items-center mb-4">
        <div className="max-w-md w-full space-y-6">
          {/* Headings */}
          <div className="text-center">
            <h1 className="font-fraunces text-4xl font-semibold">Login</h1>
            <p className="font-dosis font-medium text-3xl mt-[60px]">
              Welcome back to Story Palace!
            </p>
            <p className="mt-5 font-dosis font-medium">
              Sign in to continue your adventure
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mt-12 space-y-4">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-dosis font-medium text-xl placeholder-black bg-[#F3F7F7] mt-1 appearance-none block w-full px-3 py-2 border border-[#829793] rounded-xl shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-dosis font-medium text-xl placeholder-black bg-[#F3F7F7] mt-1 appearance-none block w-full px-3 py-2 border border-[#829793] rounded-xl shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {error && (
              <p className="mt-4 text-red-600 text-xl text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer font-dosis font-xl bg-black mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-xs font-bold text-white hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </main>

      <div className="mt-7 font-dosis font-xl text-center text-black space-y-4">
        <p>
          Forgot password?{" "}
          <a
            href="/reset-password"
            className="cursor-pointer underline font-medium text-[#06846F] hover:text-blue-500"
          >
            Reset password
          </a>
        </p>
        <p>
          Don't have an account?{" "}
          <a
            onClick={doSignup}
            className="cursor-pointer underline font-medium text-[#06846F] hover:text-blue-500"
          >
            Create account
          </a>
        </p>
      </div>
    </div>
  );
}
