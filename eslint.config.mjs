import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  { linterOptions: { reportUnusedDisableDirectives: "off" } },
  ...nextVitals,
  ...nextTs,
  // React Three Fiber is deliberately imperative inside useFrame: cameras,
  // shader uniforms and renderer properties must be mutated every frame.
  // The React Compiler immutability rule models ordinary React values and
  // reports those supported Three.js patterns as false positives.
  {
    files: ["src/components/sky-map/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // These effects hydrate local UI state or reset it when a feature is
  // disabled. They are bounded and do not form render loops.
  {
    files: [
      "src/components/panels/AIAstronoma.tsx",
      "src/components/panels/CelestialSearch.tsx",
      "src/components/panels/UpcomingConjunctions.tsx",
    ],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "tmp/**",
    "docs/dev-notes/tmp/**",
    "public/sw.js",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
