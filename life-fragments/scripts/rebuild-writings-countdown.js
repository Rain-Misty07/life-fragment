const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "index.html");
const countdownPath = path.join(__dirname, "countdown-snippet.txt");

let html = fs.readFileSync(indexPath, "utf8");
const countdown = fs.readFileSync(countdownPath, "utf8")
  .split("\n")
  .slice(2, 308)
  .join("\n");

const writingsFooter = `                        <motion.div className="flex items-center justify-between mt-3 gap-3">
                          {!readOnly ? (
                            <motion.div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(entry)}
                                className="text-xs font-body text-white/70 hover:text-white transition-colors"
                              >
                                编辑
                              </button>
                              <span className="text-white/20">|</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(entry.id)}
                                className="text-xs font-body text-red-300/80 hover:text-red-200 transition-colors"
                              >
                                删除
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div />
                          )}
                          <button
                            type="button"
                            onClick={() => toggleComments(entry.id)}
                            className="text-xs font-body text-white/70 hover:text-white transition-colors shrink-0"
                          >
                            评论
                            {commentsMap[entry.id]?.length > 0 && (
                              <span className="text-white/45 ml-1">
                                ({commentsMap[entry.id].length})
                              </span>
                            )}
                          </button>
                        </motion.div>

                        {expandedEntryId === entry.id && (
                          <motion.div className="comment-panel">
                            {commentsLoadingId === entry.id && (
                              <p className="text-xs text-white/45 font-body text-center py-2">
                                加载中...
                              </p>
                            )}
                            {commentsLoadingId !== entry.id && (
                              <>
                                {buildCommentTree(commentsMap[entry.id] || []).length === 0 ? (
                                  <p className="text-xs text-white/45 font-body text-center py-2">
                                    暂无评论
                                  </p>
                                ) : (
                                  buildCommentTree(commentsMap[entry.id] || []).map((c) =>
                                    renderCommentNode(c, entry.id, 0)
                                  )
                                )}
                                <motion.div className="mt-3 flex gap-2 items-end">
                                  <textarea
                                    value={commentDrafts[draftKey(entry.id, null)] || ""}
                                    onChange={(e) =>
                                      setCommentDrafts((prev) => ({
                                        ...prev,
                                        [draftKey(entry.id, null)]: e.target.value,
                                      }))
                                    }
                                    placeholder="写下评论..."
                                    rows={2}
                                    className="comment-input flex-1 font-body"
                                  />
                                  <button
                                    type="button"
                                    disabled={commentSubmitting}
                                    onClick={() => submitComment(entry.id, null)}
                                    className="shrink-0 rounded-lg bg-white/90 text-black text-xs font-body font-medium px-3 py-2 hover:bg-white transition-colors disabled:opacity-60"
                                  >
                                    发表
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </motion.article>
                    ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      );
    }

    window.Writings = Writings;

`;

const endMarker = `    window.Countdown = Countdown;

    function Contacts({ user, onBack, onViewFriend }) {`;

const end = html.indexOf(endMarker);
if (end === -1) {
  console.error("end marker not found");
  process.exit(1);
}

const anchor = "onClick={() => handleDelete(entry.id)}";
const anchorIdx = html.lastIndexOf(anchor, end);
if (anchorIdx === -1) {
  console.error("anchor not found");
  process.exit(1);
}

const start = html.lastIndexOf(
  '<div className="flex items-center justify-between mt-3 gap-3">',
  anchorIdx
);

html =
  html.slice(0, start) +
  writingsFooter +
  countdown +
  "\n\n" +
  html.slice(end + "    window.Countdown = Countdown;\n\n".length);

