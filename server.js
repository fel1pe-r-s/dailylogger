import http from "node:http";

import { routes } from "./routes.js";

function requestlistener(req, res) {
  return routes(req, res);
}

const PORT = 3000;
const server = http.createServer(requestlistener);

server.listen(PORT, () => {
  console.log(`Servidor Rodando em: http://localhost:${PORT}`);
});
