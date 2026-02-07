const GRID_SIZE = 10;
const STORAGE_KEY = "superbowl-squares-2026";
const SCORE_REFRESH_MS = 30000;
const BOARD_REFRESH_MS = 30000;
const ADMIN_KEY_STORAGE = "superbowl-squares-admin-key";
const DIGIT_PRIOR = {
  0: 0.196,
  1: 0.106,
  2: 0.038,
  3: 0.131,
  4: 0.089,
  5: 0.042,
  6: 0.086,
  7: 0.196,
  8: 0.066,
  9: 0.049,
};

const elements = {
  appMain: document.getElementById("app-main"),
  boardGrid: document.getElementById("board-grid"),
  printGrid: document.getElementById("print-grid"),
  printView: document.getElementById("print-view"),
  printTitle: document.getElementById("print-title"),
  printSubtitle: document.getElementById("print-subtitle"),
  printAxisCols: document.getElementById("print-axis-cols"),
  printAxisRows: document.getElementById("print-axis-rows"),
  printTable: document.getElementById("print-table"),
  boardToolbar: document.querySelector(".board-toolbar"),
  boardShell: document.querySelector(".board-shell"),
  viewToggle: document.querySelector(".view-toggle"),
  gameTitle: document.getElementById("game-title"),
  gameSubtitle: document.getElementById("game-subtitle"),
  gameClock: document.getElementById("game-clock"),
  scoreboardStatus: document.getElementById("scoreboard-status"),
  scoreboardDown: document.getElementById("scoreboard-down"),
  teamALogo: document.getElementById("team-a-logo"),
  teamAShort: document.getElementById("team-a-short"),
  teamAName: document.getElementById("team-a-name"),
  teamAScore: document.getElementById("team-a-score"),
  teamBLogo: document.getElementById("team-b-logo"),
  teamBShort: document.getElementById("team-b-short"),
  teamBName: document.getElementById("team-b-name"),
  teamBScore: document.getElementById("team-b-score"),
  rowsLabel: document.getElementById("rows-label"),
  colsLabel: document.getElementById("cols-label"),
  scoreLabelA: document.getElementById("score-label-a"),
  scoreLabelB: document.getElementById("score-label-b"),
  viewHalftime: document.getElementById("view-halftime"),
  viewFinal: document.getElementById("view-final"),
  toggleSidebar: document.getElementById("toggle-sidebar"),
  randomizeDigits: document.getElementById("randomize-digits"),
  exportPdf: document.getElementById("export-pdf"),
  participantName: document.getElementById("participant-name"),
  setActive: document.getElementById("set-active"),
  pick1: document.getElementById("pick-1"),
  pick5: document.getElementById("pick-5"),
  pick10: document.getElementById("pick-10"),
  activeDisplay: document.getElementById("active-display"),
  participantsList: document.getElementById("participants-list"),
  priceDisplay: document.getElementById("price-display"),
  scoreSeahawks: document.getElementById("score-seahawks"),
  scorePatriots: document.getElementById("score-patriots"),
  timeRemainingHalf: document.getElementById("time-remaining-half"),
  timeRemainingGame: document.getElementById("time-remaining-game"),
  fetchScore: document.getElementById("fetch-score"),
  testApi: document.getElementById("test-api"),
  fetchStatus: document.getElementById("fetch-status"),
  scoreRefreshed: document.getElementById("score-refreshed"),
  gameInfo: document.getElementById("game-info"),
  winningInfo: document.getElementById("winning-info"),
  winningInfoCompact: document.getElementById("winning-info-compact"),
  oddsSummary: document.getElementById("odds-summary"),
  boardRefresh: document.getElementById("board-refresh"),
  priceInput: document.getElementById("price-input"),
  gameTitleInput: document.getElementById("game-title-input"),
  teamAInput: document.getElementById("team-a-input"),
  teamALogoInput: document.getElementById("team-a-logo-input"),
  teamBInput: document.getElementById("team-b-input"),
  teamBLogoInput: document.getElementById("team-b-logo-input"),
  adminKeyInput: document.getElementById("admin-key-input"),
  syncStatus: document.getElementById("sync-status"),
  ratioHalftime: document.getElementById("ratio-halftime"),
  ratioFinal: document.getElementById("ratio-final"),
  adminToggle: document.getElementById("admin-toggle"),
  rerandomize: document.getElementById("rerandomize"),
  clearBoard: document.getElementById("clear-board"),
  exportJson: document.getElementById("export-json"),
  exportCsv: document.getElementById("export-csv"),
  importFile: document.getElementById("import-file"),
  totalPot: document.getElementById("total-pot"),
  payoutHalftime: document.getElementById("payout-halftime"),
  payoutFinal: document.getElementById("payout-final"),
  payoutHalftimeLabel: document.getElementById("payout-halftime-label"),
  payoutFinalLabel: document.getElementById("payout-final-label"),
  openSummary: document.getElementById("open-summary"),
  summaryModal: document.getElementById("summary-modal"),
  summaryBackdrop: document.getElementById("summary-backdrop"),
  closeSummary: document.getElementById("close-summary"),
  summaryList: document.getElementById("summary-list"),
};

const squareCells = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE));
const rowHeaderCells = Array(GRID_SIZE);
const colHeaderCells = Array(GRID_SIZE);
const printCells = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE));
const printHeaders = {
  colHalftime: Array(GRID_SIZE),
  colFinal: Array(GRID_SIZE),
  rowHalftime: Array(GRID_SIZE),
  rowFinal: Array(GRID_SIZE),
  labelHalftimeCols: null,
  labelFinalCols: null,
  labelHalftimeRows: null,
  labelFinalRows: null,
};

const defaultState = () => ({
  grid: Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill("")),
  digits: {
    halftime: { rows: [], cols: [] },
    final: { rows: [], cols: [] },
  },
  locked: { halftime: false, final: false },
  view: "halftime",
  activeName: "",
  gameTitle: "Super Bowl LX",
  teamAName: "Seahawks",
  teamBName: "Patriots",
  teamALogo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
  teamBLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
  collapsed: false,
  pricePerSquare: 0.5,
  payoutRatio: { halftime: 0.3, final: 0.7 },
  adminMode: false,
  scores: { seahawks: 0, patriots: 0 },
  gameClock: "",
  gameInfo: {},
  timeRemainingHalf: 15,
  timeRemainingGame: 60,
  highlightName: "",
  oddsView: "halftime",
  lastScoreRefresh: "",
});

let state = loadState();
let syncTimeout = null;
let lastSyncOk = false;
let lastSyncMessage = "Backend: not connected";
let lastBoardSync = "";

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    return defaultState();
  }
}

