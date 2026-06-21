# Projects and boards

## Routes

- `/w/[slug]/projects` lists active projects and exposes the archived-project view through `?archived=1`.
- `/w/[slug]/p/[projectId]/board` opens a directly addressable project board.

Both routes resolve the workspace from the authenticated user's memberships. PostgreSQL RLS independently restricts project and board-column access to members of that workspace.

## Lifecycle and permissions

- Owner and Admin can create, edit, archive, and restore projects.
- Member can read project lists and boards, but management controls are not rendered and database policies reject mutations.
- Projects are archived instead of deleted. Archived boards remain readable and their project details are read-only until restored.
- Project keys contain 2–10 uppercase letters or numbers, start with a letter, and are unique inside a workspace.

## Atomic board creation

`create_project` validates the authenticated manager and creates the project plus these ordered columns in one transaction:

1. Backlog
2. To do
3. In progress
4. Review
5. Done

Positions use gaps of 1,000 so later task-ordering work can insert stable values without renumbering the workflow.

## Verification

```bash
pnpm db:verify
pnpm check
pnpm test:e2e
pnpm build
```

The SQL suite covers atomic creation, input validation, default ordering, duplicate keys, and Owner/Admin/Member/outsider behavior. The browser suite covers the complete create, edit, archive, restore, responsive-board, and read-only Member flow.
