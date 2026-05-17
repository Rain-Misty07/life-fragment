const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "index.html");
let s = fs.readFileSync(filePath, "utf8");

const pairs = [
  ['const MOODS = ["??", "??", "??", "??", "??", "??"];', 'const MOODS = ["宁静", "愉快", "忧郁", "沉思", "温厚", "烦躁"];'],
  ['Serene: "??",', 'Serene: "宁静",'],
  ['Cheerful: "??",', 'Cheerful: "愉快",'],
  ['Melancholy: "??",', 'Melancholy: "忧郁",'],
  ['Pensive: "??",', 'Pensive: "沉思",'],
  ['Warmhearted: "??",', 'Warmhearted: "温厚",'],
  ['Irritated: "??",', 'Irritated: "烦躁",'],
  ['? "????"', '? "返回首页"'],
  ['? "????"', '? "个人资料"'],
  [': "??"', ': "登录"'],
  [': "??;', ': "—";'],
  ['? "??????', '? "设置倒数日"'],
  ['if (diff > 0) return `?? ${diff} ?`;', 'if (diff > 0) return `还有 ${diff} 天`;'],
  ['if (diff < 0) return `?? ${Math.abs(diff)} ?`;', 'if (diff < 0) return `已过 ${Math.abs(diff)} 天`;'],
  ['return "????";', 'return "就是今天";'],
  ['setError("????????);', 'setError("无法连接服务器");'],
  ['setError("?????????);', 'setError("请先写下一些文字");'],
  ['setMessage(isEdit ? "???? : "????);', 'setMessage(isEdit ? "已更新" : "已保存");'],
  ['setMessage("????);', 'setMessage("已删除");'],
  ['setError(data.message || "????");', 'setError(data.message || "加载失败");'],
  ['window.confirm("??????????")', 'window.confirm("确定删除这条日记吗？")'],
  ['window.confirm("??????????")', 'window.confirm("确定删除这条评论吗？")'],
  ['`${targetNickname || targetAccount || "??"} ???`', '`${targetNickname || targetAccount || "好友"} 的随记`'],
  [': "??";', ': "随记";'],
  ['placeholder="?????????"', 'placeholder="此刻心里在想什么？"'],
  ['Ctrl+Enter ??', 'Ctrl+Enter 保存'],
  ['? "????.."', '? "保存中..."'],
  ['? "????"', '? "更新碎笔"'],
  [': "????"}', ': "保存碎笔"}'],
  ['{readOnly ? "TA ???????? : "?????????????????}', '{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}'],
  ['placeholder="????..."', 'placeholder="写下评论..."'],
  ['placeholder="????..."', 'placeholder="写下回复..."'],
  ['???...', '加载中...'],
  ['????', '暂无评论'],
  ['setMessage(result.message || "????);', 'setMessage(result.message || "已保存");'],
  ['setError(result.message || "????");', 'setError(result.message || "保存失败");'],
  ['placeholder="??????"', 'placeholder="不可修改"'],
  ['setError(data.message || "????");', 'setError(data.message || "发表失败");'],
  ['setError(data.message || "????");', 'setError(data.message || "删除失败");'],
];

for (const [from, to] of pairs) {
  while (s.includes(from)) {
    s = s.replace(from, to);
  }
}

// Comment / entry action labels (single-line buttons)
s = s.replace(/>\s*\?\?\s*<\/button>\s*\n\s*<span className="text-white\/20">/g, '>\n                                编辑\n                              </button>\n                              <span className="text-white/20">');
s = s.replace(
  /onClick=\{\(\) => handleDelete\(entry\.id\)\}[\s\S]*?>\s*\?\?\s*<\/button>/,
  'onClick={() => handleDelete(entry.id)}\n                                className="text-xs font-body text-red-300/80 hover:text-red-200 transition-colors"\n                              >\n                                删除\n                              </button>'
);

// Reply / delete in comments - fix remaining button text between known classes
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

// Comment toggle button
s = s.replace(
  /className="text-xs font-body text-white\/70 hover:text-white transition-colors shrink-0"\s*>\s*\?\?/g,
  'className="text-xs font-body text-white/70 hover:text-white transition-colors shrink-0"\n                          >\n                            评论'
);

// Section title
s = s.replace(/>\s*\?\?\?\?\?\?\s*<\/motion\.p>/, '>\n              近期的碎笔\n            </motion.p>');

fs.writeFileSync(filePath, s, "utf8");
console.log("Restored. 宁静:", s.includes("宁静"), "?? count:", (s.match(/\?\?/g) || []).length);