function normalizeState(data) {
  const base = defaultState();
  if (!data || typeof data !== "object") return base;
  if (Array.isArray(data.grid) && data.grid.length === GRID_SIZE) {
    base.grid = data.grid.map((row) => {
      if (!Array.isArray(row)) return Array(GRID_SIZE).fill("");
      return row.slice(0, GRID_SIZE).map((cell) => (cell || "").trim());
    });
  }
  if (data.digits?.halftime && data.digits?.final) {
    base.digits = {
      halftime: normalizeDigits(data.digits.halftime),
      final: normalizeDigits(data.digits.final),
    };
  }
  base.locked = {
    halftime: Boolean(data.locked?.halftime),
    final: Boolean(data.locked?.final),
  };
  base.view = data.view === "final" ? "final" : "halftime";
  base.activeName = (data.activeName || "").trim();
  base.gameTitle = (data.gameTitle || base.gameTitle).trim();
  base.teamAName = (data.teamAName || base.teamAName).trim();
  base.teamBName = (data.teamBName || base.teamBName).trim();
  base.teamALogo = (data.teamALogo || base.teamALogo).trim();
  base.teamBLogo = (data.teamBLogo || base.teamBLogo).trim();
  base.collapsed = Boolean(data.collapsed);
  base.pricePerSquare = Number(data.pricePerSquare || 0);
  base.payoutRatio = normalizeRatio(data.payoutRatio);
  base.adminMode = Boolean(data.adminMode);
  base.scores = {
    seahawks: Number(data.scores?.seahawks || 0),
    patriots: Number(data.scores?.patriots || 0),
  };
  base.gameClock = data.gameClock || "";
  base.gameInfo = data.gameInfo || {};
  base.timeRemainingHalf = Number(data.timeRemainingHalf ?? base.timeRemainingHalf);
  base.timeRemainingGame = Number(data.timeRemainingGame ?? base.timeRemainingGame);
  base.highlightName = (data.highlightName || "").trim();
  base.oddsView = data.oddsView === "final" ? "final" : "halftime";
  base.lastScoreRefresh = data.lastScoreRefresh || "";
  return base;
}

function normalizeDigits(digits) {
  const rows = Array.isArray(digits.rows) ? digits.rows.slice(0, GRID_SIZE) : [];
  const cols = Array.isArray(digits.cols) ? digits.cols.slice(0, GRID_SIZE) : [];
  return { rows, cols };
}

function normalizeRatio(ratio) {
  const halftime = Number(ratio?.halftime);
  const final = Number(ratio?.final);
  if (Number.isFinite(halftime) && Number.isFinite(final)) {
    const total = halftime + final;
    if (total > 0) {
      return { halftime: halftime / total, final: final / total };
    }
  }
  return { halftime: 0.3, final: 0.7 };
}

function normalizeTeamShort(name) {
  const letters = String(name || "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
  if (!letters) return "TBD";
  return letters.slice(0, 3);
}

function matchesPossession(possession, teamName, teamShort) {
  if (!possession) return false;
  const normalized = String(possession).toLowerCase();
  return (
    normalized.includes(String(teamName).toLowerCase()) ||
    normalized.includes(String(teamShort).toLowerCase())
  );
}

function isMobileView() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function getNameFontSize(name) {
  const length = name.trim().length;
  if (length <= 6) return "14px";
  if (length <= 9) return "12px";
  if (length <= 12) return "11px";
  return "10px";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getTeamLabel(name) {
  return name || "Team";
}

function setLogo(element, url, altText) {
  if (!element) return;
  if (!url) {
    element.classList.add("hidden");
    element.removeAttribute("src");
    return;
  }
  element.classList.remove("hidden");
  element.src = url;
  element.alt = altText;
}

function saveState(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (!options.skipSync) scheduleSync();
}

function getAdminKey() {
  return localStorage.getItem(ADMIN_KEY_STORAGE) || "";
}

function setAdminKey(value) {
  if (!value) {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
  } else {
    localStorage.setItem(ADMIN_KEY_STORAGE, value);
  }
}

function isAdmin() {
  return Boolean(getAdminKey());
}

function scheduleSync() {
  if (!isAdmin()) return;
  if (syncTimeout) window.clearTimeout(syncTimeout);
  syncTimeout = window.setTimeout(() => {
    syncTimeout = null;
    pushBoardToServer();
  }, 600);
}

function setSyncStatus(message, ok = false) {
  lastSyncOk = ok;
  lastSyncMessage = message;
  elements.syncStatus.textContent = message;
}

function serializeStateForServer() {
  const {
    grid,
    digits,
    locked,
    view,
    gameTitle,
    teamAName,
    teamBName,
    teamALogo,
    teamBLogo,
    pricePerSquare,
    payoutRatio,
    scores,
    gameClock,
    gameInfo,
    timeRemainingHalf,
    timeRemainingGame,
  } = state;
  return {
    grid,
    digits,
    locked,
    view,
    gameTitle,
    teamAName,
    teamBName,
    teamALogo,
    teamBLogo,
    pricePerSquare,
    payoutRatio,
    scores,
    gameClock,
    gameInfo,
    timeRemainingHalf,
    timeRemainingGame,
  };
}

function applyServerState(serverState) {
  const localCollapsed = state.collapsed;
  const localActive = state.activeName;
  const localAdminMode = state.adminMode;
  const localLastRefresh = state.lastScoreRefresh;
  state = normalizeState(serverState);
  state.collapsed = localCollapsed;
  state.activeName = localActive;
  state.adminMode = localAdminMode;
  state.lastScoreRefresh = localLastRefresh;
  saveState({ skipSync: true });
}

function buildGrid() {
  elements.boardGrid.innerHTML = "";
  for (let row = -1; row < GRID_SIZE; row += 1) {
    for (let col = -1; col < GRID_SIZE; col += 1) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (row === -1 && col === -1) {
        cell.classList.add("corner");
      } else if (row === -1) {
        cell.classList.add("header");
        colHeaderCells[col] = cell;
      } else if (col === -1) {
        cell.classList.add("header");
        rowHeaderCells[row] = cell;
      } else {
        cell.classList.add("square");
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.addEventListener("click", handleSquareClick);
        squareCells[row][col] = cell;
      }
      elements.boardGrid.appendChild(cell);
    }
  }
}

function buildPrintGrid() {
  elements.printGrid.innerHTML = "";
  const printSize = GRID_SIZE + 2;
  for (let row = 0; row < printSize; row += 1) {
    for (let col = 0; col < printSize; col += 1) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (row < 2 && col < 2) {
        cell.classList.add("header", "label");
        if (row === 0 && col === 0) printHeaders.labelHalftimeCols = cell;
        if (row === 1 && col === 0) printHeaders.labelFinalCols = cell;
        if (row === 0 && col === 1) printHeaders.labelHalftimeRows = cell;
        if (row === 1 && col === 1) printHeaders.labelFinalRows = cell;
      } else if (row < 2) {
        cell.classList.add("header");
        const index = col - 2;
        if (row === 0) printHeaders.colHalftime[index] = cell;
        if (row === 1) printHeaders.colFinal[index] = cell;
      } else if (col < 2) {
        cell.classList.add("header");
        const index = row - 2;
        if (col === 0) printHeaders.rowHalftime[index] = cell;
        if (col === 1) printHeaders.rowFinal[index] = cell;
      } else {
        const rowIndex = row - 2;
        const colIndex = col - 2;
        cell.classList.add("square");
        printCells[rowIndex][colIndex] = cell;
      }
      elements.printGrid.appendChild(cell);
    }
  }
}

