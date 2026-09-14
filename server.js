const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const logosRoot = path.join(root, "logos");
const port = 8080;

function scanLogos(directory, relativeDirectory = "") {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return scanLogos(absolutePath, relativePath);
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".png") return [];
    const folder = path.dirname(relativePath);
    return [{
      category: folder === "." ? "Logos" : path.basename(folder),
      name: path.basename(entry.name, ".png"),
      src: "/logos/" + relativePath.split(path.sep).map(encodeURIComponent).join("/")
    }];
  });
}

function serveFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const contentTypes = {
      ".html": "text/html",
      ".json": "application/json",
      ".png": "image/png",
      ".svg": "image/svg+xml"
    };
    const contentType = contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(data);
  });
}

http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  if (requestPath === "/api/logos") {
    response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end(JSON.stringify(scanLogos(logosRoot)));
    return;
  }

  const relativePath = requestPath === "/" ? "watermark-studio.html" : requestPath.slice(1);
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(root + path.sep)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  serveFile(response, filePath);
}).listen(port, () => {
  console.log(`Watermark Studio running at http://localhost:${port}`);
});
