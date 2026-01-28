import { z } from "zod";

export const manualMatchSchema = z.object({
    body: z.object({
        id: z.string().optional(),
        parentName: z.string().trim().min(1, "Parent name is required").optional(),
        phoneNumber: z.string().trim().optional(),
        phone: z.string().trim().optional(), // Fallback
        subject: z.string().trim().optional(),
        gradeLevel: z.string().trim().optional(),
        status: z.string().trim().optional().default("Pending"),
        dateAdded: z.string().trim().optional(),
        notes: z.string().trim().optional(),
    }),
});
