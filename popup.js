const fieldsDiv = document.getElementById("fields");
const addBtn = document.getElementById("addField");
const saveBtn = document.getElementById("save");

const importBtn = document.getElementById("importFields");
const importFile = document.getElementById("importFile");

const exportBtn = document.getElementById("exportFields");

// Fonction pour créer un champ clé/valeur dans le DOM
function createField(key = "", value = "") {
  const div = document.createElement("div");
  div.className = "field";
  div.innerHTML = `<input type="text" placeholder="Question (label)" value="${key}"/> 
                     <input type="text" placeholder="Réponse" value="${value}"/>`;
  fieldsDiv.appendChild(div);
}

// Charger les champs sauvegardés depuis chrome.storage.local
function loadFields() {
  chrome.storage.local.get("fields", ({ fields }) => {
    if (fields && fields.length > 0) {
      fields.forEach((f) => createField(f.key, f.value));
    } else {
      createField(); // Au moins un champ vide par défaut
    }
  });
}

// Ajouter un nouveau champ vide
addBtn.addEventListener("click", () => createField());

// Sauvegarder tous les champs dans storage et remplir le formulaire

async function saveAndFill() {
  const fieldElements = document.querySelectorAll(".field");
  const answers = [];
  const answerObject = {};

  fieldElements.forEach((f) => {
    const inputs = f.querySelectorAll("input");
    const key = inputs[0].value.trim();
    const value = inputs[1].value.trim();
    if (key) {
      answers.push({ key, value }); // pour sauvegarde
      answerObject[key] = value; // pour remplir le form
    }
  });

  // Sauvegarder les champs pour restauration future
  chrome.storage.local.set({ fields: answers, answers: answerObject }, () => {
    console.log("Champs sauvegardés :", answers);
  });

  // Après avoir sauvegardé les réponses
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(
    tab.id,
    { action: "fillForm", answers: answerObject },
    (response) => {
      console.log("Form rempli:", response);
    }
  );
}

saveBtn.addEventListener("click", saveAndFill);

// Handle import button click
importBtn.addEventListener("click", () => importFile.click());

// Handle file selection
importFile.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedFields = JSON.parse(e.target.result);
      if (!Array.isArray(importedFields)) throw new Error("Format invalide");
      fieldsDiv.innerHTML = "";
      importedFields.forEach((f) => createField(f.key, f.value));
      chrome.storage.local.set({ fields: importedFields });
      alert("✅ Champs importés avec succès !");
    } catch (err) {
      alert("❌ Erreur lors de l’import : " + err.message);
    }
  };
  reader.readAsText(file);
});

// Handle export button click
exportBtn.addEventListener("click", () => {
  chrome.storage.local.get("fields", ({ fields }) => {
    if (!fields || fields.length === 0) {
      alert("Aucun champ à exporter !");
      return;
    }
    const blob = new Blob([JSON.stringify(fields, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "google_form_fields.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Charger les champs existants au démarrage du popup
window.addEventListener("DOMContentLoaded", loadFields);
