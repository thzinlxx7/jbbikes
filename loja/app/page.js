import { db } from '@/lib/db';
import { brl } from '@/lib/fmt';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }) {
  const cats = await db.category.findMany({ orderBy: { name: 'asc' } });
  const products = await db.product.findMany({
    where: { active: true, ...(searchParams.cat ? { categoryId: searchParams.cat } : {}) },
    include: { category: true }, orderBy: { createdAt: 'desc' },
  });
  return (<>
    <section className="hero">
      <h1>Pipas, rabiolas, peças e bikes 🪁🚲</h1>
      <p>Pague com Pix, boleto ou cartão. Entregamos em todo o Brasil!</p>
      <a className="btn" href="/cadastro">Criar conta e indicar amigos (ganhe 10%)</a>
    </section>
    <div className="chips">
      <a className={`chip ${!searchParams.cat ? 'on' : ''}`} href="/">Todos</a>
      {cats.map((c) => <a key={c.id} className={`chip ${searchParams.cat === c.id ? 'on' : ''}`} href={`/?cat=${c.id}`}>{c.name}</a>)}
    </div>
    <div className="grid">
      {products.map((p) => (
        <div className="card" key={p.id}>
          {p.image ? <img src={p.image} alt={p.name} /> : <div className="noimg" />}
          <div className="b">
            {p.category && <span className="tag">{p.category.name}</span>}
            <b>{p.name}</b>
            <small>{p.description}</small>
            <span className="price">{brl(p.price)}</span>
            <a className="btn blue" href={`/comprar/${p.id}`}>Comprar</a>
          </div>
        </div>
      ))}
    </div>
    {!products.length && <p>Nenhum produto disponível ainda.</p>}
  </>);
}