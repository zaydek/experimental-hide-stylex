# StyleX Fold

A VS Code/Cursor extension to fold and unfold StyleX `stylex.create` and `stylex.keyframes` blocks.

## Commands

| Command                      | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `StyleX: Fold to Names`      | Fold style bodies → `item: { ... }`           |
| `StyleX: Fold Entire Blocks` | Fold entire blocks → `stylex.create({ ... })` |
| `StyleX: Unfold to Names`    | Unfold blocks but keep bodies folded          |
| `StyleX: Unfold All`         | Unfold everything completely                  |

## Installation

1. Download `stylex-fold-1.0.4.vsix`
2. In VS Code/Cursor: `Cmd+Shift+P` → "Extensions: Install from VSIX..."
3. Select the `.vsix` file
4. Reload the window

## Keybindings

Copy from `keybindings.example.json` to your keybindings (`Cmd+K Cmd+S` → click `{}` icon):

| Shortcut      | Action                              |
| ------------- | ----------------------------------- |
| `Cmd+[`       | Fold to names (`item: { ... }`)     |
| `Shift+Cmd+[` | Fold entire blocks                  |
| `Cmd+]`       | Unfold to names (expand block only) |
| `Shift+Cmd+]` | Unfold everything                   |

## Supported Patterns

- `stylex.create({ ... })`
- `stylex.keyframes({ ... })`
