import fs from "node:fs";
let notes = [];
const NOTES_FILE = "notes.json";

(function loadNotesFromFile() {
  try {
    const data = fs.readFileSync(NOTES_FILE);
    notes = JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      notes = [];
      console.error("array vazio");
    } else {
      console.error("Erro ao carrregar notes.json", error.message);
    }
  }
})();

function saveNotesToFile() {
  const data = JSON.stringify(notes, null, 2);

  fs.writeFile(NOTES_FILE, data, (err) => {
    if (err) {
      console.error("Erro ao salvar notas no disco:", err);
    } else {
      console.log("Notas salvas em notes.json");
    }
  });
}

export function routes(req, res) {
  if (req.url === "/" && req.method === "GET") {
    fs.readFile("./index.html", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Erro interno ao carregar html");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  } else if (req.url === "/submit" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const newNote = {
          id: Date.now(),
          content: data.content.trim(),
          timesTamp: new Date().toISOString(),
        };

        if (!newNote.content || newNote.content.trim().length === 0) {
          res.writeHead(400, {
            "Content-type": "application/json",
          });
          res.end(
            JSON.stringify({
              status: "error",
              note: "Conteúdo da nota não pode esta vazio",
            })
          );
          return;
        }
        notes.push(newNote);
        saveNotesToFile();
        res.writeHead(201, {
          "Content-type": "application/json",
        });
        res.end(
          JSON.stringify({
            status: "success",
            note: newNote,
          })
        );
      } catch (error) {
        console.error(error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            message: "Dados Json inválidos",
          })
        );
      }
    });
  } else if (req.url === "/notes" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(notes));
  } else if (req.url === "/app.js" && req.method === "GET") {
    fs.readFile("./app.js", (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "aplication/javascript" });
        res.end("Erro interno ao carregar html");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain" });

      res.end(data);
    });
  } else if (req.url === "/style.css" && req.method === "GET") {
    fs.readFile("./style.css", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Erro interno ao carregar css");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(data);
    });
  } else if (req.method === "DELETE" && req.url.startsWith("/notes/")) {
    const urlParts = req.url.split("/");
    const idToDelete = parseInt(urlParts[2], 10);

    const noteIndex = notes.findIndex((note) => Number(note.id) === idToDelete);

    if (noteIndex !== -1) {
      notes.splice(noteIndex, 1);

      saveNotesToFile();
      res.writeHead(204, {
        "Content-Type": "text/plain",
      });

      res.end(JSON.stringify(notes[noteIndex]));
      return;
    }
    console.error("não tem notas com esse id " + noteIndex);
  } else if (req.method === "PUT" && req.url.startsWith("/notes/")) {
    const urlParts = req.url.split("/");
    const idToUpdate = parseInt(urlParts[2], 10);
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    console.log(body);
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (!data.content || data.content.trim().length === 0) {
          res.writeHead(400, { "Content-type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              message: "O Contreúdo não pode esta vazio",
            })
          );
          return;
        }

        const noteIndex = notes.findIndex(
          (note) => Number(note.id) === idToUpdate
        );

        if (noteIndex !== -1) {
          notes[noteIndex].content = data.content.trim();
          notes[noteIndex].timesTamp = Date.now();
          saveNotesToFile();
          res.writeHead(200, { "Content-type": "application/json" });
          res.end(JSON.stringify(notes[noteIndex]));
        } else {
          res.writeHead(404, { "Content-type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              message: "Nota não foi encontada",
            })
          );
        }
      } catch (error) {
        console.error("Erro ao processar JSON no PUT:", error.message);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            message: "JSON da requisição PUT inválido.",
          })
        );
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - pagina não encontrada");
  }
}
