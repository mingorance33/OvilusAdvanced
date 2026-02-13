const modes = {
  dictionary: "dictionary",
  energy: "energy",
  proximity: "proximity",
};

let currentMode = modes.energy;

// audio
let audioContext;
let analyser;
let dataArray;
let micStream;
let rafId;

// diccionario
let wordList = [];
let wordsLoaded = false;
let currentWordIndex = 0;
let dictionaryIntervalId = null;

const wordEl = document.getElementById("word");
const barsLeft = document.getElementById("bars-left");
const barsRight = document.getElementById("bars-right");

// barras
function createBars(container) {
  for (let i = 0; i < 16; i++) {
    const span = document.createElement("span");
    container.appendChild(span);
  }
}
createBars(barsLeft);
createBars(barsRight);

const leftSegments = Array.from(barsLeft.children);
const rightSegments = Array.from(barsRight.children);

// logs de control
console.log("app.js cargado");

// cargar JSON
async function loadWords() {
  if (wordsLoaded) return;
  try {
    const res = await fetch("./words.json");
    const json = await res.json();
    wordList = Array.isArray(json.words) ? json.words : [];
    wordsLoaded = true;
    console.log("Words cargadas:", wordList.length);
  } catch (err) {
    console.error("Error cargando words.json", err);
    wordList = [];
  }
}

// barras según nivel 0–1
function setBarsLevel(level) {
  const maxIndex = Math.floor(level * leftSegments.length);
  leftSegments.forEach((el, i) => el.classList.toggle("active", i < maxIndex));
  rightSegments.forEach((el, i) => el.classList.toggle("active", i < maxIndex));
  wordEl.classList.toggle("glitch", level > 0.6);
}

// iniciar audio SOLO tras click
async function initAudio() {
  if (audioContext) return;
  try {
    console.log("Pidiendo permiso de micro…");
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(micStream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    console.log("Micrófono OK");
  } catch (err) {
    console.error("Error initAudio()", err);
    wordEl.textContent = "NO MIC";
  }
}

function getEnergyLevel() {
  if (!analyser || !dataArray) return 0;
  analyser.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = (dataArray[i] - 128) / 128;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / dataArray.length);
  return Math.min(1, rms * 4);
}

function tick() {
  if (currentMode === modes.energy || currentMode === modes.dictionary) {
    const level = getEnergyLevel();
    setBarsLevel(level);
  }
  rafId = requestAnimationFrame(tick);
}

function stopAll() {
  cancelAnimationFrame(rafId);

  if (dictionaryIntervalId) {
    clearInterval(dictionaryIntervalId);
    dictionaryIntervalId = null;
  }

  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

// cambio de modo
async function switchMode(mode) {
  console.log("Modo:", mode);
  stopAll();
  currentMode = mode;

  document
    .querySelectorAll("button[data-mode]")
    .forEach(b =>
      b.classList.toggle("active", b.dataset.mode === mode)
    );

  if (mode === modes.energy) {
    wordEl.textContent = "ENERGY MODE";
    await initAudio();
    if (!audioContext) return;
    tick();
  }

  if (mode === modes.dictionary) {
    await loadWords();
    if (!wordList.length) {
      wordEl.textContent = "NO DATA";
      return;
    }
    wordEl.textContent = "DICTIONARY MODE";
    await initAudio();
    if (!audioContext) return;
    tick();

    dictionaryIntervalId = setInterval(() => {
      const level = getEnergyLevel();
      if (level > 0.25) {
        const jump = 1 + Math.floor(Math.random() * 3);
        currentWordIndex = (currentWordIndex + jump) % wordList.length;
        wordEl.textContent = String(
          wordList[currentWordIndex]
        ).toUpperCase();
      }
    }, 800);
  }

  if (mode === modes.proximity) {
    wordEl.textContent = "PROXIMITY MODE";
    // de momento solo texto, luego metemos sensores
  }
}

// listeners de botones
document.querySelectorAll("button[data-mode]").forEach(btn => {
  btn.addEventListener("click", () => switchMode(btn.dataset.mode));
});
