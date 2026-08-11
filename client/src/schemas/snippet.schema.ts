import * as z from 'zod';
import { parseTags } from '@/utils/tags';

const tagsSchema = z
  .string()
  .refine((value) => parseTags(value).length <= 10, 'A snippet can have up to 10 tags.')
  .refine((value) => parseTags(value).every((tag) => tag.length <= 32), 'Tags cannot exceed 32 characters.');

export const snippetFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().max(300, 'Description cannot exceed 300 characters').optional(),
  language: z.string().trim().min(1, 'Language is required').max(50, 'Language cannot exceed 50 characters'),
  code: z
    .string()
    .refine((value) => value.trim().length > 0, 'Code is required')
    .refine((value) => value.length <= 100000, 'Code cannot exceed 100,000 characters'),
  tags: tagsSchema.optional(),
});

export type SnippetFormValues = z.infer<typeof snippetFormSchema>;
