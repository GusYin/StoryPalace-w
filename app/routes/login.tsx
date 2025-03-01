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
    <div className="min-h-screen  bg-white">
      {/* Sticky Navigation Bar */}
      <UnauthHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-16 flex flex-col items-center mb-4">
        <div className="max-w-md w-full space-y-6">
          {/* Headings */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Login</h1>
            <p className="mt-2 text-xl text-blue-600">
              Welcome back to Story Palace!
            </p>
            <p className="mt-2 text-gray-600">
              Sign in to continue your adventure
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Continue"}
            </button>
          </form>
        </div>
      </main>

      <div className="text-center text-sm space-y-4">
        <p className="text-gray-600">
          Can't log in?{" "}
          <a
            href="/reset-password"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Reset your password
          </a>
        </p>
        <p className="text-gray-600">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
