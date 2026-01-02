import * as vscode from "vscode";

/**
 * StyleX Fold Extension
 *
 * Commands:
 * - stylex.foldNames: Fold style bodies to show only names (container: { ... })
 * - stylex.foldBlocks: Fold entire stylex.create/keyframes blocks
 * - stylex.unfoldNames: Unfold to show names (one level)
 * - stylex.unfoldAll: Unfold all StyleX blocks completely
 */

/**
 * Checks if a line looks like a style key definition.
 * Matches: `key: {`, `"key": {`, `key: (props) => ({`, `"0%": {`, etc.
 */
function isKeyDefinition(lineText: string): boolean {
  const trimmed = lineText.trim();
  // Anchored regex that matches key definitions
  return /^['"]?[^'":\s]+['"]?\s*:\s*(\(.*\)\s*=>\s*)?\(?\{/.test(trimmed);
}

/**
 * Finds lines containing stylex.create or stylex.keyframes.
 */
function findStylexBlockLines(document: vscode.TextDocument): number[] {
  const lines: number[] = [];
  for (let i = 0; i < document.lineCount; i++) {
    const lineText = document.lineAt(i).text;
    if (lineText.includes("stylex.create") || lineText.includes("stylex.keyframes")) {
      lines.push(i);
    }
  }
  return lines;
}

/**
 * Finds top-level style keys inside stylex.create/keyframes blocks.
 * Uses indentation-based detection with candidate collection.
 */
function findStylexKeyLines(document: vscode.TextDocument): number[] {
  const keyLines: number[] = [];
  let insideBlock = false;
  let blockStartIndent = 0;
  let candidates: { line: number; indent: number }[] = [];

  const processCandidates = () => {
    if (candidates.length === 0) return;
    // Top-level keys have the minimum indentation within the block
    const minIndent = Math.min(...candidates.map((c) => c.indent));
    candidates.forEach((c) => {
      if (c.indent === minIndent) {
        keyLines.push(c.line);
      }
    });
    candidates = [];
  };

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const lineText = line.text;
    const trimmed = lineText.trim();

    // Detect start of block
    if (lineText.includes("stylex.create") || lineText.includes("stylex.keyframes")) {
      if (insideBlock) processCandidates();
      insideBlock = true;
      blockStartIndent = line.firstNonWhitespaceCharacterIndex;
      candidates = [];
      continue;
    }

    if (insideBlock) {
      // Skip blank lines
      if (trimmed === "") continue;

      const currentIndent = line.firstNonWhitespaceCharacterIndex;

      // Exit block if we're back at or before the start indent
      if (currentIndent <= blockStartIndent || trimmed.startsWith("});") || trimmed === "}") {
        processCandidates();
        insideBlock = false;
        continue;
      }

      // Collect candidate keys (only multi-line blocks are foldable)
      if (currentIndent > blockStartIndent && isKeyDefinition(lineText)) {
        // Skip single-line blocks like `itemCompleted: { opacity: 0.65 },`
        // They're not foldable and cause VS Code to fold the parent instead
        if (!lineText.includes("}")) {
          candidates.push({ line: i, indent: currentIndent });
        }
      }
    }
  }

  // Process remaining candidates
  processCandidates();

  return keyLines;
}

export function activate(context: vscode.ExtensionContext) {
  // Fold to names: shows `container: { ... }` but hides CSS properties
  context.subscriptions.push(
    vscode.commands.registerCommand("stylex.foldNames", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const lines = findStylexKeyLines(editor.document);
      if (lines.length > 0) {
        // Don't pass `levels` - it overrides selectionLines and folds the parent
        vscode.commands.executeCommand("editor.fold", {
          selectionLines: lines,
        });
      }
    }),
  );

  // Fold blocks: shows `const styles = stylex.create({ ... });`
  context.subscriptions.push(
    vscode.commands.registerCommand("stylex.foldBlocks", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const lines = findStylexBlockLines(editor.document);
      if (lines.length > 0) {
        vscode.commands.executeCommand("editor.fold", {
          levels: 1,
          selectionLines: lines,
        });
      }
    }),
  );

  // Unfold to names: expands block but keeps style bodies folded
  context.subscriptions.push(
    vscode.commands.registerCommand("stylex.unfoldNames", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const lines = findStylexBlockLines(editor.document);
      if (lines.length > 0) {
        // Unfold just one level to reveal names
        vscode.commands.executeCommand("editor.unfold", {
          levels: 1,
          selectionLines: lines,
        });
      }
    }),
  );

  // Unfold all StyleX blocks completely
  context.subscriptions.push(
    vscode.commands.registerCommand("stylex.unfoldAll", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const lines = findStylexBlockLines(editor.document);
      if (lines.length > 0) {
        vscode.commands.executeCommand("editor.unfold", {
          levels: 100,
          selectionLines: lines,
        });
      }
    }),
  );
}

export function deactivate() {}
