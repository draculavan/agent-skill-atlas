import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertAtlasShape } from "./schema.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(packageRoot, "public");

export async function checkDemo(dataPath) {
  const raw = await fs.readFile(dataPath, "utf8");
  assertAtlasShape(JSON.parse(raw));
  await fs.access(path.join(publicRoot, "index.html"));
  await fs.access(path.join(publicRoot, "app.js"));
  await fs.access(path.join(publicRoot, "styles.css"));
  return true;
}

export async function startAtlasServer({ dataPath, port = 8787, openBrowser = true } = {}) {
  const rawAtlas = await fs.readFile(dataPath, "utf8");
  assertAtlasShape(JSON.parse(rawAtlas));

  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      if (requestUrl.pathname === "/atlas.json") {
        send(response, 200, "application/json; charset=utf-8", rawAtlas);
        return;
      }
      const filePath = resolvePublicPath(requestUrl.pathname);
      const body = await fs.readFile(filePath);
      send(response, 200, contentType(filePath), body);
    } catch {
      send(response, 404, "text/plain; charset=utf-8", "Not found");
    }
  });

  const actualPort = await listenAvailable(server, port);
  const url = `http://127.0.0.1:${actualPort}/`;
  if (openBrowser) openUrl(url);
  return { server, url };
}

function resolvePublicPath(urlPath) {
  const clean = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const target = path.resolve(publicRoot, `.${clean}`);
  if (!target.startsWith(publicRoot)) throw new Error("Invalid public path.");
  return target;
}

function listenAvailable(server, startPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      server.once("error", (error) => {
        if (error.code === "EADDRINUSE" && port < startPort + 25) {
          tryPort(port + 1);
        } else {
          reject(error);
        }
      });
      server.listen(port, "127.0.0.1", () => resolve(port));
    };
    tryPort(startPort);
  });
}

function send(response, status, type, body) {
  response.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store"
  });
  response.end(body);
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function openUrl(url) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}