function handleSquareClick(event) {
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);
  const current = state.grid[row][col];
  const locked = state.locked.halftime || state.locked.final;
  if (!isAdmin() || locked) {
    if (!current) {
      state.highlightName = "";
    } else if (state.highlightName === current) {
      state.highlightName = "";
    } else {
      state.highlightName = current;
    }
    saveState({ skipSync: true });
    render();
    return;
  }
  if (!isAdmin()) {
    elements.activeDisplay.textContent = "Read-only mode. Admin key required.";
    return;
  }
  if (current) {
    if (!state.adminMode) return;
    if (!state.activeName || state.activeName === current) {
      const confirmClear = window.confirm(`Unassign this square from ${current}?`);
      if (!confirmClear) return;
      state.grid[row][col] = "";
    } else {
      const confirmSwap = window.confirm(
        `Reassign this square from ${current} to ${state.activeName}?`
      );
      if (!confirmSwap) return;
      state.grid[row][col] = state.activeName;
    }
  } else {
    if (!state.activeName) {
      elements.activeDisplay.textContent = "Set your name before picking squares.";
      return;
    }
    state.grid[row][col] = state.activeName;
  }
  saveState();
  render();
}

function getAvailableSquares() {
  const open = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!state.grid[row][col]) open.push({ row, col });
    }
  }
  return open;
}

function pickRandomSquares(count) {
  if (!state.activeName) {
    elements.activeDisplay.textContent = "Set your name before picking squares.";
    return;
  }
  if (!isAdmin()) {
    elements.activeDisplay.textContent = "Read-only mode. Admin key required.";
    return;
  }
  const available = getAvailableSquares();
  if (!available.length) return;
  const picks = Math.min(count, available.length);
  for (let i = 0; i < picks; i += 1) {
    const index = Math.floor(Math.random() * available.length);
    const { row, col } = available.splice(index, 1)[0];
    state.grid[row][col] = state.activeName;
  }
  elements.activeDisplay.textContent = `Picked ${picks} square${picks === 1 ? "" : "s"} for ${state.activeName}.`;
  saveState();
  render();
}

function setActiveName() {
  const name = elements.participantName.value.trim();
  if (!name) return;
  state.activeName = name;
  elements.participantName.value = "";
  saveState();
  render();
}

function setView(view) {
  state.view = view;
  saveState();
  render();
}

function placeViewToggle() {
  if (!elements.viewToggle || !elements.boardToolbar || !elements.boardShell) return;
  if (isMobileView()) {
    elements.boardShell.after(elements.viewToggle);
    elements.viewToggle.classList.add("below-board");
  } else {
    elements.boardToolbar.prepend(elements.viewToggle);
    elements.viewToggle.classList.remove("below-board");
  }
}

function toggleSidebar() {
  state.collapsed = !state.collapsed;
  saveState();
  render();
}

function isGridFull() {
  return state.grid.every((row) => row.every((cell) => cell));
}

