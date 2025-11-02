// Complete working Recipe Recommender server
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const sendFile = (filePath, res, contentType) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
};

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/recipes")) {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const ingredients = urlObj.searchParams.get("ingredients");

    if (!ingredients) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing ingredients" }));
    }

    try {
      const api = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(
        ingredients
      )}`;
      const apiRes = await fetch(api);
      const data = await apiRes.json();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to fetch recipes" }));
    }
    return;
  }

  // serve static frontend files
  let filePath =
    req.url === "/"
      ? path.join(__dirname, "frontend", "index.html")
      : path.join(__dirname, "frontend", req.url);
  const ext = path.extname(filePath);
  const contentType =
    ext === ".html"
      ? "text/html"
      : ext === ".css"
      ? "text/css"
      : ext === ".js"
      ? "application/javascript"
      : "text/plain";
  sendFile(filePath, res, contentType);
});

server.listen(PORT, () =>
  console.log(`Go check the http link as the Server running at http://localhost:${PORT}`)
);
