import express from 'express';
import pg from 'pg';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const secret = process.env.SESSION_SECRET;
if (!dbUrl || !email || !password || !secret || secret.length < 32) {
  throw new Error('Configure DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD e SESSION_SECRET.');
}
const pool = new pg.Pool({ connectionString: dbUrl, max: 2, ssl: { rejectUnauthorized: true } });
const seedNames = ['Disco de corte / serra|un','Cola para pedra|kg','Massa plástica|kg','Catalisador / secante|un','Lixa|un','Lixa diamantada|un','Rebolo diamantado|un','Boina de polimento|un','Resina|L','Silicone / selante|un','Fita crepe|rolo','Impermeabilizante|L','Álcool / solvente|L','EPIs|un'];
let initialized;
export function initialize() {
  if (!initialized) initialized = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS transactions (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, date DATE NOT NULL, type TEXT NOT NULL CHECK(type IN ('entrada','saida')), category TEXT NOT NULL, description TEXT NOT NULL, amount_cents BIGINT NOT NULL CHECK(amount_cents > 0), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS materials (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT NOT NULL UNIQUE, unit TEXT NOT NULL, quantity DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(quantity >= 0), min_quantity DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(min_quantity >= 0));
    CREATE TABLE IF NOT EXISTS material_movements (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, material_id BIGINT NOT NULL REFERENCES materials(id), date DATE NOT NULL, type TEXT NOT NULL CHECK(type IN ('entrada','saida')), quantity DOUBLE PRECISION NOT NULL CHECK(quantity > 0), unit_cost_cents BIGINT NOT NULL DEFAULT 0 CHECK(unit_cost_cents >= 0), note TEXT NOT NULL DEFAULT '', transaction_id BIGINT REFERENCES transactions(id));
    CREATE TABLE IF NOT EXISTS employees (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS production (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, employee_id BIGINT NOT NULL REFERENCES employees(id), week DATE NOT NULL, piece TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0), unit_value_cents BIGINT NOT NULL CHECK(unit_value_cents >= 0));
    CREATE TABLE IF NOT EXISTS site_visits (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, visitor_id TEXT NOT NULL, visited_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE INDEX IF NOT EXISTS site_visits_visitor_idx ON site_visits(visitor_id);
    CREATE INDEX IF NOT EXISTS site_visits_date_idx ON site_visits(visited_at);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT INTO settings (key,value) VALUES ('reserve_percent','20') ON CONFLICT (key) DO NOTHING;`);
    for (const item of seedNames) await pool.query('INSERT INTO materials (name,unit) VALUES ($1,$2) ON CONFLICT (name) DO NOTHING', item.split('|'));
  })().catch((error) => { initialized = null; throw error; });
  return initialized;
}
const query = (sql, params = []) => pool.query(sql, params);
const wrap = (handler) => async (req, res) => {
  try { await initialize(); await handler(req, res); }
  catch (error) { console.error('API error:', error); if (!res.headersSent) res.status(500).json({ error: 'Erro interno. Tente novamente.' }); }
};
const fail = (res, message, status = 400) => res.status(status).json({ error: message });
const text = (value, max = 120) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const positive = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const nonnegative = (value) => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const quantity = (value) => Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 1000000 ? Number(value) : null;
const date = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? value : null;
const sign = (payload) => createHmac('sha256', secret).update(payload).digest('hex');
function currentSession(req) {
  const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('jr_session='));
  if (!cookie) return false;
  const value = cookie.slice('jr_session='.length);
  const [payload, signature] = value.split('.');
  if (!payload || !signature || signature.length !== 64 || !timingSafeEqual(Buffer.from(sign(payload)), Buffer.from(signature))) return false;
  const [expires] = payload.split(':');
  return Number(expires) > Date.now();
}
const auth = (req, res, next) => currentSession(req) ? next() : fail(res, 'Faça login para continuar.', 401);
const cookieOptions = 'HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=28800';
app.post('/api/visit', wrap(async (req, res) => {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)jr_visitor=([a-f0-9]{64})(?:;|$)/);
  const visitorId = match?.[1] || randomBytes(32).toString('hex');
  await query('INSERT INTO site_visits (visitor_id) VALUES ($1)', [visitorId]);
  if (!match) res.setHeader('Set-Cookie', `jr_visitor=${visitorId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`);
  res.status(204).end();
}));

app.post('/api/login', wrap(async (req, res) => {
  const givenEmail = text(req.body?.email, 200).toLowerCase();
  const salt = Buffer.from(secret.slice(0, 32));
  const stored = scryptSync(password, salt, 64);
  const given = scryptSync(String(req.body?.password || ''), salt, 64);
  if (givenEmail !== email.toLowerCase() || !timingSafeEqual(stored, given)) return fail(res, 'Credenciais inválidas.', 401);
  const payload = `${Date.now() + 8 * 60 * 60_000}:${randomBytes(16).toString('hex')}`;
  res.setHeader('Set-Cookie', `jr_session=${payload}.${sign(payload)}; ${cookieOptions}`);
  res.json({ ok: true });
}));
app.post('/api/logout', auth, (_req, res) => { res.setHeader('Set-Cookie', 'jr_session=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/me', auth, (_req, res) => res.json({ email }));
app.get('/api/dashboard', auth, wrap(async (_req, res) => {
  const [transactions, materials, movements, employees, production, settings, visitors] = await Promise.all([
    query('SELECT id,date,type,category,description,amount_cents,created_at FROM transactions ORDER BY date DESC,id DESC'),
    query('SELECT * FROM materials ORDER BY name'),
    query('SELECT mm.*,m.name AS material_name,m.unit FROM material_movements mm JOIN materials m ON m.id=mm.material_id ORDER BY mm.date DESC,mm.id DESC'),
    query('SELECT * FROM employees ORDER BY name'),
    query('SELECT p.*,e.name AS employee_name FROM production p JOIN employees e ON e.id=p.employee_id ORDER BY p.week DESC,p.id DESC'),
    query("SELECT value FROM settings WHERE key='reserve_percent'"),
    query("SELECT COUNT(*)::int AS views, COUNT(DISTINCT visitor_id)::int AS unique_visitors, COUNT(*) FILTER (WHERE (visited_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS views_today, COUNT(DISTINCT visitor_id) FILTER (WHERE (visited_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS unique_today FROM site_visits")
  ]);
  const iso = (row, key) => ({ ...row, [key]: row[key]?.toISOString?.().slice(0, 10) || row[key] });
  res.json({ transactions: transactions.rows.map((row) => iso(row,'date')), materials: materials.rows, movements: movements.rows.map((row) => iso(row,'date')), employees: employees.rows, production: production.rows.map((row) => iso(row,'week')), reservePercent: Number(settings.rows[0]?.value || 20), visitors: visitors.rows[0] });
}));
app.post('/api/transactions', auth, wrap(async (req, res) => {
  const type = req.body.type, d = date(req.body.date), category = text(req.body.category,60), description = text(req.body.description), amount = positive(req.body.amount_cents);
  if (!['entrada','saida'].includes(type) || !d || !category || !description || !amount) return fail(res, 'Confira os dados do lançamento.');
  await query('INSERT INTO transactions (date,type,category,description,amount_cents) VALUES ($1,$2,$3,$4,$5)', [d,type,category,description,amount]); res.json({ ok:true });
}));
app.delete('/api/transactions/:id', auth, wrap(async (req, res) => {
  const id = positive(req.params.id); if (!id) return fail(res,'Lançamento inválido.');
  const linked = await query('SELECT id FROM material_movements WHERE transaction_id=$1',[id]);
  if (linked.rowCount) return fail(res,'Este lançamento está vinculado ao estoque. Exclua a movimentação de material primeiro.');
  await query('DELETE FROM transactions WHERE id=$1',[id]); res.json({ok:true});
}));
app.post('/api/materials', auth, wrap(async (req,res) => {
  const name=text(req.body.name,80), unit=text(req.body.unit,16), min=Number(req.body.min_quantity||0);
  if (!name||!unit||!Number.isFinite(min)||min<0) return fail(res,'Confira os dados do material.');
  const result=await query('INSERT INTO materials (name,unit,min_quantity) VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING RETURNING id',[name,unit,min]);
  if (!result.rowCount) return fail(res,'Esse material já existe.'); res.json({ok:true});
}));
app.post('/api/material-movements', auth, wrap(async (req,res) => {
  const id=positive(req.body.material_id), d=date(req.body.date), type=req.body.type, qty=quantity(req.body.quantity), cost=nonnegative(req.body.unit_cost_cents), note=text(req.body.note);
  if (!id||!d||!['entrada','saida'].includes(type)||!qty||cost===null) return fail(res,'Confira os dados da movimentação.');
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const material=(await client.query('SELECT * FROM materials WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if (!material) { await client.query('ROLLBACK'); return fail(res,'Material não encontrado.'); }
    if (type==='saida' && material.quantity+0.000001<qty) { await client.query('ROLLBACK'); return fail(res,'Estoque insuficiente.'); }
    const total=Math.round(qty*cost);
    let transactionId=null;
    if (total>0 && (type==='entrada'||req.body.post_to_cash)) {
      const description=`${type==='entrada'?'Compra':'Consumo'}: ${material.name}${note?` — ${note}`:''}`;
      transactionId=(await client.query('INSERT INTO transactions (date,type,category,description,amount_cents) VALUES ($1,$2,$3,$4,$5) RETURNING id',[d,'saida','Materiais',description,total])).rows[0].id;
    }
    await client.query('UPDATE materials SET quantity=quantity+$1 WHERE id=$2',[type==='entrada'?qty:-qty,id]);
    await client.query('INSERT INTO material_movements (material_id,date,type,quantity,unit_cost_cents,note,transaction_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',[id,d,type,qty,cost,note,transactionId]);
    await client.query('COMMIT'); res.json({ok:true});
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}));
app.delete('/api/material-movements/:id', auth, wrap(async (req,res) => {
  const id=positive(req.params.id); if (!id) return fail(res,'Movimentação inválida.');
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const movement=(await client.query('SELECT * FROM material_movements WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if (!movement) { await client.query('ROLLBACK'); return fail(res,'Movimentação não encontrada.',404); }
    const material=(await client.query('SELECT * FROM materials WHERE id=$1 FOR UPDATE',[movement.material_id])).rows[0];
    if (movement.type==='entrada' && material.quantity+0.000001<movement.quantity) { await client.query('ROLLBACK'); return fail(res,'Não é possível desfazer: parte do material já foi consumida.'); }
    await client.query('UPDATE materials SET quantity=quantity+$1 WHERE id=$2',[movement.type==='saida'?movement.quantity:-movement.quantity,movement.material_id]);
    await client.query('DELETE FROM material_movements WHERE id=$1',[id]);
    if (movement.transaction_id) await client.query('DELETE FROM transactions WHERE id=$1',[movement.transaction_id]);
    await client.query('COMMIT'); res.json({ok:true});
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}));
app.post('/api/employees', auth, wrap(async (req,res) => { const name=text(req.body.name,80); if (!name) return fail(res,'Informe o nome.'); await query('INSERT INTO employees (name) VALUES ($1)',[name]); res.json({ok:true}); }));
app.patch('/api/employees/:id', auth, wrap(async (req,res) => {
  const id=positive(req.params.id), updates=[], values=[]; if (!id) return fail(res,'Funcionário inválido.');
  if (Object.hasOwn(req.body,'name')) { const name=text(req.body.name,80); if (!name) return fail(res,'Informe o nome do funcionário.'); values.push(name); updates.push(`name=$${values.length}`); }
  if (Object.hasOwn(req.body,'active')) { if (![0,1].includes(req.body.active)) return fail(res,'Status inválido.'); values.push(req.body.active); updates.push(`active=$${values.length}`); }
  if (!updates.length) return fail(res,'Nenhuma alteração informada.');
  const result=await query(`UPDATE employees SET ${updates.join(',')} WHERE id=$${values.length+1}`,[...values,id]);
  if (!result.rowCount) return fail(res,'Funcionário não encontrado.',404); res.json({ok:true});
}));
app.post('/api/production', auth, wrap(async (req,res) => {
  const id=positive(req.body.employee_id), week=date(req.body.week), piece=text(req.body.piece,80), qty=positive(req.body.quantity), value=nonnegative(req.body.unit_value_cents);
  if (!id||!week||!piece||!qty||value===null) return fail(res,'Confira os dados da produção.');
  const result=await query('INSERT INTO production (employee_id,week,piece,quantity,unit_value_cents) SELECT id,$2,$3,$4,$5 FROM employees WHERE id=$1 AND active=1 RETURNING id',[id,week,piece,qty,value]);
  if (!result.rowCount) return fail(res,'Funcionário não encontrado ou inativo.'); res.json({ok:true});
}));
app.delete('/api/production/:id', auth, wrap(async (req,res) => { await query('DELETE FROM production WHERE id=$1',[positive(req.params.id)]); res.json({ok:true}); }));
app.put('/api/settings/reserve', auth, wrap(async (req,res) => { const value=Number(req.body.percent); if (!Number.isFinite(value)||value<0||value>100) return fail(res,'Use um percentual entre 0 e 100.'); await query("UPDATE settings SET value=$1 WHERE key='reserve_percent'",[String(value)]); res.json({ok:true}); }));
app.use('/api', (_req,res) => fail(res,'Rota não encontrada.',404));

export default function handler(req,res) {
  const original = new URL(req.url, 'https://local.invalid');
  const route = original.searchParams.get('route');
  if (route) {
    original.searchParams.delete('route');
    req.url = `/api/${route}${original.search}`;
  }
  return app(req,res);
}
