import fs from "node:fs";
let notes = [];
export function routes(req, res) {
  if (req.url === "/" && req.method === "GET") {
    fs.readFile("./index.html", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Erro interno ao carregar html");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      console.log("Requisição Get");
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
      console.log("Requisição Get");
      res.end(data);
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - pagina não encontrada");
  }
}
