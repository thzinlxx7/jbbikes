import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { brl, STATUS } from '@/lib/fmt';
import { saveProduct, deleteProduct, saveCategory, deleteCategory, addAdmin, setStatus, payWithdraw } from '../actions';

export const dynamic = 'force-dynamic';

function ProductForm({ p, cats }) {
  return (
    <form className="f" action={saveProduct}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <input name="name" placeholder="Nome" defaultValue={p?.name} required />
      <textarea name="description" placeholder="Descrição" defaultValue={p?.description} />
      <div className="row">
        <input name="price" placeholder="Preço (ex: 199,90)" defaultValue={p ? (p.price / 100).toFixed(2).replace('.', ',') : ''} required />
        <select name="categoryId" defaultValue={p?.categoryId || ''}>
          <option value="">Sem categoria</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <input type="file" name="image" accept="image/*" />
      <label><input type="checkbox" name="active" defaultChecked={p ? p.active : true} style={{ width: 'auto' }} /> Visível na loja</label>
      <button className="btn blue">{p ? 'Salvar' : 'Adicionar produto'}</button>
    </form>
  );
}

export default async function Admin({ searchParams: s }) {
  await requireAdmin();
  const [cats, products, orders, wds, admins] = await Promise.all([
    db.category.findMany({ orderBy: { name: 'asc' } }),
    db.product.findMany({ orderBy: { createdAt: 'desc' } }),
    db.order.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
    db.withdrawal.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } }),
    db.user.findMany({ where: { role: 'ADMIN' } }),
  ]);
  return (<>
    <h2>Painel administrativo</h2>
    {s.erro && <div className="msg err">{s.erro}</div>}
    {s.ok && <div className="msg ok">{s.ok}</div>}

    <div className="box"><h3>🛒 Pedidos</h3>
      <div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Data</th><th>Cliente</th><th>Item</th><th>Total</th><th>Pago</th><th>Entrega</th><th>Status</th></tr></thead>
        <tbody>{orders.map((o) => (
          <tr key={o.id}>
            <td>{o.createdAt.toLocaleDateString('pt-BR')}</td>
            <td>{o.user.name}<br /><small>{o.user.email}</small></td>
            <td>{o.quantity}x {o.productName}</td>
            <td>{brl(o.total)}</td>
            <td>{o.paid ? '✅' : '⏳'}</td>
            <td><small>{o.address}</small></td>
            <td>
              <form action={setStatus} className="row">
                <input type="hidden" name="id" value={o.id} />
                <select name="status" defaultValue={o.status}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button className="btn sm">OK</button>
              </form>
            </td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>

    <div className="box"><h3>💸 Solicitações de saque (Pix)</h3>
      <table><tbody>{wds.map((w) => (
        <tr key={w.id}>
          <td>{w.createdAt.toLocaleDateString('pt-BR')}</td>
          <td>{w.user.name}<br /><small>{w.user.email}</small></td>
          <td><b>{brl(w.amount)}</b></td>
          <td>Pix: <b>{w.pixKey}</b></td>
          <td>{w.status === 'PENDENTE'
            ? <form action={payWithdraw}><input type="hidden" name="id" value={w.id} /><button className="btn sm green">Marcar como pago</button></form>
            : <span className="badge PAGO">PAGO</span>}</td>
        </tr>
      ))}</tbody></table>
    </div>

    <div className="box"><h3>📦 Produtos</h3>
      <details><summary>➕ Novo produto</summary><ProductForm cats={cats} /></details>
      {products.map((p) => (
        <details key={p.id}>
          <summary>{p.name} — {brl(p.price)} {!p.active && '(oculto)'}</summary>
          <ProductForm p={p} cats={cats} />
          <form action={deleteProduct}><input type="hidden" name="id" value={p.id} /><button className="btn sm pink">Remover</button></form>
        </details>
      ))}
    </div>

    <div className="box"><h3>🏷️ Categorias</h3>
      <form className="row" action={saveCategory}><input name="name" placeholder="Nova categoria" /><button className="btn sm y">Adicionar</button></form>
      {cats.map((c) => (
        <form key={c.id} action={deleteCategory} className="row" style={{ marginTop: 6 }}>
          <span>{c.name}</span><input type="hidden" name="id" value={c.id} /><button className="btn sm pink">Remover</button>
        </form>
      ))}
    </div>

    <div className="box"><h3>👤 Administradores</h3>
      <ul>{admins.map((a) => <li key={a.id}>{a.email}</li>)}</ul>
      <form className="row" action={addAdmin}>
        <input name="email" type="email" placeholder="E-mail da conta (já cadastrada)" required />
        <button className="btn sm blue">Tornar administrador</button>
      </form>
    </div>
  </>);
}