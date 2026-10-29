"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { brand } from "@/config/brand.config";
import { socialProof } from "@/config/social-proof.config";

function nextAfterLogin(): string {
  const raw = new URLSearchParams(window.location.search).get("next") ?? "";
  if (!raw.startsWith("/access/") || raw.startsWith("//") || raw.includes("\\")) return "/dashboard";
  return raw;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push(nextAfterLogin());
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      } else if (data.user) {
        window.location.href = nextAfterLogin();
      } else {
        setLoading(false);
      }
    } catch {
      setError("An unexpected system error occurred.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle={brand.authTagline}>
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
          <label htmlFor="login-email" className="auth-field-label">
            Email
          </label>
          <div className="relative group">
            <Mail className="auth-field-icon absolute left-4 top-1/2 -translate-y-1/2" size={18} />
            <input
              id="login-email"
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
          <label htmlFor="login-password" className="auth-field-label">
            Password
          </label>
          <div className="relative group">
            <Lock className="auth-field-icon absolute left-4 top-1/2 -translate-y-1/2" size={18} />
            <input
              id="login-password"
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

        <div className="flex justify-end -mt-1">
          <Link href="/forgot-password" className="auth-link">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          <span className="flex items-center justify-center gap-2">
            {loading ? "Authorizing..." : (
              <>
                Log In
                <LogIn size={18} />
              </>
            )}
          </span>
        </button>
      </form>

      <div className="flex flex-col items-center gap-2 auth-divider pt-5">
        <p className="text-ink-3 text-[13px]">New here?</p>
        <Link href="/signup" className="auth-link brand-font text-[15px]">
          Sign Up
        </Link>
      </div>

      {socialProof.enabled && socialProof.loginPage.activeMembers > 0 && (
        <p className="text-center text-[13px] text-ink-5">
          <span className="text-[var(--mcv-success)]">{socialProof.loginPage.activeMembers}</span> members active now
        </p>
      )}
    </AuthLayout>
  );
}
