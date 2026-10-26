import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
const port = Number(process.env.PORT || 3001);
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const sessionKey = process.env.SESSION_SECRET;
if (!email || !password || !sessionKey || sessionKey.length < 32) {
  throw new Error('Configure ADMIN_EMAIL, ADMIN_PASSWORD e SESSION_SECRET (32+ caracteres) no .env.');
}
const salt = randomBytes(32);
const passwordHash = scryptSync(password, salt, 64);
const dbPath = process.env.DB_PATH || path.resolve('data/gestao.sqlite');
mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('entrada','saida')), category TEXT NOT NULL, description TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents > 0), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS materials (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, unit TEXT NOT NULL, quantity REAL NOT NULL DEFAULT 0 CHECK(quantity >= 0), min_quantity REAL NOT NULL DEFAULT 0 CHECK(min_quantity >= 0));
CREATE TABLE IF NOT EXISTS material_movements (id INTEGER PRIMARY KEY, material_id INTEGER NOT NULL REFERENCES materials(id), date TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('entrada','saida')), quantity REAL NOT NULL CHECK(quantity > 0), unit_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK(unit_cost_cents >= 0), note TEXT NOT NULL DEFAULT '', transaction_id INTEGER REFERENCES transactions(id));
CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS production (id INTEGER PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id), week TEXT NOT NULL, piece TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0), unit_value_cents INTEGER NOT NULL CHECK(unit_value_cents >= 0));
CREATE TABLE IF NOT EXISTS site_visits (id INTEGER PRIMARY KEY, visitor_id TEXT NOT NULL, visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS site_visits_visitor_idx ON site_visits(visitor_id);
CREATE INDEX IF NOT EXISTS site_visits_date_idx ON site_visits(visited_at);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO settings VALUES ('reserve_percent','20');`);
const seeds = ['Disco de corte / serra|un','Cola para pedra|kg','Massa plástica|kg','Catalisador / secante|un','Lixa|un','Lixa diamantada|un','Rebolo diamantado|un','Boina de polimento|un','Resina|L','Silicone / selante|un','Fita crepe|rolo','Impermeabilizante|L','Álcool / solvente|L','EPIs|un'];
const seed = db.prepare('INSERT OR IGNORE INTO materials (name, unit) VALUES (?, ?)');
for (const item of seeds) seed.run(...item.split('|'));

const sessions = new Map();
const cookieName = 'jr_session';
const sign = (token) => createHmac('sha256', sessionKey).update(token).digest('hex');
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter((parts) => parts.length === 2));
function session(req) {
  const value = cookies(req)[cookieName];
  if (!value) return null;
  const [token, signature] = value.split('.');
  if (!token || !signature || signature.length !== 64 || !timingSafeEqual(Buffer.from(sign(token)), Buffer.from(signature))) return null;
  const expires = sessions.get(token);
  if (!expires || expires < Date.now()) { sessions.delete(token); return null; }
  return token;
}
const cookieOptions = (req) => `HttpOnly; SameSite=Strict; Path=/api; Max-Age=28800${req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`;
app.post('/api/visit', (req, res) => {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)jr_visitor=([a-f0-9]{64})(?:;|$)/);
  const visitorId = match?.[1] || randomBytes(32).toString('hex');
  db.prepare('INSERT INTO site_visits (visitor_id) VALUES (?)').run(visitorId);
  if (!match) res.setHeader('Set-Cookie', `jr_visitor=${visitorId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`);
  res.status(204).end();
});
const auth = (req, res, next) => session(req) ? next() : res.status(401).json({ error: 'Faça login para continuar.' });
const fail = (res, message, status = 400) => res.status(status).json({ error: message });
const text = (value, max = 120) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const positive = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const nonnegative = (value) => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const quantity = (value) => Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 1000000 ? Number(value) : null;
const date = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? value : null;

app.post('/api/login', (req, res) => {
  const givenEmail = text(req.body?.email, 200).toLowerCase();
  const givenPassword = String(req.body?.password || '');
  const givenHash = scryptSync(givenPassword, salt, 64);
  if (givenEmail !== email.toLowerCase() || !timingSafeEqual(givenHash, passwordHash)) {
    return fail(res, 'Credenciais inválidas.', 401);
  }
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + 8 * 60 * 60_000);
  res.setHeader('Set-Cookie', `${cookieName}=${token}.${sign(token)}; ${cookieOptions(req)}`);
  res.json({ ok: true });
});
app.post('/api/logout', auth, (req, res) => { sessions.delete(session(req)); res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0`); res.json({ ok: true }); });
app.get('/api/me', auth, (_req, res) => res.json({ email }));

