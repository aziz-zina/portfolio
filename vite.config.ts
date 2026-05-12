/// <reference types="vitest" />

import analog, { PrerenderContentFile } from "@analogjs/platform";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    root: __dirname,
    cacheDir: "./node_modules/.vite",
    build: {
      // outDir: './dist/./client',
      reportCompressedSize: true,
      target: ["es2020"],
    },
    plugins: [
      analog({
        ssr: true,
        static: false,
        content: {
          highlighter: "shiki",
          shikiOptions: {
            highlight: {
              theme: "github-dark",
            },
            highlighter: {
              langs: [
                "json",
                "ts",
                "tsx",
                "js",
                "jsx",
                "html",
                "css",
                "angular-html",
                "angular-ts",
                "bash",
                "shell",
                "text",
                "python",
              ],
              themes: ["github-dark", "github-light"],
            },
          },
        },
        prerender: {
          routes: [
            "/",
            "/blog",
            "/projects",
            {
              contentDir: "src/content",
              transform: (file: PrerenderContentFile) => {
                // do not include files marked as draft in frontmatter
                if (file.attributes["draft"]) {
                  return false;
                }
                // use the slug from frontmatter if defined, otherwise use the files basename
                const slug = file.attributes["slug"] || file.name;
                return `/blog/${slug}`;
              },
            },
            {
              contentDir: "src/content/projects",
              transform: (file: PrerenderContentFile) => {
                if (file.attributes["draft"]) {
                  return false;
                }
                const slug = file.attributes["slug"] || file.name;
                return `/projects/${slug}`;
              },
            },
          ],
        },
      }),
      tailwindcss(),
      viteTsConfigPaths(),
    ],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["src/test-setup.ts"],
      include: ["**/*.spec.ts"],
      reporters: ["default"],
    },
    define: {
      "import.meta.vitest": mode !== "production",
    },
  };
});
