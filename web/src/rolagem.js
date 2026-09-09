/**
 * Os dois sinais que a rolagem produz, fora do componente que os desenha.
 *
 * O `App` só precisa de dois números para montar a tela: quanto da página já
 * passou, e qual trecho está sendo lido. Como o cálculo dos dois não tem nada
 * de apresentação, ele mora aqui e o componente fica só com o desenho.
 */

import { useEffect, useState } from "react";

/** Onde o observador considera que um trecho está "sendo lido": a faixa do meio. */
const FAIXA_DE_LEITURA = "-45% 0px -45% 0px";

/**
 * Quanto da página já passou, de 0 a 1.
 *
 * Lido do scroll da janela, e não do índice da seção, porque é ele que amanhece
 * e anoitece a página: com o índice a transição andaria aos saltos.
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
 * `quantos` entra na dependência do efeito: se o roteiro mudar de tamanho, o
 * observador precisa ser remontado sobre os elementos novos.
 */
export function useSecaoAtiva(quantos) {
  const [atual, setAtual] = useState(0);
  const [refs] = useState(() => []);

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          // O índice vem do DOM, que é de fora daqui: um trecho sem
          // `data-indice` daria NaN, e o roteiro indexado por NaN é undefined,
          // o que derruba a página inteira na primeira leitura de `secao.forma`.
          const i = Number(e.target.dataset.indice);
          if (!Number.isInteger(i) || i < 0 || i >= quantos) return;
          setAtual(i);
        });
      },
      { rootMargin: FAIXA_DE_LEITURA }
    );
    refs.forEach((el) => el && observador.observe(el));
    return () => observador.disconnect();
  }, [quantos, refs]);

  return { atual, refs };
}
