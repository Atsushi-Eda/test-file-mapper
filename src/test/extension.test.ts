import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  isMatch,
  getRelatedFileUris,
  existsFile,
  getTerminal,
  execTestCommand,
} from '../extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('isMatch should return true for matching file path', async () => {
    const result = isMatch('src/utils/helper.ts', 'src/', ['.ts', '.js']);
    assert.strictEqual(result, true);
  });

  test('isMatch should return false for non-matching directory', async () => {
    const result = isMatch('lib/utils/helper.ts', 'src/', ['.ts', '.js']);
    assert.strictEqual(result, false);
  });

  test('isMatch should return false for non-matching suffix', async () => {
    const result = isMatch('src/utils/helper.py', 'src/', ['.ts', '.js']);
    assert.strictEqual(result, false);
  });

  test('getRelatedFileUris should generate correct URIs', async () => {
    const projectRootUri = vscode.Uri.file('/project');
    const activeFilePath = 'src/utils/helper.ts';
    const activeFileSetting = { directory: 'src/', suffixes: ['.ts'] };
    const passiveFileSetting = { directory: 'test/', suffixes: ['.test.ts'] };

    const result = getRelatedFileUris(
      projectRootUri,
      activeFilePath,
      activeFileSetting,
      passiveFileSetting
    );

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].fsPath, '/project/test/utils/helper.test.ts');
  });

  test('getRelatedFileUris should handle multiple suffixes', async () => {
    const projectRootUri = vscode.Uri.file('/project');
    const activeFilePath = 'src/utils/helper.ts';
    const activeFileSetting = { directory: 'src/', suffixes: ['.ts'] };
    const passiveFileSetting = {
      directory: 'test/',
      suffixes: ['.test.ts', '.spec.ts'],
    };

    const result = getRelatedFileUris(
      projectRootUri,
      activeFilePath,
      activeFileSetting,
      passiveFileSetting
    );

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].fsPath, '/project/test/utils/helper.test.ts');
    assert.strictEqual(result[1].fsPath, '/project/test/utils/helper.spec.ts');
  });

  test('existsFile should return true for existing file', async () => {
    const uri = vscode.Uri.file(__filename);
    const result = await existsFile(uri);
    assert.strictEqual(result, true);
  });

  test('existsFile should return false for non-existing file', async () => {
    const uri = vscode.Uri.file('/non/existing/file.ts');
    const result = await existsFile(uri);
    assert.strictEqual(result, false);
  });

  test('getTerminal should return existing terminal if exists', async () => {
    // Create a terminal first
    const existingTerminal = vscode.window.createTerminal('test-file-mapper');

    const result = getTerminal();
    assert.strictEqual(result.name, 'test-file-mapper');

    // Clean up
    existingTerminal.dispose();
  });

  test('execTestCommand should replace placeholders correctly', async () => {
    // Mock terminal to capture sent text
    let sentCommand = '';
    const mockTerminal = {
      name: 'test-file-mapper',
      show: () => {},
      sendText: (text: string) => {
        sentCommand = text;
      },
      dispose: () => {},
    } as vscode.Terminal;

    // Mock vscode.window
    const originalCreateTerminal = vscode.window.createTerminal;
    const originalTerminals = vscode.window.terminals;

    vscode.window.createTerminal = () => mockTerminal;
    Object.defineProperty(vscode.window, 'terminals', {
      value: [],
      writable: true,
      configurable: true,
    });

    const projectRootUri = '/project';
    const testCommand = 'npm test {testFilePath} --root={moduleRootDirectory}';
    const testFilePath = '/project/test/utils/helper.test.ts';
    const moduleRootDirectory = '/project/module1';

    await execTestCommand(
      projectRootUri,
      testCommand,
      testFilePath,
      moduleRootDirectory
    );

    assert.strictEqual(
      sentCommand,
      'npm test test/utils/helper.test.ts --root=/project/module1'
    );

    // Restore original functions
    vscode.window.createTerminal = originalCreateTerminal;
    Object.defineProperty(vscode.window, 'terminals', {
      value: originalTerminals,
      writable: true,
      configurable: true,
    });
  });

  test('execTestCommand should handle missing moduleRootDirectory', async () => {
    let sentCommand = '';
    const mockTerminal = {
      name: 'test-file-mapper',
      show: () => {},
      sendText: (text: string) => {
        sentCommand = text;
      },
      dispose: () => {},
    } as vscode.Terminal;

    const originalCreateTerminal = vscode.window.createTerminal;
    const originalTerminals = vscode.window.terminals;

    vscode.window.createTerminal = () => mockTerminal;
    Object.defineProperty(vscode.window, 'terminals', {
      value: [],
      writable: true,
      configurable: true,
    });

    const projectRootUri = '/project';
    const testCommand = 'npm test {testFilePath} --root={moduleRootDirectory}';
    const testFilePath = '/project/test/utils/helper.test.ts';

    await execTestCommand(projectRootUri, testCommand, testFilePath);

    assert.strictEqual(
      sentCommand,
      'npm test test/utils/helper.test.ts --root='
    );

    vscode.window.createTerminal = originalCreateTerminal;
    Object.defineProperty(vscode.window, 'terminals', {
      value: originalTerminals,
      writable: true,
      configurable: true,
    });
  });

  test('execTestCommand should handle testFilePathFromModuleRoot placeholder', async () => {
    let sentCommand = '';
    const mockTerminal = {
      name: 'test-file-mapper',
      show: () => {},
      sendText: (text: string) => {
        sentCommand = text;
      },
      dispose: () => {},
    } as vscode.Terminal;

    const originalCreateTerminal = vscode.window.createTerminal;
    const originalTerminals = vscode.window.terminals;

    vscode.window.createTerminal = () => mockTerminal;
    Object.defineProperty(vscode.window, 'terminals', {
      value: [],
      writable: true,
      configurable: true,
    });

    const projectRootUri = '/project';
    const testCommand = 'npm test {testFilePathFromModuleRoot}';
    const testFilePath = '/project/module1/test/utils/helper.test.ts';
    const moduleRootDirectory = '/project/module1';

    await execTestCommand(
      projectRootUri,
      testCommand,
      testFilePath,
      moduleRootDirectory
    );

    assert.strictEqual(sentCommand, 'npm test /test/utils/helper.test.ts');

    vscode.window.createTerminal = originalCreateTerminal;
    Object.defineProperty(vscode.window, 'terminals', {
      value: originalTerminals,
      writable: true,
      configurable: true,
    });
  });
});
