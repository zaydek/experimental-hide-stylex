import * as vscode from "vscode";

// Helper to determine if a line looks like a key definition
function isKeyDefinition(lineText: string): boolean {
  const trimmed = lineText.trim();
  // Regex matches:
  // 1. Standard keys:  key: {  or  "key": {
  // 2. Dynamic keys:   key: (props) => ({
  // 3. Handles trailing comments and spaces
  return /^['"]?[\w-]+['"]?\s*:\s*(\(.*\)\s*=>\s*)?\(?\{/.test(trimmed);
}

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
  let blockStartIndent = 0;

  // We collect potential candidates within a block and process them
  // when the block ends to determine the correct "top level" indentation.
  let currentBlockCandidates: { line: number; indent: number }[] = [];

  const processCandidates = () => {
    if (currentBlockCandidates.length === 0) return;

    // The top-level keys are the ones with the minimum indentation
    // found inside the block (but greater than the block start).
    const minIndent = Math.min(...currentBlockCandidates.map((c) => c.indent));

    currentBlockCandidates.forEach((c) => {
      if (c.indent === minIndent) {
        topLevelKeyLines.push(c.line);
      }
    });
    currentBlockCandidates = [];
  };

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const lineText = line.text;
    const trimmed = lineText.trim();

    // 1. Detect start of block (create OR keyframes)
    if (lineText.includes("stylex.create") || lineText.includes("stylex.keyframes")) {
      // If we were already in a block (edge case), process it first
      if (insideStylexBlock) processCandidates();

      insideStylexBlock = true;
      // Use VS Code API for tab-safe indentation check
      blockStartIndent = line.firstNonWhitespaceCharacterIndex;
      currentBlockCandidates = [];
      continue;
    }

    if (insideStylexBlock) {
      // 2. Skip blank lines (fix for premature exit bug)
      if (trimmed === "") continue;

      const currentIndent = line.firstNonWhitespaceCharacterIndex;

      // 3. Check for Block Exit
      // We exit if indent drops to (or below) start level, OR we see the closing syntax.
      // We explicitly check it's not the start of the block itself to be safe.
      if (currentIndent <= blockStartIndent || trimmed.startsWith("});") || trimmed === "}") {
        processCandidates();
        insideStylexBlock = false;
        continue;
      }

      // 4. Collect Candidates
      // If it looks like a key and is indented deeper than the start
      if (currentIndent > blockStartIndent && isKeyDefinition(lineText)) {
        currentBlockCandidates.push({ line: i, indent: currentIndent });
      }
    }
  }

  // Process any remaining candidates if file ends inside a block
  processCandidates();

  return topLevelKeyLines;
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    // Fold All (Collapses the entire stylex.create block)
    vscode.commands.registerCommand("stylex-fold.foldAll", () => {
      if (!vscode.window.activeTextEditor) return;
      const lines = findStylexLineNumbers(vscode.window.activeTextEditor.document);
      if (lines.length > 0) {
        vscode.commands.executeCommand("editor.fold", {
          levels: 1,
          selectionLines: lines,
        });
      }
    }),
    vscode.commands.registerCommand("stylex-fold.unfoldAll", () => {
      if (!vscode.window.activeTextEditor) return;
      const lines = findStylexLineNumbers(vscode.window.activeTextEditor.document);
      if (lines.length > 0) {
        vscode.commands.executeCommand("editor.unfold", {
          levels: 1,
          selectionLines: lines,
        });
      }
    }),

    // Fold Level Three (Collapses the individual styles inside the block)
    vscode.commands.registerCommand("stylex-fold.foldLevelThree", () => {
      if (!vscode.window.activeTextEditor) return;
      const lines = findStylexTopLevelKeys(vscode.window.activeTextEditor.document);
      if (lines.length > 0) {
        // Use levels: 1. We want to fold the block *immediately* at these lines.
        vscode.commands.executeCommand("editor.fold", {
          levels: 1,
          selectionLines: lines,
        });
      }
    }),
    vscode.commands.registerCommand("stylex-fold.unfoldLevelThree", () => {
      if (!vscode.window.activeTextEditor) return;
      const lines = findStylexTopLevelKeys(vscode.window.activeTextEditor.document);
      if (lines.length > 0) {
        vscode.commands.executeCommand("editor.unfold", {
          levels: 1,
          selectionLines: lines,
        });
      }
    }),
  );
}

export function deactivate() {}
