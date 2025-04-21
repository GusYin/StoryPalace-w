import { useState, type FormEvent } from "react";
import UnauthHeader from "~/components/header-unauth";
import { sendPasswordResetLinkToEmail } from "~/firebase/firebase";

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await sendPasswordResetLinkToEmail(email);
    } catch (err) {
      setError("Sorry there has been an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <UnauthHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-16 flex flex-col items-center">
        <div className="max-w-md w-full space-y-6">
          {/* Headings */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Reset your password
            </h1>
            <p className="mt-2 font-dosis font-medium">
              Please enter the email address associated with your account
            </p>
          </div>

          {/* Sign Up Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  className="font-dosis font-medium text-xl placeholder-black bg-[#F3F7F7] mt-1 appearance-none block w-full px-3 py-2 border border-[#829793] rounded-xl shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="font-dosis font-xl bg-black mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-xs font-bold text-white hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? "Sending reset link..." : "Request reset link"}
            </button>

            <div className="text-black text-center font-dosis font-xl">
              Back to login?{" "}
              <a
                href="/login"
                className="underline font-medium text-[#06846F] hover:text-blue-500"
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

export default ResetPasswordPage;
