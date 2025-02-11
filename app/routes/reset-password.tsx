import { useState, type FormEvent } from "react";
import { StoryPalaceLogo } from "~/components/icons/story-palace-logo";
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
      {/* Sticky Navigation Bar */}
      <nav className="sticky h-[64px] top-0 bg-white shadow-sm z-50 relative">
        {/* Left-aligned Logo */}
        <div className="absolute top-1/2 -translate-y-1/2">
          <StoryPalaceLogo />
        </div>

        {/* Centered Navigation Buttons */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-4">
          <button className="hover:text-blue-600">Library</button>
          <button className="hover:text-blue-600">Story Player</button>
        </div>

        {/* Right-aligned Auth Buttons */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex space-x-4 items-center">
          <button className="hover:text-blue-600">Login</button>
          <button
            type="button"
            className="text-white bg-custom-teal hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            Get started
          </button>
        </div>
      </nav>

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
