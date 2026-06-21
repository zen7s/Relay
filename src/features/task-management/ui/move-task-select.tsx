import { ArrowRight } from "lucide-react";

import type { ProjectBoardColumn } from "@/entities/project";
import { Button, NativeSelect } from "@/shared/ui";

import { moveTaskAction } from "../api/actions";

type MoveTaskSelectProps = {
  context: {
    workspaceId: string;
    workspaceSlug: string;
    projectId: string;
  };
  task: {
    id: string;
    title: string;
    columnId: string;
  };
  columns: ProjectBoardColumn[];
};

export function MoveTaskSelect({
  context,
  task,
  columns,
}: MoveTaskSelectProps) {
  return (
    <form action={moveTaskAction} className="min-w-0 flex-1">
      <input type="hidden" name="workspaceId" value={context.workspaceId} />
      <input type="hidden" name="workspaceSlug" value={context.workspaceSlug} />
      <input type="hidden" name="projectId" value={context.projectId} />
      <input type="hidden" name="taskId" value={task.id} />
      <NativeSelect
        name="columnId"
        defaultValue={task.columnId}
        aria-label={`Move ${task.title} to`}
        className="h-8 text-xs"
      >
        {columns.map((column) => (
          <option key={column.id} value={column.id}>
            {column.name}
          </option>
        ))}
      </NativeSelect>
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        className="mt-1 h-7 w-full text-xs"
        aria-label={`Move ${task.title}`}
      >
        <ArrowRight />
        Move
      </Button>
    </form>
  );
}
