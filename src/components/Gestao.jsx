import { useEffect, useState } from 'react';
import '../styles/gestao.css';

const money = (cents) => (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const cents = (value) => Math.round(Number(String(value).replace(',', '.')) * 100);
const today = () => new Date().toLocaleDateString('sv-SE');
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.toLocaleDateString('sv-SE'); };
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options, body: options.body ? JSON.stringify(options.body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Não foi possível concluir.');
  return result;
}

function EmployeeList({ employees, busy, run }) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  return <ul className="gestao__employees">{employees.map((employee) => <li key={employee.id}>
    {editingId === employee.id ? <form className="gestao__inline" onSubmit={async (event) => {
      event.preventDefault();
      const saved = await run(() => api(`/employees/${employee.id}`, { method: 'PATCH', body: { name } }));
      if (saved) setEditingId(null);
    }}><label>Nome<input required maxLength="80" autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label><button disabled={busy}>Salvar</button><button type="button" className="gestao__quiet" onClick={() => setEditingId(null)}>Cancelar</button></form> : <>
      <span>{employee.name} — {employee.active ? 'ativo' : 'inativo'}</span>
      <button className="gestao__quiet" onClick={() => { setEditingId(employee.id); setName(employee.name); }}>Editar nome</button>
      <button className="gestao__quiet" onClick={() => run(() => api(`/employees/${employee.id}`, { method: 'PATCH', body: { active: employee.active ? 0 : 1 } }))}>{employee.active ? 'Desativar' : 'Reativar'}</button>
    </>}
  </li>)}</ul>;
}

function VisitorMetrics({ metrics }) {
  if (!metrics) return null;
  return <section aria-labelledby="visitas-titulo">
    <h2 id="visitas-titulo">Visitas ao site</h2>
    <div className="gestao__cards">
      <article><span>Visitantes distintos</span><strong>{metrics.unique_visitors}</strong></article>
      <article><span>Acessos à página</span><strong>{metrics.views}</strong></article>
      <article><span>Visitantes hoje</span><strong>{metrics.unique_today}</strong></article>
      <article><span>Acessos hoje</span><strong>{metrics.views_today}</strong></article>
    </div>
    <p className="gestao__hint">Visitantes distintos são estimados por navegador. A contagem começa a partir da publicação deste recurso e não inclui a área de gestão.</p>
  </section>;
}

