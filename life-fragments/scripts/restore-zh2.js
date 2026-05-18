const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "..", "index.html");
let s = fs.readFileSync(filePath, "utf8");

const fixes = [
  ['placeholder="暂无评论??"', 'placeholder="Leave blank to keep current"'],
  ["                  ??\n                  </h2>\n                  <p className=\"text-xs text-white/50 font-body mt-1\">\n                    暂无评论暂无评论??", "                  随记\n                  </h2>\n                  <p className=\"text-xs text-white/50 font-body mt-1\">\n                    记下此刻的一小段心情"],
  ['<p className="text-xs text-white/60 font-body mt-5 mb-2">??</p>', '<p className="text-xs text-white/60 font-body mt-5 mb-2">心情</p>'],
  ['? "返回首页"\n                          : "保存碎笔"}', '? "更新碎笔"\n                          : "保存碎笔"}'],
  ['                      >\n                        ??\n                      </button>\n                    )}\n                  </motion.div>\n                </motion.div>\n              </motion.div>\n            )}\n\n            {readOnly && (', '                      >\n                        取消\n                      </button>\n                    )}\n                  </motion.div>\n                </motion.div>\n              </motion.div>\n            )}\n\n            {readOnly && ('],
  ['              暂无评论??            </motion.p>\n\n            <motion.div\n              layout', '              近期的碎笔\n            </motion.p>\n\n            <motion.div\n              layout'],
  ['                      暂无评论..', '                      加载中...'],
  ['                  暂无评论                </h2>\n                <p className="text-xs text-white/50 font-body mt-1">\n                  暂无评论暂无评论??', '                  倒数日\n                </h2>\n                <p className="text-xs text-white/50 font-body mt-1">\n                  最近的目标'],
  ['{loading ? "保存中..." : "暂无评论暂无评论暂无评论???"}', '{loading ? "加载中..." : "暂无倒数日，在下方添加一个吧。"}'],
  ['{editingId ? "设置倒数日" : "暂无评论??}', '{editingId ? "编辑倒数日" : "新建倒数日"}'],
  ['                    <label className="block text-xs text-white/70 font-body mb-2">\n                      暂无评论\n                    </label>\n                    <input\n                      type="text"\n                      value={title}\n                      onChange={(e) => setTitle(e.target.value)}\n                      placeholder="暂无评论暂无评论\n                      className=', '                    <label className="block text-xs text-white/70 font-body mb-2">\n                      事件名称\n                    </label>\n                    <input\n                      type="text"\n                      value={title}\n                      onChange={(e) => setTitle(e.target.value)}\n                      placeholder="例如：毕业典礼"\n                      className='],
  ['                    <label className="block text-xs text-white/70 font-body mb-2">\n                      暂无评论\n                    </label>\n                    <input\n                      type="date"', '                    <label className="block text-xs text-white/70 font-body mb-2">\n                      目标日期\n                    </label>\n                    <input\n                      type="date"'],
  ['{saving ? "保存中..." : editingId ? "??" : "登录"}', '{saving ? "保存中..." : editingId ? "更新" : "保存"}'],
  ['setError("暂无评论???");', 'setError("请输入事件名称");'],
  ['setMessage(data.message || "暂无评论??);', 'setMessage(data.message || "好友申请已发送");'],
  ['setMessage("暂无评论??);', 'setMessage("已移除好友");'],
  ['setLoginError("暂无评论暂无评论暂无评论?? npm start");', 'setLoginError("无法连接服务器，请确认已启动 npm start");'],
  ['setRegisterError("暂无评论暂无评论暂无评论?? npm start");', 'setRegisterError("无法连接服务器，请确认已启动 npm start");'],
  ['<span className="ml-2 text-white/40">? ???/span>', '<span className="ml-2 text-white/40">· {displayMood(entry.mood)}</span>'],
];

for (const [from, to] of fixes) {
  if (s.includes(from)) {
    s = s.replace(from, to);
    console.log("fixed chunk");
  } else {
    console.log("missed:", from.slice(0, 40));
  }
}

// Countdown list section labels
s = s.replace(/              暂无评论\?\?            <\/motion\.p>\n\n            <motion\.div className="writings-shell w-full max-w-lg flex-1/, '              全部倒数日\n            </motion.p>\n\n            <motion.div className="writings-shell w-full max-w-lg flex-1');

fs.writeFileSync(filePath, s, "utf8");
console.log("?? left:", (s.match(/\?\?/g) || []).length);