function shuffleDigits() {
  const digits = Array.from({ length: 10 }, (_, index) => index);
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

function randomizeDigits(force = false) {
  if (!isAdmin()) {
    alert("Read-only mode. Admin key required.");
    return;
  }
  if (!isGridFull()) {
    alert("All 100 squares must be assigned before randomizing.");
    return;
  }
  if ((state.locked.halftime || state.locked.final) && !force) return;

  state.digits.halftime.rows = shuffleDigits();
  state.digits.halftime.cols = shuffleDigits();
  state.digits.final.rows = shuffleDigits();
  state.digits.final.cols = shuffleDigits();
  state.locked.halftime = true;
  state.locked.final = true;
  saveState();
  render();
}

function rerandomizeDigits() {
  if (!isAdmin()) {
    alert("Read-only mode. Admin key required.");
    return;
  }
  if (!state.adminMode) return;
  const confirmAction = window.confirm(
    "Re-randomize all digits? This will change winners."
  );
  if (!confirmAction) return;
  randomizeDigits(true);
}

function clearBoard() {
  if (!isAdmin()) {
    alert("Read-only mode. Admin key required.");
    return;
  }
  if (!state.adminMode) return;
  const confirmAction = window.confirm("Clear all squares and digits?");
  if (!confirmAction) return;
  state = defaultState();
  saveState();
  render();
}

function getParticipants() {
  const counts = {};
  state.grid.forEach((row) => {
    row.forEach((name) => {
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      total: count * state.pricePerSquare,
    }))
    .sort((a, b) => b.count - a.count);
}

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

function getWinnerCoords(scores, view) {
  const digits = state.digits[view];
  if (digits.rows.length !== GRID_SIZE || digits.cols.length !== GRID_SIZE) {
    return null;
  }
  const rowDigit = scores.seahawks % 10;
  const colDigit = scores.patriots % 10;
  const rowIndex = digits.rows.indexOf(rowDigit);
  const colIndex = digits.cols.indexOf(colDigit);
  if (rowIndex === -1 || colIndex === -1) return null;
  return { rowIndex, colIndex };
}

function getSquareLabel(rowIndex, colIndex) {
  const name = state.grid[rowIndex][colIndex];
  if (!name) return "Unassigned";
  return name;
}

function buildWinningInfo() {
  const scores = state.scores;
  const winner = getWinnerCoords(scores, state.view);
  const viewLabel = state.view === "halftime" ? "Halftime" : "Final";
  const rows = [];
  if (!winner) {
    rows.push(`<div class="row"><strong>${viewLabel} winner</strong><span>Digits not set</span></div>`);
  } else {
    rows.push(
      `<div class="row"><strong>${viewLabel} winner</strong><span>${getSquareLabel(
        winner.rowIndex,
        winner.colIndex
      )}</span></div>`
    );
  }

  const scenarios = [
    { label: "Seahawks +3", seahawks: scores.seahawks + 3, patriots: scores.patriots },
    { label: "Seahawks +7", seahawks: scores.seahawks + 7, patriots: scores.patriots },
    { label: "Patriots +3", seahawks: scores.seahawks, patriots: scores.patriots + 3 },
    { label: "Patriots +7", seahawks: scores.seahawks, patriots: scores.patriots + 7 },
  ];

  scenarios.forEach((scenario) => {
    const coords = getWinnerCoords(scenario, state.view);
    const name = coords ? getSquareLabel(coords.rowIndex, coords.colIndex) : "Digits not set";
    rows.push(`<div class="row"><span>${scenario.label}</span><span>${name}</span></div>`);
  });

  if (state.highlightName) {
    const odds = getUserOdds(state.highlightName, state.oddsView);
    if (odds) {
      const payout = getPayoutForView(state.oddsView);
      const expectedValue = odds * payout;
      rows.push(
        `<div class="row"><span>${state.highlightName} total odds</span><span>${formatPercent(
          odds
        )}</span></div>`
      );
      rows.push(
        `<div class="row"><span>${state.highlightName} expected value</span><span>${formatMoney(
          expectedValue
        )}</span></div>`
      );
    }
  }

  const content = rows.join("");
  if (elements.winningInfo) {
    elements.winningInfo.innerHTML = content;
  }
  if (elements.winningInfoCompact) {
    elements.winningInfoCompact.innerHTML = content;
  }
}

function renderOddsSummary() {
  const participants = getParticipants();
  if (!participants.length) {
    elements.oddsSummary.innerHTML = "";
    return;
  }
  const viewKey = state.oddsView;
  const { oddsByName, hasOutcomes } = buildOddsByName(viewKey);
  if (!hasOutcomes) {
    elements.oddsSummary.innerHTML = "";
    return;
  }
  const payout = getPayoutForView(viewKey);
  const list = participants
    .map((participant) => ({
      name: participant.name,
      odds: oddsByName[participant.name] || 0,
    }))
    .sort((a, b) => b.odds - a.odds);
  const html = `
    <div class="odds-title">
      User odds
      <div class="odds-toggle" role="group" aria-label="Odds view">
        <button type="button" class="toggle ${viewKey === "halftime" ? "active" : ""}" data-odds="halftime">Halftime</button>
        <button type="button" class="toggle ${viewKey === "final" ? "active" : ""}" data-odds="final">Final</button>
      </div>
    </div>
    ${list
      .map(
        (item) => `
          <div class="odds-row">
            <span>${item.name}</span>
            <span>${formatPercent(item.odds)} • ${formatMoney(item.odds * payout)}</span>
          </div>
        `
      )
      .join("")}
  `;
  elements.oddsSummary.innerHTML = html;
  bindOddsToggle(elements.oddsSummary);
}

function buildLikelihoodRows() {
  const digits = state.digits[state.view];
  if (digits.rows.length !== GRID_SIZE || digits.cols.length !== GRID_SIZE) {
    return [];
  }
  const minutesRemaining =
    state.view === "halftime" ? state.timeRemainingHalf : state.timeRemainingGame;
  const elapsedMinutes =
    state.view === "halftime" ? Math.max(0, 30 - minutesRemaining) : Math.max(0, 60 - minutesRemaining);
  const outcomes = getOutcomeProbabilities(minutesRemaining, elapsedMinutes);
  if (!outcomes.length) return [];
  const currentWinner = getWinnerCoords(state.scores, state.view);
  const rows = [];
  if (currentWinner) {
    const currentKey = `${currentWinner.rowIndex}-${currentWinner.colIndex}`;
    const currentOutcome = outcomes.find((item) => item.key === currentKey);
    if (currentOutcome) {
      rows.push(
        `<div class="row"><span>Current winner</span><span>${currentOutcome.name} · ${formatPercent(
          currentOutcome.prob
        )}</span></div>`
      );
    }
  }
  const alternatives = outcomes
    .filter((item) => !currentWinner || item.key !== `${currentWinner.rowIndex}-${currentWinner.colIndex}`)
    .slice(0, 3);
  alternatives.forEach((item) => {
    rows.push(
      `<div class="row"><span>${item.label}</span><span>${item.name} · ${formatPercent(
        item.prob
      )}</span></div>`
    );
  });
  return rows;
}

function getOutcomeProbabilities(minutesRemaining, elapsedMinutes, viewKey = state.view) {
  const minutes = Math.max(0, Number(minutesRemaining || 0));
  const elapsed = Math.max(0, Number(elapsedMinutes || 0));
  const teamADist = buildScoreDistribution(minutes, state.scores.seahawks, elapsed);
  const teamBDist = buildScoreDistribution(minutes, state.scores.patriots, elapsed);
  const digits = state.digits[viewKey];
  const outcomes = new Map();

  Object.entries(teamADist).forEach(([aPoints, aProb]) => {
    Object.entries(teamBDist).forEach(([bPoints, bProb]) => {
      const totalProb = aProb * bProb;
      if (totalProb === 0) return;
      const aDigit = (state.scores.seahawks + Number(aPoints)) % 10;
      const bDigit = (state.scores.patriots + Number(bPoints)) % 10;
      const rowIndex = digits.rows.indexOf(aDigit);
      const colIndex = digits.cols.indexOf(bDigit);
      if (rowIndex === -1 || colIndex === -1) return;
      const digitWeight =
        (DIGIT_PRIOR[aDigit] ?? 0.1) * (DIGIT_PRIOR[bDigit] ?? 0.1);
      const key = `${rowIndex}-${colIndex}`;
      const current = outcomes.get(key) || { prob: 0, rowIndex, colIndex };
      current.prob += totalProb * digitWeight;
      outcomes.set(key, current);
    });
  });

  const list = Array.from(outcomes.values()).sort((a, b) => b.prob - a.prob);
  const total = list.reduce((sum, item) => sum + item.prob, 0);
  if (!total) return [];
  return list.map((item) => ({
    key: `${item.rowIndex}-${item.colIndex}`,
    prob: item.prob / total,
    label: `${digits.rows[item.rowIndex]}-${digits.cols[item.colIndex]} digits`,
    name: getSquareLabel(item.rowIndex, item.colIndex),
    rowIndex: item.rowIndex,
    colIndex: item.colIndex,
  }));
}

function buildScoreDistribution(minutesRemaining, currentScore, elapsedMinutes) {
  if (minutesRemaining <= 0) return { 0: 1 };
  const baselinePointsPerMin = 0.35;
  const pace = elapsedMinutes > 1 ? currentScore / elapsedMinutes : baselinePointsPerMin;
  const paceFactor = clamp(pace / baselinePointsPerMin, 0.6, 1.8);
  const lambda = (minutesRemaining / 8) * paceFactor;
  const maxEvents = Math.max(1, Math.min(7, Math.round((minutesRemaining / 6) * paceFactor) + 1));
  const increments = [
    { points: 7, weight: 0.5 },
    { points: 3, weight: 0.3 },
    { points: 6, weight: 0.08 },
    { points: 8, weight: 0.06 },
    { points: 2, weight: 0.04 },
    { points: 1, weight: 0.02 },
  ];
  const eventWeights = [];
  for (let k = 0; k <= maxEvents; k += 1) {
    eventWeights.push(poisson(lambda, k));
  }
  const totalWeight = eventWeights.reduce((sum, value) => sum + value, 0);
  const normalizedEvents = eventWeights.map((value) => value / totalWeight);

  const maxPoints = 42;
  const distribution = {};
  normalizedEvents.forEach((eventProb, eventCount) => {
    let dist = { 0: 1 };
    for (let i = 0; i < eventCount; i += 1) {
      const next = {};
      Object.entries(dist).forEach(([points, prob]) => {
        increments.forEach((inc) => {
          const total = Number(points) + inc.points;
          if (total > maxPoints) return;
          next[total] = (next[total] || 0) + prob * inc.weight;
        });
      });
      dist = next;
    }
    Object.entries(dist).forEach(([points, prob]) => {
      distribution[points] = (distribution[points] || 0) + prob * eventProb;
    });
  });
  const sum = Object.values(distribution).reduce((acc, value) => acc + value, 0);
  Object.keys(distribution).forEach((key) => {
    distribution[key] /= sum;
  });
  return distribution;
}

function poisson(lambda, k) {
  let result = Math.exp(-lambda);
  for (let i = 1; i <= k; i += 1) {
    result *= lambda / i;
  }
  return result;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function getUserOdds(name, viewKey = state.view) {
  const minutesRemaining =
    viewKey === "halftime" ? state.timeRemainingHalf : state.timeRemainingGame;
  const elapsedMinutes =
    viewKey === "halftime" ? Math.max(0, 30 - minutesRemaining) : Math.max(0, 60 - minutesRemaining);
  const outcomes = getOutcomeProbabilities(minutesRemaining, elapsedMinutes, viewKey);
  if (!outcomes.length) return 0;
  return outcomes.reduce((sum, outcome) => {
    const owner = state.grid[outcome.rowIndex][outcome.colIndex];
    if (!owner) return sum;
    return owner === name ? sum + outcome.prob : sum;
  }, 0);
}

function buildOddsByName(viewKey) {
  const minutesRemaining =
    viewKey === "halftime" ? state.timeRemainingHalf : state.timeRemainingGame;
  const elapsedMinutes =
    viewKey === "halftime" ? Math.max(0, 30 - minutesRemaining) : Math.max(0, 60 - minutesRemaining);
  const outcomes = getOutcomeProbabilities(minutesRemaining, elapsedMinutes, viewKey);
  if (!outcomes.length) return { oddsByName: {}, hasOutcomes: false };
  const oddsByName = outcomes.reduce((acc, outcome) => {
    const owner = state.grid[outcome.rowIndex][outcome.colIndex];
    if (!owner) return acc;
    acc[owner] = (acc[owner] || 0) + outcome.prob;
    return acc;
  }, {});
  return { oddsByName, hasOutcomes: true };
}

function getPayoutForView(viewKey) {
  const assignedSquares = GRID_SIZE * GRID_SIZE - getAvailableSquares().length;
  const totalPot = assignedSquares * state.pricePerSquare;
  const ratio = viewKey === "halftime" ? state.payoutRatio.halftime : state.payoutRatio.final;
  return totalPot * ratio;
}

function bindOddsToggle(container) {
  if (!container) return;
  const buttons = container.querySelectorAll(".odds-toggle .toggle");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      state.oddsView = button.dataset.odds === "final" ? "final" : "halftime";
      saveState({ skipSync: true });
      render();
    });
  });
}

