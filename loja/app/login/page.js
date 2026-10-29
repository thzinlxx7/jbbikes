import { login } from '../actions';
export default function Login({ searchParams: s }) {
  return (
    <div className="box" style={{ maxWidth: 420, margin: '30px auto' }}>
      <h2>Entrar</h2>
      {s.erro && <div className="msg err">{s.erro}</div>}
      {s.ok && <div className="msg ok">{s.ok}</div>}
      <form className="f" action={login}>
        <input type="hidden" name="next" value={s.next || '/conta'} />
        <input name="email" type="email" placeholder="E-mail" required />
        <input name="password" type="password" placeholder="Senha" required />
        <button className="btn blue">Entrar</button>
      </form>
      <p><a href="/esqueci-senha">Esqueci minha senha</a> · <a href="/cadastro">Criar conta</a></p>
    </div>
  );
}