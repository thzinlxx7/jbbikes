import './globals.css';
import { getUser } from '@/lib/auth';
import { logout } from './actions';

export const metadata = { title: 'JB Bikes — Pipas, Rabiolas e Bikes', description: 'Pipas, rabiolas, peças de bike e bikes. Entrega para todo o Brasil.' };

export default async function Layout({ children }) {
  const u = await getUser();
  return (
    <html lang="pt-BR"><body>
      <header><div className="wrap">
        <a className="logo" href="/">JB<span>Bikes</span> 🚲</a>
        <nav>
          <a href="/">Produtos</a>
          {u ? (<>
            <a href="/conta">Minha conta</a>
            {u.role === 'ADMIN' && <a href="/admin">Admin</a>}
            <form action={logout}><button className="btn sm">Sair</button></form>
          </>) : (<>
            <a href="/login">Entrar</a><a className="btn sm blue" href="/cadastro">Criar conta</a>
          </>)}
        </nav>
      </div></header>
      <main className="wrap">{children}</main>
      <footer><div className="wrap">
        <div><b>JB Bikes</b><br />jbbikes.online<br />🚚 Entrega para todo o Brasil</div>
        <div>💳 Pix, boleto e cartão<br />Pix: 11945907614</div>
        <div><a href="https://wa.me/5511945907614">💬 WhatsApp: (11) 94590-7614</a></div>
      </div></footer>
    </body></html>
  );
}