"use client";

import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image
              src="/logo.png"
              alt="{{APP_NAME}}"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold text-primary">{{APP_NAME}}</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Sign in
          </Link>
          <a
            href="{{GITHUB_REPO}}"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
