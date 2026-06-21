import "server-only";

import nodemailer from "nodemailer";
import { Resend } from "resend";

import { publicEnvironment } from "@/shared/config/env";
import { serverEnvironment } from "@/shared/config/server-env";

type InvitationEmail = {
  to: string;
  workspaceName: string;
  inviterName: string;
  token: string;
};

export async function sendWorkspaceInvitationEmail({
  to,
  workspaceName,
  inviterName,
  token,
}: InvitationEmail) {
  const inviteUrl = new URL(
    `/invite/${encodeURIComponent(token)}`,
    publicEnvironment.NEXT_PUBLIC_SITE_URL,
  ).toString();
  const safeWorkspaceName = workspaceName.replace(/[\r\n]+/g, " ");
  const subject = `Join ${safeWorkspaceName} in Relay`;
  const text = [
    `${inviterName} invited you to join ${workspaceName} in Relay.`,
    "",
    `Accept invitation: ${inviteUrl}`,
    "",
    "This one-time invitation expires in 7 days.",
  ].join("\n");

  if (serverEnvironment.RESEND_API_KEY) {
    const resend = new Resend(serverEnvironment.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: serverEnvironment.INVITATION_FROM_EMAIL,
      to,
      subject,
      text,
    });

    if (error) throw new Error(error.message);
    return;
  }

  const transport = nodemailer.createTransport(
    serverEnvironment.MAILPIT_SMTP_URL,
  );
  await transport.sendMail({
    from: serverEnvironment.INVITATION_FROM_EMAIL,
    to,
    subject,
    text,
  });
}
