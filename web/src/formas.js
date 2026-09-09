/**
 * Onde cada uma das 58 marcas fica, em cada fase da narrativa.
 *
 * Aqui não há React nem cor: só geometria. Cada fase devolve um mapa
 * `id -> marca`, e a marca é sempre a mesma coisa — um segmento de reta com
 * espessura. É ele que o framer-motion interpola de uma fase para a seguinte, e
 * é o que segura a promessa da narrativa: a marca do bicho é sempre a mesma
 * marca, mesmo quando o gráfico inteiro muda de tipo.
 *
 * Segmento, e não retângulo, por um motivo prático: com ponta arredondada, um
 * segmento de comprimento zero já é um ponto, e um segmento inclinado já é um
 * raio da roda. Nenhuma fase precisa de rotação, e nenhuma precisa que a marca
 * seja montada de novo — o que interpola são quatro números e uma espessura.
 * (Rotacionar era o caminho óbvio e não funciona: o framer-motion reescreve o
 * `transform-origin` do elemento e a roda sai do lugar.)
 *
 * Como a ponta é arredondada, as pontas são recolhidas em meia espessura: o que
 * o olho vê começa e termina exatamente no valor medido, não meio traço adiante.
 */

export const VB = { w: 600, h: 760 };

const M = { esq: 58, dir: 30, topo: 34, baixo: 52 };
const PW = VB.w - M.esq - M.dir;
const PH = VB.h - M.topo - M.baixo;

export const AREA = { ...M, largura: PW, altura: PH };
export const CENTRO = { x: M.esq + PW / 2, y: M.topo + PH / 2 };

const DIA = 24;
const trava = (t) => Math.min(1, Math.max(0, t));

/** Horas viram largura na régua deitada de 24h. */
export const horas = (h) => (h / DIA) * PW;
/** Horas viram altura: mais sono, mais alto. */
export const alturaDeSono = (h) => M.topo + PH - (h / DIA) * PH;
/** Risco 1 embaixo… não: risco 1 em cima, para o olho descer com o perigo. */
export const alturaDeRisco = (r) => M.topo + PH * 0.07 + ((r - 1) / 4) * PH * 0.86;

/** O peso vai de 5 g a 6,6 t: a régua é logarítmica ou vira um ponto e um traço. */
export function escalaPeso(especies) {
  const vs = especies.map((e) => e.log_peso);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  return (v) => M.esq + ((v - min) / (max - min)) * PW;
}

/** Um segmento deitado que ocupa exatamente [inicio, fim] depois das pontas. */
function deitado(inicio, fim, y, esp) {
  const meio = esp / 2;
  const cabe = fim - inicio > esp;
  const x1 = cabe ? inicio + meio : (inicio + fim) / 2;
  const x2 = cabe ? fim - meio : (inicio + fim) / 2;
  return { x1, y1: y, x2, y2: y, esp };
}

const ponto = (x, y, d) => ({ x1: x, y1: y, x2: x, y2: y, esp: d });

const marca = (o) => ({
  x1: 0, y1: 0, x2: 0, y2: 0, esp: 0, op: 1,
  seg: null, conector: null, trilho: null, alvo: null,
  ...o,
});

function ordenar(especies, campo) {
  return [...especies].sort((a, b) => {
    const va = a[campo], vb = b[campo];
    if (va == null) return 1;
    if (vb == null) return -1;
    return vb - va;
  });
}

/**
 * O rótulo sai à direita da marca; se o nome não couber até a borda do quadro,
 * vira para a esquerda e passa por cima do próprio desenho — por isso o texto
 * ganha contorno da cor do fundo em `estilos.css`.
 */
export function rotulo(x, y, especie) {
  const largura = (especie.pt.length + 9) * 6.4;
  const cabeADireita = x + 11 + largura <= VB.w - 6;
  return {
    x: x + (cabeADireita ? 11 : -11),
    y: y + 4,
    ancora: cabeADireita ? "start" : "end",
  };
}