function renderBoard() {
  const digits = state.digits[state.view];
  const winner = getWinnerCoords(state.scores, state.view);
  const minutesRemaining =
    state.view === "halftime" ? state.timeRemainingHalf : state.timeRemainingGame;
  const elapsedMinutes =
    state.view === "halftime" ? Math.max(0, 30 - minutesRemaining) : Math.max(0, 60 - minutesRemaining);
  const outcomes = getOutcomeProbabilities(minutesRemaining, elapsedMinutes);
  const oddsMap = outcomes.reduce((acc, outcome) => {
    acc[`${outcome.rowIndex}-${outcome.colIndex}`] = outcome.prob;
    return acc;
  }, {});
  rowHeaderCells.forEach((cell, index) => {
    cell.textContent = digits.rows[index] ?? "-";
    cell.classList.toggle("highlight", Boolean(winner && winner.rowIndex === index));
  });
  colHeaderCells.forEach((cell, index) => {
    cell.textContent = digits.cols[index] ?? "-";
    cell.classList.toggle("highlight", Boolean(winner && winner.colIndex === index));
  });

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cell = squareCells[row][col];
      const name = state.grid[row][col];
      if (!name) {
        cell.textContent = "";
        cell.style.fontSize = "";
      } else if (isMobileView()) {
        cell.textContent = name.trim().charAt(0).toUpperCase();
        cell.style.fontSize = "";
      } else {
        cell.textContent = name;
        cell.style.fontSize = getNameFontSize(name);
      }
      cell.classList.toggle("assigned", Boolean(name));
      cell.classList.toggle(
        "same-name",
        Boolean(state.highlightName && name === state.highlightName)
      );
      const isWinner = winner && winner.rowIndex === row && winner.colIndex === col;
      const isRow = winner && winner.rowIndex === row;
      const isCol = winner && winner.colIndex === col;
      cell.classList.toggle("highlight-row", Boolean(isRow));
      cell.classList.toggle("highlight-col", Boolean(isCol));
      cell.classList.toggle("winner", Boolean(isWinner));
      const oddsKey = `${row}-${col}`;
      if (oddsMap[oddsKey] != null) {
        cell.title = `Chance: ${formatPercent(oddsMap[oddsKey])}`;
      } else {
        cell.title = "Chance: —";
      }
    }
  }
}

function renderPrintBoard() {
  const teamAShort = normalizeTeamShort(state.teamAName);
  const teamBShort = normalizeTeamShort(state.teamBName);
  printHeaders.labelHalftimeCols.textContent = `HT Cols (${teamBShort})`;
  printHeaders.labelFinalCols.textContent = `Final Cols (${teamBShort})`;
  printHeaders.labelHalftimeRows.textContent = `HT Rows (${teamAShort})`;
  printHeaders.labelFinalRows.textContent = `Final Rows (${teamAShort})`;

  const halftime = state.digits.halftime;
  const final = state.digits.final;

  printHeaders.colHalftime.forEach((cell, index) => {
    cell.textContent = halftime.cols[index] ?? "-";
  });
  printHeaders.colFinal.forEach((cell, index) => {
    cell.textContent = final.cols[index] ?? "-";
  });
  printHeaders.rowHalftime.forEach((cell, index) => {
    cell.textContent = halftime.rows[index] ?? "-";
  });
  printHeaders.rowFinal.forEach((cell, index) => {
    cell.textContent = final.rows[index] ?? "-";
  });

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cell = printCells[row][col];
      if (!cell) continue;
      cell.textContent = state.grid[row][col] || "";
    }
  }
}

