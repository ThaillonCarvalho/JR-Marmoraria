/**
 * Ícones em SVG inline — sem dependências externas.
 * Traço fino (1.25) para combinar com o ar elegante da marca.
 */

const base = {
  width: 28,
  height: 28,
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

const desenhos = {
  bancada: (
    <>
      <path d="M3 14h26" />
      <path d="M4 14v3h24v-3" />
      <path d="M5 17v10h22V17" />
      <path d="M11 17v10M21 17v10" />
    </>
  ),
  pia: (
    <>
      <path d="M4 15h24a12 12 0 0 1-24 0Z" />
      <path d="M16 11V6a3 3 0 0 1 3-3h2" />
      <path d="M21 3v3" />
      <path d="M9 22v6M23 22v6" />
    </>
  ),
  lavatorio: (
    <>
      <path d="M5 14h22v3a7 7 0 0 1-7 7h-8a7 7 0 0 1-7-7v-3Z" />
      <path d="M13 24v4h6v-4" />
      <path d="M16 11V7a2.5 2.5 0 0 1 2.5-2.5H21" />
    </>
  ),
  ilha: (
    <>
      <path d="M3 13h26v3H3z" />
      <path d="M7 16v11M25 16v11" />
      <path d="M12 19h8v8h-8z" />
    </>
  ),
  balcao: (
    <>
      <path d="M2 15h28" />
      <path d="M4 15v4h24v-4" />
      <path d="M7 19v9M25 19v9" />
      <path d="M7 19h18v3H7z" />
    </>
  ),
  soleira: (
    <>
      <path d="M4 20h24" />
      <path d="M4 20v-4h24v4" />
      <path d="M12 16V8h8v8" />
    </>
  ),
  peitoril: (
    <>
      <path d="M3 19h26v3H3z" />
      <path d="M8 19V8h16v11" />
      <path d="M8 14h16" />
    </>
  ),
  escada: (
    <>
      <path d="M3 27h6v-6h6v-6h6V9h4" />
      <path d="M25 9h4v18h-4" />
      <path d="M3 27h26" />
    </>
  ),
  revestimento: (
    <>
      <path d="M4 5h11v11H4z" />
      <path d="M17 5h11v11H17z" />
      <path d="M4 18h11v9H4z" />
      <path d="M17 18h11v9h-11z" />
    </>
  ),
  instalacao: (
    <>
      <path d="M4 25h24" />
      <path d="M8 25V11l8-5 8 5v14" />
      <path d="M13 25v-6h6v6" />
      <path d="M16 12v4" />
    </>
  ),
  ou: (
    <>
      <path d="M4 27h24" />
      <path d="M8 27V12h16v15" />
      <path d="M4 12h24" />
      <path d="M16 12v15" />
    </>
  ),
  seta: (
    <>
      <path d="M4 16h22" />
      <path d="M20 10l6 6-6 6" />
    </>
  ),
  check: (
    <>
      <path d="M5 16.5 12 23.5 27 8.5" />
    </>
  ),
  alerta: (
    <>
      <path d="M16 4 29 27H3L16 4Z" />
      <path d="M16 13v6" />
      <path d="M16 23h.01" />
    </>
  ),
  copiar: (
    <>
      <path d="M11 5h14a2 2 0 0 1 2 2v16" />
      <path d="M21 5v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <path d="M21 27H7a2 2 0 0 1-2-2v-2" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M16 3a13 13 0 0 0-11.2 19.8L3 29l6.4-1.8A13 13 0 1 0 16 3Z" />
      <path d="M12.5 12.5c0 4 3.5 7.5 7.5 7.5 1 0 1.7-.7 1.7-1.6l-.2-1.3-2.4-.8-1 1.1a8 8 0 0 1-2.9-2.9l1.1-1-.8-2.4-1.3-.2c-.9 0-1.7.7-1.7 1.6Z" />
    </>
  ),
};

export default function Icone({ nome, tamanho = 28, className = '', ...resto }) {
  const desenho = desenhos[nome];
  if (!desenho) return null;
  return (
    <svg {...base} {...resto} width={tamanho} height={tamanho} className={className}>
      {desenho}
    </svg>
  );
}