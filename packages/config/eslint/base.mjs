export const baseIgnores = [
  "**/dist/**",
  "**/coverage/**",
  "**/node_modules/**",
  "**/.turbo/**"
];

export const baseTypeScriptRules = {
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports"
    }
  ],
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }
  ],
  "no-console": "off",
  "no-undef": "off"
};
