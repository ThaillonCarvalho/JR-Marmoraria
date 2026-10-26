import { SERVICOS } from '../data/services';
import Icone from './Icons';
import '../styles/servicos.css';

/** Seção de serviços: cards numerados, sem exagero visual. */
export default function Servicos() {
  return (
    <section id="servicos" className="secao secao--clara servicos" aria-labelledby="servicos-titulo">
      <div className="container">
        <header className="cabecalho-secao">
          <p className="etiqueta">
            <span className="etiqueta__linha" aria-hidden="true" />
            Serviços
          </p>
          <h2 className="secao__titulo" id="servicos-titulo">
            Peças de pedra que nascem do seu projeto
          </h2>
          <p className="secao__texto">
            Cada item abaixo é executado sob medida, do desenho à instalação. Escolha o que você
            precisa ou descreva na seção de orçamento — se ainda estiver em dúvida, a gente
            orienta.
          </p>
        </header>

        <ul className="servicos__grade">
          {SERVICOS.map((servico, indice) => (
            <li key={servico.id} className="servico">
              <span className="servico__numero" aria-hidden="true">
                {String(indice + 1).padStart(2, '0')}
              </span>
              <span className="servico__icone">
                <Icone nome={servico.icone} tamanho={30} />
              </span>
              <h3 className="servico__titulo">{servico.titulo}</h3>
              <p className="servico__texto">{servico.texto}</p>
              <ul className="servico__itens">
                {servico.itens.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}