function CashHistory({ transactions, run }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const term = normalize(search.trim());
  const categories = [...new Set(transactions.map((row) => row.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filtered = transactions.filter((row) =>
    (!term || normalize(`${row.description} ${row.category}`).includes(term)) &&
    (!type || row.type === type) &&
    (!category || row.category === category) &&
    (!from || row.date >= from) &&
    (!to || row.date <= to)
  );
  const clear = () => { setSearch(''); setType(''); setCategory(''); setFrom(''); setTo(''); };

  return <section className="gestao__history" aria-labelledby="historico-caixa-titulo">
    <h3 id="historico-caixa-titulo">Histórico</h3>
    <div className="gestao__filters">
      <label>Pesquisar item ou categoria<input type="search" placeholder="Ex.: Vale Thaillon" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label>Tipo<select value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos</option><option value="entrada">Entradas</option><option value="saida">Saídas</option></select></label>
      <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas</option>{categories.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      <label>De<input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
      <label>Até<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
      <button type="button" className="gestao__quiet" onClick={clear}>Limpar filtros</button>
    </div>
    <p className="gestao__hint">{filtered.length} {filtered.length === 1 ? 'lançamento encontrado' : 'lançamentos encontrados'}</p>
    <div className="gestao__scroll"><table><thead><tr><th>Data</th><th>Tipo</th><th>Item</th><th>Categoria</th><th>Valor</th><th></th></tr></thead><tbody>
      {filtered.map((row) => <tr key={row.id}><td>{row.date}</td><td>{row.type}</td><td>{row.description}</td><td>{row.category}</td><td>{money(row.amount_cents)}</td><td><button className="gestao__danger" onClick={() => { if (confirm('Excluir este lançamento?')) run(() => api(`/transactions/${row.id}`, { method: 'DELETE' })); }}>Excluir</button></td></tr>)}
      {!filtered.length && <tr><td colSpan="6">Nenhum lançamento corresponde aos filtros.</td></tr>}
    </tbody></table></div>
  </section>;
}

export default function Gestao() {
  const [logged, setLogged] = useState(false);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('resumo');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [entry, setEntry] = useState({ date: today(), type: 'entrada', category: 'Serviços', description: '', amount: '' });
  const [material, setMaterial] = useState({ name: '', unit: 'un', min_quantity: 0 });
  const [movement, setMovement] = useState({ material_id: '', date: today(), type: 'entrada', quantity: '', unit_cost: '', note: '', post_to_cash: false });
  const [employee, setEmployee] = useState('');
  const [production, setProduction] = useState({ employee_id: '', week: weekStart(), piece: '', quantity: '', unit_value: '' });
  const [reserve, setReserve] = useState('20');

  const refresh = async () => { const next = await api('/dashboard'); setData(next); setReserve(String(next.reservePercent)); };
  useEffect(() => { api('/me').then(() => { setLogged(true); return refresh(); }).catch(() => {}); }, []);
  async function run(action) {
    setBusy(true); setMessage('');
    try { await action(); await refresh(); setMessage('Salvo com sucesso.'); return true; }
    catch (error) { setMessage(error.message); return false; }
    finally { setBusy(false); }
  }
  async function submitLogin(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await api('/login', { method: 'POST', body: login }); setLogged(true); setLogin({ email: '', password: '' }); await refresh(); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  const balance = data?.transactions.reduce((sum, row) => sum + (row.type === 'entrada' ? row.amount_cents : -row.amount_cents), 0) || 0;
  const revenue = data?.transactions.filter((row) => row.type === 'entrada').reduce((sum, row) => sum + row.amount_cents, 0) || 0;
  const expense = revenue - balance;
  const reserveValue = Math.max(0, balance * (data?.reservePercent || 0) / 100);
  const productionTotal = data?.production.reduce((sum, row) => sum + row.quantity * row.unit_value_cents, 0) || 0;

  return <main className="gestao">
    <div className="gestao__shell">
      <header className="gestao__header"><div><a href="/">← Voltar ao site</a><h1>Gestão JR</h1><p>Caixa, estoque e produção em um lugar.</p></div>{logged && <button className="gestao__quiet" onClick={async () => { await api('/logout', { method: 'POST' }); setLogged(false); setData(null); }}>Sair</button>}</header>
      {!logged ? <section className="gestao__login"><h2>Acesso administrativo</h2><form onSubmit={submitLogin}><label>E-mail<input type="email" required autoComplete="username" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} /></label><label>Senha<input type="password" required autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label><button disabled={busy}>Entrar</button></form></section> : data && <>
        <nav className="gestao__tabs" aria-label="Seções da gestão">{[['resumo','Resumo'],['caixa','Caixa'],['materiais','Materiais'],['funcionarios','Funcionários']].map(([id,label]) => <button key={id} className={tab === id ? 'ativo' : ''} onClick={() => { setTab(id); setMessage(''); }}>{label}</button>)}</nav>
        {tab === 'resumo' && <VisitorMetrics metrics={data.visitors} />}
        {tab === 'resumo' && <section><h2>Visão geral</h2><div className="gestao__cards"><article><span>Entradas</span><strong>{money(revenue)}</strong></article><article><span>Saídas</span><strong>{money(expense)}</strong></article><article><span>Saldo do caixa</span><strong>{money(balance)}</strong></article><article><span>Reserva sugerida ({data.reservePercent}%)</span><strong>{money(reserveValue)}</strong></article></div><div className="gestao__panel"><h3>Reserva financeira</h3><p>Defina a parcela do saldo positivo que deseja separar. Exemplo: 20% de R$ 10.000,00 = R$ 2.000,00. Esta é uma meta de planejamento; nenhum dinheiro é movimentado automaticamente.</p><form className="gestao__inline" onSubmit={(e) => { e.preventDefault(); run(() => api('/settings/reserve', { method: 'PUT', body: { percent: reserve } })); }}><label>Percentual da reserva (%)<input type="number" min="0" max="100" step="0.5" value={reserve} onChange={(e) => setReserve(e.target.value)} /></label><button disabled={busy}>Salvar percentual</button></form><p>Saldo após a reserva: <strong>{money(balance - reserveValue)}</strong></p></div><div className="gestao__cards"><article><span>Materiais abaixo do mínimo</span><strong>{data.materials.filter((m) => m.quantity <= m.min_quantity).length}</strong></article><article><span>Produção cadastrada</span><strong>{money(productionTotal)}</strong></article></div><p className="gestao__hint">Produção é um controle de peças e valores. Ela não gera lançamentos no caixa automaticamente.</p></section>}
        {tab === 'caixa' && <section><h2>Caixa</h2><p>Registre serviços recebidos, pagamentos e outras despesas. Valores em reais.</p><form className="gestao__form" onSubmit={(e) => { e.preventDefault(); run(() => api('/transactions', { method: 'POST', body: { ...entry, amount_cents: cents(entry.amount) } })); setEntry({ ...entry, description: '', amount: '' }); }}><label>Data<input type="date" required value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></label><label>Tipo<select value={entry.type} onChange={(e) => setEntry({ ...entry, type: e.target.value, category: e.target.value === 'entrada' ? 'Serviços' : 'Despesas' })}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></label><label>Categoria<input required value={entry.category} onChange={(e) => setEntry({ ...entry, category: e.target.value })} /></label><label>Item / serviço<input required placeholder="Ex.: Bancada de cozinha" value={entry.description} onChange={(e) => setEntry({ ...entry, description: e.target.value })} /></label><label>Valor (R$)<input type="number" min="0.01" step="0.01" required value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} /></label><button disabled={busy}>Adicionar lançamento</button></form><CashHistory transactions={data.transactions} run={run} /></section>}
        {tab === 'materiais' && <section><h2>Materiais e consumo</h2><p>Itens comuns de corte, colagem e acabamento já estão cadastrados. Informe as compras e o consumo para acompanhar o estoque.</p><div className="gestao__two"><div className="gestao__panel"><h3>Novo material</h3><form className="gestao__form" onSubmit={(e) => { e.preventDefault(); run(() => api('/materials', { method: 'POST', body: material })); setMaterial({ name: '', unit: 'un', min_quantity: 0 }); }}><label>Nome<input required value={material.name} onChange={(e) => setMaterial({ ...material, name: e.target.value })} /></label><label>Unidade<input required value={material.unit} onChange={(e) => setMaterial({ ...material, unit: e.target.value })} /></label><label>Estoque mínimo<input type="number" min="0" step="0.001" value={material.min_quantity} onChange={(e) => setMaterial({ ...material, min_quantity: e.target.value })} /></label><button disabled={busy}>Cadastrar</button></form></div><div className="gestao__panel"><h3>Movimentar material</h3><form className="gestao__form" onSubmit={(e) => { e.preventDefault(); run(() => api('/material-movements', { method: 'POST', body: { ...movement, unit_cost_cents: cents(movement.unit_cost || 0) } })); setMovement({ ...movement, quantity: '', unit_cost: '', note: '' }); }}><label>Material<select required value={movement.material_id} onChange={(e) => setMovement({ ...movement, material_id: e.target.value })}><option value="">Selecione</option>{data.materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label>Data<input type="date" required value={movement.date} onChange={(e) => setMovement({ ...movement, date: e.target.value })} /></label><label>Tipo<select value={movement.type} onChange={(e) => setMovement({ ...movement, type: e.target.value })}><option value="entrada">Compra / entrada</option><option value="saida">Uso / saída</option></select></label><label>Quantidade<input type="number" min="0.001" step="0.001" required value={movement.quantity} onChange={(e) => setMovement({ ...movement, quantity: e.target.value })} /></label><label>Custo unitário (R$)<input type="number" min="0" step="0.01" value={movement.unit_cost} onChange={(e) => setMovement({ ...movement, unit_cost: e.target.value })} /></label><label>Serviço / observação<input value={movement.note} onChange={(e) => setMovement({ ...movement, note: e.target.value })} /></label>{movement.type === 'saida' && <label className="gestao__check"><input type="checkbox" checked={movement.post_to_cash} onChange={(e) => setMovement({ ...movement, post_to_cash: e.target.checked })} />Lançar consumo no caixa também</label>}<p className="gestao__hint">Compras com custo informado entram como saída do caixa. Consumo só gera saída se a opção acima for marcada, para evitar contagem dupla.</p><button disabled={busy}>Registrar movimentação</button></form></div></div><h3>Estoque atual</h3><div className="gestao__scroll"><table><thead><tr><th>Material</th><th>Unidade</th><th>Quantidade</th><th>Mínimo</th></tr></thead><tbody>{data.materials.map((m) => <tr key={m.id}><td>{m.name}</td><td>{m.unit}</td><td>{m.quantity}</td><td>{m.min_quantity}{m.quantity <= m.min_quantity && <span className="gestao__alert"> Repor</span>}</td></tr>)}</tbody></table></div><h3>Movimentações</h3><div className="gestao__scroll"><table><thead><tr><th>Data</th><th>Material</th><th>Tipo</th><th>Quantidade</th><th>Custo total</th><th>Observação</th><th></th></tr></thead><tbody>{data.movements.map((m) => <tr key={m.id}><td>{m.date}</td><td>{m.material_name}</td><td>{m.type}</td><td>{m.quantity} {m.unit}</td><td>{money(m.quantity * m.unit_cost_cents)}</td><td>{m.note}</td><td><button className="gestao__danger" onClick={() => { if (confirm('Desfazer esta movimentação e o lançamento de caixa vinculado?')) run(() => api(`/material-movements/${m.id}`, { method: 'DELETE' })); }}>Desfazer</button></td></tr>)}</tbody></table></div></section>}
        {tab === 'funcionarios' && <section><h2>Funcionários e produção semanal</h2><div className="gestao__two"><div className="gestao__panel"><h3>Cadastrar funcionário</h3><form className="gestao__inline" onSubmit={(e) => { e.preventDefault(); run(() => api('/employees', { method: 'POST', body: { name: employee } })); setEmployee(''); }}><label>Nome<input required value={employee} onChange={(e) => setEmployee(e.target.value)} /></label><button disabled={busy}>Cadastrar</button></form><EmployeeList employees={data.employees} busy={busy} run={run} /></div><div className="gestao__panel"><h3>Registrar peças da semana</h3><form className="gestao__form" onSubmit={(e) => { e.preventDefault(); run(() => api('/production', { method: 'POST', body: { ...production, unit_value_cents: cents(production.unit_value) } })); setProduction({ ...production, piece: '', quantity: '', unit_value: '' }); }}><label>Funcionário<select required value={production.employee_id} onChange={(e) => setProduction({ ...production, employee_id: e.target.value })}><option value="">Selecione</option>{data.employees.filter((e) => e.active).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>Início da semana<input type="date" required value={production.week} onChange={(e) => setProduction({ ...production, week: e.target.value })} /></label><label>Peça / serviço<input required placeholder="Ex.: Pia de cozinha" value={production.piece} onChange={(e) => setProduction({ ...production, piece: e.target.value })} /></label><label>Quantidade<input type="number" min="1" step="1" required value={production.quantity} onChange={(e) => setProduction({ ...production, quantity: e.target.value })} /></label><label>Valor por peça (R$)<input type="number" min="0" step="0.01" required value={production.unit_value} onChange={(e) => setProduction({ ...production, unit_value: e.target.value })} /></label><button disabled={busy}>Registrar produção</button></form></div></div><h3>Produção registrada</h3><div className="gestao__scroll"><table><thead><tr><th>Semana</th><th>Funcionário</th><th>Peça</th><th>Quantidade</th><th>Valor unitário</th><th>Total</th><th></th></tr></thead><tbody>{data.production.map((p) => <tr key={p.id}><td>{p.week}</td><td>{p.employee_name}</td><td>{p.piece}</td><td>{p.quantity}</td><td>{money(p.unit_value_cents)}</td><td>{money(p.quantity * p.unit_value_cents)}</td><td><button className="gestao__danger" onClick={() => { if (confirm('Excluir este registro de produção?')) run(() => api(`/production/${p.id}`, { method: 'DELETE' })); }}>Excluir</button></td></tr>)}</tbody></table></div></section>}
      </>}
      {message && <p role="status" className="gestao__message">{message}</p>}
    </div>
  </main>;
}



