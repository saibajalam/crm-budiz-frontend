import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "components/fields/InputField";
import { useAuthActions, useLogin } from "domains/auth/hooks";
import toast from "react-hot-toast";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { storeTokens } = useAuthActions();

  const loginMutation = useLogin({
    onSuccess: (data) => {
      storeTokens(data);
      toast.success("Logged in successfully");
      navigate("/admin/default");
    },
    onError: (err) => {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(message);
    },
  });

  const handleSignIn = (e) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-full max-w-[420px]">
        <h4 className="mb-6 text-3xl font-bold text-navy-700 dark:text-white">Login</h4>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn}>
          <InputField
            variant="auth"
            extra="mb-3"
            label="Email"
            placeholder="Enter email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <InputField
            variant="auth"
            extra="mb-4"
            label="Password"
            placeholder="Enter password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