function renderPrintTable() {
  if (!elements.printTable) return;
  const teamAName = getTeamLabel(state.teamAName);
  const teamBName = getTeamLabel(state.teamBName);
  elements.printTitle.textContent = state.gameTitle || "Super Bowl";
  elements.printSubtitle.textContent = `${teamAName} vs ${teamBName}`;
  elements.printAxisCols.textContent = teamBName;
  elements.printAxisRows.textContent = teamAName;

  const halftime = state.digits.halftime;
  const final = state.digits.final;

  elements.printTable.innerHTML = "";
  const tableSize = GRID_SIZE + 2;
  for (let row = 0; row < tableSize; row += 1) {
    const tr = document.createElement("tr");
    for (let col = 0; col < tableSize; col += 1) {
      const td = document.createElement("td");
      if (row < 2 && col < 2) {
        td.classList.add("header");
        if (row === 0 && col === 0) td.textContent = "Halftime";
        if (row === 1 && col === 1) td.textContent = "Final";
        if (row === 0 && col === 1) td.textContent = "";
        if (row === 1 && col === 0) td.textContent = "";
      } else if (row < 2) {
        td.classList.add("header");
        const index = col - 2;
        td.textContent = row === 0 ? (halftime.cols[index] ?? "-") : (final.cols[index] ?? "-");
      } else if (col < 2) {
        td.classList.add("header");
        const index = row - 2;
        td.textContent = col === 0 ? (halftime.rows[index] ?? "-") : (final.rows[index] ?? "-");
      } else {
        const rowIndex = row - 2;
        const colIndex = col - 2;
        td.classList.add("name-cell");
        td.textContent = state.grid[rowIndex][colIndex] || "";
      }
      tr.appendChild(td);
    }
    elements.printTable.appendChild(tr);
  }
}

function renderGameInfo() {
  const info = state.gameInfo || {};
  const rows = [];
  if (info.statusDetail) rows.push(["Status", info.statusDetail]);
  if (info.period) rows.push(["Period", `Q${info.period}`]);
  if (info.clock) rows.push(["Clock", info.clock]);
  if (info.possession) rows.push(["Possession", info.possession]);
  if (info.downDistance) rows.push(["Down & distance", info.downDistance]);
  if (info.yardLine) rows.push(["Ball on", info.yardLine]);
  if (info.lastPlay) rows.push(["Last play", info.lastPlay]);
  if (!rows.length) {
    elements.gameInfo.innerHTML =
      '<div class="row"><span>No extra game info.</span><span></span></div>';
    return;
  }
  elements.gameInfo.innerHTML = rows
    .map(([label, value]) => `<div class="row"><span>${label}</span><span>${value}</span></div>`)
    .join("");
}

function renderParticipants() {
  const participants = getParticipants();
  if (!participants.length) {
    elements.participantsList.innerHTML =
      '<div class="hint">No squares assigned yet.</div>';
    return;
  }
  elements.participantsList.innerHTML = participants
    .map(
      (participant) => `
        <div class="participant-row">
          <div class="name">${participant.name}</div>
          <div class="total">${participant.count} • ${formatMoney(
        participant.total
      )}</div>
        </div>
      `
    )
    .join("");
}

function renderParticipantSummary() {
  const participants = getParticipants();
  if (!participants.length) {
    elements.summaryList.innerHTML = '<div class="hint">No squares assigned yet.</div>';
    return;
  }
  const halftimeOdds = buildOddsByName("halftime").oddsByName;
  const finalOdds = buildOddsByName("final").oddsByName;
  const halftimePayout = getPayoutForView("halftime");
  const finalPayout = getPayoutForView("final");
  elements.summaryList.innerHTML = participants
    .map(
      (participant) => `
        <div class="summary-row" data-name="${participant.name}">
          <span>${participant.name}</span>
          <span class="count">${participant.count} • ${formatMoney(participant.total)}</span>
          <span class="meta">
            HT ${formatPercent(halftimeOdds[participant.name] || 0)} • ${formatMoney(
        (halftimeOdds[participant.name] || 0) * halftimePayout
      )} · Final ${formatPercent(finalOdds[participant.name] || 0)} • ${formatMoney(
        (finalOdds[participant.name] || 0) * finalPayout
      )}
          </span>
        </div>
      `
    )
    .join("");
  elements.summaryList.querySelectorAll(".summary-row").forEach((row) => {
    row.addEventListener("click", () => {
      const name = row.dataset.name || "";
      state.highlightName = state.highlightName === name ? "" : name;
      saveState({ skipSync: true });
      render();
    });
  });
}

