"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import {
  Authenticated,
  ConvexReactClient,
  Unauthenticated,
  ConvexProvider
} from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(convexUrl);

import { Toaster } from "@workspace/ui/components/sonner";


import { ConvexAuthProvider } from "@convex-dev/auth/react";

import { SymbolRegistryProvider } from "./components/providers/SymbolRegistryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexAuthProvider client={convex}>
        <NuqsAdapter>
          <SymbolRegistryProvider>
            {children}
          </SymbolRegistryProvider>
          <Toaster />
        </NuqsAdapter>
      </ConvexAuthProvider>
    </NextThemesProvider>
  );
}

