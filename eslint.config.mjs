import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {ignores: ["lib/vendor/**", "**/.*", "node_modules/**"]},
  {files: ["index.js", "lib/**/*.js", "benchmark/**/*.js"], languageOptions: {sourceType: "commonjs", globals: globals.node}},
  {files: ["test/**/*.js"], languageOptions: { globals: {...globals.node, ...globals.mocha, ...globals.chai} }},
  pluginJs.configs.recommended
];
