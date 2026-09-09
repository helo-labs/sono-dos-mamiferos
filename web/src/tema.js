/**
 * A página amanhece no topo e anoitece conforme a rolagem desce.
 *
 * O dia inteiro está aqui, e não só as duas pontas dele: o creme da madrugada
 * abre para o azul da manhã, o azul fecha no do meio-dia, e só então a luz cai
 * para a areia, a terracota e a ameixa do entardecer. A versão anterior pulava
 * do amanhecer direto para o pôr do sol e o céu passava o dia inteiro quente,
 * sem nunca ser azul.
 *
 * Entre o azul e a terracota entra um marco de areia clara. É o mesmo cuidado
 * de sempre: a reta entre azul e terracota atravessa o cinza, e o meio da
 * página ficava lodoso. Passando por uma cor clara e pouco saturada, a
 * travessia lê como o ar lavando no fim da tarde, não como sujeira.
 *
 * O texto não é interpolado junto: ele troca de claro para escuro de uma vez,
 * quando o fundo cruza o limiar de luminância, com uma transição curta no CSS.
 * Interpolar a cor do texto o faria passar pelo cinza-médio sobre um fundo
 * cinza-médio, e o texto sumia por centenas de pixels de rolagem.
 */

const CEU = [
  { em: 0.0, fundo: [253, 246, 236], fraco: [244, 233, 217] },
  { em: 0.1, fundo: [222, 236, 248], fraco: [206, 226, 244] },
  { em: 0.28, fundo: [158, 201, 236], fraco: [138, 187, 228] },
  { em: 0.44, fundo: [247, 222, 196], fraco: [238, 208, 176] },
  { em: 0.6, fundo: [188, 116, 92], fraco: [166, 98, 80] },
  { em: 0.74, fundo: [92, 58, 84], fraco: [76, 48, 72] },
  { em: 1.0, fundo: [10, 15, 34], fraco: [20, 27, 54] },
];

/**
 * As tintas da marca, escuras enquanto o céu está claro e claras depois que ele
 * escurece.
 *
 * Antes eram três marcos e a marca era clara o tempo todo: uma tinta creme em
 * cima de um céu claro. Medido, o sono da segunda fase dava 1,06 de contraste e
 * o risco 3 chegava a 1,00, luminância idêntica à do fundo. A marca existia
 * como matiz e não existia como luz.
 *
 * Os tons daqui são os mesmos que já estavam escritos, levados a outra
 * luminância: escurecer é multiplicar a luz linear, o que mantém a proporção
 * entre os canais, então o laranja continua laranja e vira âmbar, não marrom
 * sujo. Foram os saturados do marco 0 que serviram de base, não os creme do
 * meio-dia, senão o resultado sai lamacento.
 *
 * A virada de escuro para claro é curta de propósito, entre 0,60 e 0,62, e cai
 * entre a quarta e a quinta fase. Ela existe porque tem que existir: um fundo
 * que vai de creme a azul-noite obriga a marca a trocar de lado em algum ponto,
 * e ali é onde a leitura de nenhuma fase está no meio.
 */
const TINTA = [
  { em: 0.0, sono: [164, 100, 31], sonho: [169, 79, 104], acordado: [232, 222, 208] },
  { em: 0.28, sono: [137, 82, 24], sonho: [144, 66, 87], acordado: [221, 178, 159] },
  { em: 0.44, sono: [142, 86, 25], sonho: [150, 69, 91], acordado: [214, 152, 130] },
  { em: 0.6, sono: [122, 73, 20], sonho: [131, 59, 79], acordado: [190, 138, 124] },
  { em: 0.62, sono: [250, 206, 126], sonho: [252, 168, 190], acordado: [150, 110, 112] },
  { em: 1.0, sono: [124, 169, 255], sonho: [198, 148, 240], acordado: [30, 40, 72] },
];

/**
 * A escala do risco, de 1 (protegido) a 5 (exposto), nos mesmos marcos.
 *
 * Era uma interpolação só, de um conjunto de dia para um de noite, e por isso
 * não conseguia ser escura na terceira fase e clara na sétima. Aqui ela tem a
 * mesma virada da TINTA, e as duas fases de risco caem as duas no lado escuro,
 * com o céu ainda claro. Os cinco matizes são os que já estavam escritos.
 */
const RISCO = [
  { em: 0.0, cores: [[86, 124, 79], [114, 119, 53], [148, 107, 35], [179, 90, 44], [182, 85, 84]] },
  { em: 0.6, cores: [[61, 90, 55], [82, 86, 36], [108, 77, 23], [131, 64, 29], [150, 45, 43]] },
  { em: 0.62, cores: [[99, 173, 131], [132, 169, 98], [187, 154, 72], [227, 134, 84], [241, 121, 125]] },
  { em: 1.0, cores: [[122, 210, 160], [168, 214, 126], [242, 200, 96], [246, 146, 92], [240, 96, 102]] },
];

const TEXTO_ESCURO = [43, 33, 24];
const TEXTO_CLARO = [240, 240, 248];

