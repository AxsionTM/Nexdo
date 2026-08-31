export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "NONE" | "LOW" | "MEDIUM" | "HIGH";
export type ProjectMemberRole = "OWNER" | "EDITOR" | "VIEWER";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  startDate?: string | null;
  completedAt?: string | null;
  isAllDay: boolean;
  sortOrder: number;
  isArchived: boolean;
  isDeleted: boolean;
  parentId?: string | null;
  projectId?: string | null;
  sectionId?: string | null;
  creatorId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  children?: Task[];
  tags?: { id: string; name: string; color: string }[];
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  isChecked: boolean;
  sortOrder: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  isInbox: boolean;
  isArchived: boolean;
  sortOrder: number;
}

export interface Habit {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  frequency: string;
  daysOfWeek: number[];
  targetCount: number;
  isArchived: boolean;
}
