"use client";

import { FormEvent, useState } from "react";
import { AuthShell } from "../_components/AuthShell";

type LoginErrors = { email?: string; password?: string };

export default function LoginPage() {
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const nextErrors: LoginErrors = {};

    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter your password.";

    setErrors(nextErrors);
    setMessage(Object.keys(nextErrors).length === 0
      ? "The login page is ready for API integration. No session was created and no information was sent."
      : "Please correct the highlighted fields.");
  }

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to your account" description="Continue to your reports and council updates.">
      <div className="auth-notice"><strong>UI preview</strong><span>Login is not connected to a backend yet.</span></div>
      <form className="auth-form" onSubmit={submitLogin} noValidate>
        <label htmlFor="login-email">Email address</label>
        <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "login-email-error" : undefined} />
        {errors.email && <p className="field-error" id="login-email-error">{errors.email}</p>}

        <div className="label-row"><label htmlFor="login-password">Password</label><button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div>
        <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "login-password-error" : undefined} />
        {errors.password && <p className="field-error" id="login-password-error">{errors.password}</p>}

        <label className="checkbox-row"><input name="remember" type="checkbox" /><span>Remember my email on this device when supported</span></label>
        <button className="button button-primary auth-submit" type="submit">Sign in <span aria-hidden="true">→</span></button>
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>
      <p className="auth-switch">New to Smart Community? <a href="/register">Create an account</a></p>
    </AuthShell>
  );
}