/** Fase 1 — o dia deitado: 58 faixas coladas, sem coluna de rótulo nem de horas. */
function faixa(especies, secao) {
  const ord = ordenar(especies, secao.ordem);
  const passo = PH / ord.length;
  const esp = Math.max(2.4, passo - 0.9);
  const mapa = {};
  ord.forEach((e, i) => {
    const y = M.topo + i * passo + passo / 2;
    const fim = M.esq + horas(e.sono);
    mapa[e.id] = marca({
      ...deitado(M.esq, fim, y, esp),
      trilho: deitado(M.esq, M.esq + PW, y, esp),
      alvo: rotulo(fim, y, e),
    });
  });
  return mapa;
}

/** Fase 2 — a faixa vira ponto e voa para a nuvem peso × sono. */
function dispersao(especies) {
  const px = escalaPeso(especies);
  const d = 11;
  const mapa = {};
  especies.forEach((e) => {
    const x = px(e.log_peso);
    const y = alturaDeSono(e.sono);
    mapa[e.id] = marca({ ...ponto(x, y, d), alvo: rotulo(x + d / 2, y, e) });
  });
  return mapa;
}

/**
 * Enxame de verdade: o ponto só sai do centro da coluna se já houver alguém
 * ocupando aquela altura. Deslocar todo mundo por uma fórmula fixa desenharia
 * diagonais que os dados não têm.
 */
function espalhar(grupo, centro, alturaDe, d) {
  const postos = [];
  return grupo.map((e) => {
    const y = alturaDe(e);
    let k = 0;
    let dx = 0;
    for (;;) {
      dx = Math.ceil(k / 2) * (k % 2 === 0 ? 1 : -1) * (d + 1.5);
      const colide = postos.some(
        (p) => Math.abs(p.y - y) < d && Math.abs(p.dx - dx) < d
      );
      if (!colide) break;
      k++;
    }
    postos.push({ y, dx });
    return { e, x: centro + dx, y };
  });
}

/** Fase 3 — os mesmos pontos se juntam em cinco colunas de risco. */
function enxame(especies) {
  const colW = PW / 5;
  const d = 11;
  const mapa = {};
  for (let r = 1; r <= 5; r++) {
    const grupo = ordenar(especies.filter((e) => e.risco === r), "sono");
    const centro = M.esq + (r - 0.5) * colW;
    espalhar(grupo, centro, (e) => alturaDeSono(e.sono), d).forEach(({ e, x, y }) => {
      mapa[e.id] = marca({ ...ponto(x, y, d), alvo: rotulo(x + d / 2, y, e) });
    });
  }
  return mapa;
}

/** Fase 4 — peso contra risco: se fossem a mesma coisa, haveria diagonal. */
function dispersaoRisco(especies) {
  const px = escalaPeso(especies);
  const d = 11;
  const mapa = {};
  for (let r = 1; r <= 5; r++) {
    const grupo = ordenar(especies.filter((e) => e.risco === r), "log_peso");
    grupo.forEach((e, k) => {
      const x = px(e.log_peso);
      const y = alturaDeRisco(r) + (((k % 5) - 2) * PH) / 52;
      mapa[e.id] = marca({ ...ponto(x, y, d), alvo: rotulo(x + d / 2, y, e) });
    });
  }
  return mapa;
}

/** Fase 5 — halteres: o vão entre o ponto e a ponta clara é o sonho. */
function halteres(especies, secao) {
  const ord = ordenar(especies, secao.ordem);
  const passo = PH / ord.length;
  const d = Math.min(9, passo - 1.2);
  const mapa = {};
  ord.forEach((e, i) => {
    const y = M.topo + i * passo + passo / 2;
    const xTotal = M.esq + horas(e.sono);
    const medido = e.sonho != null && e.profundo != null;
    if (!medido) {
      mapa[e.id] = marca({ ...ponto(xTotal, y, d), op: 0.3, alvo: rotulo(xTotal + d / 2, y, e) });
      return;
    }
    const xProfundo = M.esq + horas(e.profundo);
    mapa[e.id] = marca({
      ...ponto(xProfundo, y, d),
      conector: deitado(xProfundo, xTotal, y, Math.min(4, d * 0.5)),
      seg: ponto(xTotal, y, d),
      alvo: rotulo(xTotal + d / 2, y, e),
    });
  });
  return mapa;
}

