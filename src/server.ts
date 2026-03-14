import http from "node:http";
import "dotenv/config";
import db from "./db/sqliteDB.js";
import cors from "./middleware/CORS.js";
import * as path from "node:path";
import * as url from "node:url";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
// 1. Import the whole package as a default import
import adyen from "@adyen/api-library";

// 2. Destructure the classes you need from that default import
const { Client, CheckoutAPI, EnvironmentEnum } = adyen;

// get directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join("/usr/src/app", "");

// setup adyen client
const adyenClient = new Client({
  apiKey: process.env.ADYEN_API_KEY ?? "",
  // Cast the string to the EnvironmentEnum type
  environment: (process.env.ADYEN_ENV as any) || "TEST",
});

const checkout = new CheckoutAPI(adyenClient);

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    try {
      // 1. Query the database
      const users = db.prepare("SELECT * FROM users").all();

      // 2. insert user in sql
      const insert = db.prepare(
        "INSERT INTO users (name, email) VALUES (?, ?)",
      );
      //  insert.run('Alice', 'alice@example.com');
      // seed data - silently skips if email already exists
      db.prepare("INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)").run(
        "Alice",
        "alice@example.com",
      );
      db.prepare("INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)").run(
        "Bob",
        "bob@example.com",
      );

      // 3. Debugging: Print database results to the terminal
      console.log("Database Query Results:", users);

      res.writeHead(200, { "Content-Type": "application/json" });

      // 3. Send the response
      res.end(
        JSON.stringify({
          status: "success",
          message: "Keep it simple",
          debug_info: {
            rowCount: users.length,
            data: users,
          },
        }),
      );
    } catch (error) {
      console.error("Database Error:", error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
    return;
  }

  // GET /healt/Adyen --  check adyen connection
  if (req.url === "/api/health-adyen" && req.method === "GET") {
    try {
      const response = await checkout.PaymentsApi.paymentMethods({
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT ?? "",
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          message: "Adyen connection successful",
          paymentMethods: response.paymentMethods?.length ?? 0,
        }),
      );
    } catch (error: any) {
      console.error("Adyen Error:", error);
      res.writeHead(503);
      res.end(
        JSON.stringify({
          status: "error",
          message: "Adyen connection failed",
          detail: error.message,
        }),
      );
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = process.env.PORT || 3400;

server.listen(PORT, () => {
  console.log(dataDir);
  console.log(`Server running at http://localhost:${PORT}/`);
});
