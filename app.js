const noteForm = document.getElementById("noteForm");
const noteText = document.getElementById("noteText");
const logList = document.getElementById("logList");

async function deleteNote(id) {
  const url = `/notes/${id}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 204) {
      updateNotesList();
    } else {
      showNotification("erro ao deletar a nota " + response.status, "error");
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
    const response = await fetch("/notes", {
      method: "GET",
      headers: {
        "Content-type": "application/json",
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

function renderNotes(notes) {
  logList.innerHTML = "";

  notes.forEach((note) => {
    const listItem = document.createElement("li");
    const date = new Date(note.timesTamp).toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const textNode = document.createTextNode(`[${date}]: ${note.content}`);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "X";
    deleteButton.classList.add("delete-btn");

    deleteButton.dataset.noteId = note.id;
    listItem.appendChild(textNode);
    listItem.appendChild(deleteButton);
    logList.appendChild(listItem);
  });

  attachDeleteListeners();
}

async function updateNotesList() {
  const notes = await fetchNotes();
  renderNotes(notes);
}

async function sendNote(data) {
  try {
    const response = await fetch("/submit", {
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
