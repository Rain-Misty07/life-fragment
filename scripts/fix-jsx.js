const fs = require("fs");
const p = require("path").join(__dirname, "..", "index.html");
let s = fs.readFileSync(p, "utf8");

// Fix mismatched div/motion.div in renderCommentNode
s = s.replace(
  `<motion.div className="flex items-center gap-3 mt-1.5">
              <button
                type="button"
                onClick={() =>
                  setReplyingToId(isReplying ? null : comment.id)
                }
                className="text-[10px] font-body text-white/55 hover:text-white/85 transition-colors"
              >
                回复
              </button>
              {canDeleteComment(comment) && (
                <button
                  type="button"
                  onClick={() => deleteComment(comment.id, entryId)}
                  className="text-[10px] font-body text-red-300/70 hover:text-red-200 transition-colors"
                >
                  删除
                </button>
              )}
            </motion.div>`,
  `<div className="flex items-center gap-3 mt-1.5">
              <button
                type="button"
                onClick={() =>
                  setReplyingToId(isReplying ? null : comment.id)
                }
                className="text-[10px] font-body text-white/55 hover:text-white/85 transition-colors"
              >
                回复
              </button>
              {canDeleteComment(comment) && (
                <button
                  type="button"
                  onClick={() => deleteComment(comment.id, entryId)}
                  className="text-[10px] font-body text-red-300/70 hover:text-red-200 transition-colors"
                >
                  删除
                </button>
              )}
            </div>`
);

// Wrong - opening is already div. Just fix closing tags:
s = s.replace(
  `              )}
            </motion.div>
            {isReplying && (
              <div className="mt-2 flex gap-2 items-end">`,
  `              )}
            </div>
            {isReplying && (
              <motion.div className="mt-2 flex gap-2 items-end">`
);

s = s.replace(
  `                    发表
                  </button>
              </motion.div>
            )}
            {comment.replies?.map((reply) =>`,
  `                    发表
                  </button>
              </div>
            )}
            {comment.replies?.map((reply) =>`
);

fs.writeFileSync(p, s, "utf8");
console.log("jsx fixed");
