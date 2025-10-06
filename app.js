const noteForm = document.getElementById("noteForm");
const noteText = document.getElementById("noteText");
const logList = document.getElementById("logList");

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
    const date = new Date(note.timesTamp).toLocaleString();
    const textNode = document.createTextNode(`${date}: ${note.content}`);

    listItem.appendChild(textNode);
    logList.appendChild(listItem);
  });
}

async function updateNotesList() {
  const notes = await fetchNotes();
  renderNotes(notes);
}

document.addEventListener("DOMContentLoaded", updateNotesList);

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