const RAIO_INTERNO = 92;
const RAIO_EXTERNO = Math.min(PW, PH) / 2 - 26;
export const ANEL = { interno: RAIO_INTERNO, externo: RAIO_EXTERNO };

const noAnel = (a, raio) => ({
  x: CENTRO.x + Math.cos(a) * raio,
  y: CENTRO.y + Math.sin(a) * raio,
});

/** Fase 6 — todos recuam para um anel; o mostrador da equidna ocupa o centro. */
function mostrador(especies, secao) {
  const ord = ordenar(especies, "sono");
  const d = 7;
  const mapa = {};
  ord.forEach((e, i) => {
    const a = (i / ord.length) * Math.PI * 2 - Math.PI / 2;
    const { x, y } = noAnel(a, RAIO_EXTERNO);
    mapa[e.id] = marca({
      ...ponto(x, y, d),
      op: secao.foco.includes(e.id) ? 0 : 0.34,
    });
  });
  return mapa;
}

/** Fase 7 — a roda: a volta inteira é o dia, cada raio é uma espécie. */
function polar(especies, secao) {
  const ord = ordenar(especies, secao.ordem);
  const n = ord.length;
  const vao = RAIO_EXTERNO - RAIO_INTERNO;
  const esp = Math.max(3, (2 * Math.PI * RAIO_INTERNO) / n - 1.6);
  const meia = esp / 2;
  const mapa = {};
  ord.forEach((e, i) => {
    const a = ((i / n) * 360 - 90) * (Math.PI / 180);
    const fim = RAIO_INTERNO + (e.sono / DIA) * vao;
    const p1 = noAnel(a, RAIO_INTERNO + meia);
    const p2 = noAnel(a, Math.max(RAIO_INTERNO + meia, fim - meia));
    const temSonho = e.sonho != null && e.profundo != null;
    const inicioDoSonho = RAIO_INTERNO + (e.profundo / DIA) * vao;
    const s1 = temSonho ? noAnel(a, Math.min(inicioDoSonho + meia, fim - meia)) : null;
    const ponta = noAnel(a, fim);
    mapa[e.id] = marca({
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, esp,
      op: temSonho ? 1 : 0.55,
      seg: temSonho ? { x1: s1.x, y1: s1.y, x2: p2.x, y2: p2.y, esp } : null,
      alvo: {
        x: ponta.x + (Math.cos(a) >= 0 ? 12 : -12),
        y: ponta.y + 4,
        ancora: Math.cos(a) >= 0 ? "start" : "end",
      },
    });
  });
  return mapa;
}

const FORMAS = { faixa, dispersao, enxame, dispersaoRisco, halteres, mostrador, polar };

export function posicoes(especies, secao) {
  return (FORMAS[secao.forma] || faixa)(especies, secao);
}

/** O mostrador central da fase 6, em coordenadas absolutas. */
export function relogio(especie) {
  const R = 108;
  const fatia = (especie.sono / DIA) * Math.PI * 2;
  const a = -Math.PI / 2 + fatia;
  const grande = fatia > Math.PI ? 1 : 0;
  const p = noAnel(a, R);
  return {
    cx: CENTRO.x,
    cy: CENTRO.y,
    r: R,
    arco: [
      `M ${CENTRO.x} ${CENTRO.y}`,
      `L ${CENTRO.x} ${CENTRO.y - R}`,
      `A ${R} ${R} 0 ${grande} 1 ${p.x} ${p.y}`,
      "Z",
    ].join(" "),
  };
}

export { trava };
