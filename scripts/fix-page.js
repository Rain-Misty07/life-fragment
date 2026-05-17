const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "..", "index.html");
let s = fs.readFileSync(filePath, "utf8");

// Fix broken string literals (syntax errors)
const syntaxFixes = [
  ['setMessage(result.message || "????);', 'setMessage(result.message || "已保存");'],
  ['setMessage(result.message || "???");', 'setMessage(result.message || "已保存");'],
  ['setMessage(data.message || "????????);', 'setMessage(data.message || "好友申请已发送");'],
  ['return { ok: true, message: "???? };', 'return { ok: true, message: "已保存" };'],
  ['return { ok: false, message: "???????? };', 'return { ok: false, message: "无法连接服务器" };'],
  [': "??;', ': "—";'],
  ['nearestDiff != null ? String(Math.abs(nearestDiff)) : "?";', 'nearestDiff != null ? String(Math.abs(nearestDiff)) : "—";'],
  ['friendCount != null ? String(friendCount) : "?";', 'friendCount != null ? String(friendCount) : "—";'],
  ['? `${nearestCountdown.title} ? ${dayLabel', '? `${nearestCountdown.title} · ${dayLabel'],
];

for (const [a, b] of syntaxFixes) {
  s = s.split(a).join(b);
}

// MOODS
s = s.replace('const MOODS = ["??", "??", "??", "??", "??", "??"];', 'const MOODS = ["宁静", "愉快", "忧郁", "沉思", "温厚", "烦躁"];');
for (const [en, zh] of [
  ["Serene", "宁静"],
  ["Cheerful", "愉快"],
  ["Melancholy", "忧郁"],
  ["Pensive", "沉思"],
  ["Warmhearted", "温厚"],
  ["Irritated", "烦躁"],
]) {
  s = s.replace(`${en}: "??",`, `${en}: "${zh}",`);
}

const pairs = {
  '? "????"': '? "返回首页"',
  '? "????"': '? "个人资料"',
  ': "??"': ': "登录"',
  '? "?????"': '? "设置倒数日"',
  'setError("???????");': 'setError("无法连接服务器");',
  'setError("????????");': 'setError("请先写下一些文字");',
  'setError(data.message || "????");': 'setError(data.message || "加载失败");',
  'setMessage(isEdit ? "???" : "???");': 'setMessage(isEdit ? "已更新" : "已保存");',
  'setMessage("???");': 'setMessage("已删除");',
  'setMessage("?????");': 'setMessage("已移除好友");',
  'setMessage(data.message || "???????");': 'setMessage(data.message || "已发送申请，等待对方同意");',
  'window.confirm("??????????")': 'window.confirm("确定删除这条日记吗？")',
  'if (diff > 0) return `?? ${diff} ?`;': 'if (diff > 0) return `还有 ${diff} 天`;',
  'if (diff < 0) return `?? ${Math.abs(diff)} ?`;': 'if (diff < 0) return `已过 ${Math.abs(diff)} 天`;',
  'return "????";': 'return "就是今天";',
  '`${targetNickname || targetAccount || "??"} ???`': '`${targetNickname || targetAccount || "好友"} 的随记`',
  ': "??";': ': "随记";',
  'placeholder="?????????"': 'placeholder="此刻心里在想什么？"',
  'Ctrl+Enter ??': 'Ctrl+Enter 保存',
  '? "???..."': '? "保存中..."',
  '? "????"': '? "更新碎笔"',
  ': "????"}': ': "保存碎笔"}',
  '?????': '近期的碎笔',
  '???...': '加载中...',
  '????': '暂无评论',
  '{readOnly ? "TA ???????" : "????????????????"}': '{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}',
  'placeholder="????..."': 'placeholder="写下评论..."',
  'setLoginError(data.message || "????");': 'setLoginError(data.message || "登录失败");',
  'setRegisterError(data.message || "????");': 'setRegisterError(data.message || "注册失败");',
  'setLoginError("?????????????? npm start");': 'setLoginError("无法连接服务器，请确认已启动 npm start");',
  'setRegisterError("?????????????? npm start");': 'setRegisterError("无法连接服务器，请确认已启动 npm start");',
  'return { ok: false, message: data.message || "????" };': 'return { ok: false, message: data.message || "保存失败" };',
};

for (const [a, b] of Object.entries(pairs)) {
  while (s.includes(a)) s = s.replace(a, b);
}

// Writings header block
s = s.replace(
  /<h2 className="font-heading italic text-2xl md:text-3xl text-white tracking-tight">\s*\?\?\s*<\/h2>/,
  '<h2 className="font-heading italic text-2xl md:text-3xl text-white tracking-tight">\n                    随记\n                  </h2>'
);
s = s.replace(
  /<p className="text-xs text-white\/50 font-body mt-1">\s*[^\n<]{1,30}\s*<\/p>\s*<p className="text-xs text-white\/60 font-body mt-5 mb-2">??<\/p>/,
  `<p className="text-xs text-white/50 font-body mt-1">\n                    记下此刻的一小段心情\n                  </p>\n                  <p className="text-xs text-white/60 font-body mt-5 mb-2">心情</p>`
);

