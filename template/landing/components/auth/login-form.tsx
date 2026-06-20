"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthCard, AuthField, AuthLink } from "@/components/auth/auth-card";
import { useLogin } from "@/hooks/api/use-auth";
import { type LoginInput, loginSchema } from "@/lib/auth-validation";

const MAIN_APP_URL =
  process.env.NEXT_PUBLIC_MAIN_APP_URL || "{{MAIN_APP_URL}}";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo =
    searchParams.get("redirect") || `${MAIN_APP_URL}/dashboard`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const {
    trigger: login,
    isLoading,
    error,
  } = useLogin({
    onSuccess: () => {
      window.location.href = redirectTo;
    },
  });

  return (
    <AuthCard
      title="Sign in"
      description="Enter your credentials to access the app"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <AuthLink
            href={`/signup${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          >
            Create one
          </AuthLink>
        </>
      }
    >
      <form
        onSubmit={handleSubmit((data) => login(data))}
        className="space-y-4"
      >
        <AuthField
          id="email"
          label="Email"
          type="email"
          error={errors.email?.message}
          registration={register("email")}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          error={errors.password?.message}
          registration={register("password")}
        />

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
