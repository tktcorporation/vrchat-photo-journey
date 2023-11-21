module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:react/recommended",
		"plugin:@typescript-eslint/recommended",
		"airbnb",
		"plugin:prettier/recommended",
		"prettier",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: "module",
	},
	plugins: ["react", "@typescript-eslint", "prettier"],
	rules: {
		// Prettier
		"prettier/prettier": "error",
		// Typescript
		"no-use-before-define": "off",
		"import/prefer-default-export": "off",
		"@typescript-eslint/no-use-before-define": ["error"],
		"@typescript-eslint/no-unused-vars": "warn",
		"@typescript-eslint/no-explicit-any": "warn",
		"@typescript-eslint/no-var-requires": "warn",
		"react/prop-types": "off",
		// react
		"react/require-default-props": 0,
		"react/button-has-type": 0,
		"react/no-children-prop": 0,
		"react/jsx-props-no-spreading": 0,
		"react/function-component-definition": [
			"warn",
			{
				namedComponents: "function-declaration",
				unnamedComponents: "function-expression",
			},
		],
		"react/jsx-filename-extension": [
			2,
			{
				extensions: [".js", ".jsx", ".ts", ".tsx"],
			},
		],
		"no-restricted-syntax": [
			"error",
			"ForInStatement",
			"LabeledStatement",
			"WithStatement",
		],
		// Import
		"import/extensions": 0,
		"no-restricted-imports": [
			"error",
			{
				paths: [
					{
						name: "fs",
						message:
							"Please don't use fs module directly. Use fs/promises instead.",
					},
				],
			},
		],
	},
	overrides: [
		{
			files: ["electron/lib/wrappedFs.ts"],
			rules: {
				"no-restricted-imports": "off",
			},
		},
		{
			files: ["electron/**/error.ts"],
			rules: {
				"max-classes-per-file": "off",
			},
		},
	],
	settings: {
		"import/resolver": {
			node: {
				extensions: [".js", ".jsx", ".ts", ".tsx"],
			},
			typescript: {},
		},
		"import/core-modules": ["electron", "electron-is-dev"],
	},
	ignorePatterns: ["node_modules/", "dist/", "main/", "src/out/"],
};
