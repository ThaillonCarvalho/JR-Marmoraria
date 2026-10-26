import logoMarca from '../assets/logo-jr-marmores-granitos-marca.png';
import logoMarcaClara from '../assets/logo-jr-marmores-granitos-marca-clara.png';
import { EMPRESA } from '../data/company';

/**
 * Logomarca da JR Mármores e Granitos.
 *
 * Usa duas variações geradas a partir do arquivo original em `fotos/`
 * (script `npm run logo`), uma com tinta escura para fundos claros
 * e outra clara para o rodapé escuro. O original nunca é alterado.
 */
export default function Logo({ variante = 'escura', className = '' }) {
  const src = variante === 'clara' ? logoMarcaClara : logoMarca;
  const classes = ['logo', `logo--${variante}`, className].filter(Boolean).join(' ');

  return (
    <img
      className={classes}
      src={src}
      width="353"
      height="265"
      alt={`${EMPRESA.nome} — logomarca`}
      decoding="async"
    />
  );
}