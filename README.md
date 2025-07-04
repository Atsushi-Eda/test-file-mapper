# Test File Mapper

A VS Code extension that helps you navigate between test and production files in multi-module projects and run tests efficiently.

## Features

- **Quick Navigation**: Switch between test and production files with a single command
- **Automatic File Creation**: Creates test files if they don't exist when navigating
- **Test Execution**: Run tests directly from production or test files
- **Multi-Module Support**: Configure different modules with their own file structures and test commands
- **Flexible Configuration**: Support for different file naming conventions and directory structures

## Commands

- `test-file-mapper.open-test-or-production-file`: Opens the corresponding test or production file
- `test-file-mapper.run-test`: Runs the test for the current file

### Adding Keyboard Shortcuts

You can add keyboard shortcuts for these commands by adding them to your `keybindings.json` file:

```json
[
  {
    "key": "ctrl+shift+t",
    "command": "test-file-mapper.open-test-or-production-file",
    "when": "editorTextFocus"
  },
  {
    "key": "ctrl+shift+r",
    "command": "test-file-mapper.run-test",
    "when": "editorTextFocus"
  }
]
```

To access `keybindings.json`:

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Preferences: Open Keyboard Shortcuts (JSON)"
3. Add the shortcuts above

## Configuration

Configure the extension in your VS Code settings under `test-file-mapper.modules`. Each module can have:

### Module Configuration

```json
{
  "test-file-mapper.modules": [
    {
      "moduleRootDirectory": "packages/core",
      "productionFile": {
        "directory": "packages/core/src/",
        "suffixes": [".ts", ".js"]
      },
      "testFile": {
        "directory": "packages/core/test/",
        "suffixes": [".test.ts", ".spec.ts"]
      },
      "testCommand": "npm test -- {testFilePath}"
    }
  ]
}
```

### Configuration Properties

- `moduleRootDirectory` (optional): Root directory of the module
- `productionFile`: Configuration for production files
  - `directory`: Directory where production files are located
  - `suffixes`: Array of file extensions for production files
- `testFile`: Configuration for test files
  - `directory`: Directory where test files are located
  - `suffixes`: Array of file extensions for test files
- `testCommand`: Command to run tests (supports placeholders)

### Command Placeholders

The `testCommand` supports the following placeholders:

- `{testFilePath}`: Full path to the test file
- `{moduleRootDirectory}`: Module root directory (if specified)
- `{testFilePathFromModuleRoot}`: Test file path relative to module root

## Usage

1. Open a production file or test file
2. Use the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:
   - "Open test or production file" to switch between files
   - "Run test" to execute the test for the current file

## Example Configuration

```json
{
  "test-file-mapper.modules": [
    {
      "moduleRootDirectory": "frontend",
      "productionFile": {
        "directory": "frontend/src/",
        "suffixes": [".tsx", ".ts"]
      },
      "testFile": {
        "directory": "frontend/src/",
        "suffixes": [".test.tsx", ".test.ts"]
      },
      "testCommand": "npm --prefix {moduleRootDirectory} test -- {testFilePathFromModuleRoot}"
    },
    {
      "moduleRootDirectory": "backend",
      "productionFile": {
        "directory": "backend/src/",
        "suffixes": [".php"]
      },
      "testFile": {
        "directory": "backend/tests/",
        "suffixes": ["Test.php"]
      },
      "testCommand": "{moduleRootDirectory}/vendor/bin/phpunit {testFilePathFromModuleRoot}"
    }
  ]
}
```

## Requirements

- VS Code 1.0.0 or higher

## Installation

1. Install from VS Code Marketplace
2. Or install the `.vsix` file directly

## Development

### Building

```bash
pnpm install
pnpm run compile
```

### Testing

```bash
pnpm run test
```

### Packaging

```bash
pnpm run package
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the terms specified in the LICENSE file.
