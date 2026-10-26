import { EMPRESA, CTA_ORCAMENTO } from '../data/company';
import heroImage from '../assets/galeria/destaque-cozinha-marmore.jpg';
import Icone from './Icons';
import '../styles/hero.css';

/**
 * Seção principal (Hero).
 * Imagem de destaque: `src/assets/galeria/destaque-cozinha-marmore.jpg`
 * (referência ilustrativa — ver `src/data/gallery.js`).
 */
export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-titulo">
      <div className="hero__fundo" aria-hidden="true">
        <img
          className="hero__imagem"
          src={heroImage}
          alt=""
          width="1800"
          height="1080"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero__veu" />
      </div>

      <div className="hero__conteudo container">
        <p className="hero__selo">
          <span className="hero__selo-linha" aria-hidden="true" />
          {EMPRESA.nomeCurto} · {EMPRESA.assinatura}
        </p>

        <h1 className="hero__titulo" id="hero-titulo">
          {EMPRESA.titulo}
        </h1>

        <p className="hero__chamada">{EMPRESA.chamada}</p>

        <div className="hero__acoes">
          <a className="botao botao--ouro" href="#orcamento">
            {CTA_ORCAMENTO}
            <Icone nome="seta" tamanho={20} className="botao__icone" />
          </a>
          <a className="botao botao--contorno-claro" href="#servicos">
            Ver serviços
          </a>
        </div>

        <ul className="hero__marcadores">
          <li>Mármore e granito</li>
          <li>Peças sob medida</li>
          <li>Instalação e acabamento</li>
        </ul>
      </div>
    </section>
  );
}