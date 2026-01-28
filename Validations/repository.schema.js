import { z } from "zod";

export const repositorySchema = z.object({
    body: z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1, "Repository name is required"),
        url: z.string().trim().url("Invalid repository URL").optional().or(z.literal("")),
        category: z.string().trim().optional(),
        assignedTo: z.string().trim().optional(),
        lastSync: z.string().trim().optional(),
        createdAt: z.string().trim().optional(),
    }),
});
