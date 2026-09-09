import { corDeRisco } from "./tema";

const n = (v, casas = 2) => v.toFixed(casas).replace(".", ",");

/** O confronto entre tamanho e risco, com uma barra por coeficiente. */
export function Separacao({ dados, cores }) {
  const linhas = dados.tamanho_ou_risco.map((d) => ({
    rotulo: d.sono === "total_sleep" ? "Quanto dorme" : "Quanto sonha",
    tamanho: Math.abs(d.tamanho_sem_risco),
    risco: Math.abs(d.risco_sem_tamanho),
    n: d.n,
  }));

  return (
    <div className="painel" style={{ borderColor: cores.linha }}>
      {linhas.map((l) => (
        <div className="painel-linha" key={l.rotulo}>
          <p className="painel-titulo" style={{ color: cores.texto }}>
            {l.rotulo} <span style={{ color: cores.textoFraco }}>· {l.n} espécies</span>
          </p>
          {[
            ["Tamanho do corpo", l.tamanho, cores.sono],
            ["Risco de predação", l.risco, cores.sonho],
          ].map(([nome, valor, cor]) => (
            <div className="painel-barra" key={nome}>
              <span style={{ color: cores.textoFraco }}>{nome}</span>
              <span className="painel-trilho" style={{ background: cores.fundoFraco }}>
                <span style={{ width: `${valor * 100}%`, background: cor }} />
              </span>
              <b style={{ color: cores.texto }}>{n(valor)}</b>
            </div>
          ))}
        </div>
      ))}
      <p className="painel-nota" style={{ color: cores.textoFraco }}>
        Correlação de postos com o outro fator mantido fixo. Quanto maior, mais aquele
        fator explica sozinho. No sono total os dois empatam; no sonho, o risco dobra
        o tamanho.
      </p>
    </div>
  );
}

/** Média de sono profundo e de sonho em cada nível de risco. */
export function Queda({ dados, cores, progresso }) {
  const max = Math.max(...dados.por_risco.map((r) => r.total));
  return (
    <div className="painel" style={{ borderColor: cores.linha }}>
      {dados.por_risco.map((r) => (
        <div className="painel-risco" key={r.danger}>
          <span className="painel-chip" style={{ background: corDeRisco(r.danger, progresso) }}>
            {r.danger}
          </span>
          <span className="painel-trilho" style={{ background: cores.fundoFraco }}>
            <span style={{ width: `${(r.profundo / max) * 100}%`, background: cores.sono }} />
            <span style={{ width: `${(r.sonho / max) * 100}%`, background: cores.sonho }} />
          </span>
          <b style={{ color: cores.texto }}>{n(r.total, 1)} h</b>
        </div>
      ))}
      <p className="painel-nota" style={{ color: cores.textoFraco }}>
        Do risco 1 ao 5: sono profundo −{Math.round(dados.queda.profundo)}%, sonho −
        {Math.round(dados.queda.sonho)}%.
      </p>
    </div>
  );
}
