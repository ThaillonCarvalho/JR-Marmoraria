import { useState } from 'react';
import { GALERIA, CATEGORIAS } from '../data/gallery';
import '../styles/galeria.css';

/**
 * Galeria de referências.
 * As imagens atuais são ilustrativas e cada item exibe a fonte.
 * Ver `src/data/gallery.js` para trocar pelas fotos reais.
 */
export default function Galeria() {
  const [categoria, setCategoria] = useState('Todas');
  const visiveis =
    categoria === 'Todas' ? GALERIA : GALERIA.filter((item) => item.categoria === categoria);

  return (
    <section id="trabalhos" className="secao galeria" aria-labelledby="galeria-titulo">
      <div className="container">
        <header className="cabecalho-secao cabecalho-secao--claro">
          <p className="etiqueta etiqueta--clara">
            <span className="etiqueta__linha" aria-hidden="true" />
            Trabalhos e referências
          </p>
          <h2 className="secao__titulo secao__titulo--claro" id="galeria-titulo">
            Pedra que mostra a diferença
          </h2>
          <p className="secao__texto secao__texto--claro">
            Um bom acabamento se nota no detalhe: no alinhamento das juntas, no brilho uniforme e na
            forma como a peça se encaixa no espaço.
          </p>
        </header>

        <div className="galeria__filtros" role="group" aria-label="Filtrar referências por categoria">
          {['Todas', ...CATEGORIAS].map((opcao) => (
            <button
              key={opcao}
              type="button"
              className={`filtro${categoria === opcao ? ' filtro--ativo' : ''}`}
              onClick={() => setCategoria(opcao)}
              aria-pressed={categoria === opcao}
            >
              {opcao}
            </button>
          ))}
        </div>

        <ul className="galeria__grade">
          {visiveis.map((item) => (
            <li key={item.id} className="galeria__item">
              <figure className="galeria__figura">
                <img
                  className="galeria__imagem"
                  src={item.imagem}
                  alt={item.titulo}
                  width="900"
                  height="1125"
                  loading="lazy"
                  decoding="async"
                />
                {item.referenciaIlustrativa && (
                  <span className="galeria__selo">Referência ilustrativa</span>
                )}
              </figure>
              <div className="galeria__conteudo">
                <p className="galeria__categoria">{item.categoria}</p>
                <h3 className="galeria__titulo">{item.titulo}</h3>
                <p className="galeria__descricao">{item.descricao}</p>
                {item.fonte && (
                  <p className="galeria__fonte">
                    Foto:{' '}
                    <a href={item.fonte.url} target="_blank" rel="noreferrer noopener">
                      {item.fonte.autor}
                    </a>{' '}
                    · {item.fonte.origem} · {item.fonte.licenca}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
