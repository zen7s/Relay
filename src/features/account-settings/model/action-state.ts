export type AccountSettingsActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export const initialAccountSettingsActionState: AccountSettingsActionState = {
  status: "idle",
};