// Button labels
s = s.replace(/>\s*\?\?\s*<\/button>\s*\n\s*<\/motion\.div>\s*\n\s*\)\}\s*\n\s*<\/motion\.div>\s*\n\s*<\/motion\.div>\s*\n\s*\)\}\s*\n\s*\{readOnly && \(/, '>\n                        取消\n                      </button>\n                    )}\n                  </motion.div>\n                </motion.div>\n              </motion.div>\n            )}\n\n            {readOnly && (');

s = s.replace(
  /text-white\/55 hover:text-white\/85 transition-colors"\s*>\s*\?\?\s*<\/button>/,
  'text-white/55 hover:text-white/85 transition-colors"\n              >\n                回复\n              </button>'
);
s = s.replace(
  /text-red-300\/70 hover:text-red-200 transition-colors"\s*>\s*\?\?\s*<\/button>/g,
  'text-red-300/70 hover:text-red-200 transition-colors"\n                >\n                  删除\n                </button>'
);
s = s.replace(
  /disabled:opacity-60"\s*>\s*\?\?\s*<\/button>/g,
  'disabled:opacity-60"\n                  >\n                    发表\n                  </button>'
);

s = s.replace(
  /onClick=\{\(\) => handleEdit\(entry\)\}[\s\S]*?>\s*\?\?\s*<\/button>\s*\n\s*<span className="text-white\/20">/,
  'onClick={() => handleEdit(entry)}\n                                className="text-xs font-body text-white/70 hover:text-white transition-colors"\n                              >\n                                编辑\n                              </button>\n                              <span className="text-white/20">'
);
s = s.replace(
  /onClick=\{\(\) => handleDelete\(entry\.id\)\}[\s\S]*?>\s*\?\?\s*<\/button>/,
  'onClick={() => handleDelete(entry.id)}\n                                className="text-xs font-body text-red-300/80 hover:text-red-200 transition-colors"\n                              >\n                                删除\n                              </button>'
);
s = s.replace(
  /onClick=\{\(\) => toggleComments\(entry\.id\)\}[\s\S]*?>\s*\?\?/,
  'onClick={() => toggleComments(entry.id)}\n                            className="text-xs font-body text-white/70 hover:text-white transition-colors shrink-0"\n                          >\n                            评论'
);

// Countdown section
s = s.replace(/                  \?\?\s*<\/h2>\s*<p className="text-xs text-white\/50 font-body mt-1">\s*\?\?\?\?\?/, '                  倒数日\n                </h2>\n                <p className="text-xs text-white/50 font-body mt-1">\n                  最近的目标');
s = s.replace('{loading ? "加载中..." : "暂无评论暂无评论暂无评论???"}', '{loading ? "加载中..." : "暂无倒数日，在下方添加一个吧。"}');
s = s.replace('{editingId ? "设置倒数日" : "新建倒数日"}', '{editingId ? "编辑倒数日" : "新建倒数日"}');
s = s.replace('placeholder="例如：毕业典礼"', 'placeholder="例如：毕业典礼"');
if (s.includes('placeholder="???????')) {
  s = s.replace(/placeholder="[^"]*\n\s*className="w-full bg-transparent border-0 border-b/, 'placeholder="例如：毕业典礼"\n                      className="w-full bg-transparent border-0 border-b');
}

// Reply placeholder
s = s.replace(
  'placeholder="写下评论..."\n                  rows={2}\n                  className="comment-input flex-1 font-body"\n                />\n                <button\n                  type="button"\n                  disabled={commentSubmitting}\n                  onClick={() => submitComment(entryId, comment.id)}',
  'placeholder="写下回复..."\n                  rows={2}\n                  className="comment-input flex-1 font-body"\n                />\n                <button\n                  type="button"\n                  disabled={commentSubmitting}\n                  onClick={() => submitComment(entryId, comment.id)}'
);

// Navbar titles
s = s.replace(
  /page === "profile"\s*\? "[^"]*"/,
  'page === "profile"\n                ? "返回首页"'
);
s = s.replace(
  /page === "contacts"\s*\n\s*\? "[^"]*"/,
  'page === "contacts"\n                  ? "返回首页"'
);
s = s.replace(
  /\? "[^"]*"\s*\n\s*: user\s*\n\s*\? "[^"]*"\s*\n\s*: "登录"/,
  '? "返回首页"\n                  : user\n                    ? "个人资料"\n                    : "登录"'
);

fs.writeFileSync(filePath, s, "utf8");

// Validate no obvious syntax breaks
const breaks = [
  /"[^"]*\);/g,
];
const bad = [];
for (const m of s.matchAll(/setMessage\([^)]+\);/g)) {
  if (m[0].includes("??") && !m[0].includes('",')) bad.push(m[0]);
}
console.log("Fixed. ?? count:", (s.match(/\?\?/g) || []).length);
console.log("宁静:", s.includes("宁静"));
console.log("Suspicious setMessage:", bad.slice(0, 5));
