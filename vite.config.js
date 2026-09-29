import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/knyhy/",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        background: resolve(__dirname, "background.html"),
        index: resolve(__dirname, "index.html"),
        menu: resolve(__dirname, "menu.html"),
        reader: resolve(__dirname, "reader.html"),
      },
    },
  },
});
