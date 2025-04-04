import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import UnauthHeader from "~/components/header-unauth";
import { auth, verifyEmail } from "~/firebase/firebase";

const VerifyEmailPage = () => {
  const [isResending, setResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    !auth.currentUser && navigate("/login");

    auth.currentUser?.emailVerified && navigate("/my-account");
  }, []);

  async function resendVerifyEmail(e: FormEvent) {
    e.preventDefault();
    setResending(true);

    try {
      await verifyEmail();
    } catch (err) {
      console.error(err);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <UnauthHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-16 flex flex-col items-center">
        <div className="max-w-md w-full space-y-24">
          {/* Headings */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Email Verification
            </h1>
            <p className="mt-2 text-xl">Thank you for signing up!</p>
            <p className="text-left mt-2 text-gray-600">
              We've sent a verification email to you. <br />
              Please check your inbox and click on the link in the email to
              verify your account.
            </p>
          </div>

          <div className="max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Didn't receive the email?
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Check your spam or junk folder.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Make sure you entered the correct email address.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Still having trouble?{" "}
                  <button
                    disabled={isResending}
                    onClick={resendVerifyEmail}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isResending ? "Resending..." : "Resend Verification Email"}
                  </button>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmailPage;
