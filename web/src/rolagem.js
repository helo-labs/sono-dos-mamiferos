/** Os dois sinais que a rolagem produz, fora do componente que os desenha. */

import { useEffect, useState } from "react";

/**
 * Onde o observador considera que um trecho está "sendo lido".
 *
 * No desktop é a faixa do meio da tela, porque o texto ocupa uma coluna inteira
 * e o meio dela é onde o olho está. No celular o gráfico fica grudado no topo,
 * ocupando mais da metade da altura, e o meio da tela cai dentro do desenho:
 * a faixa precisa descer para o pedaço onde o texto de fato aparece, senão a
 * fase do gráfico anda descolada do trecho que está sendo lido.
 */
const FAIXA_DESKTOP = "-45% 0px -45% 0px";
const FAIXA_CELULAR = "-74% 0px -20% 0px";
const CONSULTA_CELULAR = "(max-width: 900px)";

const faixaDeLeitura = () =>
  typeof window !== "undefined" && window.matchMedia(CONSULTA_CELULAR).matches
    ? FAIXA_CELULAR
    : FAIXA_DESKTOP;

/**
 * Quanto da página já passou, de 0 a 1.
 *
 * Vem do scroll da janela e não do índice da seção porque é ele que amanhece e
 * anoitece a página. Pelo índice, a transição andaria aos saltos.
 */
export function useProgressoDaRolagem() {
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const aoRolar = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      setProgresso(total > 0 ? window.scrollY / total : 0);
    };
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return progresso;
}

/**
 * Qual trecho está no meio da tela, e a lista de refs para pendurar neles.
 *
 * `quantos` é dependência do efeito: mudando o tamanho do roteiro, o observador
 * precisa ser remontado sobre os elementos novos.
 */
export function useSecaoAtiva(quantos) {
  const [atual, setAtual] = useState(0);
  const [refs] = useState(() => []);
  // girar o celular troca a faixa; sem isto o observador ficaria com a de antes
  const [faixa, setFaixa] = useState(faixaDeLeitura);

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_CELULAR);
    const aoTrocar = () => setFaixa(faixaDeLeitura());
    consulta.addEventListener("change", aoTrocar);
    return () => consulta.removeEventListener("change", aoTrocar);
  }, []);

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          // O índice vem do DOM. Um trecho sem `data-indice` dá NaN, e o
          // roteiro indexado por NaN é undefined, o que derruba a página na
          // primeira leitura de `secao.forma`.
          const i = Number(e.target.dataset.indice);
          if (!Number.isInteger(i) || i < 0 || i >= quantos) return;
          setAtual(i);
        });
      },
      { rootMargin: faixa }
    );
    refs.forEach((el) => el && observador.observe(el));
    return () => observador.disconnect();
  }, [quantos, refs, faixa]);

  return { atual, refs };
}
