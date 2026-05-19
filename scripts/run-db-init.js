const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { getDbConfig } = require("./db-config");

const SEED_ACCOUNT = "3245702304";
const SEED_PASSWORD = "123456";
const SEED_FRIEND_ACCOUNT = "friend_demo";
const SEED_FRIEND_NICKNAME = "Demo Friend";

async function ensureChatOrbitImagesTable(conn, database) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'chat_orbit_images'
     LIMIT 1`,
    [database]
  );
  if (rows.length) return;
  await conn.query(
    `CREATE TABLE chat_orbit_images (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      friend_user_id INT UNSIGNED NOT NULL,
      slot TINYINT UNSIGNED NOT NULL COMMENT '0-4',
      file_path VARCHAR(512) NOT NULL COMMENT '相对 uploads 的路径',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_friend_slot (user_id, friend_user_id, slot),
      CONSTRAINT fk_orbit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_orbit_friend FOREIGN KEY (friend_user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
}

async function ensureChatEphemeralColumns(conn, database) {
  const columns = [
    {
      name: "is_ephemeral",
      ddl: `ALTER TABLE chat_messages
        ADD COLUMN is_ephemeral TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=限时消息，查看后销毁'
        AFTER content`,
    },
    {
      name: "viewed_at",
      ddl: `ALTER TABLE chat_messages
        ADD COLUMN viewed_at TIMESTAMP NULL COMMENT '接收方首次查看限时消息时间'
        AFTER is_ephemeral`,
    },
  ];
  for (const col of columns) {
    const [rows] = await conn.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = ?
       LIMIT 1`,
      [database, col.name]
    );
    if (!rows.length) {
      await conn.query(col.ddl);
    }
  }
}

async function ensureLastSeenColumn(conn, database) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_seen_at'
     LIMIT 1`,
    [database]
  );
  if (rows.length) return;
  await conn.query(
    `ALTER TABLE users
     ADD COLUMN last_seen_at TIMESTAMP NULL COMMENT '最后活跃时间，用于在线状态'
     AFTER nickname`
  );
}

async function runDbInit() {
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

  await conn.query(schemaSql);
  await ensureLastSeenColumn(conn, dbName);
  await ensureChatEphemeralColumns(conn, dbName);
  await ensureChatOrbitImagesTable(conn, dbName);

  const hash = await bcrypt.hash(SEED_PASSWORD, 10);
  await conn.query(
    `INSERT INTO users (account, password, nickname)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       password = VALUES(password),
       nickname = VALUES(nickname)`,
    [SEED_ACCOUNT, hash, SEED_ACCOUNT]
  );

  const [rows] = await conn.query(
    "SELECT id, account, nickname, created_at FROM users WHERE account = ?",
    [SEED_ACCOUNT]
  );
  const seedUser = rows[0];

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
    }
  }

  await conn.query(
    `INSERT INTO friends (user_id, friend_user_id)
     SELECT f.friend_user_id, f.user_id
     FROM friends f
     WHERE NOT EXISTS (
       SELECT 1 FROM friends f2
       WHERE f2.user_id = f.friend_user_id AND f2.friend_user_id = f.user_id
     )`
  );

  await conn.end();

  return {
    seedAccount: SEED_ACCOUNT,
    database: dbName,
  };
}

module.exports = {
  runDbInit,
  ensureLastSeenColumn,
  ensureChatEphemeralColumns,
  ensureChatOrbitImagesTable,
};
