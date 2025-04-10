import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import UnauthHeader from "~/components/header-unauth";
import { createUserWithEmailAndPw } from "~/firebase/firebase";

const SignUpPage = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState({
    userName: false,
    email: false,
    password: false,
  });
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Reset invalid fields
    setInvalidFields({
      userName: !userName.trim(),
      email: !email.trim(),
      password: !password.trim(),
    });

    // Check if any fields are invalid
    const hasErrors = Object.values(invalidFields).some(Boolean);

    if (!userName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const user = await createUserWithEmailAndPw(email, password, userName);

      if (user.user.emailVerified) {
        navigate("/my-account");
      } else {
        navigate("/verify-email");
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle input changes and remove invalid state
  const handleInputChange =
    (field: keyof typeof invalidFields) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInvalidFields((prev) => ({ ...prev, [field]: false }));
      switch (field) {
        case "userName":
          setUserName(e.target.value);
          break;
        case "email":
          setEmail(e.target.value);
          break;
        case "password":
          setPassword(e.target.value);
          break;
      }
    };

  return (
    <div className="min-h-screen bg-white">
      <UnauthHeader />

      {/* Main Content */}
      <main className="mt-[60px] text-black container mx-auto px-4 flex flex-col items-center">
        <div className="max-w-md w-full space-y-6">
          {/* Headings */}
          <div className=" text-center">
            <h1 className="font-fraunces text-4xl font-semibold">
              Create an Account
            </h1>
            <p className="font-dosis font-medium text-3xl mt-[50px]">
              Welcome to Story Palace
            </p>
            <p className="mt-5 font-dosis font-medium">
              Create your account to start your adventure
            </p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mt-12 space-y-4">
              <input
                type="text"
                required
                className={`font-dosis font-medium text-xl placeholder-black
                 bg-[#F3F7F7] mt-1 block w-full rounded-xl border px-5 py-3 
                 focus:outline-hidden focus:ring-2 ${
                   invalidFields.userName
                     ? "border-red-500 ring-red-500"
                     : "border-[#829793] focus:ring-blue-500"
                 }`}
                placeholder="Your name"
                onChange={handleInputChange("userName")}
              />

              <input
                type="email"
                required
                className={`font-dosis font-medium text-xl placeholder-black bg-[#F3F7F7] mt-1 block w-full rounded-xl border px-5 py-3 focus:outline-hidden focus:ring-2 ${
                  invalidFields.email
                    ? "border-red-500 ring-red-500"
                    : "border-[#829793] focus:ring-blue-500"
                }`}
                placeholder="Email address"
                onChange={handleInputChange("email")}
              />

              <input
                type="password"
                required
                className={`font-dosis font-medium text-xl placeholder-black bg-[#F3F7F7] mt-1 block w-full rounded-xl border px-5 py-3 focus:outline-hidden focus:ring-2 ${
                  invalidFields.password
                    ? "border-red-500 ring-red-500"
                    : "border-[#829793] focus:ring-blue-500"
                }`}
                placeholder="Password"
                onChange={handleInputChange("password")}
              />
            </div>

            {error && (
              <p className="mt-4 text-red-600 text-xl text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="font-dosis font-xl bg-black mt-6 w-full text-white py-2 px-4 rounded-full hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? "Creating an account..." : "Create account"}
            </button>

            <div className="mt-11 text-center text-sm text-black font-dosis font-xl space-y-4">
              Already have an account?{" "}
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

export default SignUpPage;
