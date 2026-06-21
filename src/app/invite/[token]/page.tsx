import type { Metadata } from "next";

import { getCurrentUser } from "@/entities/user";
import { getInvitationPreview } from "@/entities/workspace";
import { InvitationPage } from "@/views/invitation";

export const metadata: Metadata = { title: "Workspace invitation" };

type InvitationRouteProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function InvitationRoute({
  params,
  searchParams,
}: InvitationRouteProps) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const [invitation, user] = await Promise.all([
    getInvitationPreview(token),
    getCurrentUser(),
  ]);

  return (
    <InvitationPage
      token={token}
      invitation={invitation}
      user={user}
      accountError={query.error === "account"}
    />
  );
}
