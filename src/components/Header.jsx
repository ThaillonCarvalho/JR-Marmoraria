import { useEffect, useRef, useState } from 'react';
import { NAVEGACAO, CTA_ORCAMENTO } from '../data/company';
import Logo from './Logo';
import '../styles/header.css';

/**
 * Cabeçalho fixo com navegação por âncoras.
 * No celular, vira um painel de menu acessível por teclado.
 */
export default function Header() {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const botaoRef = useRef(null);
  const painelRef = useRef(null);

  // Marca o cabeçalho como compacto após o primeiro scroll.
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 12);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  // Trava a rolagem do fundo e fecha com Esc enquanto o menu está aberto.
  useEffect(() => {
    if (!aberto) return undefined;

    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') {
        setAberto(false);
        botaoRef.current?.focus();
      }
    };
    document.addEventListener('keydown', aoTeclar);
    document.body.classList.add('menu-aberto');
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.classList.remove('menu-aberto');
    };
  }, [aberto]);

  const fechar = () => setAberto(false);

  return (
    <header className={`cabecalho${rolou ? ' cabecalho--compacto' : ''}`}>
      <a className="pular-para-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>

      <div className="cabecalho__interno container">
        <a className="cabecalho__marca" href="#topo" onClick={fechar}>
          <Logo variante="clara" className="cabecalho__logo" />
        </a>

        <nav className="cabecalho__nav" aria-label="Navegação principal">
          <ul className="cabecalho__lista">
            {NAVEGACAO.map((item) => (
              <li key={item.id}>
                <a className="cabecalho__link" href={`#${item.id}`}>
                  {item.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a className="botao botao--escuro cabecalho__cta" href="#orcamento">
          {CTA_ORCAMENTO}
        </a>
        <a className="cabecalho__gestao" href="/gestao">
          Entrar na gestão
        </a>

        <button
          ref={botaoRef}
          type="button"
          className={`cabecalho__alternador${aberto ? ' cabecalho__alternador--ativo' : ''}`}
          onClick={() => setAberto((valor) => !valor)}
          aria-expanded={aberto}
          aria-controls="menu-mobile"
        >
          <span className="visualmente-oculto">
            {aberto ? 'Fechar menu' : 'Abrir menu'}
          </span>
          <span className="cabecalho__hamburger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <div
        id="menu-mobile"
        ref={painelRef}
        className={`cabecalho__painel${aberto ? ' cabecalho__painel--aberto' : ''}`}
        hidden={!aberto}
      >
        <nav className="container" aria-label="Navegação principal (celular)">
          <ul className="cabecalho__lista cabecalho__lista--painel">
            {NAVEGACAO.map((item) => (
              <li key={item.id}>
                <a className="cabecalho__link cabecalho__link--painel" href={`#${item.id}`} onClick={fechar}>
                  {item.rotulo}
                </a>
              </li>
            ))}
          </ul>
          <a className="botao botao--ouro cabecalho__cta-painel" href="#orcamento" onClick={fechar}>
            {CTA_ORCAMENTO}
          </a>
          <a className="botao botao--escuro cabecalho__gestao-painel" href="/gestao" onClick={fechar}>
            Entrar na gestão
          </a>
        </nav>
      </div>
    </header>
  );
}
