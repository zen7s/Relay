export type InvitationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export const initialInvitationActionState: InvitationActionState = {
  status: "idle",
};
