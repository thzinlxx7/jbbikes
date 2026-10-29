import { resetPassword } from '../actions';
export default function Redefinir({ searchParams: s }) {
  return (
    <div className="box" style={{ maxWidth: 420, margin: '30px auto' }}>
      <h2>Nova senha</h2>
      {s.erro && <div className="msg err">{s.erro}</div>}
      <form className="f" action={resetPassword}>
        <input type="hidden" name="token" value={s.token || ''} />
        <input name="password" type="password" placeholder="Nova senha" required minLength={6} />
        <button className="btn blue">Salvar</button>
      </form>
    </div>
  );
}