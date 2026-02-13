const modes = {
  dictionary: "dictionary",
  energy: "energy",
  proximity: "proximity",
};

let currentMode = modes.energy;
let audioContext;
let analyser;
let dataArray;
let micStream;
let rafId;
let currentWordIndex = 0;

const wordEl = document.getElementById("word");
const barsLeft = document.getElementById("bars-left");
const barsRight = document.getElementById("bars-right");

// palabras tipo “diccionario” para ITC teatral
const wordList = [
  "HELLO",
  "WHO",
  "HERE",
  "COLD",
  "DARK",
  "LEAVE",
  "STAY",
  "YES",
  "NO",
];

// crear barras
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

function setBarsLevel(level) {
  const maxIndex = Math.floor(level * leftSegments.length);
  leftSegments.forEach((el, i) => {
    el.classList.toggle("active", i < maxIndex);
  });
  rightSegments.forEach((el, i) => {
    el.classList.toggle("active", i < maxIndex);
  });

  wordEl.classList.toggle("glitch", level > 0.6);
}

async function initAudio() {
  if (audioContext) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(micStream);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);
}

function getEnergyLevel() {
  if (!analyser || !dataArray) return 0;

  analyser.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = (dataArray[i] - 128) / 128;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / dataArray.length); // 0–1 aprox
  return Math.min(1, rms * 4);
}

function handleOrientationEvent(e) {
  // usar cambios de orientación como “EMF”
  const alpha = e.alpha || 0;
  const beta = e.beta || 0;
  const gamma = e.gamma || 0;
  const mag = Math.abs(alpha) + Math.abs(beta) + Math.abs(gamma);
  const level = Math.min(1, mag / 180);
  setBarsLevel(level);
}

function tick() {
  if (currentMode === modes.energy) {
    const level = getEnergyLevel();
    setBarsLevel(level);
  }
  rafId = requestAnimationFrame(tick);
}

function stopAll() {
  cancelAnimationFrame(rafId);
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  window.removeEventListener("deviceorientation", handleOrientationEvent);
}

async function switchMode(mode) {
  stopAll();
  currentMode = mode;

  document
    .querySelectorAll("button[data-mode]")
    .forEach(btn => btn.classList.toggle("active", btn.dataset.mode === mode));

  if (mode === modes.energy) {
    await initAudio();
    tick();
  } else if (mode === modes.dictionary) {
    // modo palabra aleatoria influida por “energía” del micrófono
    await initAudio();
    tick();
    setInterval(() => {
      const level = getEnergyLevel();
      if (level > 0.45) {
        currentWordIndex =
          (currentWordIndex + 1 + Math.floor(Math.random() * 3)) %
          wordList.length;
        wordEl.textContent = wordList[currentWordIndex];
      }
    }, 1200);
  } else if (mode === modes.proximity) {
    if ("ondeviceorientation" in window) {
      window.addEventListener("deviceorientation", handleOrientationEvent);
    }
  }
}

// manejar botones
document.querySelectorAll("button[data-mode]").forEach(btn => {
  btn.addEventListener("click", () => switchMode(btn.dataset.mode));
});

// iniciar en Energy
switchMode(modes.energy).catch(console.error);
