import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    targetKeyword: z.string().optional(),
    kind: z.enum(['pillar', 'cluster']),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('henshubu'),
    draft: z.boolean().default(false),
    order: z.number().default(99),
    // FAQ は本文にも表示しつつ、FAQPage 構造化データにも使う(可視Q&Aのみ)。
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .optional(),
  }),
});

export const collections = { posts };
