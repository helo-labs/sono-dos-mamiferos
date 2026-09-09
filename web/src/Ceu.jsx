import { useMemo } from "react";
import { trava } from "./formas";

/**
 * O céu atrás da página: nuvens que atravessam o meio do dia, e a lua e um
 * campo de estrelas depois que anoitece.
 *
 * Nada aqui é asset: são gradientes radiais e círculos gerados por semente
 * fixa, para o desenho ser o mesmo em toda visita e não custar um download. As
 * três camadas são decorativas e ficam fora da árvore de acessibilidade.
 */

const ESTRELAS = 130;
const NUVENS = 6;

/**
 * Em que ponto da rolagem cada coisa do céu entra e sai.
 *
 * Estava tudo como literal solto, e dois deles apareciam duas vezes: o começo
 * das nuvens governa a opacidade delas E o deslocamento do paralaxe, e a
 * entrada da lua governa a opacidade dela E a subida. Mudar um lugar e esquecer
 * o outro dessincronizava sem dar erro em canto nenhum.
 *
 * `NUVENS_FIM` tem um motivo que não é estético: o texto da página vira branco
 * em p≈0,62, e nuvem quase branca atrás de texto branco derruba o contraste da
 * leitura para 1,3. As nuvens têm que ter saído antes disso.
 */
const CEU = {
  NUVENS_INICIO: 0.14,
  NUVENS_CHEIAS: 0.12,
  NUVENS_FIM: 0.46,
  ESTRELAS_INICIO: 0.72,
  ESTRELAS_RAMPA: 0.2,
  ESTRELAS_OPACIDADE: 0.8,
  LUA_INICIO: 0.74,
  LUA_RAMPA: 0.14,
  LUA_OPACIDADE: 0.95,
  LUA_SUBIDA_RAMPA: 0.26,
  LUA_SUBIDA_PX: 90,
};

/** Gerador determinístico: o mesmo céu em toda visita, sem arquivo de dados. */
function semente(n) {
  let s = n;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function estrelas() {
  const r = semente(20260902);
  return Array.from({ length: ESTRELAS }, () => ({
    // a tela inteira: o campo passa por trás do texto e do gráfico
    x: r() * 100,
    y: r() * 100,
    raio: 0.4 + r() * 1.2,
    brilho: 0.22 + r() * 0.45,
    // deriva de poucos pixels, lenta e em direção própria: o movimento é
    // percebido de canto de olho, nunca como uma estrela atravessando a tela
    dx: (r() - 0.5) * 16,
    dy: (r() - 0.5) * 16,
    duracao: 16 + r() * 16,
    // atraso negativo: cada estrela já entra no meio do próprio ciclo, senão
    // as 130 respiram juntas no primeiro segundo
    atraso: -r() * 30,
  }));
}

/**
 * As nuvens do meio do dia: baixas e largas, de larguras e alturas diferentes
 * para nenhuma parecer a cópia da outra.
 *
 * `passo` é o quanto cada uma anda com a rolagem — as mais baixas e maiores
 * andam mais, e é essa diferença que dá profundidade ao céu. A deriva contínua
 * do CSS acontece por cima disso, para o céu não congelar quando a página está
 * parada.
 */
function nuvens() {
  const r = semente(20260903);
  return Array.from({ length: NUVENS }, (_, i) => {
    const largura = 20 + r() * 26;
    return {
      // espalhadas na largura e no terço de cima da tela
      x: -8 + (i / NUVENS) * 108 + r() * 10,
      y: 4 + r() * 34,
      largura,
      // a nuvem maior é a que passa mais perto: anda mais e pesa mais
      passo: 8 + (largura / 46) * 26,
      opacidade: 0.3 + r() * 0.34,
      duracao: 30 + r() * 26,
      atraso: -r() * 50,
    };
  });
}

export default function Ceu({ progresso }) {
  const pontos = useMemo(estrelas, []);
  const nuvem = useMemo(nuvens, []);
  const p = progresso;

  const opNuvens =
    trava((p - CEU.NUVENS_INICIO) / CEU.NUVENS_CHEIAS) *
    trava((CEU.NUVENS_FIM - p) / CEU.NUVENS_CHEIAS);

  // as estrelas só acendem no último quarto, e discretamente
  const opEstrelas =
    trava((p - CEU.ESTRELAS_INICIO) / CEU.ESTRELAS_RAMPA) * CEU.ESTRELAS_OPACIDADE;

  // a lua entra depois das estrelas e sobe o resto da rolagem até o lugar dela
  const opLua = trava((p - CEU.LUA_INICIO) / CEU.LUA_RAMPA) * CEU.LUA_OPACIDADE;
  const sobeLua =
    (1 - trava((p - CEU.LUA_INICIO) / CEU.LUA_SUBIDA_RAMPA)) * CEU.LUA_SUBIDA_PX;

  return (
    <div className="ceu" aria-hidden="true">
      <div className="nuvens" style={{ opacity: opNuvens }}>
        {nuvem.map((n, i) => (
          // dois elementos: o de fora anda com a rolagem, o de dentro deriva
          // sozinho. Uma transformação por camada, senão uma sobrescreve a outra
          <span
            key={i}
            className="nuvem-passo"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: `${n.largura}vw`,
              transform: `translate3d(${(p - CEU.NUVENS_INICIO) * n.passo}vw, 0, 0)`,
            }}
          >
            <span
              className="nuvem"
              style={{
                opacity: n.opacidade,
                animationDuration: `${n.duracao}s`,
                animationDelay: `${n.atraso}s`,
              }}
            />
          </span>
        ))}
      </div>
      <div
        className="lua"
        style={{ opacity: opLua, transform: `translate3d(0, ${sobeLua}px, 0)` }}
      />
      <div className="estrelas" style={{ opacity: opEstrelas }}>
        {pontos.map((e, i) => (
          <span
            key={i}
            className="estrela"
            style={{
              left: `${e.x}%`,
              top: `${e.y}%`,
              width: `${e.raio * 2}px`,
              height: `${e.raio * 2}px`,
              "--brilho": e.brilho,
              "--dx": `${e.dx}px`,
              "--dy": `${e.dy}px`,
              animationDuration: `${e.duracao}s`,
              animationDelay: `${e.atraso}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
