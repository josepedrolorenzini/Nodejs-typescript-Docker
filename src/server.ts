import http from "node:http" ; 
import 'dotenv/config' ; 
import db from './db/sqliteDB.js' ; 
import cors  from './middleware/CORS.js' ;
import * as path from "node:path" ;
import * as url from "node:url" ;
import { fileURLToPath }  from "node:url";
import  dotenv from "dotenv";


// get directory names
const __filename = fileURLToPath(import.meta.url) ;
const __dirname  = path.dirname(__filename);
const dataDir = path.join('/usr/src/app', '');



const server = http.createServer((req,res) => {

    if(req.url === "/"){
       try {
                // 1. Query the database
            const users = db.prepare('SELECT * FROM users').all();

            // 2. insert user in sql
            const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
          //  insert.run('Alice', 'alice@example.com');
                // seed data - silently skips if email already exists
            db.prepare('INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)').run('Alice', 'alice@example.com');
            db.prepare('INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)').run('Bob', 'bob@example.com');

            // 3. Debugging: Print database results to the terminal
            console.log("Database Query Results:", users);
   

            res.writeHead(200, { "Content-Type": "application/json" });

             // 3. Send the response
            res.end(JSON.stringify({
                status: "success",
                message: "Keep it simple",
                debug_info: {
                    rowCount: users.length,
                    data: users
                }
            })); 

            
       

       } catch (error) {
            console.error("Database Error:", error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Internal Server Error" }));
       }
    }else{
            res.writeHead(404) ;
            res.end("not found")
    }


}) ; 


const PORT = process.env.PORT || 3400;

server.listen(PORT, () => {
    console.log(dataDir)
    console.log(`Server running at http://localhost:${PORT}/`);

});