import { z } from "zod";

export const contactSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, "Name must be at least 2 characters"),
        email: z.string().trim().toLowerCase().email("Invalid email address"),
        phone: z.string().trim().optional(),
        message: z.string().trim().min(5, "Message must be at least 5 characters"),
        subject: z.string().trim().optional(),
    }),
});
