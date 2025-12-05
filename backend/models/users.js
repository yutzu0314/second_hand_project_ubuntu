// models/users.js
import pool from '../db.js';

let ID_COL = 'id';
let PASS_COL = 'password';
let NAME_COL = 'name';
let EMAIL_COL = 'email';
let ROLE_COL = 'role';
let STATUS_COL = null;
let CREATED_COL = 'created_at';

async function detectUserColumns() {
    const [cols] = await pool.query('SHOW COLUMNS FROM users');
    const set = new Set(cols.map(c => c.Field));

    ID_COL = set.has('user_id') ? 'user_id' : (set.has('id') ? 'id' : 'id');
    PASS_COL = set.has('password') ? 'password' : (set.has('password_hash') ? 'password_hash' : 'password');
    NAME_COL = set.has('name') ? 'name' : (set.has('username') ? 'username' : null);
    ROLE_COL = set.has('role') ? 'role' : null;
    STATUS_COL = set.has('status') ? 'status' : null;
    CREATED_COL = set.has('created_at') ? 'created_at' : (set.has('create_time') ? 'create_time' : null);
    EMAIL_COL = set.has('email') ? 'email' : null;

    console.log('[users columns]', { ID_COL, PASS_COL, NAME_COL, ROLE_COL, STATUS_COL, CREATED_COL, EMAIL_COL });
}

function getUserColumns() {
    return { ID_COL, PASS_COL, NAME_COL, EMAIL_COL, ROLE_COL, STATUS_COL, CREATED_COL };
}

async function simpleLogin(req, res, roleWanted) {
    const { name, email, password } = req.body || {};
    const { ID_COL, PASS_COL, NAME_COL, EMAIL_COL, ROLE_COL, STATUS_COL } = getUserColumns();

    if ((!name && !email) || !password) {
        return res.status(400).json({ error: '缺少 name/email 或 password' });
    }

    const keyField = email ? EMAIL_COL : NAME_COL;
    const keyValue = email || name;

    if (!keyField) {
        return res.status(500).json({ error: 'users 表沒有 name 或 email 欄位' });
    }

    const sql = `
    SELECT 
      \`${ID_COL}\` AS id,
      ${EMAIL_COL ? `\`${EMAIL_COL}\` AS email,` : `'N/A' AS email,`}
      ${NAME_COL ? `\`${NAME_COL}\` AS name,` : `'N/A' AS name,`}
      \`${PASS_COL}\` AS pwd
      ${ROLE_COL ? `, \`${ROLE_COL}\` AS role` : `, '${roleWanted || 'buyer'}' AS role`}
      ${STATUS_COL ? `, \`${STATUS_COL}\` AS status` : `, 'active' AS status`}
    FROM users
    WHERE \`${keyField}\` = ?
    LIMIT 1
  `;

    const [rows] = await pool.query(sql, [keyValue]);
    const u = rows[0];

    if (!u) return res.status(401).json({ error: '帳號不存在' });
    if (u.pwd !== password) return res.status(401).json({ error: '密碼錯誤' });
    if (u.status !== 'active') return res.status(403).json({ error: '帳號未啟用或已停用' });

    if (roleWanted && ROLE_COL && u.role !== roleWanted) {
        return res.status(403).json({ error: `需要 ${roleWanted} 身分` });
    }

    return res.json({
        success: true,
        token: 'DEV_TOKEN',
        id: u.id,
        role: u.role,
        email: u.email,
        name: u.name
    });
}

export { detectUserColumns, getUserColumns, simpleLogin };
