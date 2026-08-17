// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: replace with the real production domain before launch.
  // @astrojs/sitemap needs an absolute `site` to emit valid URLs.
  site: 'https://openroad.example.org',

  // /og-card is an asset source for scripts/make-assets.mjs and /explore is a
  // temporary design comparison. Neither is a page of the site.
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/og-card') && !page.includes('/explore') && !page.includes('/review'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
