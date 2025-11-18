# sudoku.js

_A Sudoku puzzle generator & solver JavaScript library_

[![npm](https://img.shields.io/badge/npm-CB3837?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@acrazypie/sudoku.js)
[![License:
MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Issues](https://img.shields.io/github/issues/acrazypie/sudoku.js)](https://github.com/acrazypie/sudoku.js/issues)

## 🚀 Overview

`sudoku.js` is a compact JavaScript library for generating and solving
**9×9 Sudoku puzzles**.\
It is fully browser-compatible and can also be imported in Node.js or
bundlers.

The puzzle generator uses constraint propagation + randomization to
produce boards at various difficulties, while the solver guarantees a
valid solution using depth-first search with constraint logic.

### Key features

-   ✔️ Generate playable Sudoku puzzles\
-   ✔️ Choose difficulty: **easy, medium, expert, master, extreme**\
-   ✔️ Solve any valid puzzle automatically\
-   ✔️ Zero dependencies\
-   ✔️ Works in browser and Node.js\
-   ✔️ Lightweight & simple to integrate

## 📦 Installation

### Using npm

```bash
npm i @acrazypie/sudoku.js
```

### Using via script tag (browser global)

```html
<script src="path/to/sudoku.js"></script>
<script>
    const puzzle = sudoku.generate("medium");
</script>
```

## 🐖 Usage

### Generate a puzzle

```js
import sudoku from "@acrazypie/sudoku.js";

const puzzle = sudoku.generate("expert");
console.log(puzzle);
```

### Solve a puzzle

```js
const solved = sudoku.solve(puzzle);
console.log(solved);
```

### Validate a board

```js
const valid = sudoku.validate_board(puzzle);
console.log(valid);
```

## ⚙️ API Reference

### `sudoku.generate(difficulty?, unique = true)`

Generate a Sudoku puzzle.\
Returns an **81-character string**, using `"."` for empty cells.

#### Difficulty levels:

Name Approx. clues

---

easy \~62
medium \~52
expert \~42
master \~32
extreme \~22

### `sudoku.solve(board)`

Solves a given Sudoku board.\
Returns the solution string, or `false` if unsolvable.

### `sudoku.validate_board(board)`

Checks board format (length, characters).\
Returns `true` or an error message.

## 🔧 Roadmap / TODO

-   Rewrite generator to use logic-based methods\
-   Guarantee unique-solution puzzles\
-   Add proper logical hints\
-   Add difficulty grading\
-   Improve performance & seeding

## 🤚 Contributing

-   Fork → modify → PR\
-   Write tests\
-   Follow project style\
-   Report bugs & issues

## 📝 License

MIT License --- see the LICENSE file.

## 🤝 Code of Conduct

This project follows the\
[Contributor Covenant Code of
Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## 📢 Changelog

View changelog [HERE](CHANGELOG.md)
