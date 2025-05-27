const chatList = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat");
const chatArea = document.getElementById("chat-area");
const inputArea = document.querySelector(".input-area");
const input = inputArea.querySelector("input");
const header = document.querySelector(".header");
const chatButtons = document.querySelector(".chat-buttons");

let currentSessionId = null;
let sessions = JSON.parse(localStorage.getItem("chatSessions")) || {};

// ======= ФУНКЦІЇ =======

// Створення нової сесії
function createNewSession() {
  const sessionId = Date.now().toString();
  sessions[sessionId] = [];
  currentSessionId = sessionId;
  saveSessions();
  renderSessionList();
  renderMessages();
  showOrHideHeader();  // Показати заголовок та кнопки для нової сесії
}

// Збереження в localStorage
function saveSessions() {
  localStorage.setItem("chatSessions", JSON.stringify(sessions));
}

// Отримання осмисленої назви сесії
function getSessionTitle(sessionId) {
  const messages = sessions[sessionId];
  const firstUserMessage = messages.find(msg => msg.sender === "user");
  if (firstUserMessage) {
    const words = firstUserMessage.text.trim().split(/\s+/).slice(0, 4).join(" ");
    return words || `Сесія ${new Date().toLocaleString()}`;
  } else {
    return `Сесія ${new Date(parseInt(sessionId)).toLocaleString()}`;
  }
}

// Відображення списку сесій
function renderSessionList() {
  chatList.innerHTML = "";
  Object.keys(sessions).forEach(sessionId => {
    const li = document.createElement("li");
    li.classList.add("session-item");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = getSessionTitle(sessionId);

    li.addEventListener("click", () => {
      currentSessionId = sessionId;
      renderSessionList();
      renderMessages();
      showOrHideHeader();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSession(sessionId);
    });

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    if (sessionId === currentSessionId) {
      li.classList.add("active");
    }
    chatList.appendChild(li);
  });
}

// Відображення повідомлень
function renderMessages() {
  chatArea.innerHTML = "";
  if (!currentSessionId || !sessions[currentSessionId]) return;

  const messages = sessions[currentSessionId];
  messages.forEach(msg => {
    const div = document.createElement("div");
    div.classList.add("message", msg.sender);
    div.textContent = msg.text;
    chatArea.appendChild(div);
  });

  chatArea.scrollTop = chatArea.scrollHeight;

  if (messages.length > 0) {
    hideHeaderAndButtons();
  }
}

// Додати нове повідомлення
function addMessage(sender, text) {
  if (!currentSessionId) return;

  if (sender === "bot") {
    animateTypingMessage(text);
  } else {
    sessions[currentSessionId].push({ sender, text });
    saveSessions();
    renderMessages();
    showOrHideHeader();
    renderSessionList(); // Оновити заголовок сесії
  }
}

// Анімація для повідомлення бота
function animateTypingMessage(fullText) {
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("message", "bot");
  chatArea.appendChild(typingDiv);

  let index = 0;

  function typeChar() {
    if (index < fullText.length) {
      typingDiv.textContent += fullText[index];
      index++;
      chatArea.scrollTop = chatArea.scrollHeight;
      setTimeout(typeChar, 30);
    } else {
      sessions[currentSessionId].push({ sender: "bot", text: fullText });
      saveSessions();
      renderSessionList(); // Оновити заголовок сесії, якщо потрібно
    }
  }

  typeChar();
}

// Видалення сесії
function deleteSession(sessionId) {
  delete sessions[sessionId];
  if (currentSessionId === sessionId) {
    currentSessionId = null;
    chatArea.innerHTML = "";
    header.classList.remove("hidden");
    chatButtons.classList.remove("hidden");
  }
  saveSessions();
  renderSessionList();
}

// Показати або сховати заголовок/кнопки
function showOrHideHeader() {
  const messages = sessions[currentSessionId] || [];
  if (messages.length === 0) {
    header.classList.remove("hidden");
    chatButtons.classList.remove("hidden");
  } else {
    header.classList.add("hidden");
    chatButtons.classList.add("hidden");
  }
}

function hideHeaderAndButtons() {
  header.classList.add("hidden");
  chatButtons.classList.add("hidden");
}

// ======= ОБРОБНИКИ =======

// Кнопка "Новий чат"
newChatBtn.addEventListener("click", createNewSession);
document.getElementById("header-new-chat").addEventListener("click", createNewSession);


// Відправка повідомлення
document.querySelector('.input-area').addEventListener('submit', async function (e) {
  e.preventDefault();
  const input = this.querySelector('input');
  const prompt = input.value.trim();
  if (!prompt) return;

  addMessage('user', prompt);
  input.value = '';

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          ...sessions[currentSessionId].map(msg => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text
          })),
          { role: "user", content: prompt }
        ]
        
      })
    });

    const data = await response.json();
    const botReply = data.choices?.[0]?.message?.content || "Бот не відповів.";
    addMessage('bot', botReply);

  } catch (err) {
    console.error(err);
    addMessage('bot', "Помилка: не вдалося отримати відповідь.");
  }
});

// ======= ІНІЦІАЛІЗАЦІЯ =======
renderSessionList();

const lastSessionBtn = document.getElementById("last-session");

lastSessionBtn.addEventListener("click", () => {
  const allSessionIds = Object.keys(sessions);
  if (allSessionIds.length === 0) return;

  // Знайти найновішу сесію за датою (за sessionId як timestamp)
  const latestSessionId = allSessionIds.sort((a, b) => Number(b) - Number(a))[0];

  currentSessionId = latestSessionId;
  renderSessionList();
  renderMessages();
  showOrHideHeader();
});
