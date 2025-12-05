CREATE TABLE IF NOT EXISTS users (
  user_id    INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,          -- 先放明碼；稍後改 bcrypt
  name       VARCHAR(100),
  role       ENUM('admin','seller','buyer') NOT NULL DEFAULT 'buyer',
  status     ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id  INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  status     ENUM('on_sale','sold','removed','reported') DEFAULT 'on_sale',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  report_id   INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL,
  target_type ENUM('product','user') NOT NULL,
  target_id   INT NOT NULL,
  reason_code VARCHAR(50) NOT NULL,
  reason_text TEXT,
  status      ENUM('pending','in_review','resolved','rejected') DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  action_id   INT AUTO_INCREMENT PRIMARY KEY,
  report_id   INT NOT NULL,
  admin_id    INT NOT NULL,
  action      ENUM('suspend_user','remove_product','reject_report') NOT NULL,
  action_note TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(report_id),
  FOREIGN KEY (admin_id) REFERENCES users(user_id)
);

-- seeding：一個管理員 + 一個一般用戶
INSERT IGNORE INTO users (email, password, name, role, status)
VALUES ('admin@example.com','123456','admin','admin','active');

INSERT IGNORE INTO users (email, password, name, role, status)
VALUES ('buyer1@example.com','0000','buyer1','buyer','active');

INSERT IGNORE INTO users (email, password, name, role, status)
VALUES ('seller1@example.com','0000','seller1','seller','active');