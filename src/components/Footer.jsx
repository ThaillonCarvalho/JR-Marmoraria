import { EMPRESA, NAVEGACAO, CTA_ORCAMENTO, HISTORIA } from '../data/company';
import { CONTATO, WHATSAPP_CONFIGURADO } from '../config/contact';
import Logo from './Logo';
import '../styles/footer.css';

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="rodape">
      <div className="container rodape__grade">
        <div className="rodape__marca">
          <Logo variante="clara" className="rodape__logo" />
          <p className="rodape__assinatura">{EMPRESA.assinatura}</p>
          <p className="rodape__texto">{EMPRESA.descricao}</p>
        </div>

        <nav className="rodape__coluna" aria-label="Navegação do rodapé">
          <h2 className="rodape__titulo">Navegação</h2>
          <ul className="rodape__lista">
            {NAVEGACAO.map((item) => (
              <li key={item.id}>
                <a className="rodape__link" href={`#${item.id}`}>
                  {item.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rodape__coluna">
          <h2 className="rodape__titulo">Serviços</h2>
          <ul className="rodape__lista">
            <li>
              <a className="rodape__link" href="#servicos">
                Bancadas de cozinha
              </a>
            </li>
            <li>
              <a className="rodape__link" href="#servicos">
                Pias e lavatórios
              </a>
            </li>
            <li>
              <a className="rodape__link" href="#servicos">
                Escadas e revestimentos
              </a>
            </li>
            <li>
              <a className="rodape__link" href="#servicos">
                Instalação e acabamento
              </a>
            </li>
          </ul>
        </div>

        <div className="rodape__coluna">
          <h2 className="rodape__titulo">Contato</h2>
          <p className="rodape__texto">
            {HISTORIA.responsavel} — {HISTORIA.cargo}
            <br />
            Mais de 25 anos de profissão.
          </p>

          {WHATSAPP_CONFIGURADO ? (
            <p className="rodape__texto">
              WhatsApp: <strong>{CONTATO.whatsappExibido || CONTATO.whatsapp}</strong>
            </p>
          ) : (
            <p className="rodape__texto rodape__texto--pendente">
              WhatsApp: <em>contato ainda não informado</em>
            </p>
          )}

          {CONTATO.email && (
            <p className="rodape__texto">
              E-mail: <strong>{CONTATO.email}</strong>
            </p>
          )}

          <a className="botao botao--contorno-ouro rodape__cta" href="#orcamento">
            {CTA_ORCAMENTO}
          </a>
        </div>
      </div>

      <div className="container rodape__base">
        <p>
          © {ano} {EMPRESA.nome}. Todos os direitos reservados.
        </p>
        <a className="rodape__link" href="/gestao">Área de gestão</a>
      </div>
    </footer>
  );
}
