const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "index.html");
const countdownPath = path.join(__dirname, "countdown-snippet.txt");

let html = fs.readFileSync(indexPath, "utf8");
const countdown = fs.readFileSync(countdownPath, "utf8")
  .split("\n")
  .slice(2, 308)
  .join("\n");

const start = html.indexOf("    window.Writings = Writings;");
const contactsStart = html.indexOf("    function Contacts({ user, onBack, onViewFriend })");

if (start === -1 || contactsStart === -1) {
  console.error("markers not found", start, contactsStart);
  process.exit(1);
}

const before = html.slice(0, start);
const after = html.slice(contactsStart);

// Fix writings entry footer in before - find and fix broken section
const writingsFix = `                              >
                                编辑
                              </button>
                              <span className="text-white/20">|</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(entry.id)}
                                className="text-xs font-body text-red-300/80 hover:text-red-200 transition-colors"
                              >
                                删除
                              </button>
                            </div>
                          ) : (
                            <motion.div />
                          )}
                          <button
                            type="button"
                            onClick={() => toggleComments(entry.id)}
                            className="text-xs font-body text-white/70 hover:text-white transition-colors shrink-0"
                          >
                            评论
                            {commentsMap[entry.id]?.length > 0 && (
                              <span className="text-white/45 ml-1">
                                ({commentsMap[entry.id].length})
                              </span>
                            )}
                          </button>
                        </motion.div>

                        {expandedEntryId === entry.id && (
                          <motion.div className="comment-panel">
                            {commentsLoadingId === entry.id && (
                              <p className="text-xs text-white/45 font-body text-center py-2">
                                加载中...
                              </p>
                            )}
                            {commentsLoadingId !== entry.id && (
                              <>
                                {buildCommentTree(commentsMap[entry.id] || []).length === 0 ? (
                                  <p className="text-xs text-white/45 font-body text-center py-2">
                                    暂无评论
                                  </p>
                                ) : (
                                  buildCommentTree(commentsMap[entry.id] || []).map((c) =>
                                    renderCommentNode(c, entry.id, 0)
                                  )
                                )}
                                <motion.div className="mt-3 flex gap-2 items-end">
                                  <textarea
                                    value={commentDrafts[draftKey(entry.id, null)] || ""}
                                    onChange={(e) =>
                                      setCommentDrafts((prev) => ({
                                        ...prev,
                                        [draftKey(entry.id, null)]: e.target.value,
                                      }))
                                    }
                                    placeholder="写下评论..."
                                    rows={2}
                                    className="comment-input flex-1 font-body"
                                  />
                                  <button
                                    type="button"
                                    disabled={commentSubmitting}
                                    onClick={() => submitComment(entry.id, null)}
                                    className="shrink-0 rounded-lg bg-white/90 text-black text-xs font-body font-medium px-3 py-2 hover:bg-white/90 transition-colors disabled:opacity-60"
                                  >
                                    发表
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </motion.article>`;

const brokenStart = before.indexOf('onClick={() => handleEdit(entry)}');
const brokenEnd = before.indexOf("                      </motion.article>", brokenStart);
if (brokenStart !== -1 && brokenEnd !== -1) {
  const editBtnStart = before.lastIndexOf("<button", brokenStart);
  let fixedBefore = before.slice(0, editBtnStart) + writingsFix + before.slice(brokenEnd + "                      </motion.article>".length);
  html = fixedBefore + "\n    window.Writings = Writings;\n\n" + countdown + "\n\n" + after;
} else {
  html = before + "\n    window.Writings = Writings;\n\n" + countdown + "\n\n" + after;
}

fs.writeFileSync(indexPath, html, "utf8");
console.log("restored countdown, len", html.length);
