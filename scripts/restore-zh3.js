const fs = require("fs");
const p = require("path").join(__dirname, "..", "index.html");
let s = fs.readFileSync(p, "utf8");

// Writings compose section
s = s.replace(
  /<h2 className="font-heading italic text-2xl md:text-3xl text-white tracking-tight">\s*\?\?\s*<\/h2>\s*<p className="text-xs text-white\/50 font-body mt-1">\s*[^\n<]+\s*<\/p>/,
  `<h2 className="font-heading italic text-2xl md:text-3xl text-white tracking-tight">
                    随记
                  </h2>
                  <p className="text-xs text-white/50 font-body mt-1">
                    记下此刻的一小段心情
                  </p>`
);

const map = {
  '{readOnly ? "TA ???????" : "????????????????"}': '{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}',
  '{saving\n                        ? "???..."\n                        : editingId\n                          ? "????"\n                          : "????"}':
    '{saving\n                        ? "保存中..."\n                        : editingId\n                          ? "更新碎笔"\n                          : "保存碎笔"}',
  '              ?????\n            </motion.p>\n\n            <motion.div\n              layout':
    '              近期的碎笔\n            </motion.p>\n\n            <motion.div\n              layout',
  '                      ???...\n                    </p>\n                  )}\n                  {!loading && entries.length':
    '                      加载中...\n                    </p>\n                  )}\n                  {!loading && entries.length',
  '                  ???\n                </h2>\n                <p className="text-xs text-white/50 font-body mt-1">\n                  ?????':
    '                  倒数日\n                </h2>\n                <p className="text-xs text-white/50 font-body mt-1">\n                  最近的目标',
  '{loading ? "???..." : "???????????????"}': '{loading ? "加载中..." : "暂无倒数日，在下方添加一个吧。"}',
  '{editingId ? "?????" : "?????"}': '{editingId ? "编辑倒数日" : "新建倒数日"}',
  '                      ????\n                    </label>\n                    <input\n                      type="text"\n                      value={title}':
    '                      事件名称\n                    </label>\n                    <input\n                      type="text"\n                      value={title}',
  'placeholder="???????"': 'placeholder="例如：毕业典礼"',
  '                      ????\n                    </label>\n                    <input\n                      type="date"':
    '                      目标日期\n                    </label>\n                    <input\n                      type="date"',
  '{saving ? "???..." : editingId ? "??" : "??"}': '{saving ? "保存中..." : editingId ? "更新" : "保存"}',
  '              ?????\n            </motion.p>\n\n            <motion.div className="writings-shell w-full max-w-lg flex-1':
    '              全部倒数日\n            </motion.p>\n\n            <motion.div className="writings-shell w-full max-w-lg flex-1',
  '                      ????.': '                      加载中...',
  '                      ??????                    </p>': '                      暂无倒数日\n                    </p>',
  'setMessage(data.message || "????????);': 'setMessage(data.message || "好友申请已发送");',
  'setMessage(data.message || "???????");': 'setMessage(data.message || "已发送申请，等待对方同意");',
  'return { ok: true, message: "???? };': 'return { ok: true, message: "已保存" };',
  'return { ok: false, message: "???????? };': 'return { ok: false, message: "无法连接服务器" };',
  'setMessage("?????");': 'setMessage("已移除好友");',
  '`${targetNickname || targetAccount || "??"} ???`': '`${targetNickname || targetAccount || "好友"} 的随记`',
  ': "??";': ': "随记";',
  'Ctrl+Enter ??': 'Ctrl+Enter 保存',
  'setMessage(isEdit ? "???" : "???");': 'setMessage(isEdit ? "已更新" : "已保存");',
  'setMessage("???");': 'setMessage("已删除");',
  'if (!window.confirm("????????????)) return;': 'if (!window.confirm("确定删除这个倒数日吗？")) return;',
};

for (const [a, b] of Object.entries(map)) {
  while (s.includes(a)) s = s.replace(a, b);
}

// Buttons with only ??
s = s.replace(/>\s*\?\?\s*<\/button>\s*\n\s*\)\}\s*\n\s*<\/motion\.motion\.div>/g, '>\n                        取消\n                      </button>\n                    )}\n                  </motion.div>');
s = s.replace(/className="text-xs font-body text-white\/70[^"]*"\s*>\s*\?\?\s*<\/button>/g, (m) => {
  if (m.includes('handleEdit')) return m;
  return m.replace('??', '编辑');
});

