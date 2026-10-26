import { useId, useRef, useState } from 'react';
import {
  CONTATO,
  WHATSAPP_CONFIGURADO,
  linkWhatsApp,
  montarMensagem,
  copiarTexto,
} from '../config/contact';
import {
  TIPOS_SERVICO,
  AMBIENTES,
  MATERIAIS,
  INSTALACAO,
  PRAZOS,
  UNIDADES_MEDIDA,
} from '../data/formOptions';
import Icone from './Icons';
import '../styles/orcamento.css';

const INICIAL = {
  nome: '',
  whatsapp: '',
  email: '',
  cidade: '',
  bairro: '',
  tipoServico: '',
  ambiente: '',
  material: '',
  comprimento: '',
  largura: '',
  unidade: 'cm',
  instalacao: '',
  prazo: '',
  descricao: '',
};

/** Campos obrigatórios, na ordem em que aparecem no formulário. */
const OBRIGATORIOS = ['nome', 'whatsapp', 'cidade', 'bairro', 'tipoServico', 'material', 'instalacao'];

function validar(campos) {
  const erros = {};

  if (!campos.nome.trim()) {
    erros.nome = 'Informe seu nome.';
  } else if (campos.nome.trim().length < 3) {
    erros.nome = 'O nome precisa ter ao menos 3 caracteres.';
  }

  const digitos = campos.whatsapp.replace(/\D/g, '');
  if (!digitos) {
    erros.whatsapp = 'Informe um número de WhatsApp.';
  } else if (digitos.length < 10 || digitos.length > 13) {
    erros.whatsapp = 'Use DDD + número, com 10 ou 11 dígitos.';
  }

  if (campos.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(campos.email.trim())) {
    erros.email = 'Confira o e-mail. O formato não parece válido.';
  }

  if (!campos.cidade.trim()) erros.cidade = 'Informe a cidade.';
  if (!campos.bairro.trim()) erros.bairro = 'Informe o bairro.';
  if (!campos.tipoServico) erros.tipoServico = 'Escolha o tipo de serviço.';
  if (!campos.material) erros.material = 'Escolha o material ou peça orientação.';
  if (!campos.instalacao) erros.instalacao = 'Informe se precisa de instalação.';

  return erros;
}