function render() {
  const remaining = getAvailableSquares().length;
  const assignedSquares = GRID_SIZE * GRID_SIZE - remaining;
  const totalPot = assignedSquares * state.pricePerSquare;
  const halftimePercent = Math.round(state.payoutRatio.halftime * 100);
  const finalPercent = 100 - halftimePercent;
  const teamAName = getTeamLabel(state.teamAName);
  const teamBName = getTeamLabel(state.teamBName);
  const teamAShort = normalizeTeamShort(teamAName);
  const teamBShort = normalizeTeamShort(teamBName);
  const admin = isAdmin();
  placeViewToggle();
  const locked = state.locked.halftime || state.locked.final;
  elements.viewHalftime.classList.toggle("active", state.view === "halftime");
  elements.viewFinal.classList.toggle("active", state.view === "final");
  elements.gameTitle.textContent = state.gameTitle || "Super Bowl";
  document.title = `${elements.gameTitle.textContent} Squares`;
  elements.gameSubtitle.textContent = `${teamAName} vs ${teamBName}`;
  elements.gameClock.textContent = state.gameClock || "Clock —";
  elements.scoreboardStatus.textContent =
    state.gameInfo?.statusDetail || state.gameClock || "Clock —";
  elements.scoreboardDown.textContent = state.gameInfo?.downDistance
    ? `Down & distance: ${state.gameInfo.downDistance}`
    : "Down & distance —";
  elements.teamAName.textContent = teamAName;
  elements.teamBName.textContent = teamBName;
  elements.teamAShort.textContent = teamAShort;
  elements.teamBShort.textContent = teamBShort;
  elements.teamAScore.textContent = state.scores.seahawks;
  elements.teamBScore.textContent = state.scores.patriots;
  const possession = state.gameInfo?.possession || "";
  const teamABadge = elements.teamAName?.closest(".team-badge");
  const teamBBadge = elements.teamBName?.closest(".team-badge");
  if (teamABadge && teamBBadge) {
    teamABadge.classList.toggle(
      "possession",
      matchesPossession(possession, teamAName, teamAShort)
    );
    teamBBadge.classList.toggle(
      "possession",
      matchesPossession(possession, teamBName, teamBShort)
    );
  }
  setLogo(elements.teamALogo, state.teamALogo, `${teamAName} logo`);
  setLogo(elements.teamBLogo, state.teamBLogo, `${teamBName} logo`);
  elements.rowsLabel.textContent = teamAName;
  elements.colsLabel.textContent = teamBName;
  elements.rowsLabel.classList.add("team-a");
  elements.rowsLabel.classList.remove("team-b");
  elements.colsLabel.classList.add("team-b");
  elements.colsLabel.classList.remove("team-a");
  elements.scoreLabelA.textContent = `${teamAName} score`;
  elements.scoreLabelB.textContent = `${teamBName} score`;
  elements.appMain.classList.toggle("collapsed", state.collapsed);
  elements.toggleSidebar.textContent = state.collapsed ? "Show sidebar" : "Focus mode";
  elements.toggleSidebar.disabled = assignedSquares === 0;
  elements.activeDisplay.textContent = state.activeName
    ? `Active participant: ${state.activeName}`
    : "No active participant yet.";
  elements.priceDisplay.textContent = formatMoney(state.pricePerSquare);
  elements.priceInput.value = state.pricePerSquare;
  elements.gameTitleInput.value = state.gameTitle;
  elements.teamAInput.value = state.teamAName;
  elements.teamBInput.value = state.teamBName;
  elements.teamALogoInput.value = state.teamALogo;
  elements.teamBLogoInput.value = state.teamBLogo;
  elements.adminKeyInput.value = admin ? getAdminKey() : "";
  elements.syncStatus.textContent = lastSyncMessage;
  elements.randomizeDigits.style.display = locked ? "none" : "";
  elements.boardRefresh.textContent = lastBoardSync
    ? `Board synced ${new Date(lastBoardSync).toLocaleTimeString()}`
    : "Board synced —";
  elements.ratioHalftime.value = halftimePercent;
  elements.ratioFinal.value = finalPercent;
  elements.totalPot.textContent = formatMoney(totalPot);
  elements.payoutHalftime.textContent = formatMoney(totalPot * state.payoutRatio.halftime);
  elements.payoutFinal.textContent = formatMoney(totalPot * state.payoutRatio.final);
  elements.payoutHalftimeLabel.textContent = `Halftime (${halftimePercent}%)`;
  elements.payoutFinalLabel.textContent = `Final (${finalPercent}%)`;
  elements.scoreSeahawks.value = state.scores.seahawks;
  elements.scorePatriots.value = state.scores.patriots;
  elements.timeRemainingHalf.value = state.timeRemainingHalf;
  elements.timeRemainingGame.value = state.timeRemainingGame;
  elements.scoreRefreshed.textContent = state.lastScoreRefresh
    ? `Score last refreshed at ${new Date(state.lastScoreRefresh).toLocaleTimeString()}`
    : "Score last refreshed at —";
  renderGameInfo();
  elements.adminToggle.checked = state.adminMode;

  elements.randomizeDigits.disabled =
    !admin || !isGridFull() || state.locked.halftime || state.locked.final;
  elements.rerandomize.disabled = !admin || !state.adminMode;
  elements.clearBoard.disabled = !admin || !state.adminMode;
  const quickPickDisabled = !admin || !state.activeName || remaining === 0;
  elements.pick1.disabled = quickPickDisabled;
  elements.pick5.disabled = quickPickDisabled;
  elements.pick10.disabled = quickPickDisabled;
  elements.adminToggle.disabled = !admin;

  renderBoard();
  renderPrintBoard();
  renderPrintTable();
  renderParticipants();
  if (elements.summaryModal.classList.contains("open")) {
    renderParticipantSummary();
  }
  buildWinningInfo();
  renderOddsSummary();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, "superbowl-squares.json");
}

function exportCsv() {
  const rows = state.grid.map((row) => row.map(escapeCsv).join(","));
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  downloadBlob(blob, "superbowl-squares.csv");
}

function escapeCsv(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importFromFile(file) {
  if (!isAdmin()) {
    alert("Read-only mode. Admin key required.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const content = reader.result;
    if (typeof content !== "string") return;
    const trimmed = content.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        state = normalizeState(parsed);
        saveState();
        render();
      } catch (error) {
        alert("Invalid JSON file.");
      }
      return;
    }
    const csvState = parseCsv(trimmed);
    if (csvState) {
      state.grid = csvState;
      state.locked = { halftime: false, final: false };
      state.digits = { halftime: { rows: [], cols: [] }, final: { rows: [], cols: [] } };
      saveState();
      render();
      return;
    }
    alert("Unsupported file format.");
  };
  reader.readAsText(file);
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < GRID_SIZE) return null;
  const grid = [];
  for (let i = 0; i < GRID_SIZE; i += 1) {
    const row = parseCsvLine(lines[i] || "");
    grid.push(row.slice(0, GRID_SIZE).map((cell) => cell.trim()));
  }
  return grid;
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  while (result.length < GRID_SIZE) result.push("");
  return result;
}

async function fetchScore() {
  elements.fetchStatus.textContent = "Fetching score...";
  try {
    const teamAName = getTeamLabel(state.teamAName).toLowerCase();
    const teamBName = getTeamLabel(state.teamBName).toLowerCase();
    if (!teamAName || !teamBName) throw new Error("Teams missing");
    const response = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    );
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();
    const event = (data.events || []).find((item) =>
      (item.competitions || []).some((competition) => {
        const competitors = competition.competitors || [];
        const names = competitors.map((team) =>
          [
            team.team?.displayName,
            team.team?.shortDisplayName,
            team.team?.abbreviation,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
        );
        const hasA = names.some((name) => name.includes(teamAName));
        const hasB = names.some((name) => name.includes(teamBName));
        return hasA && hasB;
      })
    );
    if (!event) throw new Error("Game not found");
    const competition = event.competitions[0];
    const status = competition.status || {};
    const competitors = competition.competitors || [];
    const teamA = competitors.find((team) =>
      `${team.team?.displayName || ""} ${team.team?.shortDisplayName || ""} ${
        team.team?.abbreviation || ""
      }`
        .toLowerCase()
        .includes(teamAName)
    );
    const teamB = competitors.find((team) =>
      `${team.team?.displayName || ""} ${team.team?.shortDisplayName || ""} ${
        team.team?.abbreviation || ""
      }`
        .toLowerCase()
        .includes(teamBName)
    );
    if (!teamA || !teamB) throw new Error("Teams missing");
    state.scores = {
      seahawks: Number(teamA.score || 0),
      patriots: Number(teamB.score || 0),
    };
    const clock = status.displayClock;
    const period = status.period;
    const shortDetail = status.type?.shortDetail || "";
    if (shortDetail) {
      state.gameClock = shortDetail;
    } else if (period && clock) {
      state.gameClock = `Q${period} ${clock}`;
    } else {
      state.gameClock = "";
    }
    const situation = competition.situation || {};
    const possessionTeam =
      situation.possession?.team?.shortDisplayName ||
      situation.possession?.team?.abbreviation ||
      "";
    state.gameInfo = {
      statusDetail: status.type?.shortDetail || "",
      period: status.period || "",
      clock: status.displayClock || "",
      possession: possessionTeam,
      downDistance: situation.shortDownDistanceText || situation.downDistanceText || "",
      yardLine: situation.possessionText || "",
      lastPlay: situation.lastPlay?.text || "",
    };
    if (period) {
      state.view = Number(period) >= 3 ? "final" : "halftime";
    }
    state.lastScoreRefresh = new Date().toISOString();
    elements.fetchStatus.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    saveState();
    render();
  } catch (error) {
    elements.fetchStatus.textContent = "Fetch failed. Use manual scores.";
  }
}

