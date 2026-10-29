import { register } from '../actions';
export default function Cadastro({ searchParams: s }) {
  return (
    <div className="box" style={{ maxWidth: 420, margin: '30px auto' }}>
      <h2>Criar conta</h2>
      {s.ref && <div className="msg ok">Você foi indicado por um amigo 🎉</div>}
      {s.erro && <div className="msg err">{s.erro}</div>}
      <form className="f" action={register}>
        <input type="hidden" name="ref" value={s.ref || ''} />
        <input name="name" placeholder="Seu nome" required />
        <input name="email" type="email" placeholder="E-mail" required />
        <input name="password" type="password" placeholder="Senha (mín. 6 caracteres)" required minLength={6} />
        <button className="btn blue">Criar conta</button>
      </form>
      <p>Já tem conta? <a href="/login">Entrar</a></p>
    </div>
  );
}