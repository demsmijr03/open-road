// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // The Vercel deployment URL. This is the live production domain until a
  // custom one is bought, and it has to be a real address rather than a
  // placeholder: it is what every canonical tag, every og:url and the whole
  // sitemap are built from, so a wrong value here points search engines at a
  // domain that does not exist. Change it again the day a custom domain is
  // pointed at this project, and redeploy.
  site: 'https://open-road-foundation.vercel.app',

  // /og-card is an asset source for scripts/make-assets.mjs, not a page of the
  // site. The /explore and /review temporary pages have been removed, so their
  // filters went with them.
  //
  // /thanks is a form destination, not a page anyone should reach from a search
  // result: landing there cold reads as a confirmation of something you never
  // sent. It is noindex in the page itself, and this keeps it out of the
  // sitemap too, since submitting a URL for indexing and then asking not to
  // index it is a contradiction crawlers report as an error.
  integrations: [
    sitemap({ filter: (page) => !page.includes('/og-card') && !page.includes('/thanks') }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
