"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Mail, Lock, UserPlus, ShieldAlert, User, Eye, EyeOff } from "lucide-react";
import { ONBOARDING_META_KEY } from "@/config/onboarding-content";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { brand } from "@/config/brand.config";
import { webhooks } from "@/config/webhooks.config";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            full_name: name,
            [ONBOARDING_META_KEY]: false,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
      } else {
        if (webhooks.signup) {
          const firstName = name.trim().split(/\s+/)[0];
          fetch(webhooks.signup, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, email }),
          }).catch(() => {});
        }

        if (data.session) {
          window.location.href = "/onboarding";
        } else {
          window.location.href = "/login";
        }
      }
    } catch {
      setError("An unexpected system error occurred.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle={brand.signupTagline}>
      <form onSubmit={handleSignup} className="flex flex-col gap-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[var(--mcv-danger)]/10 border border-[var(--mcv-danger)]/20 p-4 rounded-sm flex items-center gap-3 text-error text-[15px]"
          >
            <ShieldAlert size={18} />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="signup-name" className="auth-field-label">Full Name</label>
          <div className="relative group">
            <User size={18} className="auth-field-icon absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              id="signup-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="input-base w-full pl-12"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="signup-email" className="auth-field-label">Email</label>
          <div className="relative group">
            <Mail className="auth-field-icon absolute left-4 top-1/2 -translate-y-1/2" size={18} />
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-base w-full pl-12"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="signup-password" className="auth-field-label">Password</label>
          <div className="relative group">
            <Lock className="auth-field-icon absolute left-4 top-1/2 -translate-y-1/2" size={18} />
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="input-base w-full pl-12 pr-12"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="auth-field-icon absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer hover:text-brass-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          <span className="flex items-center justify-center gap-2">
            {loading ? "Creating account..." : (
              <>
                Sign Up
                <UserPlus size={18} />
              </>
            )}
          </span>
        </button>
      </form>

      <div className="flex flex-col items-center gap-2 auth-divider pt-5">
        <p className="text-ink-3 text-[13px]">Already have an account?</p>
        <Link href="/login" className="auth-link brand-font text-[15px]">
          Log In
        </Link>
      </div>
    </AuthLayout>
  );
}
