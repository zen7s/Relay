export type WorkspaceActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export const initialWorkspaceActionState: WorkspaceActionState = {
  status: "idle",
};
