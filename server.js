const path = require("path");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { getDbConfig } = require("./scripts/db-config");
require("dotenv").config();

const PORT = Number(process.env.PORT || 3456);
const dbConfig = getDbConfig();

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/login", async (req, res) => {
  try {
    const account = String(req.body?.account || "").trim();
    const password = String(req.body?.password || "");

    if (!account || !password) {
      return res.status(400).json({ success: false, message: "请输入账号和密码" });
    }

    const [rows] = await pool.execute(
      "SELECT id, account, password, nickname FROM users WHERE account = ? LIMIT 1",
      [account]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: "账号或密码错误" });
    }

    const row = rows[0];
    const valid = await bcrypt.compare(password, row.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "账号或密码错误" });
    }

    res.json({
      success: true,
      user: {
        account: row.account,
        nickname: row.nickname || row.account,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const account = String(req.body?.account || "").trim();
    const password = String(req.body?.password || "");
    const nicknameRaw = String(req.body?.nickname ?? "").trim();
    const nickname = nicknameRaw || account;

    if (!account) {
      return res.status(400).json({ success: false, message: "请输入账号" });
    }
    if (account.length > 64) {
      return res.status(400).json({ success: false, message: "账号不能超过 64 个字符" });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "请输入密码" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "密码至少 6 位" });
    }
    if (!nickname) {
      return res.status(400).json({ success: false, message: "昵称不能为空" });
    }
    if (nickname.length > 64) {
      return res.status(400).json({ success: false, message: "昵称不能超过 64 个字符" });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE account = ? LIMIT 1",
      [account]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: "该账号已被注册" });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.execute(
      "INSERT INTO users (account, password, nickname) VALUES (?, ?, ?)",
      [account, hash, nickname]
    );

    res.status(201).json({
      success: true,
      user: { account, nickname },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

const VALID_MOODS = new Set([
  "宁静",
  "愉快",
  "忧郁",
  "沉思",
  "温厚",
  "烦躁",
]);

const MOOD_ALIASES = {
  Serene: "宁静",
  Cheerful: "愉快",
  Melancholy: "忧郁",
  Pensive: "沉思",
  Warmhearted: "温厚",
  Irritated: "烦躁",
};

function normalizeMood(mood) {
  const trimmed = String(mood || "").trim();
  return MOOD_ALIASES[trimmed] || trimmed;
}

function isValidMood(mood) {
  return VALID_MOODS.has(normalizeMood(mood));
}

async function getUserByAccount(account) {
  const [rows] = await pool.execute(
    "SELECT id, account, nickname FROM users WHERE account = ? LIMIT 1",
    [account]
  );
  return rows[0] || null;
}

async function areFriends(userId, friendId) {
  const [rows] = await pool.execute(
    "SELECT 1 FROM friends WHERE user_id = ? AND friend_user_id = ? LIMIT 1",
    [userId, friendId]
  );
  return rows.length > 0;
}

async function assertCanViewEntries(viewerAccount, ownerAccount) {
  const owner = await getUserByAccount(ownerAccount);
  if (!owner) {
    return { ok: false, status: 404, message: "用户不存在" };
  }

  if (viewerAccount === ownerAccount) {
    return { ok: true, user: owner };
  }

  const viewer = await getUserByAccount(viewerAccount);
  if (!viewer) {
    return { ok: false, status: 404, message: "用户不存在" };
  }

  if (!(await areFriends(viewer.id, owner.id))) {
    return { ok: false, status: 403, message: "仅好友可查看日记" };
  }

  return { ok: true, user: owner };
}

async function fetchEntriesByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, content, mood, created_at, updated_at
     FROM entries
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return rows.map(mapEntryRow);
}

function mapEntryRow(row) {
  return {
    id: row.id,
    content: row.content,
    mood: row.mood,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.get("/api/entries", async (req, res) => {
  try {
    const account = String(req.query.account || "").trim();
    const viewerAccount = String(req.query.viewerAccount || account).trim();

    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const access = await assertCanViewEntries(viewerAccount, account);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const entries = await fetchEntriesByUserId(access.user.id);
    res.json({ success: true, entries });
  } catch (err) {
    console.error("Entries list error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.get("/api/friends/entries", async (req, res) => {
  try {
    const account = String(req.query.account || "").trim();
    const friendAccount = String(req.query.friendAccount || "").trim();

    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }
    if (!friendAccount) {
      return res.status(400).json({ success: false, message: "缺少好友账号" });
    }

    const access = await assertCanViewEntries(account, friendAccount);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const entries = await fetchEntriesByUserId(access.user.id);
    res.json({ success: true, entries });
  } catch (err) {
    console.error("Friend entries list error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.post("/api/entries", async (req, res) => {
  try {
    const account = String(req.body?.account || "").trim();
    const content = String(req.body?.content || "").trim();
    const mood = normalizeMood(req.body?.mood);

    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: "日记内容不能为空" });
    }
    if (!isValidMood(mood)) {
      return res.status(400).json({ success: false, message: "请选择有效的心情" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [result] = await pool.execute(
      "INSERT INTO entries (user_id, content, mood) VALUES (?, ?, ?)",
      [user.id, content, mood]
    );

    const [rows] = await pool.execute(
      "SELECT id, content, mood, created_at, updated_at FROM entries WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    res.json({
      success: true,
      entry: mapEntryRow(rows[0]),
    });
  } catch (err) {
    console.error("Entry create error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.put("/api/entries/:id", async (req, res) => {
  try {
    const entryId = Number(req.params.id);
    const account = String(req.body?.account || "").trim();
    const content = String(req.body?.content || "").trim();
    const mood = normalizeMood(req.body?.mood);

    if (!entryId) {
      return res.status(400).json({ success: false, message: "无效的日记 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: "日记内容不能为空" });
    }
    if (!isValidMood(mood)) {
      return res.status(400).json({ success: false, message: "请选择有效的心情" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM entries WHERE id = ? AND user_id = ? LIMIT 1",
      [entryId, user.id]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "日记不存在" });
    }

    await pool.execute(
      "UPDATE entries SET content = ?, mood = ? WHERE id = ? AND user_id = ?",
      [content, mood, entryId, user.id]
    );

    const [rows] = await pool.execute(
      "SELECT id, content, mood, created_at, updated_at FROM entries WHERE id = ? LIMIT 1",
      [entryId]
    );

    res.json({
      success: true,
      entry: mapEntryRow(rows[0]),
    });
  } catch (err) {
    console.error("Entry update error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.delete("/api/entries/:id", async (req, res) => {
  try {
    const entryId = Number(req.params.id);
    const account = String(req.body?.account || "").trim();

    if (!entryId) {
      return res.status(400).json({ success: false, message: "无效的日记 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [result] = await pool.execute(
      "DELETE FROM entries WHERE id = ? AND user_id = ?",
      [entryId, user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "日记不存在" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Entry delete error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

async function getEntryOwnerAccount(entryId) {
  const [rows] = await pool.execute(
    `SELECT u.account, u.id AS owner_id
     FROM entries e
     INNER JOIN users u ON u.id = e.user_id
     WHERE e.id = ?
     LIMIT 1`,
    [entryId]
  );
  return rows[0] || null;
}

async function assertCanCommentOnEntry(viewerAccount, entryId) {
  const entryOwner = await getEntryOwnerAccount(entryId);
  if (!entryOwner) {
    return { ok: false, status: 404, message: "日记不存在" };
  }

  const access = await assertCanViewEntries(viewerAccount, entryOwner.account);
  if (!access.ok) {
    return access;
  }

  return {
    ok: true,
    owner: access.user,
    ownerId: entryOwner.owner_id,
    ownerAccount: entryOwner.account,
  };
}

function mapCommentRow(row) {
  return {
    id: row.id,
    parentId: row.parent_id,
    content: row.content,
    createdAt: row.created_at,
    authorAccount: row.account,
    authorNickname: row.nickname || row.account,
    authorUserId: row.user_id,
  };
}

app.get("/api/entries/:id/comments", async (req, res) => {
  try {
    const entryId = Number(req.params.id);
    const account = String(req.query.account || "").trim();

    if (!entryId) {
      return res.status(400).json({ success: false, message: "无效的日记 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const access = await assertCanCommentOnEntry(account, entryId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const [rows] = await pool.execute(
      `SELECT c.id, c.entry_id, c.user_id, c.parent_id, c.content, c.created_at,
              u.account, u.nickname
       FROM entry_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.entry_id = ?
       ORDER BY c.created_at ASC`,
      [entryId]
    );

    res.json({
      success: true,
      comments: rows.map(mapCommentRow),
    });
  } catch (err) {
    console.error("Comments list error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.post("/api/entries/:id/comments", async (req, res) => {
  try {
    const entryId = Number(req.params.id);
    const account = String(req.body?.account || "").trim();
    const content = String(req.body?.content || "").trim();
    const parentId = req.body?.parentId != null ? Number(req.body.parentId) : null;

    if (!entryId) {
      return res.status(400).json({ success: false, message: "无效的日记 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: "评论内容不能为空" });
    }
    if (content.length > 500) {
      return res.status(400).json({ success: false, message: "评论不能超过 500 字" });
    }

    const access = await assertCanCommentOnEntry(account, entryId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const viewer = await getUserByAccount(account);
    if (!viewer) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    if (parentId) {
      const [parentRows] = await pool.execute(
        "SELECT id FROM entry_comments WHERE id = ? AND entry_id = ? LIMIT 1",
        [parentId, entryId]
      );
      if (!parentRows.length) {
        return res.status(400).json({ success: false, message: "回复的评论不存在" });
      }
    }

    const [result] = await pool.execute(
      "INSERT INTO entry_comments (entry_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)",
      [entryId, viewer.id, parentId || null, content]
    );

    const [rows] = await pool.execute(
      `SELECT c.id, c.entry_id, c.user_id, c.parent_id, c.content, c.created_at,
              u.account, u.nickname
       FROM entry_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.id = ? LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      comment: mapCommentRow(rows[0]),
    });
  } catch (err) {
    console.error("Comment create error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.delete("/api/comments/:id", async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const account = String(req.body?.account || "").trim();

    if (!commentId) {
      return res.status(400).json({ success: false, message: "无效的评论 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const viewer = await getUserByAccount(account);
    if (!viewer) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [commentRows] = await pool.execute(
      `SELECT c.id, c.entry_id, c.user_id, e.user_id AS entry_owner_id
       FROM entry_comments c
       INNER JOIN entries e ON e.id = c.entry_id
       WHERE c.id = ? LIMIT 1`,
      [commentId]
    );

    if (!commentRows.length) {
      return res.status(404).json({ success: false, message: "评论不存在" });
    }

    const comment = commentRows[0];
    const canDelete =
      comment.user_id === viewer.id || comment.entry_owner_id === viewer.id;

    if (!canDelete) {
      return res.status(403).json({ success: false, message: "无权删除此评论" });
    }

    await pool.execute("DELETE FROM entry_comments WHERE id = ?", [commentId]);

    res.json({ success: true });
  } catch (err) {
    console.error("Comment delete error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

function formatTargetDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value || "").slice(0, 10);
}

function isValidTargetDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const parsed = new Date(y, m - 1, d);
  return (
    parsed.getFullYear() === y &&
    parsed.getMonth() === m - 1 &&
    parsed.getDate() === d
  );
}

function mapCountdownRow(row) {
  return {
    id: row.id,
    title: row.title,
    targetDate: formatTargetDate(row.target_date),
  };
}

app.get("/api/countdowns", async (req, res) => {
  try {
    const account = String(req.query.account || "").trim();
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [rows] = await pool.execute(
      `SELECT id, title, target_date
       FROM countdowns
       WHERE user_id = ?
       ORDER BY target_date ASC`,
      [user.id]
    );

    res.json({
      success: true,
      countdowns: rows.map(mapCountdownRow),
    });
  } catch (err) {
    console.error("Countdowns list error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.post("/api/countdowns", async (req, res) => {
  try {
    const account = String(req.body?.account || "").trim();
    const title = String(req.body?.title || "").trim();
    const targetDate = formatTargetDate(req.body?.targetDate);

    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: "请输入事件名称" });
    }
    if (!isValidTargetDate(targetDate)) {
      return res.status(400).json({ success: false, message: "请选择有效的目标日期" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [result] = await pool.execute(
      "INSERT INTO countdowns (user_id, title, target_date) VALUES (?, ?, ?)",
      [user.id, title, targetDate]
    );

    const [rows] = await pool.execute(
      "SELECT id, title, target_date FROM countdowns WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    res.json({
      success: true,
      countdown: mapCountdownRow(rows[0]),
    });
  } catch (err) {
    console.error("Countdown create error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.put("/api/countdowns/:id", async (req, res) => {
  try {
    const countdownId = Number(req.params.id);
    const account = String(req.body?.account || "").trim();
    const title = String(req.body?.title || "").trim();
    const targetDate = formatTargetDate(req.body?.targetDate);

    if (!countdownId) {
      return res.status(400).json({ success: false, message: "无效的倒数日 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: "请输入事件名称" });
    }
    if (!isValidTargetDate(targetDate)) {
      return res.status(400).json({ success: false, message: "请选择有效的目标日期" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM countdowns WHERE id = ? AND user_id = ? LIMIT 1",
      [countdownId, user.id]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "倒数日不存在" });
    }

    await pool.execute(
      "UPDATE countdowns SET title = ?, target_date = ? WHERE id = ? AND user_id = ?",
      [title, targetDate, countdownId, user.id]
    );

    const [rows] = await pool.execute(
      "SELECT id, title, target_date FROM countdowns WHERE id = ? LIMIT 1",
      [countdownId]
    );

    res.json({
      success: true,
      countdown: mapCountdownRow(rows[0]),
    });
  } catch (err) {
    console.error("Countdown update error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.delete("/api/countdowns/:id", async (req, res) => {
  try {
    const countdownId = Number(req.params.id);
    const account = String(req.body?.account || "").trim();

    if (!countdownId) {
      return res.status(400).json({ success: false, message: "无效的倒数日 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [result] = await pool.execute(
      "DELETE FROM countdowns WHERE id = ? AND user_id = ?",
      [countdownId, user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "倒数日不存在" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Countdown delete error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

function mapFriendRow(row) {
  return {
    id: row.id,
    account: row.account,
    nickname: row.nickname || row.account,
  };
}

function mapFriendRequestRow(row) {
  return {
    id: row.id,
    account: row.account,
    nickname: row.nickname || row.account,
    createdAt: row.created_at,
  };
}

async function linkMutualFriends(conn, userId, friendId) {
  await conn.execute(
    `INSERT INTO friends (user_id, friend_user_id)
     SELECT ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM friends WHERE user_id = ? AND friend_user_id = ?
     )`,
    [userId, friendId, userId, friendId]
  );
  await conn.execute(
    `INSERT INTO friends (user_id, friend_user_id)
     SELECT ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM friends WHERE user_id = ? AND friend_user_id = ?
     )`,
    [friendId, userId, friendId, userId]
  );
}

app.get("/api/friends", async (req, res) => {
  try {
    const account = String(req.query.account || "").trim();
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [rows] = await pool.execute(
      `SELECT f.id, u.account, u.nickname
       FROM friends f
       INNER JOIN users u ON u.id = f.friend_user_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [user.id]
    );

    res.json({
      success: true,
      friends: rows.map(mapFriendRow),
    });
  } catch (err) {
    console.error("Friends list error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.post("/api/friends", async (req, res) => {
  try {
    const account = String(req.body?.account || "").trim();
    const friendAccount = String(req.body?.friendAccount || "").trim();

    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }
    if (!friendAccount) {
      return res.status(400).json({ success: false, message: "请输入好友账号" });
    }
    if (account === friendAccount) {
      return res.status(400).json({ success: false, message: "不能添加自己为好友" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const friend = await getUserByAccount(friendAccount);
    if (!friend) {
      return res.status(404).json({ success: false, message: "好友账号不存在" });
    }

    if (await areFriends(user.id, friend.id)) {
      return res.status(400).json({ success: false, message: "已是好友" });
    }

    const [outgoing] = await pool.execute(
      `SELECT id FROM friend_requests
       WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending' LIMIT 1`,
      [user.id, friend.id]
    );
    if (outgoing.length) {
      return res.status(400).json({ success: false, message: "已发送申请，等待对方同意" });
    }

    const [incoming] = await pool.execute(
      `SELECT id FROM friend_requests
       WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending' LIMIT 1`,
      [friend.id, user.id]
    );
    if (incoming.length) {
      return res.status(400).json({
        success: false,
        message: "对方已向你发送申请，请在消息中处理",
      });
    }

    await pool.execute(
      `INSERT INTO friend_requests (from_user_id, to_user_id, status)
       VALUES (?, ?, 'pending')
       ON DUPLICATE KEY UPDATE status = 'pending', updated_at = CURRENT_TIMESTAMP`,
      [user.id, friend.id]
    );

    res.json({ success: true, message: "好友申请已发送" });
  } catch (err) {
    console.error("Friend request send error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.get("/api/friend-requests", async (req, res) => {
  try {
    const account = String(req.query.account || "").trim();
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [rows] = await pool.execute(
      `SELECT fr.id, u.account, u.nickname, fr.created_at
       FROM friend_requests fr
       INNER JOIN users u ON u.id = fr.from_user_id
       WHERE fr.to_user_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [user.id]
    );

    res.json({
      success: true,
      requests: rows.map(mapFriendRequestRow),
    });
  } catch (err) {
    console.error("Friend requests list error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.post("/api/friend-requests/:id/accept", async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const account = String(req.body?.account || "").trim();

    if (!requestId) {
      return res.status(400).json({ success: false, message: "无效的申请 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [reqRows] = await pool.execute(
      `SELECT id, from_user_id, to_user_id FROM friend_requests
       WHERE id = ? AND to_user_id = ? AND status = 'pending' LIMIT 1`,
      [requestId, user.id]
    );
    if (!reqRows.length) {
      return res.status(404).json({ success: false, message: "申请不存在或已处理" });
    }

    const request = reqRows[0];
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await linkMutualFriends(conn, request.from_user_id, request.to_user_id);
      await conn.execute(
        "UPDATE friend_requests SET status = 'accepted' WHERE id = ?",
        [requestId]
      );
      await conn.execute(
        `DELETE FROM friend_requests
         WHERE status = 'pending'
           AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))`,
        [
          request.from_user_id,
          request.to_user_id,
          request.to_user_id,
          request.from_user_id,
        ]
      );
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    res.json({ success: true, message: "已添加好友" });
  } catch (err) {
    console.error("Friend request accept error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.delete("/api/friend-requests/:id", async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const account = String(req.body?.account || "").trim();

    if (!requestId) {
      return res.status(400).json({ success: false, message: "无效的申请 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [result] = await pool.execute(
      "DELETE FROM friend_requests WHERE id = ? AND to_user_id = ? AND status = 'pending'",
      [requestId, user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "申请不存在或已处理" });
    }

    res.json({ success: true, message: "已拒绝申请" });
  } catch (err) {
    console.error("Friend request reject error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.delete("/api/friends/:id", async (req, res) => {
  try {
    const friendId = Number(req.params.id);
    const account = String(req.body?.account || "").trim();

    if (!friendId) {
      return res.status(400).json({ success: false, message: "无效的好友 ID" });
    }
    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }

    const user = await getUserByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    const [targetRows] = await pool.execute(
      "SELECT friend_user_id FROM friends WHERE id = ? AND user_id = ? LIMIT 1",
      [friendId, user.id]
    );

    if (!targetRows.length) {
      return res.status(404).json({ success: false, message: "好友不存在" });
    }

    const friendUserId = targetRows[0].friend_user_id;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        "DELETE FROM friends WHERE user_id = ? AND friend_user_id = ?",
        [user.id, friendUserId]
      );
      await conn.execute(
        "DELETE FROM friends WHERE user_id = ? AND friend_user_id = ?",
        [friendUserId, user.id]
      );
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Friend delete error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.put("/api/profile", async (req, res) => {
  try {
    const account = String(req.body?.account || "").trim();
    const nickname = String(req.body?.nickname ?? "").trim();
    const password = String(req.body?.password || "");

    if (!account) {
      return res.status(400).json({ success: false, message: "缺少账号" });
    }
    if (!nickname) {
      return res.status(400).json({ success: false, message: "昵称不能为空" });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ success: false, message: "密码至少 6 位" });
    }

    const [rows] = await pool.execute(
      "SELECT id FROM users WHERE account = ? LIMIT 1",
      [account]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.execute(
        "UPDATE users SET nickname = ?, password = ? WHERE account = ?",
        [nickname, hash, account]
      );
    } else {
      await pool.execute("UPDATE users SET nickname = ? WHERE account = ?", [
        nickname,
        account,
      ]);
    }

    res.json({
      success: true,
      user: { account, nickname },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "服务器错误，请稍后重试" });
  }
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Life Fragments running on port ${PORT}`);
});
