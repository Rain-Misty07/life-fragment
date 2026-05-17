const fs = require("fs");
const p = require("path").join(__dirname, "..", "index.html");
let s = fs.readFileSync(p, "utf8");

const map = {
  '<p className="text-xs text-white/60 font-body mt-5 mb-2">??</p>':
    '<p className="text-xs text-white/60 font-body mt-5 mb-2">心情</p>',
  "近期的碎笔近期的碎笔": "记下此刻的一小段心情",
  '{readOnly ? "TA 近期的碎笔??" : "近期的碎笔近期的碎笔近期的碎笔?"}':
    '{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}',
  '<span className="ml-2 text-white/40">? ??</span>':
    '<span className="ml-2 text-white/40">· 最近</span>',
  'return { ok: true, message: "???" };': 'return { ok: true, message: "已保存" };',
  'return { ok: false, message: "近期的碎笔??" };':
    'return { ok: false, message: "无法连接服务器" };',
  'if (!window.confirm("确定删除这条日记吗？")) return;\n        setError("");\n        setMessage("");\n        try {\n          const res = await fetch(`/api/friends/${id}`':
    'if (!window.confirm("确定移除这位好友吗？")) return;\n        setError("");\n        setMessage("");\n        try {\n          const res = await fetch(`/api/friends/${id}`',
  "Casual Writings": "随记",
  'const contactsSub = user ? "Contacts" : "Contacts";':
    'const contactsSub = user ? "通讯录" : "通讯录";',
  "<h2 className=\"font-heading italic text-2xl md:text-3xl text-white tracking-tight\">\n                      Contacts\n                    </h2>":
    '<h2 className="font-heading italic text-2xl md:text-3xl text-white tracking-tight">\n                      通讯录\n                    </h2>',
};

for (const [a, b] of Object.entries(map)) {
  s = s.split(a).join(b);
}

// Cancel button in writings compose (only ?? between tags)
s = s.replace(
  /onClick={resetForm}\s*className="rounded-xl liquid-glass[^"]*"\s*>\s*\?\?\s*<\/button>/,
  'onClick={resetForm}\n                        className="rounded-xl liquid-glass text-sm font-medium font-body text-white/90 px-4 py-2.5 hover:bg-white/5 transition-colors"\n                      >\n                        取消\n                      </button>'
);

fs.writeFileSync(p, s, "utf8");
console.log("polish done, ??", (s.match(/\?\?/g) || []).length, "宁静", s.includes("宁静"));
