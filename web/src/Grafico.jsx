import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { corDeRisco, saturar } from "./tema";
import {
  ANEL, AREA, CENTRO, VB,
  alturaDeRisco, alturaDeSono, escalaPeso, horas, posicoes, relogio, rotulo,
} from "./formas";

const h1 = (v) => v.toFixed(1).replace(".", ",");


/** Cada fase tem o seu par de réguas; formas irmãs compartilham a mesma. */
const EIXO_DA_FORMA = {
  faixa: "regua",
  halteres: "regua",
  dispersao: "pesoSono",
  enxame: "riscoSono",
  dispersaoRisco: "pesoRisco",
  mostrador: "circulo",
  polar: "circulo",
};

const HORAS_MARCADAS = [0, 6, 12, 18, 24];
// o peso é lido em log: as marcas são potências de dez, não fatias iguais
const PESOS_MARCADOS = [
  { log: -2, rotulo: "10 g" },
  { log: 0, rotulo: "1 kg" },
  { log: 2, rotulo: "100 kg" },
];

function Eixos({ forma, especies, cores }) {
  const px = useMemo(() => escalaPeso(especies), [especies]);
  const tipo = EIXO_DA_FORMA[forma] || "regua";
  const fraco = cores.textoFraco;

  const linhasDeSono = HORAS_MARCADAS.map((h) => (
    <g key={h}>
      <line
        x1={AREA.esq} x2={AREA.esq + AREA.largura}
        y1={alturaDeSono(h)} y2={alturaDeSono(h)}
        stroke={cores.linha} strokeWidth="1" opacity="0.34"
      />
      <text x={AREA.esq - 10} y={alturaDeSono(h) + 4} textAnchor="end" fill={fraco} className="eixo-num">
        {h}h
      </text>
    </g>
  ));

  const reguaDePeso = (
    <g>
      {PESOS_MARCADOS.map((m) => (
        <g key={m.log}>
          <line
            x1={px(m.log)} x2={px(m.log)}
            y1={AREA.topo} y2={AREA.topo + AREA.altura}
            stroke={cores.linha} strokeWidth="1" opacity="0.28"
          />
          <text x={px(m.log)} y={AREA.topo + AREA.altura + 22} textAnchor="middle" fill={fraco} className="eixo-num">
            {m.rotulo}
          </text>
        </g>
      ))}
      <text
        x={AREA.esq + AREA.largura} y={AREA.topo + AREA.altura + 40}
        textAnchor="end" fill={fraco} className="eixo-titulo"
      >
        peso do corpo, em escala log →
      </text>
    </g>
  );

  const conteudo = {
    regua: (
      <g>
        {HORAS_MARCADAS.map((h) => (
          <g key={h}>
            <line
              x1={AREA.esq + horas(h)} x2={AREA.esq + horas(h)}
              y1={AREA.topo} y2={AREA.topo + AREA.altura}
              stroke={cores.linha} strokeWidth="1" opacity="0.3"
            />
            <text
              x={AREA.esq + horas(h)} y={AREA.topo + AREA.altura + 22}
              textAnchor="middle" fill={fraco} className="eixo-num"
            >
              {h}h
            </text>
          </g>
        ))}
        <text
          x={AREA.esq} y={AREA.topo + AREA.altura + 40}
          textAnchor="start" fill={fraco} className="eixo-titulo"
        >
          um dia de 24 horas
        </text>
      </g>
    ),
    pesoSono: <g>{linhasDeSono}{reguaDePeso}</g>,
    riscoSono: (
      <g>
        {linhasDeSono}
        {[1, 2, 3, 4, 5].map((r) => (
          <text
            key={r}
            x={AREA.esq + ((r - 0.5) * AREA.largura) / 5}
            y={AREA.topo + AREA.altura + 22}
            textAnchor="middle" fill={fraco} className="eixo-num"
          >
            {r}
          </text>
        ))}
        <text
          x={AREA.esq + AREA.largura / 2} y={AREA.topo + AREA.altura + 40}
          textAnchor="middle" fill={fraco} className="eixo-titulo"
        >
          risco de predação, de 1 (protegido) a 5 (exposto)
        </text>
      </g>
    ),
    pesoRisco: (
      <g>
        {[1, 2, 3, 4, 5].map((r) => (
          <g key={r}>
            <line
              x1={AREA.esq} x2={AREA.esq + AREA.largura}
              y1={alturaDeRisco(r)} y2={alturaDeRisco(r)}
              stroke={cores.linha} strokeWidth="1" opacity="0.28"
            />
            <text x={AREA.esq - 10} y={alturaDeRisco(r) + 4} textAnchor="end" fill={fraco} className="eixo-num">
              risco {r}
            </text>
          </g>
        ))}
        {reguaDePeso}
      </g>
    ),
    circulo: (
      <g>
        <circle
          cx={CENTRO.x} cy={CENTRO.y} r={ANEL.externo}
          fill="none" stroke={cores.linha} strokeWidth="1" opacity="0.3"
        />
        <circle
          cx={CENTRO.x} cy={CENTRO.y} r={ANEL.interno}
          fill="none" stroke={cores.linha} strokeWidth="1" opacity="0.22"
        />
      </g>
    ),
  }[tipo];

  return (
    <AnimatePresence initial={false}>
      <motion.g
        key={tipo}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
      >
        {conteudo}
      </motion.g>
    </AnimatePresence>
  );
}


