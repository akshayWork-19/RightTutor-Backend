import { z } from "zod";

export const manualMatchSchema = z.object({
    body: z.object({
        studentId: z.string().trim().optional(),
        tutorId: z.string().trim().optional(),
        subject: z.string().trim().min(1, "Subject is required"),
        status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
        notes: z.string().trim().optional(),
    }),
});
