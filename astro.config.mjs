import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Pure Static SSG - Bebas dideploy ke hosting sendiri (Nginx/Apache/cPanel/VPS/dll)
export default defineConfig({
  output: 'static',
  site: 'https://lawuvista.com',
  trailingSlash: 'always',
  integrations: [tailwind({ applyBaseStyles: false })]
});
