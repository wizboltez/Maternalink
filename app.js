// app.js
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const backendDist = path.join(__dirname, "backend", "dist", "index.js");

if (fs.existsSync(backendDist)) {
  require(backendDist);
} else {
  const child = spawn("npm", ["--prefix", "backend", "run", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error("Failed to launch backend server:", error);
    process.exit(1);
  });
}
