import { useMemo } from "react";
import dados from "./dados.json";
import { SECOES } from "./secoes";
import { trava } from "./formas";
import { useProgressoDaRolagem, useSecaoAtiva } from "./rolagem";
import { paleta } from "./tema";
import Ceu from "./Ceu";
import Grafico from "./Grafico";
import { Separacao, Queda } from "./Paineis";

/**
 * Ênfase dentro do parágrafo, sem trazer uma biblioteca de markdown.
 *
 * A copy vive em `secoes.js` como texto puro, para ser editada sem abrir JSX.
 * `**assim**` sai em negrito e `*assim*` em itálico, e nada além disso.
 */
function Enfase({ children }) {
  const partes = String(children).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return partes.map((t, i) => {
    if (t.startsWith("**") && t.endsWith("**")) return <strong key={i}>{t.slice(2, -2)}</strong>;
    if (t.startsWith("*") && t.endsWith("*") && t.length > 2) return <i key={i}>{t.slice(1, -1)}</i>;
    return t;
  });
}

/** Quanta rolagem já basta para a seta da capa sair. */
const ROLAGEM_QUE_APAGA_A_SETA = 0.03;

export default function App() {
  const progresso = useProgressoDaRolagem();
  const { atual, refs } = useSecaoAtiva(SECOES.length);

  const cores = useMemo(() => paleta(progresso), [progresso]);
  const secao = SECOES[atual];
  const f = dados.faltantes;
  const fora = f.descartadas.map((d) => d.pt);

  return (
    <div
      className="pagina"
      style={{
        background: cores.fundo,
        color: cores.texto,
        "--texto-fraco": cores.textoFraco,
        // o celular usa isto para dar fundo opaco ao gráfico grudado;
        // no desktop nada lê esta variável
        "--fundo": cores.fundo,
      }}
    >
      <Ceu progresso={progresso} />

      <header className="capa">
        <p className="sobrenome" style={{ color: cores.textoFraco }}>
          Sono de mamíferos · Allison &amp; Cicchetti, 1976
        </p>
        <h1>Hipnos</h1>
        <p className="chamada">
          O tamanho do bicho explica quanto ele dorme.
          <br />O risco de ser comido explica quanto ele sonha.
        </p>
        <div className="premissa" style={{ color: cores.textoFraco }}>
          <p>
            Em {dados.fonte.ano}, dois pesquisadores reuniram dados de{" "}
            {dados.fonte.especies} mamíferos: quanto cada um dormia, quanto desse sono
            era REM e o quanto estavam expostos a predadores.
          </p>
          <p>
            É uma base de dados pequena. Antiga. Imperfeita. E justamente por isso,
            interessante. Em vez de começar pelas correlações, vamos começar pelo dia.
          </p>
        </div>
        <p
          className="rolar"
          style={{ color: cores.textoFraco, opacity: 1 - trava(progresso / ROLAGEM_QUE_APAGA_A_SETA) }}
        >
          role para começar o dia ↓
        </p>
        {/* só aparece em tela estreita; no desktop o CSS mantém escondido */}
        <p className="aviso-tela" style={{ color: cores.textoFraco }}>
          Feito para tela grande. Se puder, abra no computador.
        </p>
      </header>

      {/* o desenho troca de lado a cada duas fases, não a cada uma: 1 e 2 de um
          lado, 3 e 4 do outro, e assim por diante. O CSS faz a travessia */}
      <main className={Math.floor(atual / 2) % 2 ? "corpo trocado" : "corpo"}>
        <div className="grafico">
          <Grafico
            especies={dados.especies}
            secao={secao}
            cores={cores}
            progresso={progresso}
          />
          <p className="legenda" style={{ color: cores.textoFraco }}>
            {secao.legenda}
          </p>
        </div>

        <div className="texto">
          {SECOES.map((s, i) => (
            <section
              key={s.id}
              data-indice={i}
              ref={(el) => (refs[i] = el)}
              className={i === atual ? "trecho ativo" : "trecho"}
            >
              <h2>{s.titulo}</h2>
              {s.texto.map((t, k) =>
                typeof t === "string" ? (
                  <p key={k}>
                    <Enfase>{t}</Enfase>
                  </p>
                ) : t.painel === "separacao" ? (
                  <Separacao key={k} dados={dados} cores={cores} />
                ) : (
                  <Queda key={k} dados={dados} cores={cores} progresso={progresso} />
                )
              )}
            </section>
          ))}
        </div>
      </main>

      <footer className="rodape" style={{ borderColor: cores.linha, color: cores.textoFraco }}>
        <h3 style={{ color: cores.texto }}>O que estes dados não contam</h3>
        <p>Toda história tem um rodapé.</p>
        <p>
          A base original tinha <b>{dados.fonte.especies} espécies</b>. {fora.length}{" "}
          ficaram de fora porque não havia medida do tempo total de sono: {fora.join(", ")}.
        </p>
        <p>
          Por isso, são <b>{dados.fonte.analisadas}</b> que aparecem nas visualizações.
        </p>
        <p>
          E das {dados.fonte.analisadas}, em <b>{f.sem_sonho} espécies não havia medida
          de REM</b>, entre elas elefante-africano, gorila e onça-pintada.
        </p>
        <p>Nenhum valor foi estimado para preencher esses espaços.</p>
        <p><b>Sem medida não significa zero.</b></p>
        <p>Onde o dado não existe, a marca desaparece.</p>
        <p>
          Os índices de predação, exposição e perigo também não são medições diretas de
          campo. São classificações de 1 a 5 feitas pelos autores em {dados.fonte.ano}.
        </p>
        <p>
          E uma última cautela: <b>correlação não é causa</b>.
        </p>
        <p>
          As espécies desta base compartilham muitas características além das que estamos
          comparando. Animais aparentados, por exemplo, podem se parecer em várias
          dimensões ao mesmo tempo.
        </p>
        <p>
          Então, talvez a pergunta não seja simplesmente <i>“o que faz um animal
          dormir?”</i>
        </p>
        <p>
          É: <b>quanto sono um animal consegue se permitir quando fechar os olhos tem um
          preço?</b>
        </p>
        <p className="fonte">
          {dados.fonte.autores} ({dados.fonte.ano}). <i>{dados.fonte.titulo}</i>.{" "}
          {dados.fonte.publicacao}. Dados distribuídos no {dados.fonte.distribuicao}.
        </p>
      </footer>
    </div>
  );
}
