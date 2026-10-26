/**
 * Galeria — "Trabalhos e referências".
 *
 * IMPORTANTE
 * -----------
 * As imagens abaixo são REFERÊNCIAS ILUSTRATIVAS baixadas do Pexels
 * (licença Pexels: uso livre, sem necessidade de atribuição).
 * Elas NÃO são trabalhos da JR Mármores e Granitos.
 *
 * Como trocar pelas fotos reais
 * -----------------------------
 * 1. Coloque a foto em `src/assets/galeria/` com um nome descritivo
 *    (por exemplo: `bancada-cozinha-jr-01.jpg`).
 * 2. Troque o `import` no topo deste arquivo.
 * 3. Atualize `titulo`, `categoria`, `descricao` e `fonte`.
 * 4. Se a foto for da própria JR, apague `fonte` e defina
 *    `referenciaIlustrativa: false` para o selo de "ilustrativa"
 *    desaparecer do item.
 */

import balcaoImg from '../assets/galeria/balcao-marmore.jpg';
import bancadaImg from '../assets/galeria/bancada-cozinha-marmore.jpg';
import escadaImg from '../assets/galeria/escada-marmore.jpg';
import ilhaImg from '../assets/galeria/ilha-marmore.jpg';
import lavatorioImg from '../assets/galeria/lavatorio-marmore.jpg';
import piaImg from '../assets/galeria/pia-em-pedra.jpg';
import revestimentoImg from '../assets/galeria/revestimento-marmore.jpg';
import texturaImg from '../assets/galeria/textura-pedra.jpg';

export const GALERIA = [
  {
    id: 'bancada-cozinha',
    imagem: bancadaImg,
    titulo: 'Bancada de cozinha em mármore',
    categoria: 'Bancadas',
    descricao: 'Superfície contínua com veio marcado e acabamento polido.',
    fonte: {
      autor: 'Max Vakhtbovych',
      origem: 'Pexels',
      url: 'https://www.pexels.com/photo/7533765/',
      licenca: 'Pexels License',
    },
    referenciaIlustrativa: true,
  },
  {
    id: 'pia-em-pedra',
    imagem: piaImg,
    titulo: 'Cuba em pedra com torneira',
    categoria: 'Pias',
    descricao: 'Pia de pedra natural com cuba integrada e borda polida.',
    fonte: {
      autor: 'Max Vakhtbovych',
      origem: 'Pexels',
      url: 'https://www.pexels.com/photo/7535035/',
      licenca: 'Pexels License',
    },
    referenciaIlustrativa: true,
  },
  {
    id: 'lavatorio-marmore',
    imagem: lavatorioImg,
    titulo: 'Lavatório em mármore',
    categoria: 'Lavatórios',
    descricao: 'Bancada de apoio com tampos em pedra para banheiro.',
    fonte: {
      autor: 'Max Vakhtbovych',
      origem: 'Pexels',
      url: 'https://www.pexels.com/photo/7195733/',
      licenca: 'Pexels License',
    },
    referenciaIlustrativa: true,
  },
  {
    id: 'ilha-marmore',
    imagem: ilhaImg,
    titulo: 'Ilha de cozinha em pedra',
    categoria: 'Ilhas',
    descricao: 'Ilha central com tampos de pedra e base sob medida.',
    fonte: {
      autor: 'Curtis Adams',
      origem: 'Pexels',
      url: 'https://www.pexels.com/photo/37153440/',
      licenca: 'Pexels License',
    },
    referenciaIlustrativa: true,
  },
  {
    id: 'escada-marmore',
    imagem: escadaImg,
    titulo: 'Escada em pedra',
    categoria: 'Escadas',
    descricao: 'Degraus em pedra natural com nivelamento e fechamento cuidado.',
    fonte: {
      autor: 'Anastasiia Bilyk',
      origem: 'Pexels',
      url: 'https://www.pexels.com/photo/10945186/',
      licenca: 'Pexels License',
    },
    referenciaIlustrativa: true,
  },
  {
    id: 'balcao-marmore',
    imagem: balcaoImg,
    titulo: 'Balcão com tampo de pedra',
    categoria: 'Balcões',
    descricao: 'Balcão de atendimento com tampo em mármore.',
    fonte: {
      autor: 'Rachel Claire',
      origem: 'Pexels',
      url: 'https://www.pexels.com/photo/5531430/',
      licenca: 'Pexels License',
    },
    referenciaIlustrativa: true,
  },
  {
    id: 'revestimento-marmore',
    imagem: revestimentoImg,
    titulo: 'Revestimento em mármore',
    categoria: 'Revestimentos',
    descricao: 'Painel de parede em pedra com paginação e juntas precisas.',
    fonte: {
      autor: 'Laura Tancredi',
      origem: 'Pexels',
      url: 'https://www.pexels.com/photo/7078686/',
      licenca: 'Pexels License',
    },
    referenciaIlustrativa: true,
  },
  {
    id: 'textura-pedra',
    imagem: texturaImg,
    titulo: 'Veios e textura da pedra',
    categoria: 'Detalhes',
    descricao: 'A diferença entre uma peça e outra está no veio e no desenho.',
    fonte: {
      autor: 'Kaboompics',
      origem: 'Pexels',
      url: 'https://www.pexels.com/photo/6634153/',
      licenca: 'Pexels License',
    },
    referenciaIlustrativa: true,
  },
];

/** Categorias únicas, na ordem em que aparecem. */
export const CATEGORIAS = [...new Set(GALERIA.map((item) => item.categoria))];
