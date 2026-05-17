const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "index.html");
let s = fs.readFileSync(filePath, "utf8");

const replacements = [
  ['? "????"', '? "返回首页"'],
  ['? "????"', '? "个人资料"'],
  [': "??"', ': "登录"'],
  [
    'const MOODS = ["??", "??", "??", "??", "??", "??"];',
    'const MOODS = ["宁静", "愉快", "忧郁", "沉思", "温厚", "烦躁"];',
  ],
  ['Serene: "??",', 'Serene: "宁静",'],
  ['Cheerful: "??",', 'Cheerful: "愉快",'],
  ['Melancholy: "??",', 'Melancholy: "忧郁",'],
  ['Pensive: "??",', 'Pensive: "沉思",'],
  ['Warmhearted: "??",', 'Warmhearted: "温厚",'],
  ['Irritated: "??",', 'Irritated: "烦躁",'],
  [': "??;', ': "—";'],
  ['? "??????', '? "设置倒数日"'],
  ['setMessage(result.message || "????);', 'setMessage(result.message || "已保存");'],
  ['setError(result.message || "????");', 'setError(result.message || "保存失败");'],
  ['placeholder="??????"', 'placeholder="不可修改"'],
  ['if (diff > 0) return `?? ${diff} ?`;', 'if (diff > 0) return `还有 ${diff} 天`;'],
  ['if (diff < 0) return `?? ${Math.abs(diff)} ?`;', 'if (diff < 0) return `已过 ${Math.abs(diff)} 天`;'],
  ['return "????";', 'return "就是今天";'],
  ['setError(data.message || "????");', 'setError(data.message || "发表失败");'],
  ['setError("????????);', 'setError("无法连接服务器");'],
  ['window.confirm("??????????")', 'window.confirm("确定删除这条评论吗？")'],
  ['placeholder="????..."', 'placeholder="写下回复..."'],
  ['setError("?????????);', 'setError("请先写下一些文字");'],
  ['setMessage(isEdit ? "???? : "????);', 'setMessage(isEdit ? "已更新" : "已保存");'],
  ['window.confirm("??????????")', 'window.confirm("确定删除这条日记吗？")'],
  ['setMessage("????);', 'setMessage("已删除");'],
  ['`${targetNickname || targetAccount || "??"} ???`', '`${targetNickname || targetAccount || "好友"} 的随记`'],
  [': "??";', ': "随记";'],
  ['placeholder="?????????"', 'placeholder="此刻心里在想什么？"'],
  ['Ctrl+Enter ??', 'Ctrl+Enter 保存'],
  ['? "????.."', '? "保存中..."'],
  ['? "????"', '? "更新碎笔"'],
  [': "????"}', ': "保存碎笔"}'],
  ['????..', '加载中...'],
  ['{readOnly ? "TA ???????? : "?????????????????}', '{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}'],
  ['??????            </motion.p>', '近期的碎笔</motion.p>'],
  ['???...', '加载中...'],
  ['????', '暂无评论'],
  ['placeholder="????..."', 'placeholder="写下评论..."'],
  ['??\n                            {commentsMap', '评论\n                            {commentsMap'],
  ['>\n                                ??\n                              </button>', '>\n                                评论\n                              </button>'],
  ['>\n                                ??\n                              </button>\n                            </div>\n                          ) : (\n                            <motion.div />', '>\n                                删除\n                              </button>\n                            </div>\n                          ) : (\n                            <motion.div />'],
];

for (const [from, to] of replacements) {
  if (s.includes(from)) {
    s = s.split(from).join(to);
  }
}

// Fix comment render buttons (回复 / 删除 / 发表)
s = s.replace(
  /className="text-\[10px\] font-body text-white\/55 hover:text-white\/85 transition-colors"\s*>\s*\?\?\s*<\/button>/,
  'className="text-[10px] font-body text-white/55 hover:text-white/85 transition-colors"\n              >\n                回复\n              </button>'
);
s = s.replace(
  /className="text-\[10px\] font-body text-red-300\/70 hover:text-red-200 transition-colors"\s*>\s*\?\?\s*<\/button>/g,
  'className="text-[10px] font-body text-red-300/70 hover:text-red-200 transition-colors"\n                >\n                  删除\n                </button>'
);

// Navbar titles (first occurrences in title block)
s = s.replace(
  /page === "profile"\s*\? "????"/,
  'page === "profile"\n                ? "返回首页"'
);
s = s.replace(
  /page === "contacts"\s*\n\s*\? "????"/,
  'page === "contacts"\n                  ? "返回首页"'
);
s = s.replace(
  /\? "????"\s*\n\s*: user\s*\n\s*\? "????"/,
  '? "返回首页"\n                  : user\n                    ? "个人资料"'
);

// Entry card buttons
s = s.replace(/>\s*编辑\s*</g, '>\n                                编辑\n                              <');
s = s.replace(
  /onClick=\{\(\) => handleDelete\(entry\.id\)\}[\s\S]*?>\s*删除\s*</,
  (m) => m.replace('??', '删除')
);

fs.writeFileSync(filePath, s, "utf8");
console.log("Fixed index.html encoding");
