const colors = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff",
  magenta: "#ff00ff",
  cyan: "#00ffff",
  yellow: "#ffff00",
  white: "#ffffff",
  black: "#000000",
  gray: "#808080",
};

let input = [
  { id: "red" },
  { id: "green" },
  { id: "blue" },
  { id: "magenta" },
  { id: "cyan" },
  { id: "yellow" },
  { id: "white" },
  { id: "black" },
  { id: "gray" },
  { id: "default" },
  { id: "red2" },
  { id: "green2" },
  // { id: "blue2" },
  // { id: "magenta2" },
  // { id: "cyan2" },
  // { id: "yellow2" },
  // { id: "white2" },
  // { id: "black2" },
  // { id: "gray2" },
  // { id: "default2" },
];

let numCols = 0;
let automaticShuffle = document.getElementById("autoToggle").checked;
let prevAutomaticShuffle = automaticShuffle;
let autoTimer = null;
let autoInterval = null;
const AUTO_DELAY = 1000;

function parseData(items, maxRows = null, maxCols = null) {
  const total = items.length;
  let cols;

  if (maxCols != null) {
    cols = maxCols;
  } else if (maxRows != null) {
    cols = Math.floor(total / maxRows) || total;
  } else {
    cols = total;
  }

  // only full rows
  const fullRows = Math.floor(total / cols);
  const rows = maxRows != null ? Math.min(fullRows, maxRows) : fullRows;

  const grid = {};
  for (let r = 1; r <= rows; r++) {
    grid[r] = items.slice((r - 1) * cols, r * cols);
  }

  numCols = cols; // <-- save here
  const overflow = items.slice(rows * cols);
  return { grid, overflow };
}

function renderAll() {
  Object.keys(data).forEach((key) => renderRow(key));
  updateDebug();
}

function injectColumnArrows() {
  const gridEl = document.getElementById("grid");
  const upBar = document.createElement("div");
  upBar.className = "col-controls up";
  const downBar = document.createElement("div");
  downBar.className = "col-controls down";

  for (let c = 1; c <= numCols; c++) {
    const up = document.createElement("button");
    up.textContent = "↑";
    up.classList.add("arrow");
    up.dataset.col = c;
    up.addEventListener("click", () => rotateColumnUp(c));
    upBar.appendChild(up);

    const down = document.createElement("button");
    down.textContent = "↓";
    down.classList.add("arrow");
    down.dataset.col = c;
    down.addEventListener("click", () => rotateColumnDown(c));
    downBar.appendChild(down);
  }

  gridEl.prepend(upBar);
  gridEl.append(downBar);
}

function getArray(row) {
  const key = String(row);
  if (!data[key]) {
    throw new Error(`Invalid Row "${row}"`);
  }
  return data[key];
}

function renderRow(i) {
  if (!document.getElementById(`row${i}`)) {
    const d = document.createElement("div");
    d.className = "row";
    d.id = `row${i}`;
    document.getElementById("grid").appendChild(d);
  }
  const container = document.getElementById(`row${i}`);
  container.replaceChildren();
  const arr = data[i];
  const cardsWrapper = document.createElement("div");
  cardsWrapper.className = "cards";
  const left = document.createElement("button");
  left.textContent = "→";
  left.classList.add("arrow", "left");
  left.addEventListener("click", () => rotateRowLeft(i));
  cardsWrapper.appendChild(left);
  arr.forEach((item) => {
    const c = document.createElement("div");
    c.className = "card";
    c.dataset.id = item.id;
    c.textContent = item.text ?? "no text value";
    c.style.backgroundColor = colors[item.id] || colors.default;
    c.setAttribute("draggable", true);
    c.dataset.row = i;
    c.dataset.idx = arr.indexOf(item);
    if (colors[item.id] === "#000000") c.style.color = colors.white;
    c.addEventListener("dragstart", (e) => {
      // pause auto‐shuffle
      prevAutomaticShuffle = automaticShuffle;
      automaticShuffle = false;
      clearTimeout(autoTimer);

      // existing dataTransfer logic
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          row: e.target.dataset.row,
          idx: +e.target.dataset.idx,
        }),
      );
    });

    c.addEventListener("dragend", () => {
      // restore auto‐shuffle
      automaticShuffle = prevAutomaticShuffle;
      if (automaticShuffle) startAutoShuffle();
    });

    c.addEventListener("dragover", (e) => e.preventDefault());
    c.addEventListener("drop", (e) => {
      const src = JSON.parse(e.dataTransfer.getData("text/plain"));
      const tgt = { row: e.target.dataset.row, idx: +e.target.dataset.idx };
      const a = getArray(src.row),
        b = getArray(tgt.row);
      [a[src.idx], b[tgt.idx]] = [b[tgt.idx], a[src.idx]];
      renderAll();
    });
    cardsWrapper.appendChild(c);
  });
  const right = document.createElement("button");
  right.textContent = "←";
  right.classList.add("arrow", "right");
  right.addEventListener("click", () => rotateRowRight(i));
  cardsWrapper.appendChild(right);
  container.appendChild(cardsWrapper);
}

