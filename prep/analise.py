"""Contas do Hipnos — sono de mamíferos.

Só pandas e numpy: nada aqui sabe que existe um front. `preparar.py` chama estas
funções e serializa o resultado; os testes chamam as mesmas funções.

Fonte: Allison, T. & Cicchetti, D. (1976), "Sleep in Mammals: Ecological and
Constitutional Correlates", Science 194:732-734. Distribuída no pacote R
`openintro`; os nomes em português estão em data/nomes.csv.
"""

import os

import numpy as np
import pandas as pd

# Colunas de sono, em horas por dia
SONO = ["total_sleep", "non_dreaming", "dreaming"]
# Medidas do corpo e da história de vida
CORPO = ["body_wt", "brain_wt", "life_span", "gestation"]
# Índices de risco, de 1 (seguro) a 5 (exposto)
RISCO = ["predation", "exposure", "danger"]


def raiz() -> str:
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def carregar_bruto() -> pd.DataFrame:
    """As 62 linhas da fonte, com os nomes em português e as derivadas."""
    base = pd.read_csv(os.path.join(raiz(), "data", "mamiferos.csv"))
    nomes = pd.read_csv(os.path.join(raiz(), "data", "nomes.csv"))
    df = base.merge(nomes[["species", "ingles", "portugues"]], on="species", how="left")
    if df["portugues"].isna().any():
        faltando = df.loc[df["portugues"].isna(), "species"].tolist()
        raise ValueError(f"espécies sem tradução em data/nomes.csv: {faltando}")

    # peso cresce por ordem de grandeza (de 5 g a 6,6 t): comparar em log
    df["log_body"] = np.log10(df["body_wt"])
    df["log_brain"] = np.log10(df["brain_wt"])
    # fatia do sono que é sonho
    df["pct_sonho"] = df["dreaming"] / df["total_sleep"] * 100
    # horas acordado, para a barra de 24h
    df["acordado"] = 24 - df["total_sleep"]
    return df


def carregar() -> pd.DataFrame:
    """A base analisada: as 62 menos as que não têm medida de sono total.

    Sem o total de sono a espécie não entra em nenhuma das visões — a marca
    ficaria vazia nas sete seções, e vazio não é zero. Em vez de arrastar quatro
    buracos pelo gráfico inteiro, elas saem da análise e são nomeadas no rodapé.
    """
    df = carregar_bruto()
    return df[df["total_sleep"].notna()].reset_index(drop=True)


def descartadas() -> list[dict]:
    """Quem ficou de fora e o que faltava — a limpeza precisa ser auditável."""
    bruto = carregar_bruto()
    fora = bruto[bruto["total_sleep"].isna()]
    campos = {"total_sleep": "sono total", "non_dreaming": "sono profundo",
              "dreaming": "sonho"}
    return [
        {
            "pt": linha["portugues"],
            "en": linha["ingles"],
            "faltava": [rot for c, rot in campos.items() if pd.isna(linha[c])],
        }
        for _, linha in fora.iterrows()
    ]


def spearman(df: pd.DataFrame, a: str, b: str) -> tuple[float, int]:
    """Correlação de postos entre duas colunas, ignorando linhas incompletas."""
    s = df[[a, b]].dropna()
    return float(s.corr(method="spearman").iloc[0, 1]), len(s)


def correlacoes(df: pd.DataFrame) -> pd.DataFrame:
    """Cada medida de sono contra cada possível explicação."""
    linhas = []
    for alvo in SONO:
        for v in ["log_body", "log_brain", "life_span", "gestation", *RISCO]:
            r, n = spearman(df, alvo, v)
            linhas.append({"sono": alvo, "medida": v, "r": r, "n": n})
    return pd.DataFrame(linhas)


def correlacao_parcial(df: pd.DataFrame, alvo: str, x: str, controle: str) -> tuple[float, int]:
    """Correlação entre `alvo` e `x` descontando o que ambos devem a `controle`.

    Tamanho e risco poderiam estar medindo a mesma coisa — animais grandes tendem
    a ser menos predados. Esta conta responde quanto sobra de cada um quando o
    outro é mantido fixo.
    """
    s = df[[alvo, x, controle]].dropna().rank()
    c = s.corr()
    r_ax, r_ac, r_xc = c.loc[alvo, x], c.loc[alvo, controle], c.loc[x, controle]
    parcial = (r_ax - r_ac * r_xc) / np.sqrt((1 - r_ac**2) * (1 - r_xc**2))
    return float(parcial), len(s)


