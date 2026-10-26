/**
 * Informações institucionais da JR Mármores e Granitos.
 *
 * Apenas dados confirmados pelo cliente. Nada de telefones, endereços,
 * clientes, números de obras ou certificações que não tenham sido fornecidos.
 */

import medidasSobMedida from '../assets/galeria/medidas-sob-medida.jpg';

export const EMPRESA = {
  nome: 'JR Mármores e Granitos',
  nomeCurto: 'JR',
  /** Frase curta usada no cabeçalho e no rodapé. */
  assinatura: 'Mármores e Granitos sob medida',
  /** Título principal (Hero). */
  titulo: 'JR Mármores e Granitos',
  /** Chamada de apoio do Hero. */
  chamada:
    'Trabalhos sob medida em mármore e granito, com cuidado no acabamento e na execução de cada detalhe.',
  descricao:
    'Bancadas, pias, lavatórios, ilhas, balcões, soleiras, peitoris, escadas, revestimentos e instalação em mármore e granito. Execução sob medida com Julio, mais de 25 anos de profissão.',
  fundacao: null,
  /** Palavras-chave para a descrição da página. */
  palavrasChave: 'marmoraria, mármore, granito, bancadas sob medida, pias de pedra, Marmoraria JR',
};

/** Navegação do header. `id` aponta para a âncora da seção na mesma página. */
export const NAVEGACAO = [
  { id: 'servicos', rotulo: 'Serviços' },
  { id: 'trabalhos', rotulo: 'Trabalhos' },
  { id: 'historia', rotulo: 'Nossa história' },
  { id: 'orcamento', rotulo: 'Orçamento' },
];

export const CTA_ORCAMENTO = 'Solicitar orçamento';

/** Seção "Nossa história". */
export const HISTORIA = {
  eyebrow: 'Nossa história',
  titulo: 'Mais de 25 anos de profissão',
  responsavel: 'Julio',
  cargo: 'Proprietário e instalador',
  paragrafos: [
    'São mais de 25 anos trabalhando com pedra. Nesse tempo, o trabalho foi se lapidando até chegar aqui: uma marmoraria pequena, com cara de oficina, onde cada peça é medida, recortada e instalada com atenção aos detalhes que só aparecem quando a pedra está no lugar.',
    'Julio acompanha de perto a primeira medida até o acabamento final. Isso significa que existe uma única pessoa responsável pelo projeto — e ela conhece o material, entende o desenho e conversa com você antes de cortar.',
    'A proposta é simples: trabalho bem acabado, prazo combinado e uma conversa direta. Nada de surpresa no meio da obra. Cada bancada, pia ou escada é feita sob medida, pensando em como vai ser usada todos os dias.',
  ],
  /** Destaques curtos exibidos como cartões ao lado do texto. */
  destaques: [
    {
      titulo: 'Experiência',
      texto: 'Mais de 25 anos de profissão com mármore e granito, do recorte ao acabamento.',
    },
    {
      titulo: 'Acabamento',
      texto: 'Cuidado com o detalhe final: arestas, emendas, brilho e limpeza da obra.',
    },
    {
      titulo: 'Proximidade',
      texto: 'Você fala direto com quem executa o trabalho, do orçamento à instalação.',
    },
  ],
  imagem: {
    src: medidasSobMedida,
    alt: 'Medição de bancada em pedra durante a execução de um projeto sob medida.',
    credito: {
      autor: 'Los Muertos Crew',
      fonte: 'Pexels',
      url: 'https://www.pexels.com/photo/8853469/',
      licenca: 'Pexels License',
      referenciaIlustrativa: true,
    },
  },
};