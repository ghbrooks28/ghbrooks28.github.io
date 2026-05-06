# modGrid

This folder contains a self-contained browser version of the grid closed modular coloring puzzle.

Files:

- `modular-grid-coloring-game.js`: custom element that defines `<modular-grid-coloring-game>`
- `index.html`: standalone demo page

Quick local use:

```bash
cd "/Users/ghbro/Desktop/Induced Closed Modular Colorings/website-game"
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Embed on a website:

```html
<script type="module" src="/path/to/modular-grid-coloring-game.js"></script>
<modular-grid-coloring-game m="4" n="5" max-size="15"></modular-grid-coloring-game>
```

Notes:

- The component loads multiple precomputed reference colorings for every pair `1 <= m,n <= 15` whenever distinct ones were found.
- `New puzzle` randomly picks one of those reference colorings and then applies a random reverse sequence of `k` clicks, so the board is replayable even at the same `(m,n,k)`.
- The badges show the induced label; the vertex fill color shows the editable label.
- The page must be served over `http://localhost/...` rather than opened directly as `file://...`, because the component loads `precomputed_solutions.json`.
