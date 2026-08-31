import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(500),
  description: z.string().optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  sortOrder: z.number().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().default("#3B82F6"),
  icon: z.string().optional(),
});

export const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().default("#10B981"),
  frequency: z.enum(["daily", "weekly", "custom"]).default("daily"),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  targetCount: z.number().min(1).default(1),
  reminderTime: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
