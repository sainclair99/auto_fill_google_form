console.log("Content script chargé");
// Fonction pour remplir le formulaire avec un objet answers
function fillForm(answers) {
  setTimeout(() => {
    const questions = document.querySelectorAll('div[role="listitem"]');

    questions.forEach((q) => {
      const labelEl =
        q.querySelector('div[role="heading"]') ||
        q.querySelector("div[aria-label]");

      if (!labelEl) return;

      const questionText = labelEl.innerText.split("*").join("").trim();

      // Normaliser le texte pour une comparaison plus robuste
      const normalizedQuestion = normalizeText(questionText);

      // Trouver la clé correspondante dans answers
      const matchedKey = Object.keys(answers).find((k) => {
        const normalizedKey = normalizeText(k);
        // Correspondance floue : la clé est contenue dans la question ou inversement
        return normalizedQuestion.includes(normalizedKey);
        //  ||
        // normalizedKey.includes(normalizedQuestion)
      });

      if (!matchedKey) return; // pas de correspondance trouvée

      const answer = answers[matchedKey];

      // * --- Texte simple ou paragraphe ---
      const input = q.querySelector('input[type="text"], textarea');
      if (input) {
        input.value = answer;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }

      // * --- Choix multiples (radio buttons) ---
      const radioOptions = q.querySelectorAll('div[role="radio"]');
      if (radioOptions.length > 0) {
        radioOptions.forEach((option) => {
          if (option.ariaLabel.trim() === answer) {
            option.click();
          }
        });
        return;
      }

      // * --- Cases à cocher (checkboxes) ---
      const checkOptions = q.querySelectorAll('div[role="checkbox"]');
      if (checkOptions.length > 0) {
        // Supporte plusieurs réponses séparées par des virgules
        const answersArray = Array.isArray(answer)
          ? answer
          : answer.split("&").map((a) => a.trim());
        checkOptions.forEach((option) => {
          if (answersArray.includes(option.ariaLabel.trim())) {
            option.click();
          }
        });
        return;
      }

      // * --- Date ---
      const dateInput = q.querySelector('input[type="date"]');
      console.log("Date input found:", dateInput);
      if (dateInput) {
        dateInput.value = answer; // format attendu : "YYYY-MM-DD"
        dateInput.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }

      //! --- Dropdown (select menus) ---
      const selectMenu = q.querySelector("select");
      if (selectMenu) {
        for (let option of selectMenu.options) {
          if (option.text.trim() === answer) {
            selectMenu.value = option.value;
            selectMenu.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }
    });

    //* Cliquer sur le bouton Soumettre si disponible
    const submitBtn = document.querySelector(
      "div[role='button'][aria-disabled='false']"
    );
    if (submitBtn) submitBtn.click();
  }, 1000);
}

//* Écouter les messages depuis popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    fillForm(request.answers);
    sendResponse({ status: "ok" });
  }
});

// Nettoie et simplifie le texte d'une question ou d'une clé
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ") // remplacer les espaces multiples par un seul
    .replace(/[^\w\sÀ-ÿ?]/g, "") // supprimer ponctuation sauf les lettres accentuées
    .trim();
}
