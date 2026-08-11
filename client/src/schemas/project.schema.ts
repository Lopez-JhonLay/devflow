import * as z from 'zod';
import { parseTags } from '@/utils/tags';

const tagsSchema = z
  .string()
  .refine((value) => parseTags(value).length <= 10, 'A project can have up to 10 tags.')
  .refine((value) => parseTags(value).every((tag) => tag.length <= 32), 'Tags cannot exceed 32 characters.');

export const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(100, 'Project name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  repositoryUrl: z.string().url('Enter a valid repository URL').or(z.literal('')).optional(),
  liveUrl: z.string().url('Enter a valid live URL').or(z.literal('')).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']),
  tags: tagsSchema.optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
