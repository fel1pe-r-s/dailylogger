const noteForm = document.getElementById("noteForm");
const noteText = document.getElementById("noteText");
const logList = document.getElementById("logList");

async function deleteNote(id) {
  const url = `/notes/${id}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 204) {
    updateNotesList();
  } else {
    console.error("erro ao deletar a nota " + response.status);
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
  const response = await fetch("/notes", {
    method: "GET",
    headers: {
      "Content-type": "application/json",
    },
  });
  if (response.ok) {
    return await response.json();
  }

  console.error("Deu ruim na busca de notas");
  return [];
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
  const response = await fetch("/submit", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    noteText.value = "";
    console.log("nota registrada");
    updateNotesList();
  } else {
    console.error("erro ao registra nota");
  }

  return await response.json();
}

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const noteContent = noteText.value.trim();
  if (!noteContent) return;
  const dataToSend = {
    content: noteContent,
    timesTamp: new Date().toISOString(),
  };
  sendNote(dataToSend);
});

document.addEventListener("DOMContentLoaded", updateNotesList);
