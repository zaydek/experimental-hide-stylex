import * as vscode from "vscode";

export function findStylexLineNumbers(document: vscode.TextDocument): number[] {
  const stylexLineNumbers: number[] = [];

  for (let i = 0; i < document.lineCount; i++) {
    const lineText = document.lineAt(i).text;
    if (lineText.includes("stylex.create") || lineText.includes("stylex.keyframes")) {
      stylexLineNumbers.push(i);
    }
  }

  return stylexLineNumbers;
}

export function findStylexTopLevelKeys(document: vscode.TextDocument): number[] {
  const topLevelKeyLines: number[] = [];
  let insideStylexBlock = false;
  let currentIndentLevel = 0;

  for (let i = 0; i < document.lineCount; i++) {
    const lineText = document.lineAt(i).text;

    if (lineText.includes("stylex.create")) {
      insideStylexBlock = true;
      currentIndentLevel = lineText.search(/\S/); // Initial indentation level of stylex.create
      continue;
    }

    if (insideStylexBlock) {
      const lineIndentLevel = lineText.search(/\S/);

      // Ignore blank lines
      if (lineText.trim() === "") {
        continue;
      }

      // Exit the stylex block if indentation is reduced or the block ends
      if (lineIndentLevel <= currentIndentLevel || lineText.trim() === "});") {
        insideStylexBlock = false;
      }

      // Identify top-level keys (lines ending with ': {' or '=> ({')
      if (
        (lineText.trim().endsWith(": {") || lineText.trim().endsWith("=> ({")) &&
        lineIndentLevel === currentIndentLevel + 2
      ) {
        topLevelKeyLines.push(i);
      }
    }
  }

  return topLevelKeyLines;
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    // Fold all
    vscode.commands.registerCommand("stylex-fold.foldAll", () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }
      const { document } = vscode.window.activeTextEditor;
      const stylexLineNumbers = findStylexLineNumbers(document);

      if (stylexLineNumbers.length > 0) {
        vscode.commands.executeCommand("editor.fold", {
          levels: 1,
          selectionLines: stylexLineNumbers,
        });
      }
    }),
    vscode.commands.registerCommand("stylex-fold.unfoldAll", () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }
      const { document } = vscode.window.activeTextEditor;
      const stylexLineNumbers = findStylexLineNumbers(document);

      if (stylexLineNumbers.length > 0) {
        vscode.commands.executeCommand("editor.unfold", {
          levels: 1,
          selectionLines: stylexLineNumbers,
        });
      }
    }),

    // Fold level 3
    vscode.commands.registerCommand("stylex-fold.foldLevelThree", () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }
      const { document } = vscode.window.activeTextEditor;
      const stylexLevelThreeLines = findStylexTopLevelKeys(document);

      if (stylexLevelThreeLines.length > 0) {
        vscode.commands.executeCommand("editor.fold", {
          levels: 3,
          selectionLines: stylexLevelThreeLines,
        });
      }
    }),
    vscode.commands.registerCommand("stylex-fold.unfoldLevelThree", () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }
      const { document } = vscode.window.activeTextEditor;
      const stylexLevelThreeLines = findStylexTopLevelKeys(document);

      if (stylexLevelThreeLines.length > 0) {
        vscode.commands.executeCommand("editor.unfold", {
          levels: 3,
          selectionLines: stylexLevelThreeLines,
        });
      }
    }),
  );
}

export function deactivate() {}
