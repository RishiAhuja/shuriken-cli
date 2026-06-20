"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthCard, AuthField, AuthLink } from "@/components/auth/auth-card";
import { useRegister } from "@/hooks/api/use-auth";
import { type RegisterInput, registerSchema } from "@/lib/auth-validation";

const MAIN_APP_URL =
  process.env.NEXT_PUBLIC_MAIN_APP_URL || "{{MAIN_APP_URL}}";

export function SignupForm() {
  const searchParams = useSearchParams();
  const redirectTo =
    searchParams.get("redirect") || `${MAIN_APP_URL}/dashboard`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const {
    trigger: registerUser,
    isLoading,
    error,
  } = useRegister({
    onSuccess: () => {
      window.location.href = redirectTo;
    },
  });

  return (
    <AuthCard
      title="Create an account"
      description="Get started with your new account"
      footer={
        <>
          Already have an account?{" "}
          <AuthLink
            href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          >
            Sign in
          </AuthLink>
        </>
      }
    >
      <form
        onSubmit={handleSubmit((data) => registerUser(data))}
        className="space-y-4"
      >
        <AuthField
          id="name"
          label="Name"
          error={errors.name?.message}
          registration={register("name")}
        />
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
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
