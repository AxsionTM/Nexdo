# TaskFlow update — 2026-09-05

## User-facing changes
- Task graph: clicking a task node now opens its details in the right-side panel; clicking a date node continues to expand that day.
- Task details: enriched the side panel with a persistent summary of start/end date and time, project, subtask progress, and parent task when applicable.
- Task details: API now returns parent task, recent comments, and deeper subtask levels for richer inspection.
- Inbox: overdue tasks from previous calendar days are excluded; active tasks due today or later remain visible.
- Inbox: tasks are grouped by their scheduled date, matching the dated presentation used by the weekly list.
- Calendar: removed the inconvenient Day mode; only Month and Week remain.

## Obsidian
- Existing force-directed/PageRank/cluster graph remains intact.
- Date → root task → direct subtask hierarchy is preserved; subtasks do not connect directly to dates.
- Task node click now directly opens the selected task details instead of requiring a double click.
