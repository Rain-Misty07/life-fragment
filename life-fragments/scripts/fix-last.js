const fs = require("fs");
const p = require("path").join(__dirname, "..", "index.html");
let s = fs.readFileSync(p, "utf8");
s = s.replace(
  '<p className="text-xs text-white/60 font-body mt-5 mb-2">??</p>',
  '<p className="text-xs text-white/60 font-body mt-5 mb-2">心情</p>'
);
s = s.replace(
  `{readOnly ? "TA ???????" : "????????????????"}`,
  `{readOnly ? "TA 还没有发布随记" : "还没有碎笔，在上方写下第一条吧。"}`
);
s = s.replace('placeholder="?加载中..."', 'placeholder="写下回复..."');
s = s.replace(
  `                      >
                        ??
                      </button>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {readOnly && (`,
  `                      >
                        取消
                      </button>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {readOnly && (`
);
fs.writeFileSync(p, s, "utf8");
console.log("??", (s.match(/\?\?/g) || []).length);
