ALTER TABLE entries
  ADD COLUMN is_private TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1=仅自己可见, 0=好友可见'
  AFTER mood;
