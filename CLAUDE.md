# Claude Code Development Guidelines

## Pre-Pull Request Requirements

Before creating any pull request, you MUST run the following commands and ensure they pass:

```bash
# Install dependencies
yarn install

# Run linting and type checking
yarn lint

# Run tests
yarn test
```

## Available Commands

- `yarn lint` - Runs both biome linting and TypeScript type checking
- `yarn lint:biome` - Runs biome formatting and linting checks
- `yarn lint:type-check` - Runs TypeScript type checking for both electron and src
- `yarn lint:fix` - Automatically fixes biome issues and runs type checking
- `yarn test` - Runs vitest tests
- `yarn test:web` - Runs web-specific tests
- `yarn test:electron` - Runs electron-specific tests

## Development Workflow

1. Make your changes
2. Run `yarn lint:fix` to automatically fix formatting issues
3. Run `yarn lint` to ensure no remaining issues
4. Run `yarn test` to ensure tests pass
5. Only then create/update pull requests

## Linting Configuration

- Uses Biome for formatting and linting
- TypeScript strict checking enabled
- Pre-commit hooks run `yarn lint` automatically
- Configuration in `biome.json`

## Important Notes

- This project uses Yarn 4 as the package manager
- Node.js 20 is required
- TypeScript decorators are enabled for Sequelize models
- All changes must pass CI checks before merging