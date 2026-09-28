import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import app from "./app.js";

const port = Number(process.env.PORT ?? 4000);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters.");
}

await fs.mkdir(path.resolve(process.env.UPLOAD_DIR ?? "./uploads"), { recursive: true });

app.listen(port, () => {
  console.log(`DevFlow API listening on http://localhost:${port}`);
});
