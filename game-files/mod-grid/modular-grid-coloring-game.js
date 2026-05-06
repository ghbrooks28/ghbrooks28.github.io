const SOLUTION_DATA_URL = new URL("./precomputed_solutions.json", import.meta.url);

let solutionTablePromise = null;

async function loadSolutionTable() {
  if (!solutionTablePromise) {
    solutionTablePromise = fetch(SOLUTION_DATA_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load puzzle data: ${response.status}`);
      }
      return response.json();
    });
  }
  return solutionTablePromise;
}

const TEMPLATE = document.createElement("template");

TEMPLATE.innerHTML = `
  <style>
    :host {
      --panel: #ffffff;
      --surface: #f6f8fb;
      --ink: #16212d;
      --muted: #5f6f82;
      --line: #d8e0ea;
      --accent: #176b87;
      --accent-strong: #0f5369;
      --danger: #b64235;
      --success: #1f7a5d;
      --shadow: 0 18px 45px rgba(15, 23, 42, 0.1);
      display: block;
      color: var(--ink);
      font-family: "Avenir Next", "Trebuchet MS", "Gill Sans", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    .shell {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(250px, 340px);
      gap: 20px;
      padding: 24px;
      background: linear-gradient(180deg, #ffffff, #f8fafc);
      border-bottom: 1px solid var(--line);
      align-items: start;
    }

    .eyebrow {
      margin: 0 0 6px;
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h2,
    h3 {
      margin: 0;
      letter-spacing: 0;
    }

    h2 {
      font-size: clamp(30px, 4vw, 44px);
      line-height: 1;
    }

    h3 {
      font-size: 17px;
      line-height: 1.15;
    }

    .subtitle,
    .goal,
    .status,
    .guide {
      color: var(--muted);
      line-height: 1.5;
    }

    .subtitle {
      margin: 12px 0 0;
      max-width: 62ch;
    }

    .goal {
      border-left: 4px solid var(--accent);
      border-radius: 10px;
      background: #eef7fa;
      padding: 14px 16px;
    }

    .goal p {
      margin: 8px 0 0;
    }

    .toolbar {
      display: grid;
      grid-template-columns: repeat(3, minmax(130px, 1fr)) minmax(260px, auto);
      gap: 14px;
      padding: 16px 24px;
      background: var(--panel);
      border-bottom: 1px solid var(--line);
      align-items: end;
    }

    .control label {
      display: grid;
      gap: 7px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    select,
    input,
    button {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #ffffff;
      color: var(--ink);
      font: inherit;
      min-height: 44px;
      padding: 10px 14px;
    }

    select,
    input {
      width: 100%;
    }

    .button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: end;
    }

    button {
      cursor: pointer;
      transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
    }

    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: none;
    }

    button:disabled,
    select:disabled,
    input:disabled {
      cursor: wait;
      opacity: 0.6;
    }

    .primary {
      background: var(--accent);
      border-color: var(--accent-strong);
      color: #ffffff;
    }

    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 14px 24px;
      background: #ffffff;
      border-bottom: 1px solid var(--line);
    }

    .metric {
      min-width: 125px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #f8fafc;
      padding: 10px 12px;
    }

    .metric-label {
      display: block;
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .metric-value {
      display: block;
      margin-top: 4px;
      font-size: 22px;
      font-weight: 700;
      line-height: 1;
    }

    .status strong,
    .guide strong {
      color: var(--ink);
    }

    .status.good {
      border-color: rgba(31, 122, 93, 0.28);
      background: #eef9f4;
    }

    .status.warn {
      border-color: rgba(182, 66, 53, 0.28);
      background: #fff4f2;
    }

    .status.neutral {
      border-color: rgba(23, 107, 135, 0.24);
      background: #f0f8fb;
    }

    .status {
      margin: 16px 24px 0;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 12px 14px;
    }

    .play-area {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 300px;
      gap: 18px;
      padding: 18px 24px 24px;
    }

    .board-scroll {
      overflow: auto;
      max-width: 100%;
      border: 1px solid var(--line);
      border-radius: 14px;
      background:
        linear-gradient(180deg, #ffffff, #f8fafc),
        repeating-linear-gradient(
          135deg,
          rgba(23, 107, 135, 0.035) 0,
          rgba(23, 107, 135, 0.035) 8px,
          transparent 8px,
          transparent 16px
        );
      min-height: 420px;
      padding: 12px;
    }

    .guide {
      align-self: start;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--panel);
      padding: 16px;
    }

    .guide p,
    .guide ul {
      margin: 10px 0 0;
    }

    .guide ul {
      padding-left: 18px;
    }

    .guide li + li {
      margin-top: 8px;
    }

    .key {
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
    }

    .key-title {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .label-key {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .key-item {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      color: var(--muted);
    }

    .label-chip {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid rgba(22, 33, 45, 0.18);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #17212b;
      background: #fff;
    }

    svg {
      display: block;
    }

    .edge {
      stroke: rgba(95, 111, 130, 0.56);
      stroke-width: 3;
      stroke-linecap: round;
    }

    .edge.conflict {
      stroke: rgba(181, 59, 45, 0.92);
      stroke-width: 5;
    }

    .vertex {
      cursor: pointer;
    }

    .vertex.readonly {
      cursor: default;
    }

    .vertex-circle {
      stroke: rgba(66, 56, 42, 0.18);
      stroke-width: 2;
      transition: transform 120ms ease, stroke 120ms ease, filter 120ms ease;
      filter: drop-shadow(0 7px 12px rgba(15, 23, 42, 0.1));
    }

    .vertex:hover .vertex-circle {
      transform: scale(1.04);
      stroke: rgba(66, 56, 42, 0.46);
      filter: drop-shadow(0 10px 18px rgba(15, 23, 42, 0.16));
    }

    .vertex.readonly:hover .vertex-circle {
      transform: none;
      stroke: rgba(66, 56, 42, 0.18);
      filter: drop-shadow(0 7px 12px rgba(57, 42, 23, 0.12));
    }

    .vertex.conflict .vertex-circle {
      stroke: rgba(181, 59, 45, 0.96);
      stroke-width: 3.5;
    }

    .badge {
      pointer-events: none;
    }

    .badge-bg {
      fill: rgba(255, 252, 246, 0.96);
      stroke: rgba(66, 56, 42, 0.18);
      stroke-width: 1.4;
    }

    .badge-text {
      fill: #17212b;
      font-size: 13px;
      font-weight: 700;
      dominant-baseline: middle;
      text-anchor: middle;
    }

    @media (max-width: 960px) {
      .header,
      .toolbar,
      .play-area {
        grid-template-columns: 1fr;
      }

      .button-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      }
    }

    @media (max-width: 640px) {
      .header,
      .toolbar,
      .summary,
      .play-area {
        padding-left: 16px;
        padding-right: 16px;
      }

      .status {
        margin-left: 16px;
        margin-right: 16px;
      }

      .metric {
        flex: 1 1 120px;
      }
    }
  </style>

  <section class="shell">
    <header class="header">
      <div>
        <p class="eyebrow">Closed Modular Coloring</p>
        <h2>modGrid</h2>
        <p class="subtitle">
          A grid-labeling puzzle: click vertices to change their labels until every edge has different endpoint badges.
        </p>
      </div>

      <div class="goal">
        <h3>Goal</h3>
        <p>
          The badge is the closed-neighborhood sum modulo the listed modulus. Clear the red edges by making adjacent
          badges different.
        </p>
      </div>
    </header>

    <div class="toolbar">
      <div class="control">
        <label>
          Rows
          <select id="rows-select"></select>
        </label>
      </div>

      <div class="control">
        <label>
          Columns
          <select id="cols-select"></select>
        </label>
      </div>

      <div class="control">
        <label>
          Scramble
          <input id="distance-input" type="number" min="0" step="1" value="3" />
        </label>
      </div>

      <div class="button-row">
        <button id="swap-button" type="button">Swap</button>
        <button id="new-button" class="primary" type="button">New puzzle</button>
        <button id="reset-button" type="button">Reset</button>
      </div>
    </div>

    <div class="summary">
      <div class="metric">
        <span class="metric-label">Grid</span>
        <span class="metric-value" id="pair-value">P_4 × P_5</span>
      </div>

      <div class="metric">
        <span class="metric-label">Modulus</span>
        <span class="metric-value" id="cmc-value">2</span>
      </div>

      <div class="metric">
        <span class="metric-label">Conflicts</span>
        <span class="metric-value" id="conflict-value">0</span>
      </div>
    </div>

    <div class="status neutral" id="status-box">Loading puzzle data...</div>

    <div class="play-area">
      <div class="board-scroll">
        <svg id="board" aria-label="interactive grid graph" role="img"></svg>
      </div>

      <aside class="guide" aria-label="How to play">
        <h3>How to play</h3>
        <p>Each vertex has two numbers:</p>
        <ul>
          <li><strong>Fill color</strong>: the label you control. Click a vertex to cycle it.</li>
          <li><strong>Badge</strong>: that label plus its neighbors, reduced modulo the modulus.</li>
          <li><strong>Red edge</strong>: both endpoint badges match. Remove all red edges to win.</li>
        </ul>
        <div class="key">
          <span class="key-title">Labels</span>
          <span class="label-key" id="label-key"></span>
        </div>
      </aside>
    </div>
  </section>
`;

function clamp(value, lower, upper) {
  return Math.max(lower, Math.min(upper, value));
}

function pairKey(rows, cols) {
  return `${rows}x${cols}`;
}

function cellIndex(i, j, cols) {
  return i * cols + j;
}

function readAttributeInt(node, name, fallback) {
  const raw = Number.parseInt(node.getAttribute(name) || "", 10);
  return Number.isFinite(raw) ? raw : fallback;
}

function labelPalette(modulus) {
  const palettes = {
    1: ["#fff8ef"],
    2: ["#fff8ef", "#d96d4f"],
    3: ["#fff8ef", "#d96d4f", "#2d8c8d"],
  };
  return palettes[modulus] || palettes[3];
}

function badgePalette(modulus) {
  const palettes = {
    1: ["#f4efe5"],
    2: ["#f4efe5", "#f6d4cc"],
    3: ["#f4efe5", "#f0dfb2", "#cde9e8"],
  };
  return palettes[modulus] || palettes[3];
}

function decodeBoard(encoded) {
  return encoded.split("").map((digit) => Number.parseInt(digit, 10));
}

function encodeBoard(board) {
  return board.join("");
}

function transposeBoard(board, rows, cols) {
  const out = new Array(rows * cols);
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      out[cellIndex(j, i, rows)] = board[cellIndex(i, j, cols)];
    }
  }
  return out;
}

function referencesForPair(rows, cols, table) {
  const canonicalRows = Math.min(rows, cols);
  const canonicalCols = Math.max(rows, cols);
  const entry = table[pairKey(canonicalRows, canonicalCols)];
  if (!entry) {
    throw new Error(`Missing solution data for ${rows}x${cols}`);
  }
  const solutions = entry.solutions.map((encoded) => {
    let solution = decodeBoard(encoded);
    if (rows > cols) {
      solution = transposeBoard(solution, canonicalRows, canonicalCols);
    }
    return solution;
  });
  return {
    cmc: entry.cmc,
    solutions,
  };
}

function inducedFromBoard(board, rows, cols, modulus) {
  const induced = new Array(rows * cols).fill(0);
  if (modulus <= 1) {
    return induced;
  }

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      let total = board[cellIndex(i, j, cols)];
      if (i > 0) {
        total += board[cellIndex(i - 1, j, cols)];
      }
      if (i + 1 < rows) {
        total += board[cellIndex(i + 1, j, cols)];
      }
      if (j > 0) {
        total += board[cellIndex(i, j - 1, cols)];
      }
      if (j + 1 < cols) {
        total += board[cellIndex(i, j + 1, cols)];
      }
      induced[cellIndex(i, j, cols)] = ((total % modulus) + modulus) % modulus;
    }
  }

  return induced;
}

function conflictsFromInduced(induced, rows, cols, modulus) {
  if (modulus <= 1) {
    return {
      edges: [],
      vertexSet: new Set(),
      count: 0,
      proper: true,
    };
  }

  const edges = [];
  const vertices = new Set();

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const here = cellIndex(i, j, cols);
      if (j + 1 < cols) {
        const right = cellIndex(i, j + 1, cols);
        if (induced[here] === induced[right]) {
          edges.push([here, right]);
          vertices.add(here);
          vertices.add(right);
        }
      }
      if (i + 1 < rows) {
        const down = cellIndex(i + 1, j, cols);
        if (induced[here] === induced[down]) {
          edges.push([here, down]);
          vertices.add(here);
          vertices.add(down);
        }
      }
    }
  }

  return {
    edges,
    vertexSet: vertices,
    count: edges.length,
    proper: edges.length === 0,
  };
}

function boardCapacity(cellCount, modulus) {
  return modulus <= 1 ? 0 : cellCount * (modulus - 1);
}

function randomInt(maxExclusive) {
  if (maxExclusive <= 1) {
    return 0;
  }
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    const upper = 0x100000000;
    const limit = Math.floor(upper / maxExclusive) * maxExclusive;
    const buffer = new Uint32Array(1);
    let value = 0;
    do {
      globalThis.crypto.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);
    return value % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function sampleReverseSequence(cellCount, modulus, distance) {
  const actualDistance = clamp(distance, 0, boardCapacity(cellCount, modulus));
  if (modulus <= 1 || actualDistance === 0) {
    return [];
  }

  const bag = [];
  for (let index = 0; index < cellCount; index += 1) {
    for (let repeat = 0; repeat < modulus - 1; repeat += 1) {
      bag.push(index);
    }
  }

  const sequence = [];
  for (let step = 0; step < actualDistance && bag.length > 0; step += 1) {
    const choice = randomInt(bag.length);
    sequence.push(bag[choice]);
    bag.splice(choice, 1);
  }

  return sequence;
}

function puzzleFromSolution(solution, rows, cols, modulus, distance) {
  const cellCount = rows * cols;
  const actualDistance = clamp(distance, 0, boardCapacity(cellCount, modulus));
  if (modulus <= 1 || actualDistance === 0) {
    return {
      board: solution.slice(),
      sequence: [],
    };
  }

  let lastBoard = solution.slice();
  let lastSequence = [];
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const sequence = sampleReverseSequence(cellCount, modulus, actualDistance);
    const board = solution.slice();
    for (const vertex of sequence) {
      board[vertex] = (board[vertex] - 1 + modulus) % modulus;
    }
    const induced = inducedFromBoard(board, rows, cols, modulus);
    const conflicts = conflictsFromInduced(induced, rows, cols, modulus);
    lastBoard = board;
    lastSequence = sequence;
    if (!conflicts.proper) {
      return {
        board,
        sequence,
      };
    }
  }

  return {
    board: lastBoard,
    sequence: lastSequence,
  };
}

function boardLayout(rows, cols, compact = false) {
  const spacing = compact ? 46 : rows >= 12 || cols >= 12 ? 54 : 62;
  const margin = compact ? 38 : 54;
  const radius = compact ? 14 : 18;
  const badgeW = compact ? 20 : 22;
  const badgeH = compact ? 16 : 18;
  return {
    spacing,
    margin,
    radius,
    badgeW,
    badgeH,
    width: margin * 2 + (cols - 1) * spacing,
    height: margin * 2 + (rows - 1) * spacing,
  };
}

function boardMarkup(board, induced, conflicts, rows, cols, modulus, options = {}) {
  const {
    compact = false,
    interactive = true,
  } = options;

  const geometry = boardLayout(rows, cols, compact);
  const labelColors = labelPalette(modulus);
  const badgeColors = badgePalette(modulus);
  const points = [];

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      points.push({
        index: cellIndex(i, j, cols),
        x: geometry.margin + j * geometry.spacing,
        y: geometry.margin + i * geometry.spacing,
      });
    }
  }

  const pointMap = new Map(points.map((point) => [point.index, point]));
  const conflictEdges = new Set(
    conflicts.edges.map(([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`))
  );

  const edgeMarkup = [];
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const from = cellIndex(i, j, cols);
      if (j + 1 < cols) {
        const to = cellIndex(i, j + 1, cols);
        const key = `${from}-${to}`;
        const p = pointMap.get(from);
        const q = pointMap.get(to);
        const cls = conflictEdges.has(key) ? "edge conflict" : "edge";
        edgeMarkup.push(`<line class="${cls}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"></line>`);
      }
      if (i + 1 < rows) {
        const to = cellIndex(i + 1, j, cols);
        const key = `${from}-${to}`;
        const p = pointMap.get(from);
        const q = pointMap.get(to);
        const cls = conflictEdges.has(key) ? "edge conflict" : "edge";
        edgeMarkup.push(`<line class="${cls}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"></line>`);
      }
    }
  }

  const vertexMarkup = points.map((point) => {
    const label = board[point.index];
    const badge = induced[point.index];
    const fill = labelColors[label % labelColors.length];
    const badgeFill = badgeColors[badge % badgeColors.length];
    const conflictClass = conflicts.vertexSet.has(point.index) ? " conflict" : "";
    const readonlyClass = interactive ? "" : " readonly";
    const badgeX = point.x + geometry.radius - 4;
    const badgeY = point.y - geometry.radius + 5;
    const dataIndex = interactive ? ` data-index="${point.index}"` : "";
    return `
      <g class="vertex${conflictClass}${readonlyClass}"${dataIndex}>
        <circle class="vertex-circle" cx="${point.x}" cy="${point.y}" r="${geometry.radius}" fill="${fill}"></circle>
        <g class="badge">
          <rect
            class="badge-bg"
            x="${badgeX - geometry.badgeW / 2}"
            y="${badgeY - geometry.badgeH / 2}"
            rx="9"
            ry="9"
            width="${geometry.badgeW}"
            height="${geometry.badgeH}"
            fill="${badgeFill}"
          ></rect>
          <text class="badge-text" x="${badgeX}" y="${badgeY + 1}">${badge}</text>
        </g>
        <title>Vertex (${Math.floor(point.index / cols)}, ${point.index % cols}): label ${label}, induced ${badge}</title>
      </g>
    `;
  });

  return {
    viewBox: `0 0 ${geometry.width} ${geometry.height}`,
    width: geometry.width,
    height: geometry.height,
    markup: `${edgeMarkup.join("")}${vertexMarkup.join("")}`,
  };
}

