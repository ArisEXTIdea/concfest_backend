import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import authRouter from "./src/routers/auth_r.js";
import bandRouter from "./src/routers/band_r.js";
import eventRouter from "./src/routers/event_r.js";

dotenv.config();

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
// ====================== MIDDLEWARE ====================== //

const corsOptions = {
  origin: ["http://localhost:3000"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
// Deleting Expired Session

setInterval(() => {
  const folderPath = "./sessions";
  const d = new Date();

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Error reading folder:", err);
      return;
    }

    files.forEach((file) => {
      if (file !== ".gitkeep")
        fs.readFile(`${folderPath}/${file}`, "utf8", (err, data) => {
          if (err) {
            console.error("Error reading file:", err);
            return;
          }
          // Parse the JSON data
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.expired_at < d.getTime()) {
              fs.unlink(`${folderPath}/${file}`, (err) => {
                if (err) {
                  console.error("Error deleting file:", err);
                  return;
                }
              });
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        });
    });
  });
}, 3000);

// ====================== ENDPOINTS ====================== //

app.use("/authentication", authRouter);
app.use("/band", bandRouter);
app.use("/event", eventRouter);

app.use(
  "/drive",
  express.static(path.join(__dirname, "storage/uploads/images"))
);

// ====================== ERRORS HANDLING ====================== //

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const data = err.errData;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    message: message,
    errorCode: statusCode,
    data: data
  });
});

// ====================== LISTEN TO SERVER ====================== //

const port = process.env.SERVER_PORT;

if (process.env.SERVER_ENVIRONTMENT == "production") {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

export default app;