function rotateRowLeft(r) {
  const rowArr = data[r];
  if (!rowArr.length || !overflow.length) return;
  // move last row item → front of overflow
  overflow.unshift(rowArr.pop());
  // move last overflow item → front of this row
  rowArr.unshift(overflow.pop());
  renderAll();
}

function rotateRowRight(r) {
  const rowArr = data[r];
  if (!rowArr.length || !overflow.length) return;
  // move first row item → end of overflow
  overflow.push(rowArr.shift());
  // move first overflow item → end of this row
  rowArr.push(overflow.shift());
  renderAll();
}

function rotateColumnUp(colIndex) {
  const rows = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b);
  const c = colIndex - 1;

  if (overflow.length) {
    // existing behavior when overflow exists
    const top = data[rows[0]][c];
    for (let i = 0; i < rows.length - 1; i++) {
      data[rows[i]][c] = data[rows[i + 1]][c];
    }
    data[rows[rows.length - 1]][c] = overflow.shift();
    overflow.push(top);
  } else {
    // pure circular shift within the grid
    const top = data[rows[0]][c];
    for (let i = 0; i < rows.length - 1; i++) {
      data[rows[i]][c] = data[rows[i + 1]][c];
    }
    data[rows[rows.length - 1]][c] = top;
  }

  renderAll();
}

function rotateColumnDown(colIndex) {
  const rows = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b);
  const c = colIndex - 1;

  if (overflow.length) {
    // existing behavior when overflow exists
    const bottom = data[rows[rows.length - 1]][c];
    for (let i = rows.length - 1; i > 0; i--) {
      data[rows[i]][c] = data[rows[i - 1]][c];
    }
    data[rows[0]][c] = overflow.pop();
    overflow.unshift(bottom);
  } else {
    // pure circular shift within the grid
    const bottom = data[rows[rows.length - 1]][c];
    for (let i = rows.length - 1; i > 0; i--) {
      data[rows[i]][c] = data[rows[i - 1]][c];
    }
    data[rows[0]][c] = bottom;
  }

  renderAll();
}

function updateDebug() {
  const pre = document.getElementById("debug");
  if (!pre) return;
  let text = "";
  for (const [r, arr] of Object.entries(data)) {
    text += `Row ${r}: ${arr.map((it) => it.id).join(", ")}\n`;
  }
  if (overflow.length) {
    text += `Overflow: ${overflow.map((it) => it.id).join(", ")}\n`;
  }
  pre.textContent = text;
}

document.getElementById("toggle").addEventListener("click", () => {
  let pre = document.getElementById("debug");
  if (!pre) {
    pre = Object.assign(document.createElement("pre"), { id: "debug" });
    document.body.appendChild(pre);
  }
  updateDebug();
});

function doRandomShuffle() {
  // pick one random arrow button
  const arrows = Array.from(document.querySelectorAll(".arrow"));
  if (!arrows.length) return;
  const btn = arrows[Math.floor(Math.random() * arrows.length)];
  btn.click(); // invoke its handler
}

function startAutoShuffle() {
  // stopAutoShuffle(); // clear any existing
  autoInterval = setInterval(() => {
    if (automaticShuffle) doRandomShuffle();
  }, 3000);
}

function stopAutoShuffle() {
  if (autoInterval != null) {
    clearInterval(autoInterval);
    autoInterval = null;
  }
}

// wire the checkbox once
document.getElementById("autoToggle").addEventListener("change", (e) => {
  automaticShuffle = e.target.checked;
  if (automaticShuffle) startAutoShuffle();
  else stopAutoShuffle();
});

// kick it off if pre-checked
if (automaticShuffle) startAutoShuffle();

const { grid: data, overflow } = parseData(input, 5, 3);
injectColumnArrows();
renderAll();
