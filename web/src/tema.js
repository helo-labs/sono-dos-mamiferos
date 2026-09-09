/**
 * A página amanhece no topo e anoitece conforme a rolagem desce.
 *
 * O arco tem o dia inteiro: creme da madrugada, azul da manhã, azul do
 * meio-dia, areia, terracota e ameixa do entardecer, azul-noite.
 *
 * O marco de areia entre o azul e a terracota não é decorativo. A reta entre
 * essas duas cores atravessa o cinza, e o meio da página ficava lodoso.
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
 * As tintas da marca, escuras enquanto o céu está claro e claras depois dele
 * escurecer.
 *
 * Marca clara em céu claro não se enxerga: com tinta creme no meio-dia, o sono
 * da segunda fase mede 1,06 de contraste e o risco 3 mede 1,00, a mesma
 * luminância do fundo.
 *
 * Os tons são levados a outra luminância multiplicando a luz linear, o que
 * mantém a proporção entre os canais e o matiz de pé. A base tem que ser um tom
 * saturado; partindo dos creme o resultado sai lamacento.
 *
 * A virada de escuro para claro é curta, entre 0,60 e 0,62, e cai entre a
 * quarta e a quinta fase. Um fundo que vai de creme a azul-noite obriga a marca
 * a trocar de lado em algum ponto, e ali nenhuma fase está sendo lida.
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
 * A escala do risco, de 1 (protegido) a 5 (exposto), nos mesmos marcos da
 * TINTA.
 *
 * Precisa de marcos, e não de uma interpolação só entre um conjunto de dia e um
 * de noite: com uma reta só ela não consegue ser escura na terceira fase e
 * clara na sétima. Com a virada, as duas fases de risco caem no lado escuro,
 * com o céu ainda claro.
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
 * Dois valores fixos, um de dia e um de noite, não sobrevivem à travessia: em
 * p≈0,48 o fraco cai para 1,24 de contraste e as réguas do gráfico somem da
 * tela. Derivado, ele guarda sempre a mesma proporção do texto forte.
 *
 * O preço é o tom: nasce do branco do texto, então o fraco da noite sai quase
 * neutro em vez de azulado.
 */
const CAMINHO_DO_FRACO = 0.34;

/**
 * A linha da grade sai do fundo, um passo curto na direção do texto.
 *
 * Um valor por marco não funciona aqui: um marco define a linha mais escura que
 * o próprio fundo, o seguinte define mais clara, e no meio do caminho as duas se
 * igualam e a grade some da tela. Saindo do fundo, ela fica sempre do mesmo lado
 * dele.
 *
 * 0,18 é o passo que dá o peso certo: desenhada a 0,3 de opacidade, a grade fica
 * entre 1,07 e 1,17 de contraste.
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
 * Só saturação: os canais se afastam da luminância da própria cor, que fica de
 * pé, então o verde do risco 1 continua o verde do risco 1 em vez de virar um
 * tom que não existe na escala. O que clipar fica no limite do gamut.
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
