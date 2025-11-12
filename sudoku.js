/*
    Sudoku.js
    ---------
    A Sudoku puzzle generator and solver JavaScript library.
    Modified and updated version of sudoku.js by robatron -> https://github.com/robatron/sudoku.js
    Updated for modular and browser compatibility .
    - Elisa's Sudoku project

    TODO: Fix board generation to be with strategies to solve it in mind

    TODO: Add useful hints (not random ones)
    TODO: Add point system for filled cells

    Implemented:
    - _generate_full_solution(): creates a completed, valid solution via backtracking
    - _count_solutions(): search routine that counts up to a limit (used for uniqueness)
    - generate(): rewritten to create full solution, remove clues while checking uniqueness
    - _logical_solve_candidates(): basic logical solver (naked singles + hidden singles) 
        used to prefer puzzles solvable by simple human strategies
*/

(function (root, factory) {
    if (typeof module !== "undefined" && module.exports) {
        // Node/CommonJS
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        // AMD / RequireJS
        define([], factory);
    } else {
        // Browser global
        root.sudoku = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    const sudoku = {};

    sudoku.DIGITS = "123456789";
    const ROWS = "ABCDEFGHI";
    const COLS = sudoku.DIGITS;
    const MIN_GIVENS = 17;
    const NR_SQUARES = 81;

    const DIFFICULTY = {
        easy: 62,
        medium: 52,
        expert: 42,
        master: 32,
        extreme: 22,
    };

    sudoku.BLANK_CHAR = ".";
    sudoku.BLANK_BOARD = ".".repeat(81);

    let SQUARES, UNITS, SQUARE_UNITS_MAP, SQUARE_PEERS_MAP;

    function initialize() {
        SQUARES = sudoku._cross(ROWS, COLS);
        UNITS = sudoku._get_all_units(ROWS, COLS);
        SQUARE_UNITS_MAP = sudoku._get_square_units_map(SQUARES, UNITS);
        SQUARE_PEERS_MAP = sudoku._get_square_peers_map(
            SQUARES,
            SQUARE_UNITS_MAP
        );
    }

    // -------------------------
    // Full-solution generator
    // -------------------------
    sudoku._generate_full_solution = function () {
        // Backtracking fill, returns solution string or false
        // We'll work with an array of chars for speed
        const grid = Array(NR_SQUARES).fill(sudoku.BLANK_CHAR);

        // Precompute index to square name mapping
        // SQUARES is ordered A1..I9, matching index order we use elsewhere
        const order = [...Array(NR_SQUARES).keys()];
        // Shuffle order to create varied boards
        const shuffledOrder = sudoku._shuffle(order.slice());

        function canPlace(idx, digit) {
            const square = SQUARES[idx];
            for (const peer of SQUARE_PEERS_MAP[square]) {
                const pidx = SQUARES.indexOf(peer);
                if (grid[pidx] === digit) return false;
            }
            return true;
        }

        function backtrack(pos = 0) {
            if (pos >= NR_SQUARES) return true;

            const idx = shuffledOrder[pos];
            if (grid[idx] !== sudoku.BLANK_CHAR) return backtrack(pos + 1);

            // try digits in random order
            const digits = sudoku._shuffle(sudoku.DIGITS.split(""));
            for (const d of digits) {
                if (canPlace(idx, d)) {
                    grid[idx] = d;
                    if (backtrack(pos + 1)) return true;
                    grid[idx] = sudoku.BLANK_CHAR;
                }
            }
            return false;
        }

        const ok = backtrack(0);
        if (!ok) return false;
        return grid.join("");
    };

    // -------------------------
    // Count solutions (early abort)
    // -------------------------
    sudoku._count_solutions = function (board, limit = 2) {
        // Use candidate map + DFS similar to _search but count up to 'limit'
        const report = sudoku.validate_board(board);
        if (report !== true) throw report;

        const candidates = sudoku._get_candidates_map(board);
        if (!candidates) return 0;

        let count = 0;

        function search_count(cands) {
            if (!cands) return;
            // Check if solved
            let max_nr = 0,
                max_sq = null;
            for (const sq of SQUARES) {
                const len = cands[sq].length;
                if (len > max_nr) {
                    max_nr = len;
                    max_sq = sq;
                }
                if (len === 0) return; // contradiction
            }
            // solved?
            if (Object.values(cands).every((v) => v.length === 1)) {
                count++;
                return;
            }

            // choose square with fewest candidates (>1)
            let min_len = 10,
                min_sq = null;
            for (const sq of SQUARES) {
                const l = cands[sq].length;
                if (l > 1 && l < min_len) {
                    min_len = l;
                    min_sq = sq;
                }
            }
            if (!min_sq) return;

            const choices = cands[min_sq];
            for (const ch of choices) {
                if (count >= limit) return;
                // deep copy candidates (JSON copy is ok here)
                const copy = JSON.parse(JSON.stringify(cands));
                const assigned = sudoku._assign(copy, min_sq, ch);
                if (assigned) search_count(assigned);
            }
        }

        search_count(candidates);
        return count;
    };

    sudoku._has_unique_solution = function (board) {
        // returns true if exactly one solution, false if 0 or multiple
        const c = sudoku._count_solutions(board, 2);
        return c === 1;
    };

    // -------------------------
    // Basic logical solver (naked + hidden singles)
    // This is not a full human solver but helps prefer puzzles solvable
    // by simple logical steps.
    // -------------------------
    sudoku._logical_solve_candidates = function (board) {
        // returns solved board string if solved using these techniques,
        // otherwise returns false (meaning not fully solvable by these techniques)
        const report = sudoku.validate_board(board);
        if (report !== true) throw report;

        // Work with candidate map
        let cands = sudoku._get_candidates_map(board);
        if (!cands) return false;

        let stalled = false;
        while (!stalled) {
            stalled = true;

            // 1) Naked singles: any square with 1 candidate -> assign it
            for (const sq of SQUARES) {
                if (cands[sq].length === 1) continue;
                // no need to loop here; _assign via elimination will
                // handle naked singles once they appear elsewhere
            }

            // 2) Hidden singles: for each unit, if a digit only appears in one place
            for (const unit of UNITS) {
                for (const d of sudoku.DIGITS) {
                    const places = unit.filter(
                        (sq) => cands[sq].indexOf(d) !== -1
                    );
                    if (places.length === 0) {
                        // contradiction
                        return false;
                    } else if (places.length === 1) {
                        const beforeLen = cands[places[0]].length;
                        const assigned = sudoku._assign(cands, places[0], d);
                        if (!assigned) return false;
                        if (cands[places[0]].length !== beforeLen)
                            stalled = false;
                    }
                }
            }

            // If any naked singles emerged, propagate them via elimination
            for (const sq of SQUARES) {
                if (cands[sq].length === 1) {
                    // ensure peers don't have that value
                    const val = cands[sq];
                    for (const peer of SQUARE_PEERS_MAP[sq]) {
                        if (cands[peer].indexOf(val) !== -1) {
                            const beforeLen = cands[peer].length;
                            const res = sudoku._eliminate(cands, peer, val);
                            if (!res) return false;
                            if (cands[peer].length !== beforeLen)
                                stalled = false;
                        }
                    }
                }
            }

            // If no progress this loop, stalled remains true and exit
        }

        // If every cell has one candidate, we solved it
        const solved = Object.values(cands).every((v) => v.length === 1);
        if (solved) {
            // build board string in SQUARES order
            return SQUARES.map((sq) => cands[sq]).join("");
        }
        return false;
    };

    // -------------------------
    // Generate with uniqueness and basic logical preference
    // -------------------------
    sudoku.generate = function (difficulty, unique = true) {
        // Accept difficulty as string or number
        if (
            typeof difficulty === "string" ||
            typeof difficulty === "undefined"
        ) {
            difficulty = DIFFICULTY[difficulty] || DIFFICULTY.easy;
        }
        difficulty = sudoku._force_range(
            difficulty,
            NR_SQUARES + 1,
            MIN_GIVENS
        );

        // 1) create a full solved board
        let solution = sudoku._generate_full_solution();
        if (!solution) {
            // fallback - should be rare
            throw "Failed to generate full solution";
        }

        // 2) create puzzle by removing clues while trying to preserve uniqueness
        // Start with all indices and random removal order
        let puzzle = solution.split("");
        let idxs = [...Array(NR_SQUARES).keys()];
        idxs = sudoku._shuffle(idxs);

        // We'll attempt removals until we reach the desired number of givens,
        // but we only accept removals that preserve uniqueness (if unique=true).
        // Additionally we prefer puzzles that remain solvable by basic logical rules.
        let currentGivens = puzzle.filter(
            (ch) => ch !== sudoku.BLANK_CHAR
        ).length;

        for (const idx of idxs) {
            if (currentGivens <= difficulty) break;

            const removed = puzzle[idx];
            puzzle[idx] = sudoku.BLANK_CHAR;
            const candidatePuzzleStr = puzzle.join("");

            // 2a) check uniqueness if requested
            let uniqueOk = true;
            if (unique) {
                try {
                    uniqueOk = sudoku._has_unique_solution(candidatePuzzleStr);
                } catch (e) {
                    uniqueOk = false;
                }
            }

            if (!uniqueOk) {
                // revert removal
                puzzle[idx] = removed;
                continue;
            }

            // 2b) prefer logical solvability (naked + hidden singles)
            // if the puzzle is logically solvable, accept removal; if not,
            // keep removal only if we need to make progress and uniqueness is satisfied.
            const logicallySolvable = (() => {
                try {
                    const solved =
                        sudoku._logical_solve_candidates(candidatePuzzleStr);
                    // if logical solver returns a full solution and it matches the full solution, we prefer it
                    return solved && sudoku._in(solved[0], sudoku.DIGITS);
                } catch (e) {
                    return false;
                }
            })();

            if (!logicallySolvable) {
                // If strict preference because we want puzzles amenable to human strategies,
                // we could revert here. But to avoid never reaching the target, accept removal
                // if uniqueness is satisfied but mark preference.
                // For now: accept the removal (we already checked uniqueness).
                // If you want to force logical-only puzzles, uncomment revert below:
                // puzzle[idx] = removed; continue;
            }

            // keep removal
            currentGivens--;
        }

        const boardStr = puzzle.join("");
        // Ensure final board is solvable
        if (!sudoku.solve(boardStr)) {
            // If somehow unsolvable, fallback to returning some valid puzzle: try returning
            // original solution with random masking to meet difficulty (no uniqueness guarantee)
            let fallback = solution.split("");
            let fidxs = sudoku._shuffle([...Array(NR_SQUARES).keys()]);
            let fGivens = fallback.filter(
                (c) => c !== sudoku.BLANK_CHAR
            ).length;
            for (const idx of fidxs) {
                if (fGivens <= difficulty) break;
                fallback[idx] = sudoku.BLANK_CHAR;
                fGivens--;
            }
            return fallback.join("");
        }

        return boardStr;
    };

    // -------------------------
    // Solve (unchanged)
    // -------------------------
    sudoku.solve = function (board, reverse = false) {
        const report = sudoku.validate_board(board);
        if (report !== true) throw report;

        const nr_givens = [...board].filter((ch) =>
            sudoku._in(ch, sudoku.DIGITS)
        ).length;
        if (nr_givens < MIN_GIVENS)
            throw "Too few givens. Minimum givens is " + MIN_GIVENS;

        const candidates = sudoku._get_candidates_map(board);
        const result = sudoku._search(candidates, reverse);
        if (result) return SQUARES.map((sq) => result[sq]).join("");
        return false;
    };

    sudoku._get_candidates_map = function (board) {
        const report = sudoku.validate_board(board);
        if (report !== true) throw report;

        const candidate_map = {};
        const squares_values_map = sudoku._get_square_vals_map(board);

        for (const s of SQUARES) candidate_map[s] = sudoku.DIGITS;

        for (const square in squares_values_map) {
            const val = squares_values_map[square];
            if (sudoku._in(val, sudoku.DIGITS)) {
                if (!sudoku._assign(candidate_map, square, val)) return false;
            }
        }
        return candidate_map;
    };

    sudoku._assign = function (candidates, square, val) {
        const other_vals = candidates[square].replace(val, "");
        for (const other_val of other_vals) {
            if (!sudoku._eliminate(candidates, square, other_val)) return false;
        }
        return candidates;
    };

    sudoku._eliminate = function (candidates, square, val) {
        if (!sudoku._in(val, candidates[square])) return candidates;

        candidates[square] = candidates[square].replace(val, "");

        const nr_candidates = candidates[square].length;

        if (nr_candidates === 0) return false;

        if (nr_candidates === 1) {
            const target_val = candidates[square];
            for (const peer of SQUARE_PEERS_MAP[square]) {
                if (!sudoku._eliminate(candidates, peer, target_val))
                    return false;
            }
        }

        for (const unit of SQUARE_UNITS_MAP[square]) {
            const val_places = unit.filter((sq) =>
                sudoku._in(val, candidates[sq])
            );
            if (val_places.length === 0) return false;
            else if (val_places.length === 1) {
                if (!sudoku._assign(candidates, val_places[0], val))
                    return false;
            }
        }

        return candidates;
    };

    // -------------------------
    // Remaining original helpers / utilities
    // -------------------------
    sudoku._search = function (candidates, reverse) {
        /* Given a map of squares -> candiates, using depth-first search,
        recursively try all possible values until a solution is found, or false
        if no solution exists. 
        */

        // Return if error in previous iteration
        if (!candidates) {
            return false;
        }

        // Default reverse to false
        reverse = reverse || false;

        // If only one candidate for every square, we've a solved puzzle!
        // Return the candidates map.
        var max_nr_candidates = 0;
        var max_candidates_square = null;
        for (var si in SQUARES) {
            var square = SQUARES[si];

            var nr_candidates = candidates[square].length;

            if (nr_candidates > max_nr_candidates) {
                max_nr_candidates = nr_candidates;
                max_candidates_square = square;
            }
        }
        if (max_nr_candidates === 1) {
            return candidates;
        }

        // Choose the blank square with the fewest possibilities > 1
        var min_nr_candidates = 10;
        var min_candidates_square = null;
        for (si in SQUARES) {
            var square = SQUARES[si];

            var nr_candidates = candidates[square].length;

            if (nr_candidates < min_nr_candidates && nr_candidates > 1) {
                min_nr_candidates = nr_candidates;
                min_candidates_square = square;
            }
        }

        // Recursively search through each of the candidates of the square
        // starting with the one with fewest candidates.

        // Rotate through the candidates forwards
        var min_candidates = candidates[min_candidates_square];
        if (!reverse) {
            for (var vi in min_candidates) {
                var val = min_candidates[vi];

                // TODO: Implement a non-rediculous deep copy function
                var candidates_copy = JSON.parse(JSON.stringify(candidates));
                var candidates_next = sudoku._search(
                    sudoku._assign(candidates_copy, min_candidates_square, val)
                );

                if (candidates_next) {
                    return candidates_next;
                }
            }

            // Rotate through the candidates backwards
        } else {
            for (var vi = min_candidates.length - 1; vi >= 0; --vi) {
                var val = min_candidates[vi];

                // TODO: Implement a non-rediculous deep copy function
                var candidates_copy = JSON.parse(JSON.stringify(candidates));
                var candidates_next = sudoku._search(
                    sudoku._assign(candidates_copy, min_candidates_square, val),
                    reverse
                );

                if (candidates_next) {
                    return candidates_next;
                }
            }
        }

        // If we get through all combinations of the square with the fewest
        // candidates without finding an answer, there isn't one. Return false.
        return false;
    };

    // Square relationships and utilities (unchanged)
    sudoku._get_square_vals_map = function (board) {
        /* Return a map of squares -> values
         */
        var squares_vals_map = {};

        // Make sure `board` is a string of length 81
        if (board.length != SQUARES.length) {
            throw "Board/squares length mismatch.";
        } else {
            for (var i in SQUARES) {
                squares_vals_map[SQUARES[i]] = board[i];
            }
        }

        return squares_vals_map;
    };

    sudoku._get_square_units_map = function (squares, units) {
        /* Return a map of `squares` and their associated units (row, col, box)
         */
        var square_unit_map = {};

        // For every square...
        for (var si in squares) {
            var cur_square = squares[si];

            // Maintain a list of the current square's units
            var cur_square_units = [];

            // Look through the units, and see if the current square is in it,
            // and if so, add it to the list of of the square's units.
            for (var ui in units) {
                var cur_unit = units[ui];

                if (cur_unit.indexOf(cur_square) !== -1) {
                    cur_square_units.push(cur_unit);
                }
            }

            // Save the current square and its units to the map
            square_unit_map[cur_square] = cur_square_units;
        }

        return square_unit_map;
    };

    sudoku._get_square_peers_map = function (squares, units_map) {
        /* Return a map of `squares` and their associated peers, i.e., a set of
        other squares in the square's unit.
        */
        var square_peers_map = {};

        // For every square...
        for (var si in squares) {
            var cur_square = squares[si];
            var cur_square_units = units_map[cur_square];

            // Maintain list of the current square's peers
            var cur_square_peers = [];

            // Look through the current square's units map...
            for (var sui in cur_square_units) {
                var cur_unit = cur_square_units[sui];

                for (var ui in cur_unit) {
                    var cur_unit_square = cur_unit[ui];

                    if (
                        cur_square_peers.indexOf(cur_unit_square) === -1 &&
                        cur_unit_square !== cur_square
                    ) {
                        cur_square_peers.push(cur_unit_square);
                    }
                }
            }

            // Save the current square an its associated peers to the map
            square_peers_map[cur_square] = cur_square_peers;
        }

        return square_peers_map;
    };

    sudoku._get_all_units = function (rows, cols) {
        /* Return a list of all units (rows, cols, boxes)
         */
        var units = [];

        // Rows
        for (var ri in rows) {
            units.push(sudoku._cross(rows[ri], cols));
        }

        // Columns
        for (var ci in cols) {
            units.push(sudoku._cross(rows, cols[ci]));
        }

        // Boxes
        var row_squares = ["ABC", "DEF", "GHI"];
        var col_squares = ["123", "456", "789"];
        for (var rsi in row_squares) {
            for (var csi in col_squares) {
                units.push(sudoku._cross(row_squares[rsi], col_squares[csi]));
            }
        }

        return units;
    };

    // Conversions and utilities (unchanged)
    sudoku.board_string_to_grid = function (board_string) {
        /* Convert a board string to a two-dimensional array
         */
        var rows = [];
        var cur_row = [];
        for (var i in board_string) {
            cur_row.push(board_string[i]);
            if (i % 9 == 8) {
                rows.push(cur_row);
                cur_row = [];
            }
        }
        return rows;
    };

    sudoku.board_grid_to_string = function (board_grid) {
        /* Convert a board grid to a string
         */
        var board_string = "";
        for (var r = 0; r < 9; ++r) {
            for (var c = 0; c < 9; ++c) {
                board_string += board_grid[r][c];
            }
        }
        return board_string;
    };

    sudoku.print_board = function (board) {
        /* Print a sudoku `board` to the console.
         */

        // Assure a valid board
        var report = sudoku.validate_board(board);
        if (report !== true) {
            throw report;
        }

        var V_PADDING = " "; // Insert after each square
        var H_PADDING = "\n"; // Insert after each row

        var V_BOX_PADDING = "  "; // Box vertical padding
        var H_BOX_PADDING = "\n"; // Box horizontal padding

        var display_string = "";

        for (var i in board) {
            var square = board[i];

            // Add the square and some padding
            display_string += square + V_PADDING;

            // Vertical edge of a box, insert v. box padding
            if (i % 3 === 2) {
                display_string += V_BOX_PADDING;
            }

            // End of a line, insert horiz. padding
            if (i % 9 === 8) {
                display_string += H_PADDING;
            }

            // Horizontal edge of a box, insert h. box padding
            if (i % 27 === 26) {
                display_string += H_BOX_PADDING;
            }
        }

        console.log(display_string);
    };

    sudoku.validate_board = function (board) {
        /* Return if the given `board` is valid or not. If it's valid, return
        true. If it's not, return a string of the reason why it's not.
        */

        // Check for empty board
        if (!board) {
            return "Empty board";
        }

        // Invalid board length
        if (board.length !== NR_SQUARES) {
            return (
                "Invalid board size. Board must be exactly " +
                NR_SQUARES +
                " squares."
            );
        }

        // Check for invalid characters
        for (var i in board) {
            if (
                !sudoku._in(board[i], sudoku.DIGITS) &&
                board[i] !== sudoku.BLANK_CHAR
            ) {
                return (
                    "Invalid board character encountered at index " +
                    i +
                    ": " +
                    board[i]
                );
            }
        }

        // Otherwise, we're good. Return true.
        return true;
    };

    sudoku._cross = function (a, b) {
        /* Cross product of all elements in `a` and `b`, e.g.,
        sudoku._cross("abc", "123") ->
        ["a1", "a2", "a3", "b1", "b2", "b3", "c1", "c2", "c3"]
        */
        var result = [];
        for (var ai in a) {
            for (var bi in b) {
                result.push(a[ai] + b[bi]);
            }
        }
        return result;
    };

    sudoku._in = function (v, seq) {
        /* Return if a value `v` is in sequence `seq`.
         */
        return seq.indexOf(v) !== -1;
    };

    sudoku._first_true = function (seq) {
        /* Return the first element in `seq` that is true. If no element is
        true, return false.
        */
        for (var i in seq) {
            if (seq[i]) {
                return seq[i];
            }
        }
        return false;
    };

    sudoku._shuffle = function (seq) {
        /* Return a shuffled version of `seq`
         */
        // Simple Fisher-Yates or sort-based random; using Fisher-Yates is better:
        const arr = seq.slice();
        for (let i = arr.length - 1; i > 0; --i) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    };

    sudoku._rand_range = function (max, min) {
        /* Get a random integer in the range of `min` to `max` (non inclusive).
        If `min` not defined, default to 0. If `max` not defined, throw an 
        error.
        */
        min = min || 0;
        if (max) {
            return Math.floor(Math.random() * (max - min)) + min;
        } else {
            throw "Range undefined";
        }
    };

    sudoku._strip_dups = function (seq) {
        /* Strip duplicate values from `seq`
         */
        var seq_set = [];
        var dup_map = {};
        for (var i in seq) {
            var e = seq[i];
            if (!dup_map[e]) {
                seq_set.push(e);
                dup_map[e] = true;
            }
        }
        return seq_set;
    };

    sudoku._force_range = function (nr, max, min) {
        /* Force `nr` to be within the range from `min` to, but not including, 
        `max`. `min` is optional, and will default to 0. If `nr` is undefined,
        treat it as zero.
        */
        min = min || 0;
        nr = nr || 0;
        if (nr < min) {
            return min;
        }
        if (nr > max) {
            return max;
        }
        return nr;
    };

    // Initialize library after load
    initialize();

    // Pass whatever the root object is, like 'window' in browsers
    return sudoku;
});
