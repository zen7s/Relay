export type ProjectActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export const initialProjectActionState: ProjectActionState = {
  status: "idle",
};
