import { z } from "zod";

export const createPostmortemSchema = z.object({
  root_cause: z
    .string()
    .min(1, "Root cause is required")
    .min(10, "Root cause must be at least 10 characters"),
  resolution: z
    .string()
    .min(1, "Resolution is required")
    .min(10, "Resolution must be at least 10 characters"),
  lessons_learned: z
    .string()
    .min(1, "Lessons learned is required")
    .min(10, "Lessons learned must be at least 10 characters"),
  resolution_time_minutes: z
    .number()
    .int()
    .nonnegative("Resolution time must be a non-negative integer"),
});

export type CreatePostmortemSchema = z.infer<typeof createPostmortemSchema>;
