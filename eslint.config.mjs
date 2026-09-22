import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // These two replace the entire document rather than rendering inside the app shell --
  // they ship their own <html>/<body> because Next.js requires it of global-error and of a
  // root not-found. There is no router or next-intl context that high up the tree, which is
  // why both deliberately use a plain <a> (see the comment at the top of each file). The
  // rule's premise -- client-side navigation within the app -- does not hold here, and it
  // reports the single <a> in each file once per route it scans, which is where 28 of the
  // repo's 38 lint errors came from.
  {
    files: ["app/global-error.tsx", "app/not-found.tsx"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },

  // scripts/ is offline CommonJS tooling run with plain `node` -- data loaders, chart
  // renderers, seeders. Nothing under app/, components/, lib/ or remotion/ imports from it,
  // so `require` there is correct rather than legacy.
  {
    files: ["scripts/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },

  // custom-worker.ts imports ./.open-next/worker.js, which only exists after a build. That
  // makes the suppression genuinely conditional: @ts-expect-error would itself error once
  // the file is present, which is the opposite failure. Keep @ts-ignore, but require it to
  // carry a reason so a bare suppression still fails.
  {
    files: ["custom-worker.ts"],
    rules: {
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-ignore": "allow-with-description" }],
    },
  },
]);

export default eslintConfig;
