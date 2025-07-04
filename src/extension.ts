import * as vscode from 'vscode';

type Module = {
  moduleRootDirectory?: string;
  productionFile: {
    directory: string;
    suffixes: string[];
  };
  testFile: {
    directory: string;
    suffixes: string[];
  };
  testCommand: string;
};

export const isMatch = (
  activeFilePath: string,
  directory: string,
  suffixes: string[]
) => {
  if (!activeFilePath.startsWith(directory)) {
    return false;
  }
  return suffixes.some((suffix) => activeFilePath.endsWith(suffix));
};
export const getRelatedFileUris = (
  projectRootUri: vscode.Uri,
  activeFilePath: string,
  activeFileSetting: { directory: string; suffixes: string[] },
  passiveFileSetting: { directory: string; suffixes: string[] }
) => {
  const directory =
    activeFilePath
      .replace(activeFileSetting.directory, '')
      .split('/')
      .slice(0, -1)
      .join('/') + '/';
  const fileName = activeFileSetting.suffixes.reduce(
    (acc, suffix) => acc.replace(new RegExp(`${suffix}$`), ''),
    activeFilePath.split('/').slice(-1)[0]
  );
  return passiveFileSetting.suffixes.map((suffix) =>
    vscode.Uri.joinPath(
      projectRootUri,
      `${passiveFileSetting.directory}${directory}${fileName}${suffix}`
    )
  );
};
export const existsFile = async (uri: vscode.Uri) => {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
};
const openFile = async (uri: vscode.Uri) => {
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document);
};
const createFile = async (uri: vscode.Uri) => {
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.createFile(uri, { ignoreIfExists: true });
  await vscode.workspace.applyEdit(workspaceEdit);
};
export const getTerminal = () => {
  const name = 'test-file-mapper';
  const existingTerminal = vscode.window.terminals.find(
    (terminal) => terminal.name === name
  );
  if (existingTerminal) {
    return existingTerminal;
  }
  return vscode.window.createTerminal(name);
};
export const execTestCommand = async (
  projectRootUri: string,
  testCommand: string,
  testFilePath: string,
  moduleRootDirectory?: string
) => {
  const command = testCommand
    .replace(
      '{testFilePath}',
      testFilePath.replace(new RegExp(`^${projectRootUri}/`), '')
    )
    .replace('{moduleRootDirectory}', moduleRootDirectory ?? '')
    .replace(
      '{testFilePathFromModuleRoot}',
      testFilePath.replace(new RegExp(`^${moduleRootDirectory ?? ''}`), '')
    );
  const terminal = getTerminal();
  terminal.show();
  terminal.sendText(command);
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'test-file-mapper.open-test-or-production-file',
      async () => {
        const projectRootUri = vscode.workspace.workspaceFolders?.[0].uri;
        const modules = vscode.workspace
          .getConfiguration('test-file-mapper')
          .get<Module[]>('modules');
        if (!vscode.window.activeTextEditor || !projectRootUri || !modules) {
          return;
        }
        const activeFilePath = vscode.workspace.asRelativePath(
          vscode.window.activeTextEditor.document.uri.fsPath
        );

        for (const { active, passive } of [
          { active: 'testFile', passive: 'productionFile' },
          { active: 'productionFile', passive: 'testFile' },
        ] as const) {
          const matchedModules = modules.filter((module) =>
            isMatch(
              activeFilePath,
              module[active].directory,
              module[active].suffixes
            )
          );
          if (matchedModules.length === 0) {
            continue;
          }
          const relatedFileUris = matchedModules
            .map((matchedModule) =>
              getRelatedFileUris(
                projectRootUri,
                activeFilePath,
                matchedModule[active],
                matchedModule[passive]
              )
            )
            .flat();
          for (const relatedFileUri of relatedFileUris) {
            if (await existsFile(relatedFileUri)) {
              openFile(relatedFileUri);
              return;
            }
          }
          await createFile(relatedFileUris[0]);
          openFile(relatedFileUris[0]);
          return;
        }

        vscode.window.showInformationMessage(
          'No matching module setting found.'
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('test-file-mapper.run-test', async () => {
      const projectRootUri = vscode.workspace.workspaceFolders?.[0].uri;
      const modules = vscode.workspace
        .getConfiguration('test-file-mapper')
        .get<Module[]>('modules');
      if (!vscode.window.activeTextEditor || !projectRootUri || !modules) {
        return;
      }
      const activeFilePath = vscode.workspace.asRelativePath(
        vscode.window.activeTextEditor.document.uri.fsPath
      );

      const matchedModuleAsTestFile = modules.find((module) =>
        isMatch(
          activeFilePath,
          module.testFile.directory,
          module.testFile.suffixes
        )
      );
      if (matchedModuleAsTestFile) {
        await execTestCommand(
          projectRootUri.fsPath,
          matchedModuleAsTestFile.testCommand,
          activeFilePath,
          matchedModuleAsTestFile.moduleRootDirectory
        );
        return;
      }

      const matchedModulesAsProductionFile = modules.filter((module) =>
        isMatch(
          activeFilePath,
          module.productionFile.directory,
          module.productionFile.suffixes
        )
      );
      for (const matchedModuleAsProductionFile of matchedModulesAsProductionFile) {
        const testFileUris = getRelatedFileUris(
          projectRootUri,
          activeFilePath,
          matchedModuleAsProductionFile.productionFile,
          matchedModuleAsProductionFile.testFile
        );
        for (const testFileUri of testFileUris) {
          if (await existsFile(testFileUri)) {
            await execTestCommand(
              projectRootUri.fsPath,
              matchedModuleAsProductionFile.testCommand,
              testFileUri.fsPath,
              matchedModuleAsProductionFile.moduleRootDirectory
            );
            return;
          }
        }
      }

      vscode.window.showInformationMessage(
        'No matching module setting or test file found.'
      );
    })
  );
}

export function deactivate() {}
