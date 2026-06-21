import type { Metadata } from "next";

import { SignupPage } from "@/views/auth";

export const metadata: Metadata = { title: "Create account" };

type SignupRouteProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignupRoute({ searchParams }: SignupRouteProps) {
  const { next } = await searchParams;
  return <SignupPage next={next} />;
}
