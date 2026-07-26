import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["packages/costlens/dist/**", "examples/**"],
  },
];

export default eslintConfig;
