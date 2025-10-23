import fs from "node:fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = "secret";
const saltRounds = 10;

let notes = [];
const NOTES_FILE = "notes.json";

let users = [];
const USERS_FILE = "users.json";

function authenticationToken(res, req, callback) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Acesso negado: Token não fornecido" }));
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Tokin Inválido ou expirado" }));
      return;
    }
    req.user = user;
    callback();
  });
}

(function loadUsersFromFile() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    users = JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      users = [];
      console.error("array de users vazio");
    } else {
      console.error("erro ao carregar usuarios de users.json");
    }
  }
})();

function saveUsersToFile() {
  const data = JSON.stringify(users, null, 2);

  fs.writeFile(USERS_FILE, data, (err) => {
    if (err) {
      console.error("Erro ao salvar users no disco:", err);
    } else {
      console.log("Usuario salvo em users.json");
    }
  });
}

(function loadNotesFromFile() {
  try {
    const data = fs.readFileSync(NOTES_FILE, "utf8");
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
  } else if (req.url === "/register" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { username, password } = JSON.parse(body);

        if (!username || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: "Nome de usuário e senha são obrigatórios.",
            })
          );
          return;
        }

        if (users.some((user) => user.username === username)) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Nome de usuário já existe." }));
          return;
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
          id: Date.now(),
          username,
          password: hashedPassword,
        };

        users.push(newUser);
        saveUsersToFile();

        res.writeHead(201, { "Content-type": "application/json" });
        res.end(
          JSON.stringify({
            id: newUser.id,
            message: "Usuário regristrado com sucesso",
          })
        );
      } catch (error) {
        console.error("erro no registro: ", error);
        res.writeHead(500, { "Content-type": "application/json" });
        res.end(JSON.stringify({ message: "Erro interno do servidor" }));
      }
    });
  } else if (req.method === "POST" && req.url === "/login") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const { username, password } = JSON.parse(body);
        const user = users.find((user) => user.username === username);

        if (!user) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Credenciais inválidas" }));
          return;
        }

        const passwordMath = await bcrypt.compare(password, user.password);

        if (!passwordMath) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Credenciais invalidas" }));
          return;
        }

        // token

        const payload = { userId: user.id, username: user.username };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Login bem-sucedido!", token }));
      } catch (error) {
        console.error("Erro no login ", error);
        res.writeHead(500, { "Content-type": "application/json" });
        res.end(JSON.stringify({ message: "Erro interno do servidor" }));
      }
    });
  } else if (req.url === "/submit" && req.method === "POST") {
    const routeHeandle = () => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          const userId = req.user.userId;
          const newNote = {
            id: Date.now(),
            content: data.content.trim(),
            timesTamp: new Date().toISOString(),
            userId,
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
          notes.unshift(newNote);
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
    };
    authenticationToken(res, req, routeHeandle);
  } else if (req.url === "/notes" && req.method === "GET") {
    const routeHeandle = () => {
      const userId = req.user.userId;
      const userNotes = notes.filter((note) => note.userId === userId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(userNotes));
    };

    authenticationToken(res, req, routeHeandle);
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
    try {
      const routeHeandle = () => {
        const urlParts = req.url.split("/");
        const idToDelete = parseInt(urlParts[2], 10);
        const userId = req.user.userId;

        const noteIndex = notes.findIndex(
          (note) => Number(note.id) === idToDelete && note.userId === userId
        );

        if (noteIndex === -1) {
          res.writeHead(404, {
            "Content-Type": "text/plain",
          });

          res.end(JSON.stringify({ message: "Erro ao localizar a nota" }));
          return;
        }

        notes.splice(noteIndex, 1);

        saveNotesToFile();
        res.writeHead(204, {
          "Content-Type": "text/plain",
        });

        res.end(JSON.stringify(notes[noteIndex]));
      };
      authenticationToken(res, req, routeHeandle);
    } catch (error) {
      console.error("não tem notas com esse id " + noteIndex);
    }
  } else if (req.method === "PUT" && req.url.startsWith("/notes/")) {
    const routeHeandle = () => {
      const urlParts = req.url.split("/");
      const idToUpdate = parseInt(urlParts[2], 10);
      let body = "";
      const userId = req.user.userId;
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

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
            (note) => Number(note.id) === idToUpdate && note.userId === userId
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
    };
    authenticationToken(res, req, routeHeandle);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - pagina não encontrada");
  }
}
