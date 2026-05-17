const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { getDbConfig } = require("./db-config");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SEED_ACCOUNT = "3245702304";
const SEED_PASSWORD = "123456";
const SEED_FRIEND_ACCOUNT = "friend_demo";
const SEED_FRIEND_NICKNAME = "Demo Friend";

async function main() {
  const { host, port, user, password, database: dbName } = getDbConfig();
  const onRailway = Boolean(process.env.MYSQLHOST || process.env.MYSQL_URL);

  const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
  let schemaSql = fs.readFileSync(schemaPath, "utf8");
  if (onRailway) {
    schemaSql = schemaSql
      .replace(/CREATE DATABASE IF NOT EXISTS life_fragments[\s\S]*?USE life_fragments;\s*/i, "")
      .replace(/USE life_fragments;\s*/i, "");
  }

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: onRailway ? dbName : undefined,
    multipleStatements: true,
  });
  console.log("Connected to MySQL");

  await conn.query(schemaSql);
  console.log("Schema applied");

  const hash = await bcrypt.hash(SEED_PASSWORD, 10);
  await conn.query(
    `INSERT INTO users (account, password, nickname)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       password = VALUES(password),
       nickname = VALUES(nickname)`,
    [SEED_ACCOUNT, hash, SEED_ACCOUNT]
  );
  console.log(`Seed user ready: account=${SEED_ACCOUNT}, nickname=${SEED_ACCOUNT}`);

  const [rows] = await conn.query(
    "SELECT id, account, nickname, created_at FROM users WHERE account = ?",
    [SEED_ACCOUNT]
  );
  const seedUser = rows[0];
  console.log(seedUser);

  if (seedUser?.id) {
    await conn.query(
      `INSERT INTO entries (user_id, content, mood)
       SELECT ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM entries WHERE user_id = ? AND content = ?
       )`,
      [
        seedUser.id,
        "安静的夜晚，值得被记住。",
        "宁静",
        seedUser.id,
        "A quiet evening — the kind worth remembering.",
      ]
    );
    console.log("Sample diary entry ready (if not already present)");

    const sampleDate = new Date();
    sampleDate.setDate(sampleDate.getDate() + 30);
    const targetDate = [
      sampleDate.getFullYear(),
      String(sampleDate.getMonth() + 1).padStart(2, "0"),
      String(sampleDate.getDate()).padStart(2, "0"),
    ].join("-");
    await conn.query(
      `INSERT INTO countdowns (user_id, title, target_date)
       SELECT ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM countdowns WHERE user_id = ? AND title = ?
       )`,
      [seedUser.id, "示例倒数日", targetDate, seedUser.id, "示例倒数日"]
    );
    console.log("Sample countdown ready (if not already present)");

    const friendHash = await bcrypt.hash(SEED_PASSWORD, 10);
    await conn.query(
      `INSERT INTO users (account, password, nickname)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password = VALUES(password),
         nickname = VALUES(nickname)`,
      [SEED_FRIEND_ACCOUNT, friendHash, SEED_FRIEND_NICKNAME]
    );
    const [friendRows] = await conn.query(
      "SELECT id FROM users WHERE account = ? LIMIT 1",
      [SEED_FRIEND_ACCOUNT]
    );
    const friendUser = friendRows[0];
    if (friendUser?.id) {
      await conn.query(
        `INSERT INTO friends (user_id, friend_user_id)
         SELECT ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM friends WHERE user_id = ? AND friend_user_id = ?
         )`,
        [seedUser.id, friendUser.id, seedUser.id, friendUser.id]
      );
      await conn.query(
        `INSERT INTO friends (user_id, friend_user_id)
         SELECT ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM friends WHERE user_id = ? AND friend_user_id = ?
         )`,
        [friendUser.id, seedUser.id, friendUser.id, seedUser.id]
      );
      console.log(`Sample friend ready (mutual): ${SEED_FRIEND_ACCOUNT}`);
    }
  }

  const [backfill] = await conn.query(
    `INSERT INTO friends (user_id, friend_user_id)
     SELECT f.friend_user_id, f.user_id
     FROM friends f
     WHERE NOT EXISTS (
       SELECT 1 FROM friends f2
       WHERE f2.user_id = f.friend_user_id AND f2.friend_user_id = f.user_id
     )`
  );
  if (backfill.affectedRows > 0) {
    console.log(`Backfilled ${backfill.affectedRows} mutual friend link(s)`);
  }

  await conn.end();
}

main().catch((err) => {
  console.error("Database init failed:", err.message);
  process.exit(1);
});
