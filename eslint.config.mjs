import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      "**/android/**",
      "**/ios/**",
      "**/dist-android/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/.virtus-backups/**",
      "**/.local-untracked-hold/**",
      "**/*.backup.js",
      "**/*.before-*.js"
    ],
  },
  ...nextVitals,
];

export default config;
