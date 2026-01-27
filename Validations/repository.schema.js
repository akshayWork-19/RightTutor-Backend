import { z } from "zod";

export const repositorySchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, "Repository name is required"),
        url: z.string().trim().url("Invalid repository URL").optional().or(z.literal("")),
        description: z.string().trim().optional(),
        tags: z.array(z.string().trim()).optional(),
    }),
});
