/** Shared MySQL config for local dev and Railway/Render env vars. */
function getDbConfig() {
  const dbName =
    process.env.DB_NAME ||
    process.env.MYSQLDATABASE ||
    process.env.MYSQL_DATABASE ||
    "life_fragments";
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;

  if (url && /^mysql/i.test(url)) {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, "") || dbName,
    };
  }

  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
    database: dbName,
  };
}

module.exports = { getDbConfig };