/** Uma marca: segmento de reta com ponta arredondada, que é ponto quando tem
    comprimento zero. Só números animam — nenhum `transform` no caminho. */
function Traco({ alvo, cor, opacidade, mola, suave, reagir }) {
  return (
    <motion.line
      initial={false}
      strokeLinecap="round"
      animate={{
        x1: alvo.x1, y1: alvo.y1, x2: alvo.x2, y2: alvo.y2,
        strokeWidth: alvo.esp, opacity: opacidade, stroke: cor,
      }}
      transition={{ default: mola, opacity: suave, stroke: reagir ?? suave }}
    />
  );
}

/** O mostrador do meio da fase 6: um dia inteiro num relógio só. */
function Mostrador({ especie, cores }) {
  const r = relogio(especie);
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <circle cx={r.cx} cy={r.cy} r={r.r} fill={cores.acordado} opacity="0.38" />
      <circle cx={r.cx} cy={r.cy} r={r.r} fill="none" stroke={cores.linha} strokeWidth="1" />
      <path d={r.arco} fill={cores.sono} />
      {[0, 6, 12, 18].map((h) => {
        const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={h}
            x1={r.cx + Math.cos(a) * (r.r - 7)} y1={r.cy + Math.sin(a) * (r.r - 7)}
            x2={r.cx + Math.cos(a) * r.r} y2={r.cy + Math.sin(a) * r.r}
            stroke={cores.linha} strokeWidth="1.5" opacity="0.9"
          />
        );
      })}
      <text x={r.cx} y={r.cy + r.r + 34} textAnchor="middle" fill={cores.texto} className="mostrador-nome">
        {especie.pt}
      </text>
      <text x={r.cx} y={r.cy + r.r + 54} textAnchor="middle" fill={cores.textoFraco} className="mostrador-num">
        {h1(especie.sono)} h dormindo · {h1(especie.sonho ?? 0)} h de sonho
      </text>
    </motion.g>
  );
}

/**
 * As 58 marcas, em qualquer uma das sete formas.
 *
 * A geometria toda vive em `formas.js`; aqui só se decide cor, opacidade e o
 * tempo da transição. Cada espécie é um `<g>` com quatro segmentos — trilho,
 * conector, marca e sonho — que existem sempre, mesmo quando a fase não usa
 * algum deles: nesse caso ele fica com comprimento zero e espessura zero.
 * Montar e desmontar elemento a cada fase cortaria a animação no meio, que é
 * justamente o que segura a comparação entre uma tela e a seguinte.
 */
