import { z } from "zod";

export const contactSchema = z.object({
    body: z.object({
        id: z.string().optional(),
        name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
        parentName: z.string().trim().optional(),
        email: z.string().trim().toLowerCase().email("Invalid email address").or(z.literal("")).optional(),
        phone: z.string().trim().optional(),
        message: z.string().trim().optional(),
        subject: z.string().trim().optional(),
        status: z.string().optional(),
        date: z.string().optional(),
    }).refine(data => data.name || data.parentName || data.email, {
        message: "Identification (Name or Email) is required",
        path: ["name"]
    }),
});