app.get('/api/dashboard', auth, (_req, res) => {
  const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC').all();
  const materials = db.prepare('SELECT * FROM materials ORDER BY name').all();
  const movements = db.prepare('SELECT mm.*, m.name AS material_name, m.unit FROM material_movements mm JOIN materials m ON m.id=mm.material_id ORDER BY mm.date DESC, mm.id DESC').all();
  const employees = db.prepare('SELECT * FROM employees ORDER BY name').all();
  const production = db.prepare('SELECT p.*, e.name AS employee_name FROM production p JOIN employees e ON e.id=p.employee_id ORDER BY p.week DESC, p.id DESC').all();
  const reservePercent = Number(db.prepare("SELECT value FROM settings WHERE key='reserve_percent'").get().value);
  const visitors = db.prepare("SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS unique_visitors, SUM(CASE WHEN date(visited_at,'-3 hours')=date('now','-3 hours') THEN 1 ELSE 0 END) AS views_today, COUNT(DISTINCT CASE WHEN date(visited_at,'-3 hours')=date('now','-3 hours') THEN visitor_id END) AS unique_today FROM site_visits").get();
  res.json({ transactions, materials, movements, employees, production, reservePercent, visitors });
});
app.post('/api/transactions', auth, (req, res) => {
  const { type } = req.body;
  const d = date(req.body.date), category = text(req.body.category, 60), description = text(req.body.description), amount = positive(req.body.amount_cents);
  if (!['entrada', 'saida'].includes(type) || !d || !category || !description || !amount) return fail(res, 'Confira os dados do lançamento.');
  db.prepare('INSERT INTO transactions (date,type,category,description,amount_cents) VALUES (?,?,?,?,?)').run(d, type, category, description, amount);
  res.json({ ok: true });
});
app.delete('/api/transactions/:id', auth, (req, res) => {
  const id = positive(req.params.id);
  if (!id) return fail(res, 'Lançamento inválido.');
  const linked = db.prepare('SELECT id FROM material_movements WHERE transaction_id=?').get(id);
  if (linked) return fail(res, 'Este lançamento está vinculado ao estoque. Exclua a movimentação de material primeiro.');
  db.prepare('DELETE FROM transactions WHERE id=?').run(id); res.json({ ok: true });
});
app.post('/api/materials', auth, (req, res) => {
  const name = text(req.body.name, 80), unit = text(req.body.unit, 16), min = Number(req.body.min_quantity || 0);
  if (!name || !unit || !Number.isFinite(min) || min < 0) return fail(res, 'Confira os dados do material.');
  try { db.prepare('INSERT INTO materials (name,unit,min_quantity) VALUES (?,?,?)').run(name, unit, min); res.json({ ok: true }); }
  catch { fail(res, 'Esse material já existe.'); }
});
app.post('/api/material-movements', auth, (req, res) => {
  const materialId = positive(req.body.material_id), d = date(req.body.date), type = req.body.type, qty = quantity(req.body.quantity), cost = nonnegative(req.body.unit_cost_cents), note = text(req.body.note);
  const material = db.prepare('SELECT * FROM materials WHERE id=?').get(materialId);
  if (!material || !d || !['entrada','saida'].includes(type) || !qty || cost === null) return fail(res, 'Confira os dados da movimentação.');
  if (type === 'saida' && material.quantity + 0.000001 < qty) return fail(res, 'Estoque insuficiente.');
  const total = Math.round(qty * cost);
  db.exec('BEGIN');
  try {
    let transactionId = null;
    if (total > 0 && (type === 'entrada' || req.body.post_to_cash)) {
      const desc = `${type === 'entrada' ? 'Compra' : 'Consumo'}: ${material.name}${note ? ` — ${note}` : ''}`;
      transactionId = db.prepare('INSERT INTO transactions (date,type,category,description,amount_cents) VALUES (?,?,?,?,?)').run(d, 'saida', 'Materiais', desc, total).lastInsertRowid;
    }
    db.prepare('UPDATE materials SET quantity=quantity+? WHERE id=?').run(type === 'entrada' ? qty : -qty, materialId);
    db.prepare('INSERT INTO material_movements (material_id,date,type,quantity,unit_cost_cents,note,transaction_id) VALUES (?,?,?,?,?,?,?)').run(materialId,d,type,qty,cost,note,transactionId);
    db.exec('COMMIT'); res.json({ ok: true });
  } catch (error) { db.exec('ROLLBACK'); fail(res, 'Não foi possível registrar a movimentação.'); }
});
app.delete('/api/material-movements/:id', auth, (req, res) => {
  const movement = db.prepare('SELECT * FROM material_movements WHERE id=?').get(positive(req.params.id));
  if (!movement) return fail(res, 'Movimentação não encontrada.', 404);
  const material = db.prepare('SELECT * FROM materials WHERE id=?').get(movement.material_id);
  if (movement.type === 'entrada' && material.quantity + 0.000001 < movement.quantity) return fail(res, 'Não é possível desfazer: parte do material já foi consumida.');
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE materials SET quantity=quantity+? WHERE id=?').run(movement.type === 'saida' ? movement.quantity : -movement.quantity, movement.material_id);
    db.prepare('DELETE FROM material_movements WHERE id=?').run(movement.id);
    if (movement.transaction_id) db.prepare('DELETE FROM transactions WHERE id=?').run(movement.transaction_id);
    db.exec('COMMIT'); res.json({ ok: true });
  } catch { db.exec('ROLLBACK'); fail(res, 'Não foi possível desfazer a movimentação.'); }
});
app.post('/api/employees', auth, (req, res) => { const name = text(req.body.name, 80); if (!name) return fail(res, 'Informe o nome.'); db.prepare('INSERT INTO employees (name) VALUES (?)').run(name); res.json({ ok: true }); });
app.patch('/api/employees/:id', auth, (req, res) => {
  const id = positive(req.params.id);
  if (!id || !db.prepare('SELECT id FROM employees WHERE id=?').get(id)) return fail(res, 'Funcionário não encontrado.', 404);
  const updates = [];
  const values = [];
  if (Object.hasOwn(req.body, 'name')) {
    const name = text(req.body.name, 80);
    if (!name) return fail(res, 'Informe o nome do funcionário.');
    updates.push('name=?'); values.push(name);
  }
  if (Object.hasOwn(req.body, 'active')) {
    if (![0, 1].includes(req.body.active)) return fail(res, 'Status inválido.');
    updates.push('active=?'); values.push(req.body.active);
  }
  if (!updates.length) return fail(res, 'Nenhuma alteração informada.');
  db.prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id=?`).run(...values, id);
  res.json({ ok: true });
});
app.post('/api/production', auth, (req, res) => {
  const employeeId = positive(req.body.employee_id), week = date(req.body.week), piece = text(req.body.piece, 80), qty = positive(req.body.quantity), value = nonnegative(req.body.unit_value_cents);
  if (!db.prepare('SELECT id FROM employees WHERE id=? AND active=1').get(employeeId) || !week || !piece || !qty || value === null) return fail(res, 'Confira os dados da produção.');
  db.prepare('INSERT INTO production (employee_id,week,piece,quantity,unit_value_cents) VALUES (?,?,?,?,?)').run(employeeId,week,piece,qty,value); res.json({ ok: true });
});
app.delete('/api/production/:id', auth, (req, res) => { db.prepare('DELETE FROM production WHERE id=?').run(positive(req.params.id)); res.json({ ok: true }); });
app.put('/api/settings/reserve', auth, (req, res) => { const value = Number(req.body.percent); if (!Number.isFinite(value) || value < 0 || value > 100) return fail(res, 'Use um percentual entre 0 e 100.'); db.prepare("UPDATE settings SET value=? WHERE key='reserve_percent'").run(String(value)); res.json({ ok: true }); });

app.use('/api', (_req, res) => fail(res, 'Rota não encontrada.', 404));
const dist = path.resolve('dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.listen(port, () => console.log(`API de gestão na porta ${port}`));
