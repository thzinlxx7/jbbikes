import { forgot } from '../actions';
export default function Esqueci({ searchParams: s }) {
  return (
    <div className="box" style={{ maxWidth: 420, margin: '30px auto' }}>
      <h2>Recuperar senha</h2>
      {s.erro && <div className="msg err">{s.erro}</div>}
      {s.ok && <div className="msg ok">{s.ok}</div>}
      <form className="f" action={forgot}>
        <input name="email" type="email" placeholder="Seu e-mail" required />
        <button className="btn blue">Enviar link</button>
      </form>
    </div>
  );
}