/**
 * Gera as variações de exibição da logo a partir do arquivo original
 * (src/assets/logo-jr-marmores-granitos.png), que é uma cópia intacta da
 * imagem fornecida na pasta /fotos.
 *
 * A imagem original é quadrada (1254x1254), não tem transparência e traz,
 * além do monograma "JR", a assinatura em texto e uma faixa fotográfica na
 * parte inferior. O fundo também não é uniforme (há um leve gradiente e
 * pequenos ruídos), então um simples recorte não funcionaria bem sobre um
 * cabeçalho claro nem sobre um rodapé escuro.
 *
 * Por isso este script, sem nenhuma dependência externa (só node:fs e
 * node:zlib):
 *   1. recorta a faixa vertical do monograma;
 *   2. estima o nível do papel com um filtro de máximo (janela grande);
 *   3. converte "quanto o pixel é mais escuro que o papel" em transparência,
 *      descartando manchas isoladas (ruído) e preservando bordas suaves.
 *
 * Saídas (PNG com alfa, já no tamanho final exibido):
 *   - logo-jr-marmores-granitos-marca.png       (tinta grafite/azul, fundos claros)
 *   - logo-jr-marmores-granitos-marca-clara.png (tinta clara, fundos escuros)
 *
 * Uso: node scripts/gerar-variacoes-logo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEM = path.join(RAIZ, 'src', 'assets', 'logo-jr-marmores-granitos.png');
const DESTINO = path.join(RAIZ, 'src', 'assets');

/** Faixa vertical (px) do monograma na imagem original de 1254x1254. */
const FAIXA = { topo: 140, base: 720 };
/** Raio (px) da janela do filtro de máximo que estima o nível do papel. */
const RAIO_PAPEL = 50;
/** Contraste (em luminância) que vira transparência total -> opacidade total. */
const CONTRASTE_INICIO = 50;
const CONTRASTE_FIM = 95;
/** Fração da maior mancha que uma mancha precisa ter para fazer parte da marca. */
const FRACAO_DA_MAIOR = 0.2;
/** Margem (px) ao redor do conteúdo encontrado. */
const MARGEM = 10;
/** Largura máxima (px) para não gerar um PNG maior do que o necessário. */
const LARGURA_MAXIMA = 512;

/** Tinta de cada variante gerada. */
const VARIANTES = [
  { arquivo: 'logo-jr-marmores-granitos-marca.png', tinta: [16, 32, 66] },
  { arquivo: 'logo-jr-marmores-granitos-marca-clara.png', tinta: [247, 245, 241] },
];

// ------------------------------------------------------------------ PNG: leitura
function tabelaCrc() {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
}

