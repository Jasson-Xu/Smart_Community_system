"use client";

import { FormEvent, useState } from "react";
import { AuthShell } from "../_components/AuthShell";

type RegistrationErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  consent?: string;
};

export default function RegisterPage() {
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const consent = form.get("consent");
    const nextErrors: RegistrationErrors = {};

    if (name.length < 2) nextErrors.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email address.";
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      nextErrors.password = "Use at least 8 characters with upper-case, lower-case, and a number.";
    }
    if (confirmPassword !== password) nextErrors.confirmPassword = "Passwords do not match.";
    if (!consent) nextErrors.consent = "Confirm that you have read the privacy information.";

    setErrors(nextErrors);
    setMessage(Object.keys(nextErrors).length === 0
      ? "The registration page is ready for API integration. No account was created and no information was saved."
      : "Please correct the highlighted fields.");
  }

  return (
    <AuthShell eyebrow="Resident registration" title="Create your account" description="Set up one place to submit issues and follow their progress.">
      <div className="auth-notice"><strong>UI preview</strong><span>Registration is not connected to a database yet.</span></div>
      <form className="auth-form" onSubmit={submitRegistration} noValidate>
        <label htmlFor="register-name">Full name</label>
        <input id="register-name" name="name" autoComplete="name" placeholder="Your full name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "register-name-error" : undefined} />
        {errors.name && <p className="field-error" id="register-name-error">{errors.name}</p>}

        <label htmlFor="register-email">Email address</label>
        <input id="register-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "register-email-error" : undefined} />
        {errors.email && <p className="field-error" id="register-email-error">{errors.email}</p>}

        <div className="label-row"><label htmlFor="register-password">Password</label><button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div>
        <input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a strong password" aria-invalid={Boolean(errors.password)} aria-describedby="password-guidance" />
        <p className={errors.password ? "field-error" : "field-help"} id="password-guidance">{errors.password ?? "At least 8 characters, including upper-case, lower-case, and a number."}</p>

        <label htmlFor="register-confirm-password">Confirm password</label>
        <input id="register-confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "register-confirm-error" : undefined} />
        {errors.confirmPassword && <p className="field-error" id="register-confirm-error">{errors.confirmPassword}</p>}

        <label className="checkbox-row"><input name="consent" type="checkbox" aria-invalid={Boolean(errors.consent)} /><span>I have read the <a href="/privacy">privacy information</a> and understand this is a prototype.</span></label>
        {errors.consent && <p className="field-error">{errors.consent}</p>}

        <button className="button button-primary auth-submit" type="submit">Create account <span aria-hidden="true">→</span></button>
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>
      <p className="auth-switch">Already have an account? <a href="/login">Sign in</a></p>
    </AuthShell>
  );
}
