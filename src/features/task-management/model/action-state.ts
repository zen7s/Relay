export type TaskActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
  labelIds?: string[];
};

export const initialTaskActionState: TaskActionState = {
  status: "idle",
};
