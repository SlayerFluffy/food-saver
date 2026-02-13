import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/',
  publicDir: 'public',
  envDir: '../', // Look for .env in project root

  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        search: resolve(__dirname, 'src/search/index.html'),
        planner: resolve(__dirname, 'src/planner/index.html'),
        pantry: resolve(__dirname, 'src/pantry/index.html'),
        cookbook: resolve(__dirname, 'src/cookbook/index.html'),
        account: resolve(__dirname, 'src/account/index.html'),
        shoppinglist: resolve(__dirname, 'src/shopping-list/index.html')
      },
    },
  },
});
