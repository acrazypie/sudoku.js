# Changelog

All notable changes to **sudoku.js** will be documented in this file.\
This project adheres to *semantic versioning*.

------------------------------------------------------------------------

## Unreleased

### Added

-   Initial changelog structure
-   Documentation updates reflecting actual API behavior\
-   Clarified difficulty levels (`easy`, `medium`, `expert`, `master`,
    `extreme`)

### Changed

-   Updated `README.md` to describe real generator behavior, validation
    rules, examples, and internal helper notes\
-   Cleaned up import structure in UI integration\
-   Improved highlight behavior for cell selection and prefilled
    numbers\
-   Removed duplicated imports and fixed solution initialization order

### Fixed

-   Incorrect ES module imports\
-   Hover/selection highlight conflicts\
-   Redundant event triggers for prefilled cells\
-   Startup solution computation outside of game start lifecycle

------------------------------------------------------------------------

## 1.0.0 -- Initial Release

### Added

-   Basic Sudoku generator\
-   Sudoku solver using constraint propagation + DFS\
-   Board validation\
-   Candidate logic: `_assign`, `_eliminate`, `_get_candidates_map`\
-   UMD build for browser\
-   Node/CommonJS export\
-   Core constants (`BLANK_BOARD`, `DIGITS`)