function Campo({ id, rotulo, obrigatorio, erro, dica, children, className = '' }) {
  return (
    <div className={`campo ${erro ? 'campo--erro' : ''} ${className}`}>
      <label className="campo__rotulo" htmlFor={id}>
        {rotulo}
        {obrigatorio ? (
          <span className="campo__obrigatorio" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="campo__opcional">opcional</span>
        )}
      </label>
      {children}
      {dica && !erro && (
        <p className="campo__dica" id={`${id}-dica`}>
          {dica}
        </p>
      )}
      {erro && (
        <p className="campo__erro" id={`${id}-erro`} role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

export default function Orcamento() {
  const [campos, setCampos] = useState(INICIAL);
  const [erros, setErros] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const avisoRef = useRef(null);
  const uid = useId().replace(/:/g, '');

  const id = (nome) => `${uid}-${nome}`;

  const alterar = (nome) => (evento) => {
    const valor = evento.target.value;
    setCampos((atual) => ({ ...atual, [nome]: valor }));
    if (erros[nome]) {
      setErros((atual) => {
        const proximo = { ...atual };
        delete proximo[nome];
        return proximo;
      });
    }
    setEnviado(false);
    setCopiado(false);
  };

  const aoEnviar = (evento) => {
    evento.preventDefault();
    const novosErros = validar(campos);
    setErros(novosErros);
    setCopiado(false);

    if (Object.keys(novosErros).length > 0) {
      const primeiro = document.getElementById(id(Object.keys(novosErros)[0]));
      primeiro?.focus();
      primeiro?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const texto = montarMensagem(campos);
    setMensagem(texto);

    if (WHATSAPP_CONFIGURADO) {
      window.open(linkWhatsApp(texto), '_blank', 'noopener,noreferrer');
      setEnviado(true);
      return;
    }

    // Sem número configurado: não há envio simulado. A solicitação é montada
    // e o cliente pode copiar o texto para enviar pelo canal que preferir.
    avisoRef.current?.focus();
  };

  const aoCopiar = async () => {
    const texto = mensagem || montarMensagem(campos);
    const ok = await copiarTexto(texto);
    setMensagem(texto);
    setCopiado(ok);
    if (!ok) avisoRef.current?.focus();
  };

  const pendente = OBRIGATORIOS.some((campo) => !campos[campo] || !String(campos[campo]).trim());

  return (
    <section id="orcamento" className="secao orcamento" aria-labelledby="orcamento-titulo">
      <div className="container">
        <header className="cabecalho-secao cabecalho-secao--claro orcamento__cabecalho">
          <p className="etiqueta etiqueta--clara">
            <span className="etiqueta__linha" aria-hidden="true" />
            Orçamento
          </p>
          <h2 className="secao__titulo secao__titulo--claro" id="orcamento-titulo">
            Solicite seu orçamento
          </h2>
          <p className="secao__texto secao__texto--claro">
            Descreva o que você precisa. Não sabe as medidas ou o material? Sem problema —{' '}
            <strong>as medidas são opcionais</strong> e a gente orienta na conversa.
          </p>
        </header>

        <div className="orcamento__grade">
          <form className="formulario" onSubmit={aoEnviar} noValidate>
            <p className="formulario__legenda">
              <span className="campo__obrigatorio" aria-hidden="true">
                *
              </span>{' '}
              campos obrigatórios
            </p>

            <div className="formulario__linha formulario__linha--duas">
              <Campo id={id('nome')} rotulo="Nome" obrigatorio erro={erros.nome}>
                <input
                  id={id('nome')}
                  name="nome"
                  type="text"
                  autoComplete="name"
                  value={campos.nome}
                  onChange={alterar('nome')}
                  aria-invalid={Boolean(erros.nome)}
                  aria-describedby={erros.nome ? `${id('nome')}-erro` : undefined}
                  placeholder="Como podemos te chamar"
                />
              </Campo>

              <Campo
                id={id('whatsapp')}
                rotulo="WhatsApp"
                obrigatorio
                erro={erros.whatsapp}
                dica="Com DDD, para retorno mais rápido."
              >
                <input
                  id={id('whatsapp')}
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={campos.whatsapp}
                  onChange={alterar('whatsapp')}
                  aria-invalid={Boolean(erros.whatsapp)}
                  aria-describedby={
                    erros.whatsapp ? `${id('whatsapp')}-erro` : `${id('whatsapp')}-dica`
                  }
                  placeholder="(00) 00000-0000"
                />
              </Campo>
            </div>

            <div className="formulario__linha formulario__linha--tres">
              <Campo id={id('email')} rotulo="E-mail" erro={erros.email} dica="Só se preferir.">
                <input
                  id={id('email')}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={campos.email}
                  onChange={alterar('email')}
                  aria-invalid={Boolean(erros.email)}
                  aria-describedby={erros.email ? `${id('email')}-erro` : `${id('email')}-dica`}
                  placeholder="voce@email.com"
                />
              </Campo>

              <Campo id={id('cidade')} rotulo="Cidade" obrigatorio erro={erros.cidade}>
                <input
                  id={id('cidade')}
                  name="cidade"
                  type="text"
                  autoComplete="address-level2"
                  value={campos.cidade}
                  onChange={alterar('cidade')}
                  aria-invalid={Boolean(erros.cidade)}
                  aria-describedby={erros.cidade ? `${id('cidade')}-erro` : undefined}
                />
              </Campo>

              <Campo id={id('bairro')} rotulo="Bairro" obrigatorio erro={erros.bairro}>
                <input
                  id={id('bairro')}
                  name="bairro"
                  type="text"
                  autoComplete="address-level3"
                  value={campos.bairro}
                  onChange={alterar('bairro')}
                  aria-invalid={Boolean(erros.bairro)}
                  aria-describedby={erros.bairro ? `${id('bairro')}-erro` : undefined}
                />
              </Campo>
            </div>

            <div className="formulario__linha formulario__linha--duas">
              <Campo
                id={id('tipoServico')}
                rotulo="Tipo de serviço"
                obrigatorio
                erro={erros.tipoServico}
              >
                <select
                  id={id('tipoServico')}
                  name="tipoServico"
                  value={campos.tipoServico}
                  onChange={alterar('tipoServico')}
                  aria-invalid={Boolean(erros.tipoServico)}
                  aria-describedby={erros.tipoServico ? `${id('tipoServico')}-erro` : undefined}
                >
                  <option value="">Selecione…</option>
                  {TIPOS_SERVICO.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo id={id('ambiente')} rotulo="Ambiente" dica="Onde a peça vai ficar.">
                <select
                  id={id('ambiente')}
                  name="ambiente"
                  value={campos.ambiente}
                  onChange={alterar('ambiente')}
                  aria-describedby={`${id('ambiente')}-dica`}
                >
                  <option value="">Selecione…</option>
                  {AMBIENTES.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <Campo id={id('material')} rotulo="Material desejado" obrigatorio erro={erros.material}>
              <select
                id={id('material')}
                name="material"
                value={campos.material}
                onChange={alterar('material')}
                aria-invalid={Boolean(erros.material)}
                aria-describedby={erros.material ? `${id('material')}-erro` : undefined}
              >
                <option value="">Selecione…</option>
                {MATERIAIS.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </Campo>

            <fieldset className="medidas">
              <legend className="medidas__legenda">
                Medidas aproximadas
                <span className="campo__opcional">opcional</span>
              </legend>
              <p className="medidas__dica">
                Não sabe ainda? Deixe em branco — o orçamento sai com a medida certa na conversa.
              </p>
              <div className="medidas__linha">
                <div className="campo medidas__campo">
                  <label className="campo__rotulo" htmlFor={id('comprimento')}>
                    Comprimento
                  </label>
                  <input
                    id={id('comprimento')}
                    name="comprimento"
                    type="text"
                    inputMode="decimal"
                    value={campos.comprimento}
                    onChange={alterar('comprimento')}
                    placeholder="Ex.: 2,40"
                  />
                </div>

                <span className="medidas__x" aria-hidden="true">
                  ×
                </span>

                <div className="campo medidas__campo">
                  <label className="campo__rotulo" htmlFor={id('largura')}>
                    Largura
                  </label>
                  <input
                    id={id('largura')}
                    name="largura"
                    type="text"
                    inputMode="decimal"
                    value={campos.largura}
                    onChange={alterar('largura')}
                    placeholder="Ex.: 0,65"
                  />
                </div>

                <div className="campo medidas__campo medidas__campo--unidade">
                  <label className="campo__rotulo" htmlFor={id('unidade')}>
                    Unidade
                  </label>
                  <select
                    id={id('unidade')}
                    name="unidade"
                    value={campos.unidade}
                    onChange={alterar('unidade')}
                  >
                    {UNIDADES_MEDIDA.map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {unidade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            <div className="formulario__linha formulario__linha--duas">
              <Campo
                id={id('instalacao')}
                rotulo="Necessidade de instalação"
                obrigatorio
                erro={erros.instalacao}
              >
                <select
                  id={id('instalacao')}
                  name="instalacao"
                  value={campos.instalacao}
                  onChange={alterar('instalacao')}
                  aria-invalid={Boolean(erros.instalacao)}
                  aria-describedby={erros.instalacao ? `${id('instalacao')}-erro` : undefined}
                >
                  <option value="">Selecione…</option>
                  {INSTALACAO.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo id={id('prazo')} rotulo="Prazo desejado">
                <select
                  id={id('prazo')}
                  name="prazo"
                  value={campos.prazo}
                  onChange={alterar('prazo')}
                >
                  <option value="">Selecione…</option>
                  {PRAZOS.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <Campo
              id={id('descricao')}
              rotulo="Descrição do projeto"
              dica="O que você imagina fazer, e onde."
            >
              <textarea
                id={id('descricao')}
                name="descricao"
                rows={5}
                value={campos.descricao}
                onChange={alterar('descricao')}
                aria-describedby={`${id('descricao')}-dica`}
                placeholder="Ex.: bancada em L para cozinha, com canto arredondado e uma cuba de embutir."
              />
            </Campo>

            <div className="formulario__acoes">
              <button type="submit" className="botao botao--ouro botao--grande">
                {WHATSAPP_CONFIGURADO ? 'Enviar pelo WhatsApp' : 'Gerar solicitação'}
                <Icone nome="seta" tamanho={20} className="botao__icone" />
              </button>
              <p className="formulario__nota">
                Campos com <span className="campo__obrigatorio">*</span> são obrigatórios. As medidas
                são opcionais.
              </p>
            </div>
          </form>

          <aside className="orcamento__lateral" aria-label="Resumo da solicitação">
            <div className="resumo">
              <h3 className="resumo__titulo">Sua solicitação</h3>

              {!WHATSAPP_CONFIGURADO && (
                <p className="resumo__aviso">
                  <Icone nome="alerta" tamanho={20} className="resumo__aviso-icone" />
                  <span>
                    <strong>Falta configurar o contato.</strong> O número do WhatsApp da JR ainda não
                    foi definido, então este site não envia nada por enquanto. Gere a solicitação,
                    copie o texto e envie pelo canal que preferir.
                  </span>
                </p>
              )}

              <div
                ref={avisoRef}
                tabIndex={-1}
                className="resumo__area"
                role="region"
                aria-live="polite"
                aria-label="Prévia da solicitação"
              >
                {mensagem ? (
                  <pre className="resumo__texto">{mensagem}</pre>
                ) : (
                  <p className="resumo__vazio">
                    A prévia da sua solicitação aparece aqui depois que você preenche os campos
                    obrigatórios e clica no botão.
                  </p>
                )}
              </div>

              <div className="resumo__acoes">
                {/* O link só aparece depois que a mensagem foi montada, para
                    nunca abrir o WhatsApp com o texto vazio. */}
                {WHATSAPP_CONFIGURADO && mensagem && (
                  <a
                    className="botao botao--contorno-claro botao--bloco"
                    href={linkWhatsApp(mensagem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setEnviado(true)}
                  >
                    <Icone nome="whatsapp" tamanho={20} />
                    Abrir WhatsApp com a mensagem
                  </a>
                )}

                <button type="button" className="botao botao--fantasma botao--bloco" onClick={aoCopiar}>
                  <Icone nome="copiar" tamanho={20} />
                  {copiado ? 'Solicitação copiada' : 'Copiar solicitação'}
                </button>
              </div>

              {copiado && (
                <p className="resumo__confirmacao" role="status">
                  <Icone nome="check" tamanho={18} />
                  Texto copiado. Cole no WhatsApp, e-mail ou onde preferir.
                </p>
              )}

              {enviado && WHATSAPP_CONFIGURADO && (
                <p className="resumo__confirmacao" role="status">
                  <Icone nome="check" tamanho={18} />
                  Mensagem aberta no WhatsApp.
                </p>
              )}

              {CONTATO.whatsappExibido && (
                <p className="resumo__contato">
                  WhatsApp: <strong>{CONTATO.whatsappExibido}</strong>
                </p>
              )}

              {pendente && (
                <p className="resumo__rodape">
                  O resumo é gerado no seu navegador. Nenhum dado é enviado ou gravado por este site.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}