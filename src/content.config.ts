import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const releases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/releases' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      artists: z.array(reference('artists')).min(1),
      artist_line: z.string(),
      date: z.coerce.date(),
      format: z.enum(['Single', 'EP', 'Álbum', 'Ao vivo', 'Compilação']),
      catalog: z.string().optional().default(''),
      cover: image(),
      bandcamp_url: z.string().optional().default(''),
      bandcamp_id: z.coerce.number().optional(),
      bandcamp_type: z.enum(['album', 'track']).optional(),
      tracks: z.array(z.object({ title: z.string(), duration: z.string().optional().default('') })).default([]),
      credits: z.string().optional().default(''),
      draft: z.boolean().optional().default(false),
    }),
});

const artists = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artists' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      roster: z.boolean().default(false),
      photo: z.union([image(), z.literal('')]).optional(),
      links: z
        .object({
          instagram: z.string().optional().default(''),
          spotify: z.string().optional().default(''),
          website: z.string().optional().default(''),
        })
        .optional()
        .default({ instagram: '', spotify: '', website: '' }),
    }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      time: z.string().optional().default(''),
      venue: z.string(),
      city: z.string().default('Porto'),
      artists: z.array(reference('artists')).default([]),
      tickets: z.string().optional().default(''),
      poster: z.union([image(), z.literal('')]).optional(),
      draft: z.boolean().optional().default(false),
    }),
});

export const collections = { releases, artists, events };
