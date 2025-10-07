const fieldsDiv = document.getElementById("fields");
const addBtn = document.getElementById("addField");
const saveBtn = document.getElementById("save");

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
saveBtn.addEventListener("click", async () => {
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
});

// Charger les champs existants au démarrage du popup
window.addEventListener("DOMContentLoaded", loadFields);
