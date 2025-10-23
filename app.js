const noteForm = document.getElementById("noteForm");
const noteText = document.getElementById("noteText");
const logList = document.getElementById("logList");

const TOKEN_KEY = "dailyLoggerToken";
function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function handleLogin(username, password) {
  const data = { username, password };

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      showNotification(
        `Falha no login ${result.message} || "Erro desconhecido"`,
        "error"
      );
      return;
    }
    saveToken(result.token);
    showNotification("login bem-sucedido!", "success");
    window.location.reload();
  } catch (error) {
    showNotification(
      `ERRO DE REDE: Não foi possivel conecta ao servidor`,
      "error"
    );
  }
}

function handleLogout() {
  removeToken();
  showNotification("Sessão encerrada.", "success");
  window.location.reload();
}

async function authenticationFetch(url, options = {}) {
  const token = getToken();

  if (!token) {
    showNotification(
      "Sessão expirada ou não autenticada. Faça login novamente",
      "error"
    );
    //updateAuthUI()
    throw new Error("Não autenticado");
  }

  options.headers = options.headers || {};
  options.headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    // removeToken();
    showNotification(
      "Sessão inválida ou expirada. Faça login novamente.",
      "error"
    );
    // updateAuthUI();
  }

  return response;
}

async function deleteNote(id) {
  const url = `/notes/${id}`;
  try {
    const response = await authenticationFetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 204) {
      updateNotesList();
    } else {
      const erroData = await response.json();
      showNotification("erro ao deletar a nota " + erroData.status, "error");
    }
  } catch (error) {
    showNotification("erro ao deletar a nota " + error.message, "error");
  }
}

function attachDeleteListeners() {
  const deleteButtons = document.querySelectorAll(".delete-btn");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const noteId = event.target.dataset.noteId;

      if (noteId) {
        deleteNote(noteId);
      }
    });
  });
}

async function fetchNotes() {
  try {
    const response = await authenticationFetch("/notes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return await response.json();
    }

    return [];
  } catch (error) {
    showNotification("Deu ruim na busca de notas", "error");
    console.error(error);
    return [];
  }
}
async function sendEditToAPI(id, newContent) {
  const url = `/notes/${id}`;
  const contentToSave = newContent.trim();
  if (contentToSave.length === 0) {
    showNotification("O conteúdo da nota não pode ser vazio", "erro");
    return;
  }

  try {
    const response = await authenticationFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: contentToSave }),
    });

    if (!response.ok) {
      const erroData = await response.json();
      showNotification(
        `Falha ao editar: ${erroData.message}|| 'Erro desconhecido'`,
        "error"
      );
    }
    showNotification("Nota editada com sucesso!", "success");
    updateNotesList();
  } catch (error) {
    showNotification("erro ao editar a nota " + error.message, "error");
    console.error("Erro de rede durante PUT:", error);
  }
}

function enableEditMode(noteId, editButton) {
  const listItem = editButton.parentElement;
  const contentSpan = listItem.querySelector(".note-content");

  const currentText = contentSpan.textContent.replace(/\[.*\]\s*/, "").trim();

  const textarea = document.createElement("textarea");
  textarea.value = currentText;
  textarea.classList.add("edit-textarea");

  const saveButton = document.createElement("button");
  saveButton.textContent = "Salvar";
  saveButton.classList.add("save-edit-btn");

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancelar";
  cancelButton.classList.add("cancel-edit-btn");
  cancelButton.dataset.noteId = noteId;

  contentSpan.style.display = "none";
  editButton.style.display = "none";

  listItem.insertBefore(textarea, contentSpan);
  listItem.insertBefore(saveButton, editButton);
  listItem.insertBefore(cancelButton, editButton);

  saveButton.addEventListener("click", () => {
    const newContent = textarea.value;
    sendEditToAPI(noteId, newContent);
  });

  cancelButton.addEventListener("click", () => {
    textarea.remove();
    saveButton.remove();
    cancelButton.remove();
    contentSpan.style.display = "";
    editButton.style.display = "";
  });
}

function attachEditListeners() {
  const editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const noteId = event.target.dataset.noteId;
      if (noteId) {
        enableEditMode(noteId, event.target);
      }
    });
  });
}

function renderNotes(notes) {
  logList.innerHTML = "";

  notes.forEach((note) => {
    const listItem = document.createElement("li");
    listItem.dataset.noteId = note.id;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "X";
    deleteButton.classList.add("delete-btn");
    deleteButton.dataset.noteId = note.id;

    const editButton = document.createElement("button");
    editButton.textContent = "Editar";
    editButton.classList.add("edit-btn");
    editButton.dataset.noteId = note.id;

    const noteContentSpan = document.createElement("span");
    const date = new Date(note.timesTamp).toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    noteContentSpan.classList.add("note-content");
    noteContentSpan.innerHTML = `[${date}]: ${note.content}`;

    listItem.appendChild(noteContentSpan);
    listItem.appendChild(editButton);
    listItem.appendChild(deleteButton);
    logList.appendChild(listItem);
  });

  attachDeleteListeners();
  attachEditListeners();
}

async function updateNotesList() {
  const notes = await fetchNotes();
  renderNotes(notes);
}

async function sendNote(data) {
  try {
    const response = await authenticationFetch("/submit", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      showNotification(
        `Falha:${errorData.message || "erro desconhecido"}`,
        "error"
      );
      return;
    }

    showNotification("Nota salva com sucesso!", "success");
    updateNotesList();

    noteText.value = "";
    console.log("nota registrada");

    return await response.json();
  } catch (error) {
    showNotification(
      `ERRO DE CONEXÃO: Não foi possível alcançar o servidor.`,
      "error"
    );
  }
}

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const noteContent = noteText.value.trim();
  if (!noteContent) {
    showNotification("O conteúdo da nota não pode estar vazio.", "error");
    return;
  }
  const dataToSend = {
    content: noteContent,
  };
  sendNote(dataToSend);
});

document.addEventListener("DOMContentLoaded", updateNotesList);

function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  const notification = document.createElement("div");

  notification.classList.add("notification", type);
  notification.textContent = message;

  container.appendChild(notification);

  void notification.offsetWidth;

  notification.classList.add("show");

  function hideAndRemove() {
    notification.classList.remove("show");

    setTimeout(() => {
      notification.remove();
    }, 500);
  }
  setTimeout(hideAndRemove, 4000);

  notification.addEventListener(
    "click",
    () => {
      notification.remove();
    },
    { once: true }
  );
}
