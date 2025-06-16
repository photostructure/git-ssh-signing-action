# Contributing to SSH Signing Action

Thank you for your interest in contributing to SSH Signing Action! This project welcomes contributions and is open to collaboration.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm ci`
3. Make your changes
4. Run tests: `npm test`
5. Ensure linting passes: `npm run lint`
6. Build the action: `npm run package`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the project's coding standards
3. Add tests for any new functionality
4. Ensure all tests pass and the action builds successfully
5. Submit a pull request with a clear description of the changes

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
NODE_OPTIONS=--experimental-vm-modules NODE_NO_WARNINGS=1 npx jest --watch

# Run a specific test file
NODE_OPTIONS=--experimental-vm-modules NODE_NO_WARNINGS=1 npx jest __tests__/specific.test.ts
```

## Code Style

This project uses Prettier for code formatting and ESLint for linting. Run `npm run fmt` to format code and `npm run lint` to check for issues.

## Reporting Issues

Please use the [GitHub issue tracker](https://github.com/photostructure/git-ssh-signing-action/issues) to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
