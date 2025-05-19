const chatList = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat");
const chatArea = document.getElementById("chat-area");
const inputArea = document.querySelector(".input-area");
const input = inputArea.querySelector("input");
const header = document.querySelector(".header");
const chatButtons = document.querySelector(".chat-buttons");


let sessions = JSON.parse(localStorage.getItem("chatSessions")) || {};
let currentSessionId = null;

// ======= ФУНКЦІЇ =======

// Створення нової сесії
function createNewSession() {
  const sessionId = Date.now().toString();
  sessions[sessionId] = [];
  currentSessionId = sessionId;
  saveSessions();
  renderSessionList();
  renderMessages();
  showOrHideHeader();  // тут покаже header/buttons, бо нова сесія — пуста
}


// Збереження в localStorage
function saveSessions() {
  localStorage.setItem("chatSessions", JSON.stringify(sessions));
}

// Відображення списку сесій
function renderSessionList() {
  chatList.innerHTML = "";
  Object.keys(sessions).forEach(sessionId => {
    const li = document.createElement("li");
    li.classList.add("session-item");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `Сесія ${sessionId}`;
    li.addEventListener("click", () => {
      currentSessionId = sessionId;
      renderSessionList();        // оновити підсвічування
      renderMessages();           // відобразити повідомлення
      showOrHideHeader();         // показати або сховати header/buttons
    });
    

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // щоб не вибиралась сесія
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

  sessions[currentSessionId].forEach(msg => {
    const div = document.createElement("div");
    div.classList.add("message", msg.sender);
    div.textContent = msg.text;
    chatArea.appendChild(div);
  });

  chatArea.scrollTop = chatArea.scrollHeight;
}

// Додати нове повідомлення
function addMessage(sender, text) {
  if (!currentSessionId) return;
  sessions[currentSessionId].push({ sender, text });
  saveSessions();
  renderMessages();
  showOrHideHeader();  // сховає header/buttons, бо messages.length > 0
}



// Виділення активної сесії
function highlightActiveSession(sessionId) {
  document.querySelectorAll(".session-item").forEach(item => {
    item.classList.remove("active");
    if (item.textContent.includes(sessionId)) {
      item.classList.add("active");
    }
  });
}

// Показати заголовок і кнопки
function showHeaderAndButtons() {
  if (header) header.classList.remove("hidden");
  if (chatButtons) chatButtons.classList.remove("hidden");
}


// ======= ОБРОБНИКИ =======

// Кнопка "Новий чат"
newChatBtn.addEventListener("click", createNewSession);

// Відправка повідомлення
inputArea.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addMessage("user", text);
  input.value = "";

  // Спростимо бота — відповідає “Добре!”
  setTimeout(() => {
    addMessage("bot", "Добре!");
  }, 500);
});

// ======= ІНІЦІАЛІЗАЦІЯ =======
renderSessionList();

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

  // 🆕 Ховаємо заголовок і кнопки, якщо є повідомлення
  if (messages.length > 0) {
    hideHeaderAndButtons();
  }
}

function hideHeaderAndButtons() {
  header.classList.add("hidden");
  chatButtons.classList.add("hidden");
}

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
