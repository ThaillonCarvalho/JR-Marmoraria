# JR Mármores e Granitos

Página única (landing page) da JR Mármores e Granitos — React + Vite, sem framework de CSS e
sem dependências além de `react` e `react-dom`.

---

## Como executar

```bash
npm install
npm run dev      # http://localhost:5173
```

Para usar a área de gestão em desenvolvimento, execute também `npm run api` em outro terminal.
Abra `http://localhost:5173/gestao`. As credenciais ficam em `.env`, que não é versionado.
Copie `.env.example` e configure `ADMIN_EMAIL`, `ADMIN_PASSWORD` e uma chave aleatória
`SESSION_SECRET` de pelo menos 32 caracteres. O banco é salvo em `data/gestao.sqlite`.
Faça cópias de segurança desse arquivo regularmente.

Para executar a versão completa após `npm run build`, use `npm start` e abra
`http://localhost:3001`. A hospedagem precisa executar o servidor Node e manter o diretório
`data/` persistente; publicar somente `dist/` não disponibiliza a gestão.

### Deploy na Vercel

O projeto está configurado em `vercel.json` para servir a página Vite e a API como função.
Na Vercel, a gestão usa PostgreSQL remoto (Neon) via `DATABASE_URL` ou `POSTGRES_URL`.
Configure também `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `SESSION_SECRET` como variáveis sensíveis
do projeto. O arquivo SQLite local não é usado na Vercel. Para levar os lançamentos locais
ao banco remoto após a primeira inicialização da API, rode
`node scripts/migrate-sqlite-to-postgres.mjs` com a URL do banco no ambiente. A migração
preserva os vínculos entre funcionários, produção, materiais e caixa.

A gestão oferece caixa, compras e consumo de materiais, funcionários, produção semanal
e percentual configurável de reserva. Compras com custo geram saída do caixa; o consumo
é apenas estoque, salvo se você marcar a opção para lançá-lo também no caixa. O valor da
produção não gera automaticamente folha de pagamento. A reserva é um cálculo sobre o
saldo positivo, não uma transferência bancária.

O resumo mostra acessos à página pública e visitantes distintos estimados por navegador,
no total e no dia atual. A contagem usa um cookie próprio e começa após a publicação do
recurso; a área de gestão não entra nas métricas.

Outros comandos:

| Comando             | O que faz                                                          |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | Sobe o servidor de desenvolvimento em `http://localhost:5173`      |
| `npm run build`     | Gera a versão de produção em `dist/`                                |
| `npm run preview`   | Serve localmente o conteúdo de `dist/`                              |
| `npm run logo`      | Regera as variações da logo a partir do arquivo original em `fotos/` |

---

## Onde editar o conteúdo

| Assunto                | Arquivo                        |
| ---------------------- | ------------------------------ |
| Nome, tagline, menus, texto "Nossa história" | `src/data/company.js` |
| Lista de serviços      | `src/data/services.js`         |
| Galeria (fotos e fontes) | `src/data/gallery.js`         |
| Opções do formulário (serviços, materiais, prazos…) | `src/data/formOptions.js` |
| **Número do WhatsApp e demais contatos** | `src/config/contact.js` |
| Ícones SVG             | `src/components/Icons.jsx`      |
| Cores, tipografia, espaçamentos | `src/styles/base.css` (bloco `:root`) |

---

## Configurar o WhatsApp

O número já está configurado em `src/config/contact.js`:

```js
export const CONTATO = {
  whatsapp: '5511951415377',         // 55 + 11 (DDD) + 951415377
  whatsappExibido: '(11) 95141-5377', // como aparece na tela
  email: '',
  cidade: '',
  instagram: '',
};
```

`whatsapp` precisa estar em formato internacional e **somente dígitos** (sem espaço, traço ou `+`).

Com o número preenchido, o botão principal do formulário vira **Enviar pelo WhatsApp** e abre o
atendimento já com a solicitação preenchida. O botão **Copiar solicitação** continua disponível.

Se o campo for apagado, a página volta ao modo "não configurado": mostra o aviso "falta configurar
o contato" e oferece apenas a cópia — sem simular nenhum envio.

O número nunca é escrito direto nos componentes — tudo passa por `src/config/contact.js`.

---

## Trocar as imagens da galeria por fotos reais

As imagens atuais são **referências ilustrativas** do Pexels (Pexels License), com autor e
link registrados item a item. Para substituir:

1. Coloque a foto em `src/assets/galeria/` com nome descritivo (ex.: `bancada-cozinha-jr-01.jpg`).
2. Em `src/data/gallery.js`, troque o `import` e atualize o item:

```js
{
  id: 'bancada-cozinha',
  imagem: minhaFoto,
  titulo: 'Bancada em L para cozinha',
  categoria: 'Bancadas',
  descricao: 'Canto arredondado e cuba de embutir.',
  fonte: undefined,                // sem fonte: é foto da própria JR
  referenciaIlustrativa: false,    // some o selo "Referência ilustrativa"
}
```

O aviso da seção (`AVISO_GALERIA`) e o texto do rodapé também ficam no mesmo arquivo / em
`src/components/Footer.jsx`.

### Imagens usadas em outras seções

| Seção     | Arquivo                                              |
| --------- | ---------------------------------------------------- |
| Hero      | `src/assets/galeria/destaque-cozinha-marmore.jpg` (import em `src/components/Hero.jsx`) |
| História  | import `medidasSobMedida` em `src/data/company.js`    |

---

## Logo

O arquivo original **não é alterado** e permanece em:

```
fotos/Imagem do Codex 26 de set. de 2026, 11_59_40.png
```

Cópia intacta com nome descritivo em `src/assets/logo-jr-marmores-granitos.png`.

As duas variações usadas na página são geradas por `scripts/gerar-variacoes-logo.mjs`
(sem dependências externas — apenas `node:fs` e `node:zlib`) a partir do original:

| Arquivo                                                  | Uso                        |
| -------------------------------------------------------- | -------------------------- |
| `src/assets/logo-jr-marmores-granitos-marca.png`         | Header, seções claras      |
| `src/assets/logo-jr-marmores-granitos-marca-clara.png`   | Rodapé escuro              |

Depois de alterar o original em `fotos/`, rode `npm run logo` para regerar as duas.

---

## Estrutura

```
index.html
vite.config.js
fotos/                      # original (intocado)
scripts/
  gerar-variacoes-logo.mjs  # recorte da logo, sem dependências
src/
  main.jsx
  App.jsx                   # ordem das seções
  assets/
    galeria/                # fotos (substituir pelas reais)
    logo-jr-marmores-granitos*.png
  components/               # Header, Hero, Servicos, Galeria, Historia, Orcamento, Footer, Logo, Icons
  config/contact.js         # WhatsApp e contatos
  data/                     # company, services, gallery, formOptions
  styles/                   # base + um arquivo por seção
```

---

## Acessibilidade e responsividade

- Link "Pular para o conteúdo", `aria-label` nos ícones, `role="alert"` nos erros do formulário.
- Navegação por teclado com foco visível; `Esc` fecha o menu mobile.
- Alvos de toque de no mínimo 48–52 px no celular.
- `prefers-reduced-motion` desliga as animações.
- Sem overflow horizontal; layout testado de 320 px a 1440 px.
