# TaskFlow — Obsidian & scheduling fixes

## Major changes

- Reworked the Obsidian graph so selecting a date immediately reveals root tasks and the complete subtask hierarchy.
- Date nodes connect only to root tasks; subtasks connect only to their direct parent, preserving a clean tree.
- Subtasks now have a dedicated violet visual identity and smaller graph nodes.
- Improved graph force simulation and parent/subtask spacing so hierarchy stays readable.
- Changed the no-priority color to dark emerald instead of gray.
- Fixed subtask completion in the task details panel: clicking the checkbox completes the subtask instead of opening it; delete appears on hover.
- Added a global AI priority action for all open tasks scheduled for today.
- Replaced the native overlap alert with a proper conflict panel showing conflicting task title, description and time, with Cancel / Confirm time actions.
- Added collision-aware agenda columns so overlapping tasks share horizontal space instead of covering one another.
- Preserved exact minute positioning in the agenda and added subtle 15-minute grid markers.
- Kept the weekly date grouping and existing multi-day/overnight scheduling behavior.

## Validation

- Web TypeScript check: passed (`tsc --noEmit`).
- API TypeScript check: passed (`tsc --noEmit`).

A production Next.js build could not be executed in the isolated build environment because the archived dependencies do not contain the Linux SWC binary and the environment has no npm registry network access. The source/type checks for the changed web and API code pass.
