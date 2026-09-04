# Obsidian graph — final

- Day selection is click-only; hover never changes the selected day.
- The graph shows 8 calendar nodes (today through today + 7 days), matching an inclusive weekly line.
- Selecting a day reveals all open root tasks touching that calendar date and the complete descendant tree.
- Subtasks connect only to their parent task, never directly to the date.
- Completed tasks are excluded from the graph.
- Subtasks are lightweight records: title + completion; the API strips priority, dates, recurrence, description and reminders from subtasks.
- Inbox displays root tasks only and renders subtasks underneath, preventing duplicate top-level rows.
- Nodes use priority colors; subtasks use violet; status is shown through the outline; node size is influenced by PageRank.
- Force-directed physics includes repulsion, links, damping, date spine attraction and a 3D-like radial highlight.
- Semantic clusters ignore the visual timeline spine.
- Obsidian export creates a ZIP vault containing Markdown task files and `.obsidian/app.json` / `.obsidian/graph.json`.
- Import accepts the generated ZIP or a Markdown file and restores task metadata and parent relationships where available.
