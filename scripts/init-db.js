const path = require("path");
const { runDbInit } = require("./run-db-init");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

runDbInit()
  .then((result) => {
    console.log("Schema applied");
    console.log(`Seed user ready: account=${result.seedAccount}`);
    console.log("Database:", result.database);
  })
  .catch((err) => {
    console.error("Database init failed:", err.message);
    process.exit(1);
  });
