// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: replace with the real production domain before launch.
  // @astrojs/sitemap needs an absolute `site` to emit valid URLs.
  site: 'https://openroad.example.org',

  // /og-card is an asset source for scripts/make-assets.mjs, not a page.
  integrations: [sitemap({ filter: (page) => !page.includes('/og-card') })],

  vite: {
    plugins: [tailwindcss()],
  },
});
