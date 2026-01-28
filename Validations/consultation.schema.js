import { z } from "zod";

export const consultationSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
        parentName: z.string().trim().optional(),
        email: z.string().trim().toLowerCase().email("Invalid email address").or(z.literal("")).optional(),
        phone: z.string().trim().optional(),
        date: z.string().trim().optional(),
        time: z.string().trim().optional(),
        message: z.string().trim().optional(),
        studentName: z.string().trim().optional(),
        subject: z.string().trim().optional(),
        type: z.string().trim().optional(),
    }).refine(data => data.name || data.parentName, {
        message: "Either name or parentName is required",
        path: ["name"]
    }),
});
