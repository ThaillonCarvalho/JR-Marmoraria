import { HISTORIA } from '../data/company';
import Logo from './Logo';
import '../styles/historia.css';

/** Seção "Nossa história" — Julio, proprietário e instalador. */
export default function Historia() {
  const { imagem } = HISTORIA;

  return (
    <section id="historia" className="secao secao--clara historia" aria-labelledby="historia-titulo">
      <div className="container historia__grade">
        <div className="historia__midia">
          <div className="historia__marca" aria-hidden="true">
            <Logo variante="escura" className="historia__logo" />
          </div>
          <figure className="historia__figura">
            <img
              className="historia__imagem"
              src={imagem.src}
              alt={imagem.alt}
              width="900"
              height="1125"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="historia__credito">
              Foto ilustrativa: {imagem.credito.autor} · {imagem.credito.fonte} ·{' '}
              {imagem.credito.licenca}
            </figcaption>
          </figure>
        </div>

        <div className="historia__texto">
          <p className="etiqueta">
            <span className="etiqueta__linha" aria-hidden="true" />
            {HISTORIA.eyebrow}
          </p>
          <h2 className="secao__titulo" id="historia-titulo">
            {HISTORIA.titulo}
          </h2>
          <p className="historia__assinatura">
            <strong>{HISTORIA.responsavel}</strong> — {HISTORIA.cargo}
          </p>

          {HISTORIA.paragrafos.map((paragrafo) => (
            <p key={paragrafo} className="historia__paragrafo">
              {paragrafo}
            </p>
          ))}

          <ul className="historia__destaques">
            {HISTORIA.destaques.map((destaque) => (
              <li key={destaque.titulo} className="destaque">
                <h3 className="destaque__titulo">{destaque.titulo}</h3>
                <p className="destaque__texto">{destaque.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}