# sudoku.js

_A Sudoku puzzle generator & solver JavaScript library_

[![npm version](https://img.shields.io/npm/v/sudoku.js.svg)](https://www.npmjs.com/package/@acrazypie/sudoku.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Issues](https://img.shields.io/github/issues/acrazypie/sudoku.js)](https://github.com/acrazypie/sudoku.js/issues)

## 🚀 Overview

`sudoku.js` is a lightweight JavaScript library for generating and solving standard 9×9 Sudoku puzzles. It is designed to work seamlessly in browser environments and Node.js.

### Key features

-   Generate valid Sudoku puzzles (unique solution)
-   Solve a given Sudoku board (backtracking / constraint logic)
-   Minimal, dependency-free JavaScript
-   Easy integration for web apps, games, or educational tools

## 📦 Installation

### Using npm

```bash
npm i @acrazypie/sudoku.js
```

### Using via script tag

```html
<script src="path/to/sudoku.js"></script>
<script>
    // sudoku is now available globally
</script>
```

## 🐖 Usage

### Generate a puzzle

```js
const { generate } = require("sudoku.js");

const puzzle = generate();
console.log(puzzle);
```

### Solve a board

```js
const { solve } = require("sudoku.js");

const board = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    // ...
];
const solution = solve(board);
console.log(solution);
```

## ⚙️ API Reference

-   `generate([options])` – Generate a Sudoku puzzle. Options can include:

    -   `difficulty`: `'easy' | 'medium' | 'hard'`
    -   `clues`: Number of prefilled cells
    -   `seed`: Random seed

-   `solve(board)` – Solve a given 9×9 board. Returns the solution or `null`.
-   `isValid(board)` – Check if a board is valid (no conflicts). _(if implemented)_

## 🤚 Testing & Contributing

-   Fork → modify → submit Pull Request
-   Add tests for new functionality
-   Follow existing code style (plain JavaScript)
-   Open Issues for bugs or feature requests

## 📝 License

MIT License — see the [LICENSE](LICENSE) file.

## 🤝 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). All contributors are expected to uphold it.

## 📢 Changelog

_(Updates here, e.g., version 1.0, features, fixes.)_
