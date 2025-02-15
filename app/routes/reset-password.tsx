import { useState, type FormEvent } from "react";
import { StoryPalaceLogo } from "~/components/icons/story-palace-logo";
import UnauthHeader from "~/components/unauth-header";
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
            <p className="mt-2 text-gray-600">
              Please enter the email address associated with your account
            </p>
          </div>

          {/* Sign Up Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? "Sending reset link..." : "Request reset link"}
            </button>

            <div className="text-center text-sm text-gray-500">
              Back to login?{" "}
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

export default ResetPasswordPage;
