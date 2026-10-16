import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { PATHS } from './data/flow';

/** Front-matter shared by steps and troubleshooting cards. */
const schema = z.object({
  title: z.string(),
  order: z.number().int(),
  /** PATH values this entry is shown to. */
  paths: z.array(z.enum(PATHS)).min(1),
  officialLinks: z
    .array(z.object({ label: z.string(), url: z.url(), paths: z.array(z.enum(['SCEP', 'DIY', 'VENDOR'])).optional() }))
    .default([]),
});

export const collections = {
  steps: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/steps' }), schema }),
  troubleshooting: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/troubleshooting' }), schema }),
};
