# Tasks and Kanban

## Board workflow

`/w/[slug]/p/[projectId]/board` renders the five project columns as a horizontally scrollable Kanban board on smaller screens and a five-column grid on wide screens. Stage 7 deliberately uses a keyboard-operable move selector instead of drag and drop; DnD and Realtime synchronization are stage 8 work.

Each task supports:

- title and description;
- column and stable numeric position;
- no, low, medium, high, or urgent priority;
- an optional workspace-member assignee;
- an optional due date;
- zero or more project labels;
- archive and restore without hard deletion.

The workspace dashboard derives its project and task metrics from live Supabase data.

## Filters and URLs

Board filters remain in the URL and can be shared or refreshed:

- `q` searches task title and description;
- `assignee` accepts a membership ID or `unassigned`;
- `priority` accepts a task priority;
- `label` accepts a project-label ID;
- `archived=1` opens the archived-task view.

## Permissions

- Owner, Admin, and Member can create, edit, move, archive, and restore tasks in active projects.
- Owner and Admin can create and delete project labels.
- Archived projects are read-only until an Owner or Admin restores the project.
- RLS and RPC authorization enforce workspace isolation independently of rendered controls.

## Transactional operations

The application uses PostgreSQL RPCs rather than multi-request client mutations:

- `create_task` validates related records, appends a stable position, and assigns labels atomically;
- `update_task` validates and replaces task fields and labels atomically;
- `move_task` locks the task and target column before assigning the next gapped position;
- `set_task_archived` archives a task or restores it at a collision-free position.

Positions use gaps of 1,024. Stage 8 will add fine-grained ordering and normalization for DnD while retaining the move selector as the accessible fallback.

## Verification

```bash
pnpm db:verify
pnpm check
pnpm test:e2e
pnpm build
```

The database suite covers field validation, relationship integrity, archive behavior, stable movement, active-project requirements, and Owner/Admin/Member/outsider/anonymous permissions. The browser suite covers full task creation and editing, filters, movement, archive/restore, Member behavior, and the 320 px layout.
