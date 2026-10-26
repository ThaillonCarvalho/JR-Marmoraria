import Header from './components/Header';
import Hero from './components/Hero';
import Servicos from './components/Servicos';
import Galeria from './components/Galeria';
import Historia from './components/Historia';
import Orcamento from './components/Orcamento';
import Footer from './components/Footer';
import Gestao from './components/Gestao';
import './styles/base.css';

let visitRecorded = false;

export default function App() {
  useEffect(() => {
    if (window.location.pathname.replace(/\/$/, '') === '/gestao' || visitRecorded) return;
    visitRecorded = true;
    fetch('/api/visit', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(() => {});
  }, []);
  if (window.location.pathname.replace(/\/$/, '') === '/gestao') return <Gestao />;
  return (
    <div id="topo" className="pagina">
      <Header />
      <main id="conteudo">
        <Hero />
        <Servicos />
        <Galeria />
        <Historia />
        <Orcamento />
      </main>
      <Footer />
    </div>
  );
}
import { useEffect } from 'react';
