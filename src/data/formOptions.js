/**
 * Opções dos campos de seleção do formulário de orçamento.
 * Edite aqui para incluir novos tipos de serviço, materiais, etc.
 */

export const TIPOS_SERVICO = [
  'Bancada de cozinha',
  'Pia',
  'Lavatório',
  'Ilha',
  'Balcão',
  'Soleira',
  'Peitoril',
  'Escada',
  'Revestimento',
  'Instalação de mármore e granito',
  'Outro assunto',
];

export const AMBIENTES = [
  'Cozinha',
  'Banheiro',
  'Sala / estar',
  'Corredor / hall',
  'Área externa',
  'Área de serviço',
  'Escada',
  'Outro',
];

export const MATERIAIS = [
  'Mármore',
  'Granito',
  'Outro',
  'Preciso de orientação',
];

export const INSTALACAO = [
  'Sim, quero que instalem',
  'Somente a peça, sem instalação',
  'Ainda não sei — quero orientação',
];

export const PRAZOS = [
  'Urgente',
  'Até 15 dias',
  'Até 30 dias',
  'Sem pressa — só orçamento',
  'Ainda não sei',
];

export const UNIDADES_MEDIDA = ['cm', 'm', 'mm'];

/** Par de campos usado na seção de medidas. */
export const CAMPOS_MEDIDA = [
  { nome: 'comprimento', rotulo: 'Comprimento' },
  { nome: 'largura', rotulo: 'Largura' },
];