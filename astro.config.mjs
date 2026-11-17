// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Fase 1: publicado em https://birutarecords.github.io (repositório birutarecords/birutarecords.github.io).
// Quando o DNS do domínio apontar para o GitHub Pages, muda para 'https://birutamusic.com'.
export default defineConfig({
  site: 'https://birutarecords.github.io',
  integrations: [sitemap()],
  trailingSlash: 'ignore',
});