class ModularGridColoringGame extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

    this.maxSize = clamp(readAttributeInt(this, "max-size", 15), 1, 15);
    this.rows = clamp(readAttributeInt(this, "m", 4), 1, this.maxSize);
    this.cols = clamp(readAttributeInt(this, "n", 5), 1, this.maxSize);
    this.distance = Math.max(0, readAttributeInt(this, "k", 3));
    this.initialized = false;
    this.ready = false;
    this.table = null;
    this.solutionPool = [];
    this.referenceSolution = [];
    this.startBoard = [];
    this.board = [];
    this.cmc = 2;
    this.reverseSequence = [];

    this.boardSvg = this.shadowRoot.getElementById("board");
    this.rowsSelect = this.shadowRoot.getElementById("rows-select");
    this.colsSelect = this.shadowRoot.getElementById("cols-select");
    this.distanceInput = this.shadowRoot.getElementById("distance-input");
    this.swapButton = this.shadowRoot.getElementById("swap-button");
    this.newButton = this.shadowRoot.getElementById("new-button");
    this.resetButton = this.shadowRoot.getElementById("reset-button");
    this.pairValue = this.shadowRoot.getElementById("pair-value");
    this.cmcValue = this.shadowRoot.getElementById("cmc-value");
    this.conflictValue = this.shadowRoot.getElementById("conflict-value");
    this.statusBox = this.shadowRoot.getElementById("status-box");
    this.labelKey = this.shadowRoot.getElementById("label-key");
  }

  connectedCallback() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.populateSelect(this.rowsSelect);
    this.populateSelect(this.colsSelect);
    this.rowsSelect.value = String(this.rows);
    this.colsSelect.value = String(this.cols);
    this.distanceInput.value = String(this.distance);
    this.installEvents();
    this.toggleControls(true);
    this.bootstrap();
  }

  async bootstrap() {
    try {
      this.table = await loadSolutionTable();
      this.ready = true;
      this.loadPair(this.rows, this.cols);
    } catch (error) {
      this.statusBox.className = "status warn";
      this.statusBox.textContent = error instanceof Error ? error.message : "Failed to load puzzle data.";
    } finally {
      this.toggleControls(false);
    }
  }

  populateSelect(select) {
    select.innerHTML = Array.from({ length: this.maxSize }, (_, offset) => {
      const value = offset + 1;
      return `<option value="${value}">${value}</option>`;
    }).join("");
  }

  toggleControls(disabled) {
    for (const node of [
      this.rowsSelect,
      this.colsSelect,
      this.distanceInput,
      this.swapButton,
      this.newButton,
      this.resetButton,
    ]) {
      node.disabled = disabled;
    }
  }

  installEvents() {
    this.rowsSelect.addEventListener("change", () => {
      if (!this.ready) {
        return;
      }
      this.loadPair(Number(this.rowsSelect.value), this.cols);
    });

    this.colsSelect.addEventListener("change", () => {
      if (!this.ready) {
        return;
      }
      this.loadPair(this.rows, Number(this.colsSelect.value));
    });

    this.distanceInput.addEventListener("change", () => {
      if (!this.ready) {
        return;
      }
      this.readDistanceInput();
      this.createPuzzle();
    });

    this.swapButton.addEventListener("click", () => {
      if (!this.ready) {
        return;
      }
      this.loadPair(this.cols, this.rows);
    });

    this.newButton.addEventListener("click", () => {
      if (!this.ready) {
        return;
      }
      this.createPuzzle();
    });

    this.resetButton.addEventListener("click", () => {
      if (!this.ready) {
        return;
      }
      this.board = this.startBoard.slice();
      this.refresh();
    });

    this.boardSvg.addEventListener("click", (event) => {
      if (!this.ready || this.cmc <= 1) {
        return;
      }
      if (!(event.target instanceof Element)) {
        return;
      }
      const vertex = event.target.closest("[data-index]");
      if (!vertex) {
        return;
      }
      const index = Number(vertex.getAttribute("data-index"));
      if (!Number.isInteger(index) || index < 0 || index >= this.board.length) {
        return;
      }
      this.board[index] = (this.board[index] + 1) % this.cmc;
      this.refresh();
    });
  }

  loadPair(rows, cols, forceDistance = null) {
    this.rows = clamp(rows, 1, this.maxSize);
    this.cols = clamp(cols, 1, this.maxSize);
    this.rowsSelect.value = String(this.rows);
    this.colsSelect.value = String(this.cols);

    const reference = referencesForPair(this.rows, this.cols, this.table);
    this.cmc = reference.cmc;
    this.solutionPool = reference.solutions.map((solution) => solution.slice());

    if (forceDistance !== null) {
      this.distance = forceDistance;
    } else {
      this.distance = Math.max(0, Number.parseInt(this.distanceInput.value, 10) || 0);
    }

    this.configureDistanceInput();
    this.renderLabelKey();
    this.createPuzzle();
  }

  configureDistanceInput() {
    const capacity = boardCapacity(this.rows * this.cols, this.cmc);
    this.distance = clamp(this.distance, 0, capacity);
    this.distanceInput.min = "0";
    this.distanceInput.max = String(capacity);
    this.distanceInput.value = String(this.distance);
  }

  readDistanceInput() {
    const capacity = boardCapacity(this.rows * this.cols, this.cmc);
    const requested = Number.parseInt(this.distanceInput.value, 10);
    this.distance = clamp(Number.isFinite(requested) ? requested : this.distance, 0, capacity);
    this.distanceInput.value = String(this.distance);
  }

  renderLabelKey() {
    const colors = labelPalette(this.cmc);
    this.labelKey.innerHTML = colors
      .map((color, value) => `<span class="key-item"><span class="label-chip" style="background:${color}">${value}</span>label ${value}</span>`)
      .join("");
  }

  createPuzzle() {
    const previousCode = this.startBoard.length > 0 ? encodeBoard(this.startBoard) : "";
    let chosenSolution = this.solutionPool[0].slice();
    let chosenPuzzle = {
      board: chosenSolution.slice(),
      sequence: [],
    };

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const choice = this.solutionPool.length > 1 ? randomInt(this.solutionPool.length) : 0;
      const referenceSolution = this.solutionPool[choice].slice();
      const puzzle = puzzleFromSolution(
        referenceSolution,
        this.rows,
        this.cols,
        this.cmc,
        this.distance
      );
      chosenSolution = referenceSolution;
      chosenPuzzle = puzzle;
      if (encodeBoard(puzzle.board) !== previousCode) {
        break;
      }
    }

    this.referenceSolution = chosenSolution.slice();
    this.reverseSequence = chosenPuzzle.sequence.slice();
    this.startBoard = chosenPuzzle.board.slice();
    this.board = this.startBoard.slice();
    this.refresh();
  }

  refresh() {
    const induced = inducedFromBoard(this.board, this.rows, this.cols, this.cmc);
    const conflicts = conflictsFromInduced(induced, this.rows, this.cols, this.cmc);

    this.pairValue.textContent = `P_${this.rows} × P_${this.cols}`;
    this.cmcValue.textContent = String(this.cmc);
    this.conflictValue.textContent = String(conflicts.count);

    this.renderStatus(conflicts);
    this.renderBoard(induced, conflicts);
  }

  renderStatus(conflicts) {
    const pairLabel = `P_${this.rows} × P_${this.cols}`;

    if (this.cmc === 1) {
      this.statusBox.className = "status neutral";
      this.statusBox.innerHTML =
        `<strong>${pairLabel} is a trivial closed modular coloring case.</strong> ` +
        `There is only one label, so puzzle scrambling is disabled.`;
      return;
    }

    if (conflicts.proper) {
      this.statusBox.className = "status good";
      this.statusBox.innerHTML =
        `<strong>Solved.</strong> ` +
        `You found a proper induced modular coloring for ${pairLabel}.`;
      return;
    }

    this.statusBox.className = "status warn";
    this.statusBox.innerHTML =
      `<strong>${conflicts.count} conflicting edge${conflicts.count === 1 ? "" : "s"} remain.</strong> ` +
      `Click vertices to cycle labels until every red edge disappears.`;
  }

  renderBoard(induced, conflicts) {
    const interactive = this.cmc > 1;
    const { viewBox, width, height, markup } = boardMarkup(
      this.board,
      induced,
      conflicts,
      this.rows,
      this.cols,
      this.cmc,
      { compact: false, interactive }
    );

    this.boardSvg.setAttribute("viewBox", viewBox);
    this.boardSvg.setAttribute("width", String(width));
    this.boardSvg.setAttribute("height", String(height));
    this.boardSvg.innerHTML = markup;
  }
}

if (!customElements.get("modular-grid-coloring-game")) {
  customElements.define("modular-grid-coloring-game", ModularGridColoringGame);
}
