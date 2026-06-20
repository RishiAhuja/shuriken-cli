import Link from "next/link";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
        <div className="text-center text-sm text-muted-foreground">
          {footer}
        </div>
      </div>
    </div>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  error?: string;
  registration: React.InputHTMLAttributes<HTMLInputElement>;
}

export function AuthField({
  id,
  label,
  type = "text",
  error,
  registration,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        {...registration}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

interface AuthLinkProps {
  href: string;
  children: ReactNode;
}

export function AuthLink({ href, children }: AuthLinkProps) {
  return (
    <Link href={href} className="font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}
