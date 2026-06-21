import { expect, type Page } from "@playwright/test";

import { seededUser } from "../fixtures";

type SignInUser = {
  email: string;
  password: string;
};

type MailSummary = {
  ID: string;
  Subject: string;
  To: Array<{ Address: string }>;
};

type MailList = {
  messages: MailSummary[];
};

type MailMessage = {
  Text: string;
};

const mailpitUrl = "http://127.0.0.1:54324";

export async function signInSeededUser(page: Page) {
  await signInUser(page, seededUser);
  await expect(page).toHaveURL(`/w/${seededUser.workspaceSlug}`);
}

export async function signInUser(page: Page, user: SignInUser) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function getMailLink(email: string, subject: RegExp) {
  let messageId = "";

  await expect
    .poll(
      async () => {
        const response = await fetch(`${mailpitUrl}/api/v1/messages`);
        const payload = (await response.json()) as MailList;
        const message = payload.messages.find(
          (candidate) =>
            candidate.To.some((recipient) => recipient.Address === email) &&
            subject.test(candidate.Subject),
        );
        messageId = message?.ID ?? "";
        return Boolean(messageId);
      },
      { timeout: 10_000 },
    )
    .toBe(true);

  const response = await fetch(`${mailpitUrl}/api/v1/message/${messageId}`);
  const message = (await response.json()) as MailMessage;
  const link = message.Text.match(/https?:\/\/[^\s)]+/)?.[0];

  if (!link) {
    throw new Error(`No link found in ${subject} email for ${email}`);
  }

  return link;
}
