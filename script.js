document.addEventListener("DOMContentLoaded", () => {
  // KONFIGURASI PENTING
  const GEMINI_API_KEY = "AIzaSyDznTJSKqJ9-KRvEhFK9awuLJVdMAbMc5E";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  // SELEKSI ELEMEN DOM
  const promptTextElement = document.getElementById("prompt-text");
  const feedbackTextElement = document.getElementById("feedback-text");
  const speakQuizButton = document.getElementById("speak-quiz-btn");
  const nextButton = document.getElementById("next-btn");
  const resultTextElement = document.getElementById("result-text");
  const answerInput = document.getElementById("answer-input");
  const checkButton = document.getElementById("check-btn");
  const chatWindow = document.getElementById("chat-window");
  const talkButton = document.getElementById("talk-btn");
  const voiceSelect = document.getElementById("voice-select");
  const avatarDisplay = document.getElementById("current-avatar");
  const avatarOptions = document.querySelectorAll(".avatar-option");
  const translationQuizBtn = document.getElementById("translation-quiz-btn");
  const verbQuizBtn = document.getElementById("verb-quiz-btn");
  const wordsQuizBtn = document.getElementById("words-quiz-btn");
  const translationQuizSection = document.getElementById("translation-quiz");
  const verbQuizSection = document.getElementById("verb-quiz");
  const wordsQuizSection = document.getElementById("words-quiz");
  const verbPromptTextElement = document.getElementById("verb-prompt-text");
  const verbPromptLabelElement = document.getElementById("verb-prompt-label");
  const v1Input = document.getElementById("v1-input");
  const v2Input = document.getElementById("v2-input");
  const v3Input = document.getElementById("v3-input");
  const sentenceInput = document.getElementById("sentence-input");
  const checkVerbButton = document.getElementById("check-verb-btn");
  const nextVerbButton = document.getElementById("next-verb-btn");
  const revealVerbButton = document.getElementById("reveal-verb-btn");
  const verbFeedbackTextElement = document.getElementById("verb-feedback-text");
  const verbResultTextElement = document.getElementById("verb-result-text");
  const wordsPromptTextElement = document.getElementById("words-prompt-text");
  const wordsPromptLabelElement = document.getElementById("words-prompt-label");
  const wordsAnswerInput = document.getElementById("words-answer-input");
  const checkWordsButton = document.getElementById("check-words-btn");
  const nextWordsButton = document.getElementById("next-words-btn");
  const speakWordsButton = document.getElementById("speak-words-btn");
  const wordsFeedbackTextElement = document.getElementById(
    "words-feedback-text"
  );
  const wordsResultTextElement = document.getElementById("words-result-text");
  const wordInfoContainer = document.getElementById("word-info-container");
  const wordsTypeSelect = document.getElementById("words-type-select");
  const wordsDifficultySelect = document.getElementById(
    "words-difficulty-select"
  );
  const categoryOptions = document.querySelectorAll(".category-option");
  const totalQuestionsElement = document.getElementById("total-questions");
  const correctAnswersElement = document.getElementById("correct-answers");
  const accuracyRateElement = document.getElementById("accuracy-rate");
  const weakWordsListElement = document.getElementById("weak-words-list");

  // STATE APLIKASI
  let resetConfirmationTimeout;
  let practicePairs = [];
  let currentPair = {};
  let activeFeature = "";
  let currentAvatar = "assets/images/avatars/ai1.png";
  let isRecording = false;
  let recognitionTimeout;
  let verbList = [];
  let currentVerb = {};
  let wordsList = [];
  let currentWord = {};
  let currentQuizType = "translation";
  let currentVerbExerciseType = "forms";
  let currentCategory = "all";
  let currentWordsType = "mixed";
  let currentWordsDifficulty = "all";
  let currentTranslationDirection = "en-id";
  let currentWordsDirection = "mixed";

  let userProgress = {
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: {},
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
  };

  // INISIALISASI WEB API
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Maaf, browser Anda tidak mendukung Web Speech API.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.continuous = false;

  const synth = window.speechSynthesis;
  let voices = [];

  // FUNGSI-FUNGSI UTAMA
  function resetUserProgress() {
    userProgress = {
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: {},
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };

    localStorage.setItem("userProgress", JSON.stringify(userProgress));
    updateProgressUI();

    // Hide confirmation and show success message
    const resetConfirmation = document.getElementById("reset-confirmation");
    resetConfirmation.innerHTML =
      '<i class="fas fa-check-circle"></i> Progress reset successfully!';
    resetConfirmation.style.color = "var(--success-color)";

    clearTimeout(resetConfirmationTimeout);
    resetConfirmationTimeout = setTimeout(() => {
      resetConfirmation.classList.add("hidden");
      resetConfirmation.innerHTML =
        'Are you sure? This cannot be undone! \
      <button id="confirm-reset-btn" class="holographic-button danger"> \
        <i class="fas fa-check"></i> Yes, Reset \
      </button> \
      <button id="cancel-reset-btn" class="holographic-button"> \
        <i class="fas fa-times"></i> Cancel \
      </button>';
      resetConfirmation.style.color = "";
    }, 2000);
  }

  function populateVoiceList() {
    voices = synth.getVoices();
    voiceSelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Select a voice...";
    defaultOption.value = "";
    voiceSelect.appendChild(defaultOption);

    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.textContent = `${voice.name} (${voice.lang})`;
      option.setAttribute("data-name", voice.name);
      option.setAttribute("data-lang", voice.lang);
      voiceSelect.appendChild(option);
    });
  }

  function calculateAccuracy(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    const longer = Math.max(str1.length, str2.length);
    if (longer === 0) return 100;

    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    const distance = matrix[str2.length][str1.length];
    return Math.round(((longer - distance) / longer) * 100);
  }

  async function loadPracticePairs() {
    try {
      let categoryFile = "data/kamus.json";
      if (currentCategory !== "all") {
        categoryFile = `data/kamus_${currentCategory}.json`;
      }

      const response = await fetch(categoryFile);
      if (!response.ok) throw new Error(`Failed to load dictionary.`);

      practicePairs = await response.json();
      if (practicePairs.length > 0) {
        getNewQuestion();
      } else {
        feedbackTextElement.textContent =
          "No questions available for this category";
      }
    } catch (error) {
      console.error(error);
      feedbackTextElement.textContent = error.message;
      feedbackTextElement.style.color = "var(--error-color)";
    }
  }

  function getNewQuestion() {
    if (practicePairs.length === 0) return;

    const randomIndex = Math.floor(Math.random() * practicePairs.length);
    currentPair = practicePairs[randomIndex];

    // Set prompt based on translation direction
    if (currentTranslationDirection === "en-id") {
      promptTextElement.textContent = currentPair.en;
      answerInput.placeholder = "Type Indonesian translation here...";
    } else {
      promptTextElement.textContent = currentPair.id;
      answerInput.placeholder = "Type English translation here...";
    }

    feedbackTextElement.textContent =
      "Speak the sentence and type the translation.";
    feedbackTextElement.style.color = "var(--text-color)";
    answerInput.value = "";
    answerInput.disabled = false;
    resultTextElement.textContent = "";
    checkButton.classList.remove("hidden");
    nextButton.classList.add("hidden");

    promptTextElement.style.animation = "none";
    void promptTextElement.offsetWidth;
    promptTextElement.style.animation = "glow 1.5s ease-in-out";
  }

  function checkAnswer() {
    const userAnswer = answerInput.value.trim().toLowerCase();
    let correctAnswer, isCorrect;

    if (currentTranslationDirection === "en-id") {
      correctAnswer = currentPair.id.toLowerCase();
    } else {
      correctAnswer = currentPair.en.toLowerCase();
    }

    const accuracy = calculateAccuracy(userAnswer, correctAnswer);
    isCorrect = userAnswer === correctAnswer;
    updateProgress(isCorrect, currentPair.en);

    if (isCorrect) {
      feedbackTextElement.innerHTML = `<i class="fas fa-check-circle"></i> Correct translation! (${accuracy}% accuracy)`;
      feedbackTextElement.style.color = "var(--success-color)";
      feedbackTextElement.classList.add("correct-animation");
      setTimeout(() => {
        feedbackTextElement.classList.remove("correct-animation");
      }, 1000);
    } else {
      feedbackTextElement.innerHTML = `<i class="fas fa-times-circle"></i> Incorrect (${accuracy}% accuracy). The correct translation is: <strong>"${currentPair.id}"</strong>`;
      feedbackTextElement.style.color = "var(--error-color)";
    }

    answerInput.disabled = true;
    checkButton.classList.add("hidden");
    nextButton.classList.remove("hidden");
  }

  // Words Quiz Functions
  async function loadWords() {
    try {
      const response = await fetch("data/words.json");
      if (!response.ok) throw new Error(`Failed to load words.`);

      let words = await response.json();

      // Filter by type
      if (currentWordsType !== "mixed") {
        words = words.filter((word) => word.type === currentWordsType);
      }

      // Filter by difficulty
      if (currentWordsDifficulty !== "all") {
        words = words.filter((word) => {
          if (currentWordsDifficulty === "easy")
            return word.difficulty === "common";
          if (currentWordsDifficulty === "medium")
            return word.difficulty === "uncommon";
          return true;
        });
      }

      wordsList = words;
      if (wordsList.length > 0) {
        getNewWord();
      } else {
        wordsFeedbackTextElement.textContent =
          "No words available for these filters";
      }
    } catch (error) {
      console.error(error);
      wordsFeedbackTextElement.textContent = error.message;
      wordsFeedbackTextElement.style.color = "var(--error-color)";
    }
  }

  function getNewWord() {
    if (wordsList.length === 0) return;

    const randomIndex = Math.floor(Math.random() * wordsList.length);
    currentWord = wordsList[randomIndex];

    // Determine direction
    let direction = currentWordsDirection;
    if (direction === "mixed") {
      direction = Math.random() > 0.5 ? "en-id" : "id-en";
    }

    if (direction === "en-id") {
      wordsPromptTextElement.textContent = currentWord.en;
      wordsPromptLabelElement.textContent = "Translate to Indonesian:";
      currentWord.currentDirection = "en-id";
      wordsAnswerInput.placeholder = "Type Indonesian translation here...";
    } else {
      wordsPromptTextElement.textContent = currentWord.id;
      wordsPromptLabelElement.textContent = "Translate to English:";
      currentWord.currentDirection = "id-en";
      wordsAnswerInput.placeholder = "Type English translation here...";
    }

    wordsAnswerInput.value = "";
    wordsAnswerInput.disabled = false;
    wordsResultTextElement.textContent = "";
    wordInfoContainer.innerHTML = "";
    wordsFeedbackTextElement.textContent = "Type your translation";
    wordsFeedbackTextElement.style.color = "var(--text-color)";
    checkWordsButton.classList.remove("hidden");
    nextWordsButton.classList.add("hidden");

    // Reset animation
    wordsPromptTextElement.style.animation = "none";
    void wordsPromptTextElement.offsetWidth;
    wordsPromptTextElement.style.animation = "glow 1.5s ease-in-out";
  }

  function checkWordsAnswer() {
    const userAnswer = wordsAnswerInput.value.trim().toLowerCase();
    let correctAnswer, isCorrect;

    if (currentWord.currentDirection === "en-id") {
      correctAnswer = currentWord.id.toLowerCase();
      isCorrect = userAnswer === correctAnswer;
    } else {
      correctAnswer = currentWord.en.toLowerCase();
      isCorrect = userAnswer === correctAnswer;
    }

    const accuracy = calculateAccuracy(userAnswer, correctAnswer);
    updateProgress(isCorrect, currentWord.en);

    if (isCorrect) {
      wordsFeedbackTextElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
        <span>Correct! Well done! (${accuracy}% accuracy)</span>
      </div>
    `;
      wordsFeedbackTextElement.style.color = "var(--success-color)";
      wordsAnswerInput.classList.add("correct-flash");
    } else {
      wordsFeedbackTextElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <i class="fas fa-times-circle" style="color: var(--error-color);"></i>
        <span>Incorrect answer (${accuracy}% accuracy)</span>
      </div>
      <div class="correction-text">
        <div class="correction-line">
          <div class="original-text">${
            wordsAnswerInput.value || "(empty)"
          }</div>
        </div>
        <div class="correction-line">
          <div class="corrected-text">${correctAnswer}</div>
        </div>
      </div>
    `;
      wordsFeedbackTextElement.style.color = "var(--error-color)";
      wordsAnswerInput.classList.add("incorrect-flash");
    }

    // Show detailed word information
    showWordInfo();

    wordsAnswerInput.disabled = true;
    checkWordsButton.classList.add("hidden");
    nextWordsButton.classList.remove("hidden");

    setTimeout(() => {
      wordsAnswerInput.classList.remove("correct-flash", "incorrect-flash");
    }, 1000);
  }

  function showWordInfo() {
    wordInfoContainer.innerHTML = `
      <h4>
        <span class="word-type ${currentWord.type}">${currentWord.type}</span>
        ${currentWord.en} / ${currentWord.id}
      </h4>
      <p><strong>Definition:</strong> ${currentWord.definition_en} (${
      currentWord.definition_id
    })</p>
      ${
        currentWord.example_en
          ? `
      <div class="word-example">
        <strong>Example (EN):</strong> ${currentWord.example_en}<br>
        <strong>Contoh (ID):</strong> ${currentWord.example_id}
      </div>
      `
          : ""
      }
      ${
        currentWord.synonyms
          ? `
      <p><strong>Synonyms:</strong> ${currentWord.synonyms.join(", ")}</p>
      `
          : ""
      }
    `;
  }

  function speakText(text, lang = "en-US") {
    if (synth.speaking) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedOption = voiceSelect.selectedOptions[0];

    if (selectedOption) {
      const selectedVoiceName = selectedOption.getAttribute("data-name");
      const selectedVoice = voices.find(
        (voice) => voice.name === selectedVoiceName
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = lang;
      }
    } else {
      utterance.lang = lang;
    }

    const avatarImg = document.getElementById("current-avatar");
    avatarImg.classList.add("talking");

    utterance.onend = () => {
      avatarImg.classList.remove("talking");
    };

    synth.speak(utterance);
  }

  function addMessageToChat(text, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", `${sender}-message`);

    messageElement.innerHTML = `
      <div class="message-avatar">
        <img src="${
          sender === "bot" ? currentAvatar : "assets/images/avatars/user.png"
        }" alt="${sender} avatar">
      </div>
      <div class="message-content">${text}</div>
    `;

    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    messageElement.style.opacity = "0";
    messageElement.style.transform = "translateY(10px)";
    setTimeout(() => {
      messageElement.style.transition =
        "opacity 0.3s ease, transform 0.3s ease";
      messageElement.style.opacity = "1";
      messageElement.style.transform = "translateY(0)";
    }, 10);
  }

  async function getGeminiResponse(prompt) {
    const thinkingMessage = addMessageToChat("Thinking...", "bot");

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a friendly English conversation partner. When the user makes grammatical errors, follow this exact format:
                  
                  [CORRECTION]
                  I noticed a small grammar improvement opportunity:
                  Original: "[user's incorrect sentence]"
                  Corrected: "[corrected version]"
                  Explanation: "[brief explanation of the correction]"
                  [/CORRECTION]
                  
                  Then continue with your response. Keep your main response concise (1-2 sentences). Current context: English learning app. User said: "${prompt}"`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Unknown error");
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error fetching Gemini response:", error);
      return "Sorry, I'm having trouble responding right now. Please try again.";
    }
  }

  function processBotResponse(response) {
    // Check for correction pattern
    const correctionPattern = /\[CORRECTION\](.*?)\[\/CORRECTION\]/s;
    const correctionMatch = response.match(correctionPattern);

    if (correctionMatch) {
      const correctionContent = correctionMatch[1].trim();
      const restOfResponse = response.replace(correctionPattern, "").trim();

      // Extract correction details
      const originalMatch = correctionContent.match(/Original: "(.*?)"/);
      const correctedMatch = correctionContent.match(/Corrected: "(.*?)"/);
      const explanationMatch = correctionContent.match(/Explanation: "(.*?)"/);

      let correctionHTML = '<div class="grammar-correction">';
      correctionHTML +=
        '<div class="grammar-correction-title"><i class="fas fa-exclamation-circle"></i> Grammar Correction</div>';

      if (originalMatch && correctedMatch) {
        correctionHTML += '<div class="correction-text">';
        correctionHTML += `<div class="correction-line"><span class="original-text">${originalMatch[1]}</span> <i class="fas fa-arrow-right"></i> <span class="corrected-text">${correctedMatch[1]}</span></div>`;
        if (explanationMatch) {
          correctionHTML += `<div class="explanation">${explanationMatch[1]}</div>`;
        }
        correctionHTML += "</div>";
      }

      correctionHTML += "</div>";

      addMessageToChat(restOfResponse + correctionHTML, "bot");
      return restOfResponse;
    } else {
      addMessageToChat(response, "bot");
      return response;
    }
  }

  function changeAvatar(newAvatar) {
    currentAvatar = `assets/images/avatars/${newAvatar}`;
    avatarDisplay.src = currentAvatar;

    document
      .querySelectorAll(".bot-message .message-avatar img")
      .forEach((img) => {
        img.src = currentAvatar;
      });

    avatarDisplay.classList.add("avatar-change");
    setTimeout(() => {
      avatarDisplay.classList.remove("avatar-change");
    }, 500);
  }

  function switchQuizType(type) {
    currentQuizType = type;

    // Hide all sections first
    translationQuizSection.classList.add("hidden");
    verbQuizSection.classList.add("hidden");
    wordsQuizSection.classList.add("hidden");

    // Remove active class from all buttons
    translationQuizBtn.classList.remove("active");
    verbQuizBtn.classList.remove("active");
    wordsQuizBtn.classList.remove("active");

    // Show selected section and set active button
    if (type === "translation") {
      translationQuizSection.classList.remove("hidden");
      translationQuizBtn.classList.add("active");
    } else if (type === "verb") {
      verbQuizSection.classList.remove("hidden");
      verbQuizBtn.classList.add("active");
      getNewVerbQuestion();
    } else if (type === "words") {
      wordsQuizSection.classList.remove("hidden");
      wordsQuizBtn.classList.add("active");
      loadWords();
    }
  }

  function getNewVerbQuestion() {
    if (verbList.length === 0) return;

    const randomIndex = Math.floor(Math.random() * verbList.length);
    currentVerb = verbList[randomIndex];

    currentVerbExerciseType = Math.random() > 0.5 ? "forms" : "sentence";

    if (currentVerbExerciseType === "forms") {
      const forms = ["v1", "v2", "v3"];
      const promptForm = forms[Math.floor(Math.random() * forms.length)];

      let promptText = "";
      if (promptForm === "v1") {
        promptText = `Base Form: ${currentVerb.v1}`;
      } else if (promptForm === "v2") {
        promptText = `Past Simple: ${currentVerb.v2}`;
      } else {
        promptText = `Past Participle: ${currentVerb.v3}`;
      }

      verbPromptTextElement.textContent = promptText;
      verbPromptLabelElement.textContent = "Complete the verb forms:";

      document.querySelector(".verb-input-area").classList.remove("hidden");
      document.querySelector(".sentence-input-area").classList.add("hidden");

      v1Input.value = "";
      v2Input.value = "";
      v3Input.value = "";
      v1Input.disabled = false;
      v2Input.disabled = false;
      v3Input.disabled = false;

      currentVerb.promptForm = promptForm;
    } else {
      const sentences = [
        {
          template: `Yesterday I ${currentVerb.v2} to the store.`,
          answer: currentVerb.v2,
          blank: "Yesterday I ______ to the store.",
        },
        {
          template: `I have never ${currentVerb.v3} this before.`,
          answer: currentVerb.v3,
          blank: "I have never ______ this before.",
        },
        {
          template: `She will ${currentVerb.v1} the ball.`,
          answer: currentVerb.v1,
          blank: "She will ______ the ball.",
        },
        {
          template: `They were ${currentVerb.v3} by the news.`,
          answer: currentVerb.v3,
          blank: "They were ______ by the news.",
        },
        {
          template: `We ${currentVerb.v2} dinner together last night.`,
          answer: currentVerb.v2,
          blank: "We ______ dinner together last night.",
        },
      ];

      const sentence = sentences[Math.floor(Math.random() * sentences.length)];
      currentVerb.sentence = sentence;

      verbPromptTextElement.textContent = sentence.blank;
      verbPromptLabelElement.textContent = "Complete the sentence:";

      document.querySelector(".verb-input-area").classList.add("hidden");
      document.querySelector(".sentence-input-area").classList.remove("hidden");

      sentenceInput.value = "";
      sentenceInput.disabled = false;
    }

    verbFeedbackTextElement.textContent =
      currentVerbExerciseType === "forms"
        ? "Fill in all verb forms"
        : "Fill in the blank with the correct verb form";
    verbFeedbackTextElement.style.color = "var(--text-color)";
    verbResultTextElement.innerHTML = "";

    checkVerbButton.classList.remove("hidden");
    nextVerbButton.classList.add("hidden");
  }

  function checkVerbAnswers() {
    if (currentVerbExerciseType === "forms") {
      const userV1 = v1Input.value.trim().toLowerCase();
      const userV2 = v2Input.value.trim().toLowerCase();
      const userV3 = v3Input.value.trim().toLowerCase();

      const correctV1 = currentVerb.v1.toLowerCase();
      const correctV2 = currentVerb.v2.toLowerCase();
      const correctV3 = currentVerb.v3.toLowerCase();

      let allCorrect = true;
      let resultHTML = "";

      if (currentVerb.promptForm !== "v1") {
        const isCorrect = userV1 === correctV1;
        if (!isCorrect) allCorrect = false;
        resultHTML += `
          <div class="verb-result-item ${isCorrect ? "correct" : "incorrect"}">
            <i class="fas fa-${isCorrect ? "check" : "times"}"></i>
            Base Form: ${
              isCorrect ? userV1 : `${userV1} (Correct: ${correctV1})`
            }
          </div>
        `;
        if (isCorrect) v1Input.classList.add("correct-flash");
        else v1Input.classList.add("incorrect-flash");
      }

      if (currentVerb.promptForm !== "v2") {
        const isCorrect = userV2 === correctV2;
        if (!isCorrect) allCorrect = false;
        resultHTML += `
          <div class="verb-result-item ${isCorrect ? "correct" : "incorrect"}">
            <i class="fas fa-${isCorrect ? "check" : "times"}"></i>
            Past Simple: ${
              isCorrect ? userV2 : `${userV2} (Correct: ${correctV2})`
            }
          </div>
        `;
        if (isCorrect) v2Input.classList.add("correct-flash");
        else v2Input.classList.add("incorrect-flash");
      }

      if (currentVerb.promptForm !== "v3") {
        const isCorrect = userV3 === correctV3;
        if (!isCorrect) allCorrect = false;
        resultHTML += `
          <div class="verb-result-item ${isCorrect ? "correct" : "incorrect"}">
            <i class="fas fa-${isCorrect ? "check" : "times"}"></i>
            Past Participle: ${
              isCorrect ? userV3 : `${userV3} (Correct: ${correctV3})`
            }
          </div>
        `;
        if (isCorrect) v3Input.classList.add("correct-flash");
        else v3Input.classList.add("incorrect-flash");
      }

      verbResultTextElement.innerHTML = resultHTML;

      if (allCorrect) {
        verbFeedbackTextElement.innerHTML = `<i class="fas fa-check-circle"></i> All correct! Well done!`;
        verbFeedbackTextElement.style.color = "var(--success-color)";
      } else {
        verbFeedbackTextElement.innerHTML = `<i class="fas fa-times-circle"></i> Some answers need correction`;
        verbFeedbackTextElement.style.color = "var(--error-color)";
      }

      v1Input.disabled = true;
      v2Input.disabled = true;
      v3Input.disabled = true;
    } else {
      const userAnswer = sentenceInput.value.trim().toLowerCase();
      const correctAnswer = currentVerb.sentence.answer.toLowerCase();
      const isCorrect = userAnswer === correctAnswer;

      verbResultTextElement.innerHTML = `
        <div class="verb-result-item ${isCorrect ? "correct" : "incorrect"}">
          <i class="fas fa-${isCorrect ? "check" : "times"}"></i>
          ${isCorrect ? "Correct!" : `Should be: ${correctAnswer}`}
        </div>
        <div class="complete-sentence">
          ${currentVerb.sentence.template}
        </div>
      `;

      if (isCorrect) {
        verbFeedbackTextElement.innerHTML = `<i class="fas fa-check-circle"></i> Correct! Well done!`;
        verbFeedbackTextElement.style.color = "var(--success-color)";
        sentenceInput.classList.add("correct-flash");
      } else {
        verbFeedbackTextElement.innerHTML = `<i class="fas fa-times-circle"></i> Try again`;
        verbFeedbackTextElement.style.color = "var(--error-color)";
        sentenceInput.classList.add("incorrect-flash");
      }

      sentenceInput.disabled = true;
    }

    updateProgress(
      currentVerbExerciseType === "forms" ? allCorrect : isCorrect,
      currentVerb.v1
    );

    checkVerbButton.classList.add("hidden");
    nextVerbButton.classList.remove("hidden");

    setTimeout(() => {
      v1Input.classList.remove("correct-flash", "incorrect-flash");
      v2Input.classList.remove("correct-flash", "incorrect-flash");
      v3Input.classList.remove("correct-flash", "incorrect-flash");
      sentenceInput.classList.remove("correct-flash", "incorrect-flash");
    }, 1000);
  }

  function revealVerbAnswers() {
    if (currentVerbExerciseType === "forms") {
      v1Input.value = currentVerb.v1;
      v2Input.value = currentVerb.v2;
      v3Input.value = currentVerb.v3;

      verbResultTextElement.innerHTML = `
        <div class="verb-result-item correct">
          <i class="fas fa-check"></i> Base Form: ${currentVerb.v1}
        </div>
        <div class="verb-result-item correct">
          <i class="fas fa-check"></i> Past Simple: ${currentVerb.v2}
        </div>
        <div class="verb-result-item correct">
          <i class="fas fa-check"></i> Past Participle: ${currentVerb.v3}
        </div>
      `;

      v1Input.disabled = true;
      v2Input.disabled = true;
      v3Input.disabled = true;
    } else {
      sentenceInput.value = currentVerb.sentence.answer;

      verbResultTextElement.innerHTML = `
        <div class="verb-result-item correct">
          <i class="fas fa-check"></i> Correct answer: ${currentVerb.sentence.answer}
        </div>
        <div class="complete-sentence">
          ${currentVerb.sentence.template}
        </div>
      `;

      sentenceInput.disabled = true;
    }

    verbFeedbackTextElement.innerHTML = `<i class="fas fa-lightbulb"></i> Answers revealed`;
    verbFeedbackTextElement.style.color = "var(--accent-color)";
    checkVerbButton.classList.add("hidden");
    nextVerbButton.classList.remove("hidden");
  }

  function updateProgress(isCorrect, word) {
    // Update date and streaks
    const today = new Date().toDateString();
    if (userProgress.lastActiveDate !== today) {
      userProgress.lastActiveDate = today;
      if (isCorrect) {
        userProgress.currentStreak++;
        if (userProgress.currentStreak > userProgress.longestStreak) {
          userProgress.longestStreak = userProgress.currentStreak;
        }
      } else {
        userProgress.currentStreak = 0;
      }
    }

    // Update counters
    userProgress.totalQuestions++;
    if (isCorrect) {
      userProgress.correctAnswers++;
    } else if (word) {
      // Track incorrect words
      userProgress.incorrectAnswers[word] =
        (userProgress.incorrectAnswers[word] || 0) + 1;
    }

    // Save to localStorage
    localStorage.setItem("userProgress", JSON.stringify(userProgress));

    // Update UI
    updateProgressUI();
  }

  function updateProgressUI() {
    totalQuestionsElement.textContent = userProgress.totalQuestions;
    correctAnswersElement.textContent = userProgress.correctAnswers;

    const accuracy =
      userProgress.totalQuestions > 0
        ? Math.round(
            (userProgress.correctAnswers / userProgress.totalQuestions) * 100
          )
        : 0;
    accuracyRateElement.textContent = `${accuracy}%`;

    // Show weak words (top 5 most frequently incorrect)
    weakWordsListElement.innerHTML = "";

    const weakWords = Object.entries(userProgress.incorrectAnswers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (weakWords.length === 0) {
      weakWordsListElement.innerHTML =
        '<div class="no-weak-words">No weak words detected yet!</div>';
    } else {
      weakWords.forEach(([word, count]) => {
        const wordElement = document.createElement("div");
        wordElement.className = "weak-word";
        wordElement.innerHTML = `
          ${word} <i class="fas fa-times"></i> <span>${count}</span>
        `;
        weakWordsListElement.appendChild(wordElement);
      });
    }
  }

  // EVENT LISTENERS
  document
    .getElementById("translation-direction")
    .addEventListener("change", (e) => {
      currentTranslationDirection = e.target.value;
      getNewQuestion();
    });

  document.getElementById("words-direction").addEventListener("change", (e) => {
    currentWordsDirection = e.target.value;
    getNewWord();
  });

  document
    .getElementById("reset-progress-btn")
    .addEventListener("click", () => {
      const resetConfirmation = document.getElementById("reset-confirmation");
      resetConfirmation.classList.remove("hidden");
    });

  document
    .getElementById("confirm-reset-btn")
    .addEventListener("click", resetUserProgress);

  document.getElementById("cancel-reset-btn").addEventListener("click", () => {
    document.getElementById("reset-confirmation").classList.add("hidden");
  });

  checkButton.addEventListener("click", checkAnswer);
  nextButton.addEventListener("click", getNewQuestion);
  speakQuizButton.addEventListener("click", () => {
    activeFeature = "kuis";
    recognition.lang = "en-US";
    recognition.start();
  });
  talkButton.addEventListener("mousedown", () => {
    activeFeature = "chat";
    recognition.lang = "en-US";
    recognition.start();
    isRecording = true;
    recognitionTimeout = setTimeout(() => {
      if (isRecording) recognition.stop();
    }, 10000);
  });
  talkButton.addEventListener("mouseup", () => {
    if (isRecording) {
      recognition.stop();
      isRecording = false;
      clearTimeout(recognitionTimeout);
    }
  });
  avatarOptions.forEach((option) => {
    option.addEventListener("click", () => changeAvatar(option.dataset.avatar));
  });
  translationQuizBtn.addEventListener("click", () =>
    switchQuizType("translation")
  );
  verbQuizBtn.addEventListener("click", () => switchQuizType("verb"));
  wordsQuizBtn.addEventListener("click", () => switchQuizType("words"));
  checkVerbButton.addEventListener("click", checkVerbAnswers);
  nextVerbButton.addEventListener("click", getNewVerbQuestion);
  revealVerbButton.addEventListener("click", revealVerbAnswers);
  checkWordsButton.addEventListener("click", checkWordsAnswer);
  nextWordsButton.addEventListener("click", getNewWord);
  speakWordsButton.addEventListener("click", () => {
    activeFeature = "words-quiz";
    recognition.lang =
      currentWord.currentDirection === "en-id" ? "en-US" : "id-ID";
    recognition.start();
  });
  wordsTypeSelect.addEventListener("change", (e) => {
    currentWordsType = e.target.value;
    loadWords();
  });
  wordsDifficultySelect.addEventListener("change", (e) => {
    currentWordsDifficulty = e.target.value;
    loadWords();
  });
  categoryOptions.forEach((option) => {
    option.addEventListener("click", () => {
      categoryOptions.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
      currentCategory = option.dataset.category;
      loadPracticePairs();
    });
  });

  recognition.onstart = () => {
    if (activeFeature === "kuis") {
      speakQuizButton.innerHTML =
        '<i class="fas fa-microphone-alt-slash"></i> Listening...';
      speakQuizButton.disabled = true;
    } else if (activeFeature === "chat") {
      talkButton.innerHTML =
        '<i class="fas fa-microphone-alt-slash"></i> Listening...';
      talkButton.disabled = true;
    } else if (activeFeature === "words-quiz") {
      speakWordsButton.innerHTML =
        '<i class="fas fa-microphone-alt-slash"></i> Listening...';
      speakWordsButton.disabled = true;
    }
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;

    if (activeFeature === "kuis") {
      const originalText = promptTextElement.textContent;
      const accuracyScore = calculateAccuracy(originalText, transcript);
      resultTextElement.textContent = transcript;

      if (accuracyScore > 90) {
        resultTextElement.style.color = "var(--success-color)";
      } else if (accuracyScore > 70) {
        resultTextElement.style.color = "var(--warning-color)";
      } else {
        resultTextElement.style.color = "var(--error-color)";
      }

      feedbackTextElement.innerHTML = `Pronunciation Accuracy: <strong>${accuracyScore}%</strong>`;

      if (accuracyScore > 90) {
        resultTextElement.classList.add("good-pronunciation");
        setTimeout(() => {
          resultTextElement.classList.remove("good-pronunciation");
        }, 1000);
      }
    } else if (activeFeature === "chat") {
      addMessageToChat(transcript, "user");
      const botResponse = await getGeminiResponse(transcript);
      const processedResponse = processBotResponse(botResponse);
      speakText(processedResponse, "en-US");
    } else if (activeFeature === "words-quiz") {
      wordsResultTextElement.textContent = transcript;

      // Check pronunciation accuracy
      const targetWord =
        currentWord.currentDirection === "en-id"
          ? currentWord.en.toLowerCase()
          : currentWord.id.toLowerCase();
      const accuracyScore = calculateAccuracy(targetWord, transcript);

      if (accuracyScore > 90) {
        wordsResultTextElement.style.color = "var(--success-color)";
        wordsResultTextElement.classList.add("good-pronunciation");
        setTimeout(() => {
          wordsResultTextElement.classList.remove("good-pronunciation");
        }, 1000);
      } else if (accuracyScore > 70) {
        wordsResultTextElement.style.color = "var(--warning-color)";
      } else {
        wordsResultTextElement.style.color = "var(--error-color)";
      }

      wordsFeedbackTextElement.innerHTML = `Pronunciation Accuracy: <strong>${accuracyScore}%</strong>`;
    }
  };

  recognition.onend = () => {
    speakQuizButton.innerHTML =
      '<i class="fas fa-microphone"></i> Speak Sentence';
    speakQuizButton.disabled = false;
    talkButton.innerHTML = '<i class="fas fa-microphone-alt"></i> Hold to Talk';
    talkButton.disabled = false;
    speakWordsButton.innerHTML = '<i class="fas fa-microphone"></i> Speak Word';
    speakWordsButton.disabled = false;
    isRecording = false;
    clearTimeout(recognitionTimeout);
  };

  recognition.onerror = (event) => {
    let errorMessage = `Error: ${event.error}.`;
    if (event.error === "network") {
      errorMessage += " Connection to speech recognition server failed.";
    } else if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      errorMessage += " Microphone access denied.";
    } else if (event.error === "no-speech") {
      errorMessage = "No speech detected.";
    }

    console.error("Speech Recognition Error:", event);

    if (activeFeature === "kuis") {
      feedbackTextElement.textContent = errorMessage;
      feedbackTextElement.style.color = "var(--error-color)";
    } else if (activeFeature === "words-quiz") {
      wordsFeedbackTextElement.textContent = errorMessage;
      wordsFeedbackTextElement.style.color = "var(--error-color)";
    }
  };

  // INISIALISASI APLIKASI
  async function initializeApp() {
    try {
      // Load progress from localStorage
      const savedProgress = localStorage.getItem("userProgress");
      if (savedProgress) {
        userProgress = JSON.parse(savedProgress);
      }

      // Load verbs
      const verbsResponse = await fetch("data/verbs.json");
      if (!verbsResponse.ok) throw new Error(`Failed to load verb list.`);
      verbList = await verbsResponse.json();

      // Load words
      const wordsResponse = await fetch("data/words.json");
      if (!wordsResponse.ok) throw new Error(`Failed to load words list.`);
      wordsList = await wordsResponse.json();

      // Load initial practice pairs
      await loadPracticePairs();

      // Load voices
      populateVoiceList();
      synth.onvoiceschanged = populateVoiceList;

      // Preload avatars
      const avatars = ["ai1.png", "ai2.png", "ai3.png", "ai4.png", "user.png"];
      avatars.forEach((avatar) => {
        const img = new Image();
        img.src = `assets/images/avatars/${avatar}`;
      });

      // Update UI
      updateProgressUI();
    } catch (error) {
      console.error(error);
      feedbackTextElement.textContent = error.message;
      feedbackTextElement.style.color = "var(--error-color)";
    }
  }

  initializeApp();
});
