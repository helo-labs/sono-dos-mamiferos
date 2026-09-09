"""Testes das contas do Hipnos.

    python prep/test_analise.py
"""

import os
import sys
import unittest

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import analise as an  # noqa: E402
import preparar  # noqa: E402


class CorrelacaoParcial(unittest.TestCase):
    """A conta que sustenta o achado central do estudo."""

    def test_controle_irrelevante_nao_muda_a_correlacao(self):
        rng = np.random.default_rng(7)
        n = 200
        x = rng.normal(size=n)
        df = pd.DataFrame({"alvo": x + rng.normal(scale=0.5, size=n), "x": x,
                           "ruido": rng.normal(size=n)})
        bruta, _ = an.spearman(df, "alvo", "x")
        parcial, _ = an.correlacao_parcial(df, "alvo", "x", "ruido")
        self.assertAlmostEqual(bruta, parcial, delta=0.05)

    def test_controle_que_explica_tudo_zera_a_correlacao(self):
        rng = np.random.default_rng(7)
        n = 300
        z = rng.normal(size=n)
        # alvo e x só se parecem porque ambos vêm de z
        df = pd.DataFrame({"z": z,
                           "alvo": z + rng.normal(scale=0.3, size=n),
                           "x": z + rng.normal(scale=0.3, size=n)})
        bruta, _ = an.spearman(df, "alvo", "x")
        parcial, _ = an.correlacao_parcial(df, "alvo", "x", "z")
        self.assertGreater(bruta, 0.7, "sem controle, a correlação espúria é alta")
        self.assertLess(abs(parcial), 0.2, "controlando z, deveria sobrar quase nada")


class NomesDasEspecies(unittest.TestCase):
    def test_falha_alto_se_faltar_traducao(self):
        """Silenciar isso deixaria o front exibir o nome cru grudado."""
        df = pd.read_csv(os.path.join(an.raiz(), "data", "mamiferos.csv"))
        nomes = pd.read_csv(os.path.join(an.raiz(), "data", "nomes.csv"))
        self.assertEqual(set(df.species), set(nomes.species))
        self.assertEqual(len(nomes), len(nomes.drop_duplicates("species")))
        self.assertEqual(len(nomes), len(nomes.drop_duplicates("portugues")),
                         "dois bichos com o mesmo nome em português ficariam indistinguíveis")


class Base(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.df = an.carregar()

    def test_a_base_analisada_tem_58_especies_com_nome(self):
        self.assertEqual(len(an.carregar_bruto()), 62, "a fonte publicou 62")
        self.assertEqual(len(self.df), 58, "e quatro saem na limpeza")
        self.assertFalse(self.df["portugues"].isna().any())

    def test_quem_nao_tem_sono_total_fica_de_fora(self):
        """A marca ficaria vazia nas sete seções — e vazio não é zero."""
        self.assertFalse(self.df["total_sleep"].isna().any())
        fora = an.descartadas()
        self.assertEqual({d["pt"] for d in fora},
                         {"Girafa", "Canguru", "Okapi", "Marmota-de-barriga-amarela"})
        for d in fora:
            self.assertIn("sono total", d["faltava"], d["pt"])

    def test_a_limpeza_nao_derruba_ninguem_com_medida(self):
        """O corte é só pelo sono total: quem tem a medida continua na base."""
        bruto = an.carregar_bruto()
        self.assertEqual(set(self.df["species"]),
                         set(bruto.loc[bruto["total_sleep"].notna(), "species"]))

    def test_o_tamanho_explica_o_sono_e_o_risco_explica_o_sonho(self):
        t = an.tamanho_ou_risco(self.df).set_index("sono")
        sono, sonho = t.loc["total_sleep"], t.loc["dreaming"]
        # no sono total os dois pesam parecido
        self.assertAlmostEqual(sono["tamanho_sem_risco"], sono["risco_sem_tamanho"], delta=0.1)
        # no sonho o risco domina com folga
        self.assertLess(sonho["risco_sem_tamanho"], sonho["tamanho_sem_risco"] - 0.2)

    def test_tamanho_e_risco_sao_quase_independentes(self):
        """Se fossem a mesma coisa, separar um do outro não faria sentido."""
        r, _ = an.spearman(self.df, "log_body", "danger")
        self.assertLess(abs(r), 0.4)

    def test_o_sonho_encolhe_mais_que_o_sono_profundo(self):
        q = an.queda_por_risco(self.df)
        self.assertGreater(q["sonho"], q["profundo"])

    def test_sono_cai_a_cada_nivel_de_risco(self):
        total = an.por_risco(self.df).sort_values("danger")["total"]
        self.assertTrue((total.diff().dropna() < 0).all(), "a queda deveria ser monótona")

    def test_humano_comparado_a_quem_corre_o_mesmo_risco(self):
        h = an.humano(self.df)
        self.assertEqual(h["risco"], 1)
        self.assertEqual(h["sono"], 8.0)
        # a média do grupo não pode incluir o próprio humano
        self.assertEqual(h["especies_no_grupo"], 17)
        self.assertGreater(h["media_do_grupo"], h["sono"])

    def test_equidna_e_o_unico_sem_rem(self):
        sem = an.extremos(self.df)["sem_rem"]
        self.assertEqual(len(sem), 1)
        self.assertEqual(sem[0]["portugues"], "Equidna")

    def test_faltantes_sao_contados_e_nomeados(self):
        f = an.faltantes(self.df)
        self.assertEqual(f["sem_total"], 0, "o corte já tirou essas")
        self.assertEqual(f["especies_sem_total"], [])
        self.assertEqual(f["sem_sonho"], 10)
        self.assertEqual(len(f["especies_sem_sonho"]), 10)
        self.assertEqual(len(f["descartadas"]), 4)


class Json(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = preparar.montar()

    def test_nao_sobra_nan_no_json(self):
        """NaN não é JSON válido; tem que virar null antes de sair daqui."""
        import json
        texto = json.dumps(self.d, ensure_ascii=False)
        self.assertNotIn("NaN", texto)
        self.assertNotIn("Infinity", texto)

    def test_toda_especie_tem_nome_em_portugues(self):
        for e in self.d["especies"]:
            self.assertTrue(e["pt"], e["id"])

    def test_o_front_nao_precisa_calcular_nada(self):
        for chave in ["correlacoes", "tamanho_ou_risco", "por_risco", "queda",
                      "humano", "extremos", "faltantes", "corr_tamanho_risco"]:
            self.assertIn(chave, self.d)


if __name__ == "__main__":
    unittest.main(verbosity=2)
