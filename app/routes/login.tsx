import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import UnauthHeader from "~/components/unauth-header";
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

      if (user.user.emailVerified) navigate("/my-account");
      else navigate("/verify-email");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

          <form className="" onSubmit={handleSubmit}>
            <div className="text-black mt-12 rounded-md shadow-sm space-y-4">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-dosis font-medium text-xl placeholder-black bg-[#F3F7F7] mt-1 appearance-none block w-full px-3 py-2 border border-[#829793] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                className="font-dosis font-medium text-xl placeholder-black bg-[#F3F7F7] mt-1 appearance-none block w-full px-3 py-2 border border-[#829793] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {error && (
              <p className="mt-4 text-red-600 text-xl text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="font-dosis font-xl bg-black mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </main>

      <div className="mt-7 font-dosis font-xl text-center text-black space-y-4">
        <p className="">
          Forgot password?{" "}
          <a
            href="/reset-password"
            className="underline font-medium text-[#06846F] hover:text-blue-500"
          >
            Reset password
          </a>
        </p>
        <p className="">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="underline font-medium text-[#06846F] hover:text-blue-500"
          >
            Create account
          </a>
        </p>
      </div>
    </div>
  );
}
