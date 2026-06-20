import type { Metadata } from "next";

import { LoginPage } from "@/views/auth";

export const metadata: Metadata = { title: "Sign in" };

type LoginRouteProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginRoute({ searchParams }: LoginRouteProps) {
  const { next, error } = await searchParams;
  return <LoginPage next={next} error={error} />;
}