export default function Grafico({ especies, secao, cores, progresso }) {
  const reduz = useReducedMotion();
  const marcas = useMemo(() => posicoes(especies, secao), [especies, secao]);
  // quem está sob o mouse: o rótulo permanente só existe para as espécies em
  // foco, e no resto da nuvem não dá para saber quem é cada marca
  const [sobre, setSobre] = useState(null);

  const mola = reduz
    ? { duration: 0 }
    : { type: "spring", stiffness: 165, damping: 26, mass: 0.9 };
  const suave = reduz ? { duration: 0 } : { duration: 0.5 };
  const rapido = reduz ? { duration: 0 } : { duration: 0.12, ease: "easeOut" };

  // Meio segundo é o tempo da narrativa: é o que a tela leva para virar de uma
  // fase para a outra. O hover não é narrativa, é resposta ao mouse — nesse
  // ritmo ele parecia fraco mesmo estando lá. Então opacidade e cor andam
  // devagar quando a fase troca, e depressa em qualquer outro momento.
  const faseAnterior = useRef(secao.id);
  const trocouFase = faseAnterior.current !== secao.id;
  useEffect(() => {
    faseAnterior.current = secao.id;
  }, [secao.id]);
  const reagir = trocouFase ? suave : rapido;

  // Na primeira pintura as 58 não aparecem de uma vez: entram de cima para
  // baixo, no ritmo em que o olho leria a pilha. O atraso sai da altura da
  // própria marca, não do índice do array — a ordem que importa é a que está
  // desenhada na tela, e ela muda a cada fase.
  const [estreando, setEstreando] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setEstreando(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // quem está em foco é pintado por último: numa nuvem, não pode ficar embaixo
  const pintura = useMemo(
    () =>
      [...especies].sort(
        (a, b) => Number(secao.foco.includes(a.id)) - Number(secao.foco.includes(b.id))
      ),
    [especies, secao]
  );

  const semFoco = secao.foco.length === 0;
  const equidna = secao.forma === "mostrador"
    ? especies.find((e) => secao.foco.includes(e.id))
    : null;

  return (
    <svg
      className="tela"
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${secao.titulo} — ${especies.length} espécies`}
    >
      <Eixos forma={secao.forma} especies={especies} cores={cores} />

      {pintura.map((e) => {
        const m = marcas[e.id];
        const focada = secao.foco.includes(e.id);
        const acesa = sobre === e.id;
        const base = secao.cor === "risco" ? corDeRisco(e.risco, progresso) : cores.sono;
        // sob o mouse a marca não muda de tom, ganha saturação: é o mesmo verde,
        // mais vivo que o das vizinhas
        const cor = acesa ? saturar(base) : base;
        const corSonho = acesa ? saturar(cores.sonho) : cores.sonho;
        // o que a fase não usa encolhe para o meio da marca em vez de sumir
        const nulo = { x1: m.x1, y1: m.y1, x2: m.x1, y2: m.y1, esp: 0 };
        const trilho = m.trilho ?? nulo;
        const con = m.conector ?? nulo;
        const seg = m.seg ?? nulo;

        return (
          <motion.g
            key={e.id}
            initial={estreando ? { opacity: 0 } : false}
            animate={{
              // com o mouse numa marca, ela é a única acesa: saturação sozinha
              // não dava conta nas fases em que a tinta é quase neutra, e o que
              // faz uma marca aparecer no meio de 58 é as outras saírem da frente
              opacity:
                m.op *
                (sobre == null ? (semFoco || focada ? 1 : 0.42) : acesa ? 1 : 0.25),
            }}
            transition={{
              opacity: estreando
                ? { duration: 0.5, delay: (m.y1 / VB.h) * 0.8 }
                : reagir,
            }}
          >
            <title>{`${e.pt} · ${h1(e.sono)} h`}</title>
            <Traco alvo={trilho} cor={cores.acordado} opacidade={m.trilho ? 0.5 : 0} mola={mola} suave={suave} />
            <Traco alvo={con} cor={corSonho} opacidade={m.conector ? 0.9 : 0} mola={mola} suave={suave} reagir={reagir} />
            <Traco alvo={m} cor={cor} opacidade={1} mola={mola} suave={suave} reagir={reagir} />
            <Traco alvo={seg} cor={corSonho} opacidade={m.seg ? 1 : 0} mola={mola} suave={suave} reagir={reagir} />
            {m.op > 0 && (
              // O alvo do mouse, invisível: a marca em si tem poucos pixels de
              // espessura e no ponto vira um alfinete. Este segmento repete a
              // geometria dela com espessura de sobra e só serve para o hover.
              <motion.line
                initial={false}
                animate={{ x1: m.x1, y1: m.y1, x2: m.x2, y2: m.y2 }}
                transition={{ default: mola }}
                stroke="transparent"
                strokeWidth={Math.max(m.esp, 15)}
                strokeLinecap="round"
                style={{ pointerEvents: "stroke", cursor: "crosshair" }}
                onMouseEnter={() => setSobre(e.id)}
                onMouseLeave={() => setSobre((a) => (a === e.id ? null : a))}
                onPointerDown={(ev) => {
                  // No toque não existe hover, e sem isto não há como saber
                  // que bicho é cada marca no celular. O mouse sai fora daqui
                  // para o comportamento do desktop continuar sendo o de antes.
                  if (ev.pointerType === "mouse") return;
                  setSobre((a) => (a === e.id ? null : e.id));
                }}
              />
            )}
          </motion.g>
        );
      })}

      {pintura.map((e) => {
        const alvo = marcas[e.id].alvo;
        const visivel = secao.foco.includes(e.id) && alvo != null;
        const onde = alvo ?? { x: CENTRO.x, y: CENTRO.y, ancora: "middle" };
        return (
          <motion.text
            key={`rotulo-${e.id}`}
            className="marca-rotulo"
            initial={false}
            textAnchor={onde.ancora}
            animate={{
              x: onde.x, y: onde.y, opacity: visivel ? 1 : 0,
              fill: cores.texto, stroke: cores.fundo,
            }}
            transition={{ default: mola, opacity: suave, fill: suave, stroke: suave }}
          >
            {e.pt} · {h1(e.sono)} h
          </motion.text>
        );
      })}

      <AnimatePresence>
        {equidna && <Mostrador key="mostrador" especie={equidna} cores={cores} />}
      </AnimatePresence>

      {/* O rótulo do hover vem depois de tudo: passa por cima da nuvem, e não
          repete o nome de quem já ganhou rótulo permanente na fase. */}
      {(() => {
        if (sobre == null || secao.foco.includes(sobre)) return null;
        const e = especies.find((x) => x.id === sobre);
        const m = marcas[sobre];
        if (!e || !m) return null;
        const onde = m.alvo ?? rotulo(m.x2 + m.esp / 2, m.y2, e);
        return (
          <text
            className="marca-rotulo"
            x={onde.x} y={onde.y}
            textAnchor={onde.ancora}
            fill={cores.texto} stroke={cores.fundo}
            style={{ pointerEvents: "none" }}
          >
            {e.pt} · {h1(e.sono)} h
          </text>
        );
      })()}
    </svg>
  );
}