// Fix comment/reply buttons in renderCommentNode - use line-by-line
s = s.replace(/text-white\/55 hover:text-white\/85 transition-colors"\s*>\s*\?\?\s*<\/button>/, 'text-white/55 hover:text-white/85 transition-colors"\n              >\n                回复\n              </button>');
s = s.replace(/text-red-300\/70 hover:text-red-200 transition-colors"\s*>\s*\?\?\s*<\/button>/g, 'text-red-300/70 hover:text-red-200 transition-colors"\n                >\n                  删除\n                </button>');
s = s.replace(/disabled:opacity-60"\s*>\s*\?\?\s*<\/button>/g, 'disabled:opacity-60"\n                  >\n                    发表\n                  </button>');

// Entry actions
s = s.replace(/onClick=\{\(\) => handleEdit\(entry\)\}[\s\S]*?>\s*\?\?\s*<\/button>\s*\n\s*<span className="text-white\/20">/, 'onClick={() => handleEdit(entry)}\n                                className="text-xs font-body text-white/70 hover:text-white transition-colors"\n                              >\n                                编辑\n                              </button>\n                              <span className="text-white/20">');
s = s.replace(/onClick=\{\(\) => handleDelete\(entry\.id\)\}[\s\S]*?>\s*\?\?\s*<\/button>/, 'onClick={() => handleDelete(entry.id)}\n                                className="text-xs font-body text-red-300/80 hover:text-red-200 transition-colors"\n                              >\n                                删除\n                              </button>');
s = s.replace(/onClick=\{\(\) => handleEdit\(item\)\}[\s\S]*?>\s*\?\?\s*<\/button>/, 'onClick={() => handleEdit(item)}\n                              className="text-xs font-body text-white/70 hover:text-white transition-colors"\n                            >\n                              编辑\n                            </button>');
s = s.replace(/onClick=\{\(\) => handleDelete\(item\.id\)\}[\s\S]*?>\s*\?\?\s*<\/button>/, 'onClick={() => handleDelete(item.id)}\n                              className="text-xs font-body text-red-300/80 hover:text-red-200 transition-colors"\n                            >\n                              删除\n                            </button>');

// Comment toggle
s = s.replace(
  /onClick=\{\(\) => toggleComments\(entry\.id\)\}[\s\S]*?>\s*\?\?/,
  'onClick={() => toggleComments(entry.id)}\n                            className="text-xs font-body text-white/70 hover:text-white transition-colors shrink-0"\n                          >\n                            评论'
);

// Navbar - fix title block
s = s.replace(
  /page === "profile"\s*\? "[^"]*"\s*: page === "login"[^?]+\? "[^"]*"\s*: user\s*\? "[^"]*"\s*: "[^"]*"/,
  'page === "profile"\n                ? "返回首页"\n                : page === "login" || page === "register" || page === "writings" || page === "friend-writings" || page === "countdown" || page === "contacts"\n                  ? "返回首页"\n                  : user\n                    ? "个人资料"\n                    : "登录"'
);

// dayLabel
s = s.replace('if (diff > 0) return `?? ${diff} ?`;', 'if (diff > 0) return `还有 ${diff} 天`;');
s = s.replace('if (diff < 0) return `?? ${Math.abs(diff)} ?`;', 'if (diff < 0) return `已过 ${Math.abs(diff)} 天`;');
s = s.replace('return "????";', 'return "就是今天";');

// MOODS block again if needed
if (s.includes('const MOODS = ["??"')) {
  s = s.replace('const MOODS = ["??", "??", "??", "??", "??", "??"];', 'const MOODS = ["宁静", "愉快", "忧郁", "沉思", "温厚", "烦躁"];');
  s = s.replace('Serene: "??",', 'Serene: "宁静",');
  s = s.replace('Cheerful: "??",', 'Cheerful: "愉快",');
  s = s.replace('Melancholy: "??",', 'Melancholy: "忧郁",');
  s = s.replace('Pensive: "??",', 'Pensive: "沉思",');
  s = s.replace('Warmhearted: "??",', 'Warmhearted: "温厚",');
  s = s.replace('Irritated: "??",', 'Irritated: "烦躁",');
}

// Generic errors
const errRepl = [
  ['setError("???????");', 'setError("无法连接服务器");'],
  ['setError("????????");', 'setError("请先写下一些文字");'],
  ['setError(data.message || "????");', 'setError(data.message || "加载失败");'],
  ['window.confirm("??????????")', 'window.confirm("确定删除这条日记吗？")'],
  ['placeholder="?????????"', 'placeholder="此刻心里在想什么？"'],
  ['placeholder="????..."', 'placeholder="写下评论..."'],
  ['???...', '加载中...'],
  ['????', '暂无评论'],
];
for (const [a,b] of errRepl) while (s.includes(a)) s = s.replace(a,b);

// Fix reply placeholder duplicate
s = s.replace('placeholder="写下评论..."\n                  rows={2}\n                  className="comment-input flex-1 font-body"\n                />\n                <button\n                  type="button"\n                  disabled={commentSubmitting}\n                  onClick={() => submitComment(entryId, comment.id)}', 
  'placeholder="写下回复..."\n                  rows={2}\n                  className="comment-input flex-1 font-body"\n                />\n                <button\n                  type="button"\n                  disabled={commentSubmitting}\n                  onClick={() => submitComment(entryId, comment.id)}');

// JSX: close div for reply form
s = s.replace(
  /onClick=\{\(\) => submitComment\(entryId, comment\.id\)\}[\s\S]*?>\s*发表\s*<\/button>\s*<\/motion\.motion\.motion\.div>/,
  (m) => m.replace('</motion.div>', '</motion.div>').replace(/<\/motion\.div>$/, '</motion.div>')
);

fs.writeFileSync(p, s, "utf8");
console.log("done ??", (s.match(/\?\?/g)||[]).length, "宁静", s.includes("宁静"));