const fixes = [
  [': "随记";', ': "随记";'],
  [
    '{readOnly ? "TA 近期的碎笔??" : "记下此刻的一小段心情近期的碎笔?"}',
    '{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}',
  ],
  [
    '{readOnly ? "TA 近期的碎笔??" : "近期的碎笔近期的碎笔近期的碎笔?"}',
    '{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}',
  ],
  ['记下此刻的一小段心情记下此刻的一小段心情', '记下此刻的一小段心情'],
  ['placeholder="?加载中..."', 'placeholder="写下回复..."'],
  [
    'if (!window.confirm("确定删除这条日记吗？")) return;\n        try {\n          const res = await fetch(`/api/comments/',
    'if (!window.confirm("确定删除这条评论吗？")) return;\n        try {\n          const res = await fetch(`/api/comments/',
  ],
  ['setMessage(data.message || "记下此刻的一小段心情??");', 'setMessage(data.message || "好友申请已发送");'],
  ['setMessage(data.message || "近期的碎笔近期的碎笔??");', 'setMessage(data.message || "好友申请已发送");'],
  ['return { ok: true, message: "???" };', 'return { ok: true, message: "已保存" };'],
  ['return { ok: false, message: "近期的碎笔??" };', 'return { ok: false, message: "无法连接服务器" };'],
  ['return { ok: false, message: "记下此刻的一小段心情??" };', 'return { ok: false, message: "无法连接服务器" };'],
  ['if (!trimmed) {\n          setError("无法连接服务器");', 'if (!trimmed) {\n          setError("请输入好友账号");'],
  ['if (!window.confirm("确定删除这条日记吗？")) return;\n        setError("");\n        setMessage("");\n        try {\n          const res = await fetch(`/api/friends/${id}`', 'if (!window.confirm("确定移除这位好友吗？")) return;\n        setError("");\n        setMessage("");\n        try {\n          const res = await fetch(`/api/friends/${id}`'],
  ['const contactsSub = user ? "???" : "???";', 'const contactsSub = user ? "通讯录" : "通讯录";'],
  ['<p className="text-xs text-white/60 font-body mt-5 mb-2">??</p>', '<p className="text-xs text-white/60 font-body mt-5 mb-2">心情</p>'],
  ['                  ??\n                  <ArrowUpRight />', '                  随记\n                  <ArrowUpRight />'],
  ['<span className="ml-2 text-white/40"> ??</span>', '<span className="ml-2 text-white/40">· 最近</span>'],
  ['<span className="ml-2 text-white/40">? ??</span>', '<span className="ml-2 text-white/40">· 最近</span>'],
  ["Casual Writings", "随记"],
  [
    '<h2 className="font-heading italic text-2xl md:text-3xl text-white tracking-tight">\n                      Contacts\n                    </h2>',
    '<h2 className="font-heading italic text-2xl md:text-3xl text-white tracking-tight">\n                      通讯录\n                    </h2>',
  ],
];

for (const [a, b] of fixes) {
  html = html.split(a).join(b);
}

// MOODS
html = html.replace(
  'const MOODS = ["??", "??", "??", "??", "??", "??"];',
  'const MOODS = ["宁静", "愉快", "忧郁", "沉思", "温厚", "烦躁"];'
);
for (const [en, zh] of [
  ["Serene", "宁静"],
  ["Cheerful", "愉快"],
  ["Melancholy", "忧郁"],
  ["Pensive", "沉思"],
  ["Warmhearted", "温厚"],
  ["Irritated", "烦躁"],
]) {
  html = html.replace(`${en}: "??",`, `${en}: "${zh}",`);
}

// Navbar
html = html.replace(/\? "返回首页"/g, '? "返回首页"');
const navBroken = html.includes('? "????"');
if (navBroken) {
  html = html.replace(
    /page === "profile"\s*\? "[^"]*"/,
    'page === "profile"\n                ? "返回首页"'
  );
  html = html.replace(
    /page === "contacts"\s*\n\s*\? "[^"]*"/,
    'page === "contacts"\n                  ? "返回首页"'
  );
  html = html.replace(
    /\? "[^"]*"\s*\n\s*: user\s*\n\s*\? "[^"]*"\s*\n\s*: "[^"]*"/,
    '? "返回首页"\n                  : user\n                    ? "个人资料"\n                    : "登录"'
  );
  html = html.replace(': "??";', ': "登录";');
  html = html.replace('{user ? user.nickname : "??"}', '{user ? user.nickname : "登录"}');
}

fs.writeFileSync(indexPath, html, "utf8");
console.log("rebuilt OK, ??", (html.match(/\?\?/g) || []).length);
console.log("Countdown", html.includes("function Countdown"));
console.log("Writings export", html.includes("window.Writings = Writings"));
