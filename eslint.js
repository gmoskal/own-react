module.exports = {
	env: {
		node: true
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:import/errors",
		"plugin:import/typescript",
		"prettier"
	],
	plugins: ["import", "@typescript-eslint"],
	parserOptions: {
		project: ["./tsconfig.json"]
	},
	settings: {
		"import/parsers": {
			"@typescript-eslint/parser": [".ts"]
		},
		"import/resolver": {
			node: {
				extensions: [".js", ".ts"],
				moduleDirectory: ["node_modules", "src/"]
			},
			typescript: {
				alwaysTryTypes: true,
				project: "."
			}
		}
	},
	rules: {
		"no-restricted-globals": [
			"error",
			{
				name: "event",
				message: "Use local parameter instead."
			},
			{
				name: "name",
				message: "Greg said: Never use global `name`"
			}
		],
		"import/prefer-default-export": ["off"],
		"no-shadow": "off",
		"@typescript-eslint/no-shadow": ["error"]
	},
	overrides: [
		{
			files: ["**/__tests__/**/*.[jt]s", "**/?(*.)+(spec|test).[jt]s"],
			rules: {
				"import/no-extraneous-dependencies": ["off", { devDependencies: ["**/?(*.)+(spec|test).[jt]s"] }]
			}
		}
	],
	ignorePatterns: ["**/*.js", "node_modules", ".turbo", "dist", "coverage", "vite.config.ts", "setupTests.ts"],
	    parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json"
    }
}
