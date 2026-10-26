/**
 * Configuração de contato da JR Mármores e Granitos.
 *
 * ---------------------------------------------------------------
 * WHATSAPP
 * ---------------------------------------------------------------
 * O número que recebe as solicitações está em `CONTATO.whatsapp`,
 * em formato internacional e somente números (sem espaço, sem traço, sem "+").
 * Nada de número é escrito direto nos componentes.
 *
 * Se o campo for apagado, a página volta ao modo "não configurado":
 * o formulário apenas monta o texto e oferece a opção de copiar,
 * sem simular nenhum envio.
 */

export const CONTATO = {
  /**
   * Número do WhatsApp em formato internacional, somente dígitos.
   * 55 (Brasil) + 11 (DDD) + 951415377
   */
  whatsapp: '5511951415377',

  /** Número exibido ao cliente (apenas apresentação). */
  whatsappExibido: '(11) 95141-5377',

  /** E-mail de contato. Vazio enquanto não houver um endereço real. */
  email: '',

  /** Cidade/região de atendimento. Vazio enquanto não houver informação real. */
  cidade: '',

  /** Redes sociais. Mantidas vazias até serem preenchidas. */
  instagram: '',
};

/** true apenas quando existe um número de WhatsApp utilizável. */
export const WHATSAPP_CONFIGURADO = /^\d{8,15}$/.test(CONTATO.whatsapp);

/**
 * Monta a mensagem de WhatsApp com os dados do formulário.
 * Mantém a ordem dos campos para a leitura ser fácil no celular.
 */
export function montarMensagem(dados) {
  const linhas = [
    'Olá! Gostaria de um orçamento com a JR Mármores e Granitos.',
    '',
    `*Nome:* ${dados.nome}`,
    `*WhatsApp:* ${dados.whatsapp}`,
  ];

  if (dados.email) linhas.push(`*E-mail:* ${dados.email}`);

  linhas.push(`*Cidade:* ${dados.cidade}`);
  linhas.push(`*Bairro:* ${dados.bairro}`);
  linhas.push(`*Tipo de serviço:* ${dados.tipoServico}`);

  if (dados.ambiente) linhas.push(`*Ambiente:* ${dados.ambiente}`);
  if (dados.material) linhas.push(`*Material desejado:* ${dados.material}`);

  const medidas = formatarMedidas(dados);
  if (medidas) linhas.push(`*Medidas aproximadas:* ${medidas}`);

  if (dados.instalacao) linhas.push(`*Instalação:* ${dados.instalacao}`);
  if (dados.prazo) linhas.push(`*Prazo desejado:* ${dados.prazo}`);
  if (dados.descricao) linhas.push('', `*Descrição do projeto:* ${dados.descricao}`);

  return linhas.join('\n');
}

function formatarMedidas({ comprimento, largura, unidade }) {
  const preenchido = (valor) => valor !== '' && valor !== null && valor !== undefined;
  const temComprimento = preenchido(comprimento);
  const temLargura = preenchido(largura);

  if (!temComprimento && !temLargura) return '';
  if (temComprimento && temLargura) return `${comprimento} ${unidade} × ${largura} ${unidade}`;
  if (temComprimento) return `${comprimento} ${unidade} (comprimento)`;
  return `${largura} ${unidade} (largura)`;
}

/** Link do WhatsApp com a mensagem já preenchida. */
export function linkWhatsApp(mensagem) {
  return `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

/** Copia texto para a área de transferência, com alternativa para navegadores antigos. */
export async function copiarTexto(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // segue para o método alternativo
  }
  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}