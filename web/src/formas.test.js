/**
 * As invariantes da geometria.
 *
 * A promessa da narrativa é que a marca de um bicho é sempre a mesma marca,
 * em todas as sete formas. Isso só se sustenta se toda espécie tiver posição
 * em toda fase, sempre com número finito e dentro do quadro. É o que se checa
 * aqui, forma por forma, com as 58 espécies de verdade.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { posicoes, trava, VB, escalaPeso, horas, alturaDeSono, alturaDeRisco } from "./formas.js";
import { SECOES } from "./secoes.js";
import dados from "./dados.json" with { type: "json" };

const ESPECIES = dados.especies;
/** Margem de folga: a ponta arredondada e o rótulo saem um pouco do quadro. */
const FOLGA = 120;

test("a base analisada é a que a fonte declara", () => {
  assert.equal(ESPECIES.length, dados.fonte.analisadas);
  assert.ok(ESPECIES.length > 0, "sem espécie nenhuma não há o que desenhar");
});

test("toda espécie tem posição em todas as sete formas", () => {
  for (const secao of SECOES) {
    const mapa = posicoes(ESPECIES, secao);
    for (const e of ESPECIES) {
      assert.ok(mapa[e.id], `${e.pt} sem posição na fase ${secao.id}`);
    }
    assert.equal(Object.keys(mapa).length, ESPECIES.length, `sobrou marca na fase ${secao.id}`);
  }
});

test("nenhuma coordenada é NaN ou infinita", () => {
  for (const secao of SECOES) {
    const mapa = posicoes(ESPECIES, secao);
    for (const [id, m] of Object.entries(mapa)) {
      for (const campo of ["x1", "y1", "x2", "y2", "esp"]) {
        assert.ok(Number.isFinite(m[campo]), `${id}.${campo} não é finito na fase ${secao.id}`);
      }
      assert.ok(m.esp >= 0, `${id} com espessura negativa na fase ${secao.id}`);
      assert.ok(m.op >= 0 && m.op <= 1, `${id} com opacidade fora de [0,1] na fase ${secao.id}`);
    }
  }
});

test("as marcas ficam dentro do quadro", () => {
  for (const secao of SECOES) {
    const mapa = posicoes(ESPECIES, secao);
    for (const [id, m] of Object.entries(mapa)) {
      for (const [eixo, limite] of [["x1", VB.w], ["x2", VB.w], ["y1", VB.h], ["y2", VB.h]]) {
        assert.ok(
          m[eixo] >= -FOLGA && m[eixo] <= limite + FOLGA,
          `${id}.${eixo} = ${m[eixo]} escapou do quadro na fase ${secao.id}`
        );
      }
    }
  }
});

test("uma forma desconhecida cai na faixa em vez de quebrar", () => {
  const mapa = posicoes(ESPECIES, { ...SECOES[0], forma: "nao-existe" });
  assert.equal(Object.keys(mapa).length, ESPECIES.length);
});

test("trava prende em [0, 1]", () => {
  assert.equal(trava(-5), 0);
  assert.equal(trava(0.5), 0.5);
  assert.equal(trava(5), 1);
});

test("as réguas são monótonas: mais sono é mais alto, mais risco é mais embaixo", () => {
  assert.ok(alturaDeSono(20) < alturaDeSono(4), "quem dorme mais tem que ficar acima");
  assert.ok(alturaDeRisco(5) > alturaDeRisco(1), "risco maior tem que descer");
  assert.ok(horas(24) > horas(12) && horas(0) === 0);
  const px = escalaPeso(ESPECIES);
  const pesos = ESPECIES.map((e) => e.log_peso);
  assert.ok(px(Math.max(...pesos)) > px(Math.min(...pesos)), "o mais pesado tem que ficar à direita");
});

test("a lista de espécies não é mutada ao posicionar", () => {
  const antes = JSON.stringify(ESPECIES);
  for (const secao of SECOES) posicoes(ESPECIES, secao);
  assert.equal(JSON.stringify(ESPECIES), antes, "posicoes mexeu no array de entrada");
});
