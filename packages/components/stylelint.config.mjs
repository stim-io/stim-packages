export default {
  customSyntax: "postcss-scss",
  extends: ["stylelint-config-standard-scss"],
  plugins: ["stylelint-scss"],
  rules: {
    "at-rule-disallowed-list": ["import"],
    "max-nesting-depth": 2,
    "selector-class-pattern": [
      "^stim-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$",
      {
        message:
          "Use stable stim-* BEM-like class names: block, block__element, or block--modifier.",
      },
    ],
    "selector-max-id": 0,
    "selector-max-specificity": "0,4,0",
  },
};