async function testApi() {
  elements.fetchStatus.textContent = "Testing API...";
  try {
    const response = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    );
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();
    const events = data.events || [];
    if (!events.length) throw new Error("No games found");
    const sample = events[0];
    const competition = sample.competitions?.[0];
    const status = competition?.status?.type?.shortDetail || "Status unavailable";
    const teams = (competition?.competitors || [])
      .map((team) => team.team?.shortDisplayName || team.team?.displayName)
      .filter(Boolean)
      .join(" vs ");
    elements.fetchStatus.textContent = `API OK: ${teams || "Game"} · ${status}`;
  } catch (error) {
    elements.fetchStatus.textContent = "API test failed. Check network/CORS.";
  }
}

async function fetchBoardFromServer() {
  try {
    const response = await fetch("/api/board");
    if (response.status === 404 || response.status === 204) {
      setSyncStatus("Backend: no shared board yet", true);
      return;
    }
    if (!response.ok) throw new Error("Network error");
    const payload = await response.json();
    if (!payload || !payload.state) {
      setSyncStatus("Backend: no shared board yet", true);
      return;
    }
    applyServerState(payload.state);
    lastBoardSync = new Date().toISOString();
    setSyncStatus("Backend: synced", true);
    render();
  } catch (error) {
    setSyncStatus("Backend: unavailable", false);
  }
}

async function pushBoardToServer() {
  try {
    const adminKey = getAdminKey();
    if (!adminKey) return;
    const response = await fetch("/api/board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ state: serializeStateForServer() }),
    });
    if (!response.ok) throw new Error("Write failed");
    lastBoardSync = new Date().toISOString();
    setSyncStatus("Backend: saved", true);
  } catch (error) {
    setSyncStatus("Backend: save failed", false);
  }
}

function startAutoFetch() {
  fetchScore();
  window.setInterval(fetchScore, SCORE_REFRESH_MS);
}

function startBoardRefresh() {
  if (isAdmin()) return;
  window.setInterval(fetchBoardFromServer, BOARD_REFRESH_MS);
}

function setupListeners() {
  elements.viewHalftime.addEventListener("click", () => setView("halftime"));
  elements.viewFinal.addEventListener("click", () => setView("final"));
  elements.toggleSidebar.addEventListener("click", toggleSidebar);
  elements.randomizeDigits.addEventListener("click", () => randomizeDigits());
  elements.exportPdf.addEventListener("click", () => window.print());
  elements.setActive.addEventListener("click", setActiveName);
  elements.participantName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") setActiveName();
  });
  elements.pick1.addEventListener("click", () => pickRandomSquares(1));
  elements.pick5.addEventListener("click", () => pickRandomSquares(5));
  elements.pick10.addEventListener("click", () => pickRandomSquares(10));
  elements.scoreSeahawks.addEventListener("input", (event) => {
    state.scores.seahawks = Number(event.target.value || 0);
    saveState();
    render();
  });
  elements.scorePatriots.addEventListener("input", (event) => {
    state.scores.patriots = Number(event.target.value || 0);
    saveState();
    render();
  });
  elements.timeRemainingHalf.addEventListener("input", (event) => {
    state.timeRemainingHalf = Number(event.target.value || 0);
    saveState();
    render();
  });
  elements.timeRemainingGame.addEventListener("input", (event) => {
    state.timeRemainingGame = Number(event.target.value || 0);
    saveState();
    render();
  });
  elements.fetchScore.addEventListener("click", fetchScore);
  elements.testApi.addEventListener("click", testApi);
  elements.priceInput.addEventListener("input", (event) => {
    state.pricePerSquare = Number(event.target.value || 0);
    saveState();
    render();
  });
  elements.adminKeyInput.addEventListener("input", (event) => {
    setAdminKey(event.target.value.trim());
    setSyncStatus("Backend: pending", false);
    render();
    fetchBoardFromServer();
  });
  elements.gameTitleInput.addEventListener("input", (event) => {
    state.gameTitle = event.target.value.trim();
    saveState();
    render();
  });
  elements.teamAInput.addEventListener("input", (event) => {
    state.teamAName = event.target.value.trim();
    saveState();
    render();
  });
  elements.teamALogoInput.addEventListener("input", (event) => {
    state.teamALogo = event.target.value.trim();
    saveState();
    render();
  });
  elements.teamBInput.addEventListener("input", (event) => {
    state.teamBName = event.target.value.trim();
    saveState();
    render();
  });
  elements.teamBLogoInput.addEventListener("input", (event) => {
    state.teamBLogo = event.target.value.trim();
    saveState();
    render();
  });
  elements.ratioHalftime.addEventListener("input", (event) => {
    const value = Math.min(100, Math.max(0, Number(event.target.value || 0)));
    const halftime = value / 100;
    state.payoutRatio = { halftime, final: 1 - halftime };
    saveState();
    render();
  });
  elements.ratioFinal.addEventListener("input", (event) => {
    const value = Math.min(100, Math.max(0, Number(event.target.value || 0)));
    const final = value / 100;
    state.payoutRatio = { halftime: 1 - final, final };
    saveState();
    render();
  });
  elements.adminToggle.addEventListener("change", (event) => {
    state.adminMode = event.target.checked;
    saveState();
    render();
  });
  elements.rerandomize.addEventListener("click", rerandomizeDigits);
  elements.clearBoard.addEventListener("click", clearBoard);
  elements.exportJson.addEventListener("click", exportJson);
  elements.exportCsv.addEventListener("click", exportCsv);
  elements.importFile.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importFromFile(file);
    event.target.value = "";
  });
  elements.openSummary.addEventListener("click", () => {
    elements.summaryModal.classList.add("open");
    elements.summaryModal.setAttribute("aria-hidden", "false");
    renderParticipantSummary();
  });
  elements.closeSummary.addEventListener("click", () => {
    elements.summaryModal.classList.remove("open");
    elements.summaryModal.setAttribute("aria-hidden", "true");
  });
  elements.summaryBackdrop.addEventListener("click", () => {
    elements.summaryModal.classList.remove("open");
    elements.summaryModal.setAttribute("aria-hidden", "true");
  });
  window.addEventListener("resize", render);
}

buildGrid();
buildPrintGrid();
setupListeners();
render();
fetchBoardFromServer().finally(() => {
  render();
  startAutoFetch();
  startBoardRefresh();
});