/**
 * O texto fraco é o texto forte caminhando um terço em direção ao fundo.
 *
 * Antes eram dois valores fixos, um para o dia e um para a noite, e nenhum dos
 * dois sobrevivia à travessia: em p≈0,48 o fraco caía para 1,24 de contraste e
 * as réguas do gráfico sumiam da tela. Derivando do fundo de cada momento, a
 * hierarquia é sempre a mesma proporção, e o pior caso dobra.
 *
 * O preço é o tom: o fraco da noite era azulado de propósito e agora sai quase
 * neutro, porque nasce do branco do texto e não de uma cor escolhida à parte.
 */
const CAMINHO_DO_FRACO = 0.34;

/**
 * A linha da grade sai do fundo, um passo curto na direção do texto.
 *
 * Ela também era um valor por marco, e também não sobrevivia à interpolação:
 * o marco da areia definia uma linha mais escura que o próprio fundo e o da
 * terracota definia uma mais clara. Entre um e outro elas se igualavam, e em
 * p=0,436 a grade desaparecia. (O arco antigo tinha o mesmo buraco, em 0,382.)
 *
 * Saindo do fundo, ela está sempre do mesmo lado dele e o cruzamento não existe.
 * 0,18 é o passo que reproduz o peso que a grade já tinha: desenhada a 0,3 de
 * opacidade, ela fica entre 1,09 e 1,15 de contraste, onde antes ficava entre
 * 1,08 e 1,15 fora do buraco.
 */
const CAMINHO_DA_LINHA = 0.18;

const caminhar = (de, para, k) => de.map((v, i) => Math.round(v + (para[i] - v) * k));

const trava = (t) => Math.min(1, Math.max(0, t));

function interpolar(marcos, progresso, campo) {
  const t = trava(progresso);
  let a = marcos[0];
  let b = marcos[marcos.length - 1];
  for (let i = 0; i < marcos.length - 1; i++) {
    if (t >= marcos[i].em && t <= marcos[i + 1].em) {
      a = marcos[i];
      b = marcos[i + 1];
      break;
    }
  }
  const span = b.em - a.em || 1;
  const k = (t - a.em) / span;
  return a[campo].map((v, i) => Math.round(v + (b[campo][i] - v) * k));
}

const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

/** Canais em luz linear: é neles que dá para somar e multiplicar cor. */
const linear = (c) =>
  c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });

const deLinear = (c) =>
  c.map((v) => {
    const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, s)) * 255);
  });

/** Luminância relativa (WCAG). */
const luz = (c) => {
  const [r, g, b] = linear(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Em que ponto o texto deixa de ser escuro e passa a ser claro.
 *
 * 0,199 é onde os dois empatam: abaixo dali o texto claro contrasta mais com o
 * fundo, acima dali o escuro. Estava em 0,32, e a diferença não era acadêmica.
 * O texto virava branco em p=0,416, quando o escuro ainda dava 5,4 de contraste
 * e o branco dava 2,6. A faixa inteira do entardecer era lida na pior das duas
 * opções.
 */
const LIMIAR_DO_TEXTO = 0.199;

function claro(c) {
  return luz(c) > LIMIAR_DO_TEXTO;
}

/**
 * A cor da marca sob o mouse, mais viva que a das outras.
 *
 * O ganho é só de saturação: os canais se afastam da luminância da própria cor,
 * que fica de pé. A marca acesa continua o mesmo tom — verde do risco 1 é verde
 * do risco 1 — e não vira uma cor nova que não existe em lugar nenhum da
 * escala. O que clipar no caminho fica no limite do gamut.
 */
const SATURACAO_HOVER = 1.5;

export function saturar(cor, fator = SATURACAO_HOVER) {
  const c = typeof cor === "string" ? cor.match(/\d+/g).map(Number) : cor;
  const y = luz(c);
  const lin = linear(c);
  return rgb(deLinear(lin.map((v) => Math.min(1, Math.max(0, y + (v - y) * fator)))));
}

export function paleta(progresso) {
  const fundo = interpolar(CEU, progresso, "fundo");
  const texto = claro(fundo) ? TEXTO_ESCURO : TEXTO_CLARO;
  return {
    fundo: rgb(fundo),
    fundoFraco: rgb(interpolar(CEU, progresso, "fraco")),
    linha: rgb(caminhar(fundo, texto, CAMINHO_DA_LINHA)),
    sono: rgb(interpolar(TINTA, progresso, "sono")),
    sonho: rgb(interpolar(TINTA, progresso, "sonho")),
    acordado: rgb(interpolar(TINTA, progresso, "acordado")),
    texto: rgb(texto),
    textoFraco: rgb(caminhar(texto, fundo, CAMINHO_DO_FRACO)),
  };
}

/** Escala de cor do índice de risco: 1 (seguro) a 5 (exposto). */
export function corDeRisco(risco, progresso) {
  const i = Math.min(4, Math.max(0, (risco || 1) - 1));
  const t = trava(progresso);
  let a = RISCO[0];
  let b = RISCO[RISCO.length - 1];
  for (let j = 0; j < RISCO.length - 1; j++) {
    if (t >= RISCO[j].em && t <= RISCO[j + 1].em) {
      a = RISCO[j];
      b = RISCO[j + 1];
      break;
    }
  }
  const span = b.em - a.em || 1;
  const k = (t - a.em) / span;
  return rgb(a.cores[i].map((v, n) => Math.round(v + (b.cores[i][n] - v) * k)));
}
