import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions, useLogin } from "domains/auth/hooks";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
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
        "Login failed";
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(form);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-8">
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">Login</h2>
        <input
          className="w-full rounded-lg border p-3 dark:bg-navy-800 dark:text-white"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="w-full rounded-lg border p-3 dark:bg-navy-800 dark:text-white"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-lg bg-brand-500 p-3 text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}