import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { available } from '@/lib/balance';
import { requestWithdraw } from '../actions';
import { brl, STATUS } from '@/lib/fmt';

export const dynamic = 'force-dynamic';

export default async function Conta({ searchParams: s }) {
  const u = await requireUser();
  const [orders, avail, wds, refs] = await Promise.all([
    db.order.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' } }),
    available(u.id),
    db.withdrawal.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' } }),
    db.user.count({ where: { referredById: u.id } }),
  ]);
  const site = process.env.SITE_URL || 'https://jbbikes.online';
  return (<>
    <h2>Olá, {u.name}! 👋</h2>
    {s.erro && <div className="msg err">{s.erro}</div>}
    {s.ok && <div className="msg ok">{s.ok}</div>}

    <div className="box">
      <h3>📦 Meus pedidos</h3>
      {!orders.length && <p>Você ainda não fez pedidos.</p>}
      <table><tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>{o.createdAt.toLocaleDateString('pt-BR')}</td>
            <td>{o.quantity}x {o.productName}</td>
            <td>{brl(o.total)}</td>
            <td><span className={`badge ${o.status}`}>{STATUS[o.status]}</span></td>
          </tr>
        ))}
      </tbody></table>
    </div>

    <div className="box">
      <h3>🤝 Indique e ganhe 10%</h3>
      <p>Seu link exclusivo:</p>
      <input readOnly value={`${site}/cadastro?ref=${u.refCode}`} />
      <p>Pessoas indicadas: <b>{refs}</b></p>
      <p>Saldo disponível:</p>
      <div className="bal">{brl(avail)}</div>
      {avail >= 5000 ? (
        <form className="f" action={requestWithdraw}>
          <input name="pixKey" placeholder="Sua chave Pix" required />
          <button className="btn green">Solicitar saque de {brl(avail)}</button>
        </form>
      ) : <p>Saque via Pix liberado a partir de R$ 50,00.</p>}
      {wds.length > 0 && (<>
        <h4>Saques</h4>
        <table><tbody>{wds.map((w) => (
          <tr key={w.id}><td>{w.createdAt.toLocaleDateString('pt-BR')}</td><td>{brl(w.amount)}</td><td>{w.pixKey}</td>
            <td><span className={`badge ${w.status}`}>{w.status}</span></td></tr>
        ))}</tbody></table>
      </>)}
    </div>
  </>);
}