def tamanho_ou_risco(df: pd.DataFrame) -> pd.DataFrame:
    """O confronto central do estudo, para sono total e para sonho."""
    linhas = []
    for alvo in ["total_sleep", "dreaming"]:
        r_tam, n = correlacao_parcial(df, alvo, "log_body", "danger")
        r_ris, _ = correlacao_parcial(df, alvo, "danger", "log_body")
        linhas.append({
            "sono": alvo,
            "tamanho_sem_risco": r_tam,
            "risco_sem_tamanho": r_ris,
            "n": n,
        })
    return pd.DataFrame(linhas)


def por_risco(df: pd.DataFrame) -> pd.DataFrame:
    """Médias de sono em cada nível do índice de perigo."""
    g = df.groupby("danger").agg(
        especies=("species", "size"),
        total=("total_sleep", "mean"),
        profundo=("non_dreaming", "mean"),
        sonho=("dreaming", "mean"),
    )
    return g.reset_index()


def queda_por_risco(df: pd.DataFrame) -> dict:
    """Quanto o sonho e o sono profundo encolhem do menor ao maior risco."""
    g = por_risco(df).set_index("danger")
    return {
        "sonho": float((1 - g.loc[5, "sonho"] / g.loc[1, "sonho"]) * 100),
        "profundo": float((1 - g.loc[5, "profundo"] / g.loc[1, "profundo"]) * 100),
        "total": float((1 - g.loc[5, "total"] / g.loc[1, "total"]) * 100),
    }


def humano(df: pd.DataFrame) -> dict:
    """Nós, e como nos comparamos a quem corre o mesmo risco que nós."""
    h = df[df["species"] == "Man"].iloc[0]
    pares = df[(df["danger"] == h["danger"]) & (df["species"] != "Man")]
    com_sono = df["total_sleep"].notna()
    com_sonho = df["dreaming"].notna()
    return {
        "sono": float(h["total_sleep"]),
        "sonho": float(h["dreaming"]),
        "profundo": float(h["non_dreaming"]),
        "risco": int(h["danger"]),
        "gestacao": float(h["gestation"]),
        "longevidade": float(h["life_span"]),
        "posicao_sono": int((df["total_sleep"] > h["total_sleep"]).sum() + 1),
        "total_com_sono": int(com_sono.sum()),
        "posicao_sonho": int((df["dreaming"] > h["dreaming"]).sum() + 1),
        "total_com_sonho": int(com_sonho.sum()),
        "media_do_grupo": float(pares["total_sleep"].mean()),
        "especies_no_grupo": int(pares["total_sleep"].notna().sum()),
    }


def faltantes(df: pd.DataFrame) -> dict:
    """O que a base não mediu — precisa aparecer no rodapé, não ser escondido."""
    return {
        "sem_sonho": int(df["dreaming"].isna().sum()),
        "sem_profundo": int(df["non_dreaming"].isna().sum()),
        "sem_total": int(df["total_sleep"].isna().sum()),
        "especies_sem_sonho": df.loc[df["dreaming"].isna(), "portugues"].tolist(),
        "especies_sem_total": df.loc[df["total_sleep"].isna(), "portugues"].tolist(),
        "descartadas": descartadas(),
    }


def extremos(df: pd.DataFrame) -> dict:
    """Os casos que a narrativa cita pelo nome."""
    com_sono = df.dropna(subset=["total_sleep"])
    com_sonho = df.dropna(subset=["dreaming"])
    sem_rem = df[df["dreaming"] == 0]
    return {
        "dorme_mais": com_sono.nlargest(1, "total_sleep").iloc[0][["portugues", "total_sleep"]].to_dict(),
        "dorme_menos": com_sono.nsmallest(1, "total_sleep").iloc[0][["portugues", "total_sleep"]].to_dict(),
        "sonha_mais": com_sonho.nlargest(1, "dreaming").iloc[0][["portugues", "dreaming", "total_sleep"]].to_dict(),
        "sem_rem": sem_rem[["portugues", "total_sleep", "non_dreaming"]].to_dict("records"),
    }
