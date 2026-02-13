// Modos disponibles
const modes = {
  dictionary: "dictionary",
  energy: "energy",
  proximity: "proximity",
};

let currentMode = modes.energy;

// Audio / energía
let audioContext;
let analyser;
let dataArray;
let micStream;
let rafId;

// Diccionario
let wordList = [];
let wordsLoaded = false;
let currentWordIndex = 0;
let dictionaryIntervalId = null;

// DOM
const wordEl = document.getElementById("word");
const barsLeft = document.getElementById("bars-left");
const barsRight = document.getElementById("bars-right");

// Crear barras visuales
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

// Cargar palabras desde words.json
async function loadWords() {
  if (wordsLoaded) return;
  try {
    const res = await fetch("./words.json");
    const json = await res.json();
    wordList = Array.isArray(json.words) ? json.words : [];
    wordsLoaded = true;
  } catch (err) {
    console.error("Error cargando words.json", err);
    wordList = [];
  }
}

// Actualizar nivel de barras (0–1)
function setBarsLevel(level) {
  const maxIndex = Math.floor(level * leftSegments.length);

  leftSegments.forEach((el, i) =>
