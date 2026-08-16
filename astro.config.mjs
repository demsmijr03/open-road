// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: replace with the real production domain before launch.
  // @astrojs/sitemap needs an absolute `site` to emit valid URLs.
  site: 'https://openroad.example.org',

  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
