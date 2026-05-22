import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  tags: z.array(z.string()).optional(),
  action: z.enum(["draft", "publish", "archived"]).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
  action: z.enum(["draft", "publish", "archived"]).optional(),
});
