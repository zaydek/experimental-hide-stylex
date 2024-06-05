import * as vscode from "vscode";

export function findStylexCreateLineNumbers(document: vscode.TextDocument): number[] {
  const stylexLineNumbers: number[] = [];

  for (let i = 0; i < document.lineCount; i++) {
    const lineText = document.lineAt(i).text;
    if (lineText.includes("stylex.create")) {
      stylexLineNumbers.push(i);
    }
  }

  return stylexLineNumbers;
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("stylex-fold.foldAll", () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }
      const { document } = vscode.window.activeTextEditor;
      const stylexLineNumbers = findStylexCreateLineNumbers(document);

      if (stylexLineNumbers.length > 0) {
        vscode.commands.executeCommand("editor.fold", {
          levels: 1,
          selectionLines: stylexLineNumbers,
        });
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stylex-fold.unfoldAll", () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }
      const { document } = vscode.window.activeTextEditor;
      const stylexLineNumbers = findStylexCreateLineNumbers(document);

      if (stylexLineNumbers.length > 0) {
        vscode.commands.executeCommand("editor.unfold", {
          levels: 1,
          selectionLines: stylexLineNumbers,
        });
      }
    }),
  );
}

export function deactivate() {}
