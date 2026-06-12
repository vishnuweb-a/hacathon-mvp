import { z } from "zod";

const severityEnum = z.enum(["low", "medium", "high", "critical"]);
const statusEnum = z.enum(["open", "investigating", "resolved"]);

export const createIncidentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters"),
  severity: severityEnum,
  source: z.string().optional(),
});

export const updateIncidentStatusSchema = z.object({
  status: statusEnum,
});

export type CreateIncidentSchema = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentStatusSchema = z.infer<typeof updateIncidentStatusSchema>;
