# life-fragment

## 聊天轨道照片上传

与每位好友的对话可单独设置 5 张轨道照片：在聊天页点击 **相片**，从本机选择 JPEG / PNG / WebP（单张 ≤ 2MB）。

文件保存在服务器 `uploads/orbit/{userId}/{friendUserId}/{slot}.{ext}`，元数据在 `chat_orbit_images` 表。

### Railway 部署注意

容器默认磁盘不持久，**重新部署后 `uploads/` 可能清空**。若使用 Railway，请为服务挂载 **Volume**，挂载路径设为项目根下的 `uploads`（或设置 `UPLOADS` 环境变量指向 Volume 路径），否则用户上传的图片会在重启后丢失。

本地开发时 `npm start` 会自动创建 `uploads/` 目录；该目录已加入 `.gitignore`，不会提交到 Git。
