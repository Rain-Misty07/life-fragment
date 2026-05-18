const fs = require("fs");
const p = require("path").join(__dirname, "..", "index.html");
let s = fs.readFileSync(p, "utf8");
s = s.split('setError("暂无评论???");').join('setError("无法连接服务器");');
s = s.replace(
  'setMessage(data.message || "暂无评论???");',
  'setMessage(data.message || "好友申请已发送");'
);
s = s.replace('setMessage("暂无评论?");', 'setMessage("已移除好友");');
s = s.replace(
  '{readOnly ? "TA 暂无评论???" : "暂无评论暂无评论暂无评论暂无评论"}',
  '{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}'
);
fs.writeFileSync(p, s, "utf8");
console.log("??", (s.match(/\?\?/g) || []).length);
