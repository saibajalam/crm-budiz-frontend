import { useState } from "react";
import { loginUser } from "./api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async () => {
    try {
      const data = await loginUser(form);

      localStorage.setItem("access", data.access);
      localStorage.setItem("workspace_id", data.workspace_id);

      window.location.href = "/admin/dashboard";
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  return (
    <div>
      <input
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button onClick={handleSubmit}>Login</button>
    </div>
  );
}