import { z } from "zod";

export const consultationSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, "Name must be at least 2 characters"),
        email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
        phone: z.string().trim().optional(),
        date: z.string().trim().optional(),
        time: z.string().trim().optional(),
        message: z.string().trim().optional(),
        studentName: z.string().trim().optional(),
        subject: z.string().trim().optional(),
        type: z.string().trim().optional(),
    }),
});
