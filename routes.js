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
      console.log("array vazio");
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
        const newNote = JSON.parse(body);
        newNote.id = Date.now();
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
        console.log(error);
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
      console.log(noteIndex);
      notes.splice(noteIndex, 1);

      saveNotesToFile();
      res.writeHead(204, {
        "Content-Type": "text/plain",
      });

      res.end();
    }
    console.error("não tem notas com esse id " + noteIndex);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - pagina não encontrada");
  }
}