function lerPng(arquivo) {
  const buf = fs.readFileSync(arquivo);
  let pos = 8;
  let ihdr = null;
  const idat = [];
  while (pos < buf.length) {
    const tamanho = buf.readUInt32BE(pos);
    const tipo = buf.toString('ascii', pos + 4, pos + 8);
    const dados = buf.subarray(pos + 8, pos + 8 + tamanho);
    if (tipo === 'IHDR') {
      ihdr = {
        largura: dados.readUInt32BE(0),
        altura: dados.readUInt32BE(4),
        profundidade: dados[8],
        tipoCor: dados[9],
        entrelacado: dados[12],
      };
    } else if (tipo === 'IDAT') {
      idat.push(dados);
    } else if (tipo === 'IEND') {
      break;
    }
    pos += 12 + tamanho;
  }
  if (!ihdr) throw new Error('PNG sem cabeçalho IHDR');
  if (ihdr.profundidade !== 8 || ihdr.entrelacado !== 0 || ![2, 6].includes(ihdr.tipoCor)) {
    throw new Error(`PNG não suportado (profundidade ${ihdr.profundidade}, tipo de cor ${ihdr.tipoCor})`);
  }
  const canais = ihdr.tipoCor === 6 ? 4 : 3;
  const bruto = zlib.inflateSync(Buffer.concat(idat));
  const bpp = canais;
  const bytesLinha = ihdr.largura * bpp;
  const pixels = Buffer.alloc(bytesLinha * ihdr.altura);
  let ri = 0;
  for (let y = 0; y < ihdr.altura; y++) {
    const filtro = bruto[ri++];
    const linha = bruto.subarray(ri, ri + bytesLinha);
    ri += bytesLinha;
    const base = y * bytesLinha;
    for (let x = 0; x < bytesLinha; x++) {
      const a = x >= bpp ? pixels[base + x - bpp] : 0;
      const b = y > 0 ? pixels[base - bytesLinha + x] : 0;
      const c = x >= bpp && y > 0 ? pixels[base - bytesLinha + x - bpp] : 0;
      let v = linha[x];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b;
      else if (filtro === 3) v += (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      pixels[base + x] = v & 0xff;
    }
  }
  return { largura: ihdr.largura, altura: ihdr.altura, canais, pixels };
}

// ----------------------------------------------------------------- PNG: escrita
function escreverPng({ largura, altura, rgba }) {
  const tabela = tabelaCrc();
  const partes = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])];
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = tabela[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const escrever = (tipo, dados) => {
    const cabecalho = Buffer.alloc(8);
    cabecalho.writeUInt32BE(dados.length, 0);
    cabecalho.write(tipo, 4, 'ascii');
    const controle = Buffer.alloc(4);
    controle.writeUInt32BE(crc(Buffer.concat([cabecalho.subarray(4), dados])), 0);
    partes.push(cabecalho, dados, controle);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  escrever('IHDR', ihdr);
  const bruto = Buffer.alloc((largura * 4 + 1) * altura);
  for (let y = 0; y < altura; y++) {
    bruto[y * (largura * 4 + 1)] = 0; // filtro "none"
    rgba.copy(bruto, y * (largura * 4 + 1) + 1, y * largura * 4, (y + 1) * largura * 4);
  }
  escrever('IDAT', zlib.deflateSync(bruto, { level: 9 }));
  escrever('IEND', Buffer.alloc(0));
  return Buffer.concat(partes);
}

// ------------------------------------------------------------------ processamento
function luminancia(p, i) {
  return 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
}

/** Filtro de máximo separável (janela 2r+1) usado para estimar o papel. */
function filtroMaximo(entrada, largura, altura, raio) {
  const temporario = new Float32Array(largura * altura);
  for (let y = 0; y < altura; y++) {
    const linha = y * largura;
    for (let x = 0; x < largura; x++) {
      let max = 0;
      const fim = Math.min(largura - 1, x + raio);
      for (let k = Math.max(0, x - raio); k <= fim; k++) if (entrada[linha + k] > max) max = entrada[linha + k];
      temporario[linha + x] = max;
    }
  }
  const saida = new Float32Array(largura * altura);
  for (let x = 0; x < largura; x++) {
    for (let y = 0; y < altura; y++) {
      let max = 0;
      const fim = Math.min(altura - 1, y + raio);
      for (let k = Math.max(0, y - raio); k <= fim; k++) if (temporario[k * largura + x] > max) max = temporario[k * largura + x];
      saida[y * largura + x] = max;
    }
  }
  return saida;
}

/** Rotula manchas conexas e mantém só as do tamanho da marca. */
function removerManchas(mask, largura, altura, fracaoDaMaior) {
  const rotulos = new Int32Array(largura * altura).fill(-1);
  const pilha = new Int32Array(largura * altura);
  const areas = [];
  for (let inicio = 0; inicio < mask.length; inicio++) {
    if (!mask[inicio] || rotulos[inicio] >= 0) continue;
    const id = areas.length;
    let topo = 0;
    pilha[topo++] = inicio;
    rotulos[inicio] = id;
    let area = 0;
    while (topo > 0) {
      const p = pilha[--topo];
      area++;
      const x = p % largura;
      if (x > 0 && mask[p - 1] && rotulos[p - 1] < 0) { rotulos[p - 1] = id; pilha[topo++] = p - 1; }
      if (x < largura - 1 && mask[p + 1] && rotulos[p + 1] < 0) { rotulos[p + 1] = id; pilha[topo++] = p + 1; }
      if (p >= largura && mask[p - largura] && rotulos[p - largura] < 0) { rotulos[p - largura] = id; pilha[topo++] = p - largura; }
      if (p + largura < mask.length && mask[p + largura] && rotulos[p + largura] < 0) { rotulos[p + largura] = id; pilha[topo++] = p + largura; }
    }
    areas.push(area);
  }
  const corte = Math.max(1, areas.reduce((a, b) => Math.max(a, b), 0) * fracaoDaMaior);
  const resultado = new Uint8Array(largura * altura);
  for (let i = 0; i < rotulos.length; i++) {
    const id = rotulos[i];
    resultado[i] = id >= 0 && areas[id] >= corte ? 1 : 0;
  }
  console.log(`  manchas: ${areas.length} | corte em ${Math.round(corte)} px | mantidas: ${areas.filter((a) => a >= corte).length}`);
  return resultado;
}

/** Reduz por média de blocos (fator inteiro), preservando a proporção. */
function reduzir(rgba, largura, altura, fator) {
  if (fator <= 1) return { rgba, largura, altura };
  const l = Math.floor(largura / fator);
  const a = Math.floor(altura / fator);
  const saida = Buffer.alloc(l * a * 4);
  for (let y = 0; y < a; y++) {
    for (let x = 0; x < l; x++) {
      let r = 0, g = 0, b = 0, al = 0, n = 0;
      for (let dy = 0; dy < fator; dy++) {
        for (let dx = 0; dx < fator; dx++) {
          const o = ((y * fator + dy) * largura + (x * fator + dx)) * 4;
          r += rgba[o]; g += rgba[o + 1]; b += rgba[o + 2]; al += rgba[o + 3]; n++;
        }
      }
      const o = (y * l + x) * 4;
      saida[o] = Math.round(r / n);
      saida[o + 1] = Math.round(g / n);
      saida[o + 2] = Math.round(b / n);
      saida[o + 3] = Math.round(al / n);
    }
  }
  return { rgba: saida, largura: l, altura: a };
}

function main() {
  if (!fs.existsSync(ORIGEM)) {
    console.error(`Arquivo de origem não encontrado: ${ORIGEM}`);
    process.exit(1);
  }
  const img = lerPng(ORIGEM);
  const { largura: W, canais, pixels: px } = img;
  const y0 = FAIXA.topo;
  const y1 = Math.min(img.altura, FAIXA.base);
  const bw = W;
  const bh = y1 - y0;

  const lum = new Float32Array(bw * bh);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) lum[y * bw + x] = luminancia(px, ((y + y0) * W + x) * canais);
  }
  const papel = filtroMaximo(lum, bw, bh, RAIO_PAPEL);
  const contraste = new Float32Array(bw * bh);
  for (let i = 0; i < contraste.length; i++) contraste[i] = papel[i] - lum[i];

  const nucleo = new Uint8Array(bw * bh);
  for (let i = 0; i < nucleo.length; i++) nucleo[i] = contraste[i] > CONTRASTE_FIM ? 1 : 0;
  const marca = removerManchas(nucleo, bw, bh, FRACAO_DA_MAIOR);

  let minX = bw;
  let maxX = -1;
  let minY = bh;
  let maxY = -1;
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      if (!marca[y * bw + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) {
    console.error('Nenhuma marca encontrada na faixa do monograma.');
    process.exit(1);
  }
  minX = Math.max(0, minX - MARGEM);
  maxX = Math.min(bw - 1, maxX + MARGEM);
  minY = Math.max(0, minY - MARGEM);
  maxY = Math.min(bh - 1, maxY + MARGEM);

  const largura = maxX - minX + 1;
  const altura = maxY - minY + 1;
  const amplitude = CONTRASTE_FIM - CONTRASTE_INICIO;

  console.log(`Origem .........: ${path.relative(RAIZ, ORIGEM)} (${W}x${img.altura})`);
  console.log(`Faixa analisada : y ${y0}-${y1}`);
  console.log(`Recorte ........: x ${minX}-${maxX} | y ${y0 + minY}-${y0 + maxY} (${largura}x${altura})`);

  for (const variante of VARIANTES) {
    const rgba = Buffer.alloc(largura * altura * 4);
    for (let y = 0; y < altura; y++) {
      for (let x = 0; x < largura; x++) {
        // `marca`, `contraste` e `lum` estão no sistema de coordenadas da faixa (bw x bh)
        const p = (y + minY) * bw + (x + minX);
        const i = ((y + y0 + minY) * W + (x + minX)) * canais;
        const o = (y * largura + x) * 4;
        let alfa = 0;
        if (marca[p]) {
          alfa = Math.min(1, Math.max(0, (contraste[p] - CONTRASTE_INICIO) / amplitude));
        }
        // nas bordas a cor original é puxada para a tinta da variante,
        // evitando halo claro sobre fundos escuros (e o contrário)
        const puxa = (1 - alfa) * 0.85;
        rgba[o] = Math.round(px[i] * (1 - puxa) + variante.tinta[0] * puxa);
        rgba[o + 1] = Math.round(px[i + 1] * (1 - puxa) + variante.tinta[1] * puxa);
        rgba[o + 2] = Math.round(px[i + 2] * (1 - puxa) + variante.tinta[2] * puxa);
        rgba[o + 3] = Math.round(alfa * 255);
      }
    }
    const fator = Math.max(1, Math.ceil(largura / LARGURA_MAXIMA));
    const saida = reduzir(rgba, largura, altura, fator);
    fs.writeFileSync(path.join(DESTINO, variante.arquivo), escreverPng(saida));
    console.log(`Gerado .........: src/assets/${variante.arquivo} (${saida.largura}x${saida.altura}, ${(saida.largura / saida.altura).toFixed(2)}:1)`);
  }
}

main();