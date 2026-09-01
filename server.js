const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const port = process.env.PORT || 10000;
const dataDirectory = path.join(__dirname, "data");
const dataFile = path.join(dataDirectory, "state.json");
const staticFiles = {
  "/": "index.html",
  "/index.html": "index.html",
  "/app.js": "app.js",
  "/styles.css": "styles.css",
};

function readState() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify(payload));
}

function serveStatic(response, pathname) {
  const filename = staticFiles[pathname];
  if (!filename) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  const contentType = filename.endsWith(".html")
    ? "text/html; charset=utf-8"
    : filename.endsWith(".js")
      ? "text/javascript; charset=utf-8"
      : "text/css; charset=utf-8";
  response.writeHead(200, { "Content-Type": contentType });
  response.end(fs.readFileSync(path.join(__dirname, filename)));
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  if (requestUrl.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (requestUrl.pathname === "/api/state") {
    const branch = requestUrl.searchParams.get("branch") || "westlands";
    const state = readState();
    if (request.method === "GET") {
      sendJson(response, 200, state[branch] || {});
      return;
    }
    if (request.method === "POST") {
      let body = "";
      request.on("data", (chunk) => (body += chunk));
      request.on("end", () => {
        try {
          const payload = JSON.parse(body);
          state[branch] = {
            deliveries: Array.isArray(payload.deliveries) ? payload.deliveries : [],
            riders: Array.isArray(payload.riders) ? payload.riders : [],
          };
          writeState(state);
          sendJson(response, 200, state[branch]);
        } catch {
          sendJson(response, 400, { error: "Invalid JSON payload" });
        }
      });
      return;
    }
  }

  if (request.method === "GET") serveStatic(response, requestUrl.pathname);
  else sendJson(response, 405, { error: "Method not allowed" });
});

server.listen(port, () => {
  console.log(`Reflex server listening on port ${port}`);
});