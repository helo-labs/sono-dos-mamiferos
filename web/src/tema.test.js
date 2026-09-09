/**
 * As invariantes da paleta.
 *
 * O valor destes testes não é conferir que uma cor é aquela cor: é travar as
 * garantias que custaram medição para existir. Se alguém mexer num marco do céu
 * ou numa tinta e a legibilidade cair, quem avisa é este arquivo, não o olho de
 * quem estiver rolando a página.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { paleta, corDeRisco, saturar } from "./tema.js";

const rgb = (s) => s.match(/\d+/g).map(Number);
const linear = (c) =>
  c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
const luz = (c) => {
  const [r, g, b] = linear(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [luz(a), luz(b)];
  const [alto, baixo] = x > y ? [x, y] : [y, x];
  return (alto + 0.05) / (baixo + 0.05);
};
/** A rolagem inteira, de meio em meio milésimo. */
const AO_LONGO = [];
for (let p = 0; p <= 1; p += 0.002) AO_LONGO.push(Number(p.toFixed(3)));

test("paleta devolve rgb bem formado em toda a rolagem", () => {
  for (const p of AO_LONGO) {
    const c = paleta(p);
    for (const campo of ["fundo", "fundoFraco", "linha", "sono", "sonho", "acordado", "texto", "textoFraco"]) {
      const v = c[campo];
      assert.match(v, /^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/, `${campo} em p=${p}`);
      for (const canal of rgb(v)) {
        assert.ok(canal >= 0 && canal <= 255, `${campo} fora da faixa em p=${p}`);
      }
    }
  }
});

test("paleta trava fora de [0, 1]", () => {
  assert.deepEqual(paleta(-3), paleta(0));
  assert.deepEqual(paleta(9), paleta(1));
});

test("o texto nunca desce de 3,5 de contraste contra o fundo", () => {
  for (const p of AO_LONGO) {
    const c = paleta(p);
    const x = contraste(rgb(c.texto), rgb(c.fundo));
    assert.ok(x >= 3.5, `texto em ${x.toFixed(2)} no p=${p}, abaixo do piso`);
  }
});

test("as réguas e a legenda nunca descem de 2,2", () => {
  for (const p of AO_LONGO) {
    const c = paleta(p);
    const x = contraste(rgb(c.textoFraco), rgb(c.fundo));
    assert.ok(x >= 2.2, `texto fraco em ${x.toFixed(2)} no p=${p}`);
  }
});

test("a linha da grade nunca coincide com o fundo", () => {
  // Já coincidiu: quando `linha` era um valor por marco, ela cruzava o fundo
  // em p=0,436 e a grade sumia da tela. Hoje ela deriva do fundo e não cruza.
  for (const p of AO_LONGO) {
    const c = paleta(p);
    const x = contraste(rgb(c.linha), rgb(c.fundo));
    assert.ok(x > 1.02, `grade indistinguível do fundo em p=${p}`);
  }
});

test("a escala de risco tem cinco cores distintas em toda a rolagem", () => {
  for (const p of AO_LONGO) {
    const cores = [1, 2, 3, 4, 5].map((r) => corDeRisco(r, p));
    assert.equal(new Set(cores).size, 5, `escala colapsou em p=${p}: ${cores.join(" ")}`);
  }
});

test("corDeRisco trava índice fora da escala em vez de quebrar", () => {
  assert.equal(corDeRisco(0, 0.5), corDeRisco(1, 0.5));
  assert.equal(corDeRisco(99, 0.5), corDeRisco(5, 0.5));
  assert.match(corDeRisco(undefined, 0.5), /^rgb\(/);
});

test("saturar afasta os canais sem mudar a luminância de lugar", () => {
  const antes = paleta(0.2).sono;
  const depois = saturar(antes);
  const espalha = (c) => Math.max(...c) - Math.min(...c);
  assert.ok(espalha(rgb(depois)) > espalha(rgb(antes)), "não ficou mais saturada");
  assert.ok(Math.abs(luz(rgb(depois)) - luz(rgb(antes))) < 0.12, "a luminância andou demais");
});
