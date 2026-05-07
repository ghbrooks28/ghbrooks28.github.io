const DIFFICULTY_SETTINGS = {
  easy: {
    vertexMin: 5,
    vertexMax: 6,
    extraEdges: 2,
    transfers: 5,
    maxShift: 2,
    targetMin: 1,
    targetMax: 4,
    capacity: 5,
    padding: 8,
    minNeed: 5,
  },
  medium: {
    vertexMin: 7,
    vertexMax: 9,
    extraEdges: 4,
    transfers: 8,
    maxShift: 2,
    targetMin: 1,
    targetMax: 5,
    capacity: 4,
    padding: 10,
    minNeed: 8,
  },
  hard: {
    vertexMin: 10,
    vertexMax: 12,
    extraEdges: 6,
    transfers: 12,
    maxShift: 3,
    targetMin: 2,
    targetMax: 6,
    capacity: 4,
    padding: 12,
    minNeed: 12,
  },
  extreme: {
    vertexMin: 13,
    vertexMax: 15,
    extraEdges: 8,
    transfers: 16,
    maxShift: 3,
    targetMin: 2,
    targetMax: 7,
    capacity: 3,
    padding: 14,
    minNeed: 16,
  },
};

const SCORE_STORAGE_KEY = "tokenFlowRelayScores";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choose(items) {
  return items[Math.floor(Math.random() * items.length)];
}

class Graph {
  constructor() {
    this.vertices = [];
    this.edges = [];
  }

  addVertex(x, y, target) {
    const vertex = {
      id: this.vertices.length,
      x,
      y,
      tokens: target,
      target,
      neighbors: [],
    };
    this.vertices.push(vertex);
    return vertex;
  }

  addEdge(v1, v2) {
    if (v1.id === v2.id || v1.neighbors.includes(v2.id)) {
      return false;
    }

    v1.neighbors.push(v2.id);
    v2.neighbors.push(v1.id);
    this.edges.push({ from: v1.id, to: v2.id });
    return true;
  }

  getVertexById(id) {
    return this.vertices.find((vertex) => vertex.id === id);
  }

  isSolved() {
    return this.vertices.length > 0 && this.vertices.every((vertex) => vertex.tokens === vertex.target);
  }

  solvedCount() {
    return this.vertices.filter((vertex) => vertex.tokens === vertex.target).length;
  }

  deliveryNeed() {
    return this.vertices.reduce((total, vertex) => total + Math.max(0, vertex.target - vertex.tokens), 0);
  }

  surplusAt(vertexId) {
    const vertex = this.getVertexById(vertexId);
    return vertex ? Math.max(0, vertex.tokens - vertex.target) : 0;
  }

  deficitAt(vertexId) {
    const vertex = this.getVertexById(vertexId);
    return vertex ? Math.max(0, vertex.target - vertex.tokens) : 0;
  }

  surplusVertices() {
    return this.vertices.filter((vertex) => vertex.tokens > vertex.target);
  }

  deficitVertices() {
    return this.vertices.filter((vertex) => vertex.tokens < vertex.target);
  }
}

class GameManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.graph = new Graph();
    this.playerPosition = 0;
    this.playerTokens = 0;
    this.cargoCapacity = 0;
    this.moveCount = 0;
    this.moveLimit = 0;
    this.parMoves = 0;
    this.finalScore = 0;
    this.rating = 0;
    this.gameOver = false;
    this.won = false;
    this.moveTargets = null;
    this.history = [];
    this.initialSnapshot = null;
    this.statusElement = document.getElementById("statusMessage");
    this.elements = {
      playerTokens: document.getElementById("playerTokens"),
      vertexTokens: document.getElementById("vertexTokens"),
      moveCount: document.getElementById("moveCount"),
      tokenGap: document.getElementById("tokenGap"),
      starRating: document.getElementById("starRating"),
      tokenAmount: document.getElementById("tokenAmount"),
      pickupBtn: document.getElementById("pickupBtn"),
      moveBtn: document.getElementById("moveBtn"),
      moveCost: document.getElementById("moveCost"),
      dropBtn: document.getElementById("dropBtn"),
      dropAllBtn: document.getElementById("dropAllBtn"),
      undoBtn: document.getElementById("undoBtn"),
      resetBtn: document.getElementById("resetBtn"),
      winMessage: document.getElementById("winMessage"),
      resultTitle: document.getElementById("resultTitle"),
      finalScore: document.getElementById("finalScore"),
      finalRating: document.getElementById("finalRating"),
      saveScore: document.querySelector(".save-score"),
      playerName: document.getElementById("playerName"),
      saveScoreBtn: document.getElementById("saveScoreBtn"),
    };

    this.setupCanvas();
    this.setupEventListeners();
  }

  setupCanvas() {
    this.resizeCanvas();

    window.addEventListener("resize", () => {
      this.resizeCanvas();
      this.layoutGraph();
      this.draw();
    });
  }

  setupEventListeners() {
    this.elements.pickupBtn.addEventListener("click", () => this.pickupTokens());
    this.elements.moveBtn.addEventListener("click", () => this.showMoveOptions());
    this.elements.dropBtn.addEventListener("click", () => this.dropTokens());
    this.elements.dropAllBtn.addEventListener("click", () => this.dropTokens("fill"));
    this.elements.undoBtn.addEventListener("click", () => this.undo());
    this.elements.resetBtn.addEventListener("click", () => this.resetPuzzle());
    document.getElementById("newGameBtn").addEventListener("click", () => this.generateNewGame());

    this.canvas.addEventListener("click", (event) => this.handleCanvasClick(event));
  }

  resizeCanvas() {
    const { clientWidth, clientHeight } = this.canvas.parentElement;
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(clientWidth * pixelRatio);
    this.canvas.height = Math.floor(clientHeight * pixelRatio);
    this.canvas.style.width = `${clientWidth}px`;
    this.canvas.style.height = `${clientHeight}px`;
    this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  canvasWidth() {
    return this.canvas.parentElement.clientWidth;
  }

  canvasHeight() {
    return this.canvas.parentElement.clientHeight;
  }

  setStatus(message, type = "neutral") {
    this.statusElement.textContent = message;
    this.statusElement.className = `status ${type}`;
  }

  snapshot() {
    return {
      tokens: this.graph.vertices.map((vertex) => vertex.tokens),
      playerPosition: this.playerPosition,
      playerTokens: this.playerTokens,
      moveCount: this.moveCount,
      gameOver: this.gameOver,
      won: this.won,
      finalScore: this.finalScore,
      rating: this.rating,
    };
  }

  restoreSnapshot(snapshot) {
    this.graph.vertices.forEach((vertex, index) => {
      vertex.tokens = snapshot.tokens[index];
    });
    this.playerPosition = snapshot.playerPosition;
    this.playerTokens = snapshot.playerTokens;
    this.moveCount = snapshot.moveCount;
    this.gameOver = snapshot.gameOver;
    this.won = snapshot.won;
    this.finalScore = snapshot.finalScore;
    this.rating = snapshot.rating;
    this.moveTargets = null;
    this.elements.winMessage.style.display = this.gameOver ? "block" : "none";
    this.elements.winMessage.className = this.won ? "win-message" : "win-message fail";
    this.updateInfo();
    this.draw();
  }

  saveState() {
    this.history.push(this.snapshot());
  }

  undo() {
    if (this.history.length === 0) {
      this.setStatus("There is no move to undo yet.", "warn");
      return;
    }

    this.restoreSnapshot(this.history.pop());
    this.setStatus("Last move undone.", "neutral");
  }

  resetPuzzle() {
    if (!this.initialSnapshot) return;

    this.history = [];
    this.restoreSnapshot(this.initialSnapshot);
    this.elements.winMessage.style.display = "none";
    this.setStatus("Route reset. Find a tighter delivery plan.", "neutral");
  }

  generateNewGame() {
    const difficulty = document.getElementById("difficultySelect").value;
    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.medium;

    this.cargoCapacity = settings.capacity;
    this.playerTokens = 0;
    this.moveCount = 0;
    this.finalScore = 0;
    this.rating = 0;
    this.gameOver = false;
    this.won = false;
    this.moveTargets = null;
    this.history = [];
    this.elements.winMessage.className = "win-message";
    this.elements.winMessage.style.display = "none";
    this.elements.saveScore.style.display = "flex";
    this.elements.saveScoreBtn.disabled = false;
    this.elements.playerName.value = "";

    for (let attempt = 0; attempt < 30; attempt += 1) {
      this.graph = this.createPuzzle(settings);
      if (this.graph.deliveryNeed() >= settings.minNeed && this.graph.surplusVertices().length > 0 && this.graph.deficitVertices().length > 0) {
        break;
      }
    }

    const bestStart = this.graph.surplusVertices().sort((a, b) => this.graph.surplusAt(b.id) - this.graph.surplusAt(a.id))[0];
    this.playerPosition = bestStart ? bestStart.id : 0;
    this.layoutGraph();
    this.parMoves = Math.max(1, this.estimateRoute(settings.capacity));
    this.moveLimit = this.parMoves + settings.padding;
    this.initialSnapshot = this.snapshot();

    this.setStatus(`New route. Capacity ${this.cargoCapacity}, par ${this.parMoves} moves, limit ${this.moveLimit}.`, "neutral");
    this.updateInfo();
    this.draw();
  }

  createPuzzle(settings) {
    const graph = new Graph();
    const vertexCount = randomInt(settings.vertexMin, settings.vertexMax);

    for (let i = 0; i < vertexCount; i += 1) {
      graph.addVertex(0, 0, randomInt(settings.targetMin, settings.targetMax));
    }

    for (let i = 1; i < vertexCount; i += 1) {
      const from = graph.getVertexById(i);
      const to = graph.getVertexById(randomInt(0, i - 1));
      graph.addEdge(from, to);
    }

    let extraEdges = 0;
    let attempts = 0;
    while (extraEdges < settings.extraEdges && attempts < vertexCount * vertexCount) {
      attempts += 1;
      const from = graph.getVertexById(randomInt(0, vertexCount - 1));
      const to = graph.getVertexById(randomInt(0, vertexCount - 1));
      if (graph.addEdge(from, to)) {
        extraEdges += 1;
      }
    }

    for (let i = 0; i < settings.transfers; i += 1) {
      const donors = graph.vertices.filter((vertex) => vertex.tokens > 0);
      if (donors.length === 0) break;

      const from = choose(donors);
      let to = choose(graph.vertices);
      while (to.id === from.id) {
        to = choose(graph.vertices);
      }

      const amount = Math.min(randomInt(1, settings.maxShift), from.tokens);
      from.tokens -= amount;
      to.tokens += amount;
    }

    return graph;
  }

  layoutGraph() {
    const vertexCount = this.graph.vertices.length;
    if (vertexCount === 0) return;

    const centerX = this.canvasWidth() / 2;
    const centerY = this.canvasHeight() / 2;
    const radius = Math.max(118, Math.min(centerX, centerY) * 0.72);

    for (let i = 0; i < vertexCount; i += 1) {
      const angle = (i / vertexCount) * Math.PI * 2 - Math.PI / 2;
      const vertex = this.graph.vertices[i];
      vertex.x = centerX + radius * Math.cos(angle);
      vertex.y = centerY + radius * Math.sin(angle);
    }
  }

  shortestDistances(startId) {
    const distances = Array(this.graph.vertices.length).fill(Infinity);
    const queue = [startId];
    distances[startId] = 0;

    for (let index = 0; index < queue.length; index += 1) {
      const vertex = this.graph.getVertexById(queue[index]);
      for (const neighbor of vertex.neighbors) {
        if (distances[neighbor] === Infinity) {
          distances[neighbor] = distances[vertex.id] + 1;
          queue.push(neighbor);
        }
      }
    }

    return distances;
  }

  estimateRoute(capacity) {
    const distances = this.graph.vertices.map((vertex) => this.shortestDistances(vertex.id));
    const surplus = this.graph.vertices.map((vertex) => Math.max(0, vertex.tokens - vertex.target));
    const deficit = this.graph.vertices.map((vertex) => Math.max(0, vertex.target - vertex.tokens));
    let current = this.playerPosition;
    let cargo = 0;
    let moves = 0;
    let guard = 0;

    while (deficit.some((amount) => amount > 0) && guard < 500) {
      guard += 1;

      if (cargo === 0) {
        const sourceId = this.nearestIndex(current, surplus, distances);
        if (sourceId === -1) break;
        moves += distances[current][sourceId];
        current = sourceId;
        cargo = Math.min(capacity, surplus[sourceId]);
        surplus[sourceId] -= cargo;
        moves += 1;
      }

      const targetId = this.nearestIndex(current, deficit, distances);
      if (targetId === -1) break;
      moves += distances[current][targetId];
      current = targetId;
      const delivered = Math.min(cargo, deficit[targetId]);
      deficit[targetId] -= delivered;
      cargo -= delivered;
      moves += 1;
    }

    return moves;
  }

  nearestIndex(current, amounts, distances) {
    let bestIndex = -1;
    let bestDistance = Infinity;
    let bestAmount = -1;

    amounts.forEach((amount, index) => {
      if (amount <= 0) return;
      const distance = distances[current][index];
      if (distance < bestDistance || (distance === bestDistance && amount > bestAmount)) {
        bestIndex = index;
        bestDistance = distance;
        bestAmount = amount;
      }
    });

    return bestIndex;
  }

  canAct() {
    if (this.gameOver) return false;
    if (this.moveCount >= this.moveLimit) {
      this.failRoute();
      return false;
    }
    return true;
  }

  pickupTokens() {
    if (!this.canAct()) return;

    const currentVertex = this.graph.getVertexById(this.playerPosition);
    const surplus = this.graph.surplusAt(this.playerPosition);
    const room = this.cargoCapacity - this.playerTokens;

    if (room <= 0) {
      this.setStatus("Cargo is full. Deliver before picking up more.", "warn");
      return;
    }

    if (surplus <= 0) {
      this.setStatus("This vertex has no surplus to collect.", "warn");
      return;
    }

    this.saveState();
    const solvedBefore = this.graph.solvedCount();
    const amount = Math.min(surplus, room);
    currentVertex.tokens -= amount;
    this.playerTokens += amount;
    this.moveCount += 1;
    this.moveTargets = null;
    this.finishAction(`Picked up ${amount} token${amount === 1 ? "" : "s"}.`, "neutral", solvedBefore);
  }

  showMoveOptions() {
    if (!this.canAct()) return;

    const currentVertex = this.graph.getVertexById(this.playerPosition);
    this.moveTargets = currentVertex.neighbors;
    this.setStatus("Choose a highlighted neighbor, or click an adjacent vertex directly.", "neutral");
    this.draw();
  }

  moveToVertex(vertexId) {
    if (!this.canAct()) return;

    const currentVertex = this.graph.getVertexById(this.playerPosition);
    if (!currentVertex.neighbors.includes(vertexId)) {
      this.setStatus("That vertex is not adjacent. Legal moves are highlighted.", "warn");
      this.moveTargets = currentVertex.neighbors;
      this.draw();
      return;
    }

    this.saveState();
    this.playerPosition = vertexId;
    this.moveCount += 1;
    this.moveTargets = null;
    this.finishAction(`Moved to vertex ${vertexId}.`, "neutral", this.graph.solvedCount());
  }

  dropTokens(requestedAmount = null) {
    if (!this.canAct()) return;

    const currentVertex = this.graph.getVertexById(this.playerPosition);
    const deficit = this.graph.deficitAt(this.playerPosition);

    if (this.playerTokens <= 0) {
      this.setStatus("Cargo is empty. Pick up surplus from a blue vertex first.", "warn");
      return;
    }

    if (deficit <= 0) {
      this.setStatus("This vertex is not asking for a delivery.", "warn");
      return;
    }

    const requested =
      requestedAmount === "fill" ? deficit : requestedAmount === null ? parseInt(this.elements.tokenAmount.value, 10) : parseInt(requestedAmount, 10);
    const amount = Math.min(deficit, this.playerTokens, requested);

    if (!Number.isFinite(amount) || amount <= 0) {
      this.setStatus("Choose a positive delivery amount.", "warn");
      return;
    }

    this.saveState();
    const solvedBefore = this.graph.solvedCount();
    currentVertex.tokens += amount;
    this.playerTokens -= amount;
    this.moveCount += 1;
    this.moveTargets = null;
    this.finishAction(`Delivered ${amount} token${amount === 1 ? "" : "s"}.`, "neutral", solvedBefore);
  }

  finishAction(message, type, solvedBefore) {
    const solvedAfter = this.graph.solvedCount();
    let nextMessage = message;
    let nextType = type;

    if (solvedAfter > solvedBefore) {
      nextMessage = `${message} ${solvedAfter}/${this.graph.vertices.length} targets complete.`;
      nextType = "good";
    }

    if (this.graph.isSolved() && this.playerTokens === 0) {
      this.winRoute();
      return;
    }

    if (this.moveCount >= this.moveLimit) {
      this.failRoute();
      return;
    }

    const movesLeft = this.moveLimit - this.moveCount;
    if (movesLeft <= 3) {
      nextMessage = `${nextMessage} ${movesLeft} move${movesLeft === 1 ? "" : "s"} left.`;
      nextType = "warn";
    }

    this.setStatus(nextMessage, nextType);
    this.updateInfo();
    this.draw();
  }

  winRoute() {
    this.won = true;
    this.gameOver = true;
    this.rating = this.calculateRating();
    this.finalScore = this.calculateScore();
    this.elements.resultTitle.textContent = "Route complete!";
    this.elements.finalScore.textContent = this.finalScore;
    this.elements.finalRating.textContent = `${this.rating}/3`;
    this.elements.winMessage.className = "win-message";
    this.elements.winMessage.style.display = "block";
    this.elements.saveScore.style.display = "flex";
    this.setStatus(`Delivered exactly in ${this.moveCount} moves.`, "good");
    this.updateInfo();
    this.draw();
  }

  failRoute() {
    this.won = false;
    this.gameOver = true;
    this.rating = 0;
    this.finalScore = 0;
    this.elements.resultTitle.textContent = "Route missed.";
    this.elements.finalScore.textContent = "0";
    this.elements.finalRating.textContent = "0/3";
    this.elements.winMessage.className = "win-message fail";
    this.elements.winMessage.style.display = "block";
    this.elements.saveScore.style.display = "none";
    this.setStatus("Out of moves. Reset this route or start a new one.", "warn");
    this.updateInfo();
    this.draw();
  }

  calculateRating() {
    if (!this.won) return 0;
    if (this.moveCount <= this.parMoves) return 3;
    const twoStarLimit = this.parMoves + Math.ceil((this.moveLimit - this.parMoves) / 2);
    return this.moveCount <= twoStarLimit ? 2 : 1;
  }

  previewRating() {
    if (this.gameOver) return this.rating;
    if (this.moveLimit === 0) return 0;
    if (this.moveCount <= this.parMoves) return 3;
    const twoStarLimit = this.parMoves + Math.ceil((this.moveLimit - this.parMoves) / 2);
    if (this.moveCount <= twoStarLimit) return 2;
    return this.moveCount < this.moveLimit ? 1 : 0;
  }

  calculateScore() {
    const difficulty = document.getElementById("difficultySelect").value;
    const multipliers = {
      easy: 1,
      medium: 1.2,
      hard: 1.5,
      extreme: 2,
    };
    const movesLeft = Math.max(0, this.moveLimit - this.moveCount);
    const baseScore = 1000 + movesLeft * 35 + this.rating * 150;
    return Math.round(baseScore * (multipliers[difficulty] || 1));
  }

  handleCanvasClick(event) {
    if (this.gameOver) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickedVertex = this.vertexAt(x, y);

    if (!clickedVertex) return;

    if (clickedVertex.id === this.playerPosition) {
      this.describeCurrentVertex();
      return;
    }

    this.moveToVertex(clickedVertex.id);
  }

  vertexAt(x, y) {
    const radius = Math.max(26, Math.min(38, Math.min(this.canvasWidth(), this.canvasHeight()) / 13));
    return this.graph.vertices.find((vertex) => {
      const dx = vertex.x - x;
      const dy = vertex.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= radius + 10;
    });
  }

  describeCurrentVertex() {
    const vertex = this.graph.getVertexById(this.playerPosition);
    const surplus = this.graph.surplusAt(vertex.id);
    const deficit = this.graph.deficitAt(vertex.id);
    if (surplus > 0) {
      this.setStatus(`Vertex ${vertex.id} has ${surplus} surplus token${surplus === 1 ? "" : "s"}.`, "neutral");
    } else if (deficit > 0) {
      this.setStatus(`Vertex ${vertex.id} needs ${deficit} token${deficit === 1 ? "" : "s"}.`, "neutral");
    } else {
      this.setStatus(`Vertex ${vertex.id} is exactly on target.`, "good");
    }
  }

  updateInfo() {
    const currentVertex = this.graph.getVertexById(this.playerPosition);
    const movesLeft = Math.max(0, this.moveLimit - this.moveCount);
    const deficit = currentVertex ? this.graph.deficitAt(currentVertex.id) : 0;
    const surplus = currentVertex ? this.graph.surplusAt(currentVertex.id) : 0;
    const dropMax = Math.min(this.playerTokens, deficit);
    const rating = this.previewRating();

    this.elements.playerTokens.textContent = `${this.playerTokens}/${this.cargoCapacity}`;
    this.elements.vertexTokens.textContent = currentVertex ? `${currentVertex.tokens}/${currentVertex.target}` : "0/0";
    this.elements.moveCount.textContent = `${this.moveCount}/${this.moveLimit}`;
    this.elements.tokenGap.textContent = this.graph.deliveryNeed();
    this.elements.starRating.textContent = `${rating}/3`;
    this.elements.moveCost.textContent = `(${movesLeft} left)`;

    this.elements.moveCount.classList.toggle("warn", movesLeft <= 3 && !this.gameOver);
    this.elements.tokenGap.classList.toggle("good", this.graph.deliveryNeed() === 0 && this.playerTokens === 0);
    this.elements.starRating.classList.toggle("good", rating === 3);
    this.elements.starRating.classList.toggle("warn", rating <= 1);

    const canSpendMove = !this.gameOver && movesLeft > 0;
    this.elements.pickupBtn.disabled = !canSpendMove || surplus <= 0 || this.playerTokens >= this.cargoCapacity;
    this.elements.moveBtn.disabled = !canSpendMove;
    this.elements.dropBtn.disabled = !canSpendMove || dropMax <= 0;
    this.elements.dropAllBtn.disabled = !canSpendMove || dropMax <= 0;
    this.elements.undoBtn.disabled = this.history.length === 0;
    this.elements.resetBtn.disabled = !this.initialSnapshot;

    this.elements.tokenAmount.max = dropMax;
    this.elements.tokenAmount.disabled = dropMax <= 0 || this.gameOver;
    const currentAmount = parseInt(this.elements.tokenAmount.value, 10);
    if (dropMax <= 0) {
      this.elements.tokenAmount.value = 0;
    } else if (!Number.isFinite(currentAmount) || currentAmount <= 0) {
      this.elements.tokenAmount.value = 1;
    } else if (currentAmount > dropMax) {
      this.elements.tokenAmount.value = dropMax;
    }
  }

  draw() {
    const width = this.canvasWidth();
    const height = this.canvasHeight();
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.strokeStyle = "rgba(95, 111, 130, 0.56)";
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = "round";

    for (const edge of this.graph.edges) {
      const from = this.graph.getVertexById(edge.from);
      const to = this.graph.getVertexById(edge.to);
      this.ctx.beginPath();
      this.ctx.moveTo(from.x, from.y);
      this.ctx.lineTo(to.x, to.y);
      this.ctx.stroke();
    }

    const vertexRadius = Math.max(24, Math.min(34, Math.min(width, height) / (this.graph.vertices.length > 10 ? 16 : 13)));

    for (const vertex of this.graph.vertices) {
      const isCurrent = vertex.id === this.playerPosition;
      const isTarget = this.moveTargets && this.moveTargets.includes(vertex.id);
      const diff = vertex.tokens - vertex.target;
      const isSolved = diff === 0;

      if (isTarget || isCurrent) {
        this.ctx.beginPath();
        this.ctx.fillStyle = isCurrent ? "rgba(23, 107, 135, 0.16)" : "rgba(31, 122, 93, 0.14)";
        this.ctx.arc(vertex.x, vertex.y, vertexRadius + 12, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.beginPath();
      if (isCurrent) {
        this.ctx.fillStyle = "#176b87";
      } else if (diff > 0) {
        this.ctx.fillStyle = "#5672c4";
      } else if (diff < 0) {
        this.ctx.fillStyle = "#b64235";
      } else {
        this.ctx.fillStyle = "#1f7a5d";
      }
      this.ctx.arc(vertex.x, vertex.y, vertexRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = isSolved ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.88)";
      this.ctx.lineWidth = isSolved ? 4 : 3;
      this.ctx.stroke();

      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "700 18px Avenir Next, Trebuchet MS, sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(vertex.tokens, vertex.x, vertex.y);

      this.drawBadge(vertex.x + vertexRadius * 0.68, vertex.y - vertexRadius * 0.68, vertexRadius * 0.45, vertex.target);

      if (diff !== 0) {
        this.ctx.fillStyle = diff > 0 ? "#16212d" : "#b64235";
        this.ctx.font = "700 12px Avenir Next, Trebuchet MS, sans-serif";
        this.ctx.fillText(`${diff > 0 ? "+" : ""}${diff}`, vertex.x, vertex.y + vertexRadius + 17);
      }

      if (isCurrent) {
        this.ctx.fillStyle = "#16212d";
        this.ctx.font = "700 12px Avenir Next, Trebuchet MS, sans-serif";
        this.ctx.fillText("YOU", vertex.x, vertex.y + vertexRadius + (diff === 0 ? 17 : 32));
      }
    }

    this.ctx.restore();
  }

  drawBadge(x, y, radius, value) {
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    this.ctx.strokeStyle = "rgba(22, 33, 45, 0.18)";
    this.ctx.lineWidth = 1.5;
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = "#16212d";
    this.ctx.font = "700 11px Avenir Next, Trebuchet MS, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(value, x, y + 0.5);
  }
}

class ScoreManager {
  constructor() {
    this.scores = {
      easy: [],
      medium: [],
      hard: [],
      extreme: [],
    };
    this.loadScores();
  }

  loadScores() {
    try {
      const savedScores = localStorage.getItem(SCORE_STORAGE_KEY);
      if (!savedScores) return;
      const parsedScores = JSON.parse(savedScores);
      this.scores = {
        ...this.scores,
        ...parsedScores,
      };
    } catch (error) {
      console.error("Error loading tokenFlow scores:", error);
    }
  }

  saveScores() {
    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(this.scores));
  }

  addScore(difficulty, name, score, moves, rating, date = new Date()) {
    this.scores[difficulty].push({
      name: name || "Anonymous",
      score,
      moves,
      rating: `${rating}/3`,
      date: date.toISOString().split("T")[0],
    });

    this.scores[difficulty].sort((a, b) => b.score - a.score);
    this.scores[difficulty] = this.scores[difficulty].slice(0, 10);
    this.saveScores();
  }

  getScores(difficulty) {
    return this.scores[difficulty] || [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new GameManager("gameCanvas");
  const scoreManager = new ScoreManager();
  const scoreTabs = document.querySelectorAll(".score-tab");

  game.generateNewGame();

  document.getElementById("saveScoreBtn").addEventListener("click", () => {
    if (!game.won) return;
    const playerName = document.getElementById("playerName").value.trim();
    const difficulty = document.getElementById("difficultySelect").value;

    scoreManager.addScore(difficulty, playerName, game.finalScore, game.moveCount, game.rating);
    game.setStatus("Score saved.", "good");
    document.getElementById("saveScoreBtn").disabled = true;
  });

  document.getElementById("showScoresBtn").addEventListener("click", () => {
    document.getElementById("highScores").style.display = "block";
    const selectedDifficulty = document.getElementById("difficultySelect").value;
    scoreTabs.forEach((tab) => tab.classList.toggle("active", tab.getAttribute("data-difficulty") === selectedDifficulty));
    showScoresForDifficulty(selectedDifficulty);
  });

  document.getElementById("closeScoresBtn").addEventListener("click", () => {
    document.getElementById("highScores").style.display = "none";
  });

  scoreTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      scoreTabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      showScoresForDifficulty(tab.getAttribute("data-difficulty"));
    });
  });

  function showScoresForDifficulty(difficulty) {
    const scores = scoreManager.getScores(difficulty);
    const scoresBody = document.getElementById("scoresBody");
    scoresBody.innerHTML = "";

    if (scores.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.textContent = "No scores yet for this difficulty.";
      cell.style.textAlign = "center";
      row.appendChild(cell);
      scoresBody.appendChild(row);
      return;
    }

    scores.forEach((score, index) => {
      const row = document.createElement("tr");
      [index + 1, score.name, score.score, score.moves, score.rating, score.date].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      scoresBody.appendChild(row);
    });
  }
});
