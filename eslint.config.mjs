import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.config({
    extends: ["next/core-web-vitals"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "import/no-anonymous-default-export": "off",
    },
  }),
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
];

