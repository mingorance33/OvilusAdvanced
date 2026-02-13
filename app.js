const modes = {
  dictionary: "dictionary",
  energy: "energy",
  proximity: "proximity",
};

let currentMode = modes.energy;

const wordEl = document.getElementById("word");

// Comprobar que el script se ha cargado
console.log("app.js cargado");

// Escuchar clicks en los botones
document.querySelectorAll("button[data-mode]").forEach(btn => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    currentMode = mode;
    console.log("Modo:", mode);

    // marcar botón activo
    document
      .querySelectorAll("button[data-mode]")
      .forEach(b => b.classList.toggle("active", b === btn));

    // cambiar texto en pantalla para confirmar
    if (mode === modes.energy) wordEl.textContent = "ENERGY MODE";
    if (mode === modes.dictionary) wordEl.textContent = "DICTIONARY MODE";
    if (mode === modes.proximity) wordEl.textContent = "PROXIMITY MODE";
  });
});
