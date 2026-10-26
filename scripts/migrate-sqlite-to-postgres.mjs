import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!dbUrl) throw new Error('DATABASE_URL ou POSTGRES_URL não configurada.');
const local = new DatabaseSync('data/gestao.sqlite', { readOnly: true });
const remote = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: true } });
const rows = (table) => local.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
await remote.connect();
try {
  await remote.query('BEGIN');
  for (const row of rows('transactions')) {
    await remote.query('INSERT INTO transactions (id,date,type,category,description,amount_cents,created_at) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING', [row.id,row.date,row.type,row.category,row.description,row.amount_cents,row.created_at]);
  }
  const materialMap = new Map();
  for (const row of rows('materials')) {
    const result = await remote.query('INSERT INTO materials (name,unit,quantity,min_quantity) VALUES ($1,$2,$3,$4) ON CONFLICT (name) DO UPDATE SET unit=EXCLUDED.unit,quantity=EXCLUDED.quantity,min_quantity=EXCLUDED.min_quantity RETURNING id', [row.name,row.unit,row.quantity,row.min_quantity]);
    materialMap.set(row.id, result.rows[0].id);
  }
  for (const row of rows('material_movements')) {
    await remote.query('INSERT INTO material_movements (id,material_id,date,type,quantity,unit_cost_cents,note,transaction_id) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING', [row.id,materialMap.get(row.material_id),row.date,row.type,row.quantity,row.unit_cost_cents,row.note,row.transaction_id]);
  }
  for (const row of rows('employees')) {
    await remote.query('INSERT INTO employees (id,name,active) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,active=EXCLUDED.active', [row.id,row.name,row.active]);
  }
  for (const row of rows('production')) {
    await remote.query('INSERT INTO production (id,employee_id,week,piece,quantity,unit_value_cents) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING', [row.id,row.employee_id,row.week,row.piece,row.quantity,row.unit_value_cents]);
  }
  const reserve = local.prepare("SELECT value FROM settings WHERE key='reserve_percent'").get();
  if (reserve) await remote.query("INSERT INTO settings (key,value) VALUES ('reserve_percent',$1) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value", [reserve.value]);
  for (const table of ['transactions','materials','material_movements','employees','production']) {
    await remote.query(`SELECT setval(pg_get_serial_sequence('${table}','id'), GREATEST(COALESCE((SELECT MAX(id) FROM ${table}),0),1), (SELECT COUNT(*) FROM ${table})>0)`);
  }
  await remote.query('COMMIT');
  console.log('Migração concluída:', Object.fromEntries(['transactions','materials','material_movements','employees','production'].map((table) => [table, rows(table).length])));
} catch (error) {
  await remote.query('ROLLBACK');
  throw error;
} finally {
  await remote.end();
  local.close();
}
