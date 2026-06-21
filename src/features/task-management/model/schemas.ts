import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);

const optionalDate = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.iso.date().optional(),
);

export const taskPrioritySchema = z.enum([
  "no_priority",
  "low",
  "medium",
  "high",
  "urgent",
]);

const taskFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a task title.")
    .max(240, "Use no more than 240 characters."),
  description: z
    .string()
    .trim()
    .max(50000, "Use no more than 50,000 characters."),
  assigneeId: optionalUuid,
  priority: taskPrioritySchema,
  dueDate: optionalDate,
  labelIds: z.array(z.uuid()).max(20).default([]),
});

export const taskContextSchema = z.object({
  workspaceId: z.uuid(),
  workspaceSlug: z.string().min(2).max(48),
  projectId: z.uuid(),
});

export const createTaskSchema = taskContextSchema.extend({
  ...taskFieldsSchema.shape,
  columnId: z.uuid(),
});

export const updateTaskSchema = taskContextSchema.extend({
  ...taskFieldsSchema.shape,
  taskId: z.uuid(),
});

export const moveTaskSchema = taskContextSchema.extend({
  taskId: z.uuid(),
  columnId: z.uuid(),
});

export const archiveTaskSchema = taskContextSchema.extend({
  taskId: z.uuid(),
  archived: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const createLabelSchema = taskContextSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, "Enter a label name.")
    .max(50, "Use no more than 50 characters."),
  color: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.string().regex(/^#[0-9A-F]{6}$/, "Choose a valid label color.")),
});

export const deleteLabelSchema = taskContextSchema.extend({
  labelId: z.uuid(),
});
