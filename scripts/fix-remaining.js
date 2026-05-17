const fs = require("fs");
const p = require("path").join(__dirname, "..", "index.html");
let s = fs.readFileSync(p, "utf8");
const fixes = [
  ['<p className="text-xs text-white/60 font-body mt-5 mb-2">??</p>', '<p className="text-xs text-white/60 font-body mt-5 mb-2">心情</p>'],
  ['                        ??\n                      </button>', '                        取消\n                      </button>'],
  ['{readOnly ? "TA 近期的碎笔??" : "近期的碎笔近期的碎笔近期的碎笔?"}', '{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}'],
  ['setMessage(data.message || "近期的碎笔近期的碎笔??");', 'setMessage(data.message || "好友申请已发送");'],
  ['return { ok: true, message: "??? };', 'return { ok: true, message: "已保存" };'],
  ['return { ok: false, message: "近期的碎笔??" };', 'return { ok: false, message: "无法连接服务器" };'],
];
for (const [a, b] of fixes) s = s.split(a).join(b);
fs.writeFileSync(p, s, "utf8");
console.log("done", (s.match(/\?\?/g) || []).length);
