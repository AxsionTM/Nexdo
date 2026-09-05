# Commit report — TaskFlow 2026-09-05

## Commit
`feat: enhance task details, inbox filtering and calendar navigation`

## Obsidian graph update
- Task-node single click now opens the full task details side panel.
- Date-node click keeps its existing behavior: select the day and expand the date hierarchy.
- Existing Obsidian hierarchy remains date → root task → direct/descendant subtasks, without direct date-to-subtask edges.
- Existing force-directed physics, PageRank sizing, clusters, priority colors, subtask colors, .md/.obsidian export and vault import are preserved.

## Task details
- Added a persistent “Полная информация” summary at the top of the side panel.
- Shows start date/time, end date/time, project, subtask completion progress and current status.
- Shows parent task for a subtask when available.
- API detail response now includes parent task, recent comments and deeper nested subtask levels.

## Inbox
- Inbox remains a root-task list; subtasks are nested under their parent and are not duplicated as separate rows.
- Tasks whose deadline ended on a previous calendar day are excluded from Inbox.
- Tasks due today or later remain visible.
- Inbox tasks are grouped by explicit scheduled date (`DD.MM.YYYY`) in the same style as the weekly dated list.

## Calendar
- Removed the “День” mode from the calendar toolbar.
- Calendar now offers only “Месяц” and “Неделя”.
- Month/week navigation remains intact.

## Validation
- Source-level changes were reviewed for hook/order and TypeScript syntax regressions.
- Full dependency-backed TypeScript build could not be completed in the isolated build environment because npm dependency installation timed out; the project archive itself contains source/package-lock files and no generated node_modules.
