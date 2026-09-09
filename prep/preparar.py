"""Gera o JSON que o front consome.

    python prep/preparar.py

Tudo que o React exibe sai daqui: nenhuma conta acontece no navegador. Assim os
números da tela são os mesmos que os testes verificam.
"""

import json
import os

import numpy as np
import pandas as pd

import analise as an

DESTINO = os.path.join(an.raiz(), "web", "src", "dados.json")

FONTE = {
    "titulo": "Sleep in Mammals: Ecological and Constitutional Correlates",
    "autores": "Allison, T. & Cicchetti, D.",
    "publicacao": "Science 194:732-734",
    "ano": 1976,
    "distribuicao": "pacote R openintro, via Rdatasets",
    "especies": 62,      # o que a fonte publicou
    "analisadas": 58,    # o que sobrou depois da limpeza (ver analise.carregar)
}


def limpo(v):
    """NaN vira null; tipos do numpy viram tipos do Python."""
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating, float)):
        return None if pd.isna(v) else round(float(v), 4)
    return v


def especies(df: pd.DataFrame) -> list[dict]:
    campos = {
        "species": "id", "portugues": "pt", "ingles": "en",
        "total_sleep": "sono", "non_dreaming": "profundo", "dreaming": "sonho",
        "body_wt": "peso", "brain_wt": "cerebro", "life_span": "longevidade",
        "gestation": "gestacao", "predation": "predacao", "exposure": "exposicao",
        "danger": "risco", "pct_sonho": "pct_sonho", "log_body": "log_peso",
    }
    d = df[list(campos)].rename(columns=campos)
    return [{k: limpo(v) for k, v in linha.items()} for linha in d.to_dict("records")]


def montar() -> dict:
    df = an.carregar()
    corr = an.correlacoes(df)
    return {
        "fonte": FONTE,
        "especies": especies(df),
        "correlacoes": [{k: limpo(v) for k, v in r.items()} for r in corr.to_dict("records")],
        "tamanho_ou_risco": [
            {k: limpo(v) for k, v in r.items()}
            for r in an.tamanho_ou_risco(df).to_dict("records")
        ],
        "por_risco": [
            {k: limpo(v) for k, v in r.items()}
            for r in an.por_risco(df).to_dict("records")
        ],
        "queda": {k: limpo(v) for k, v in an.queda_por_risco(df).items()},
        "humano": {k: limpo(v) for k, v in an.humano(df).items()},
        "extremos": json.loads(json.dumps(an.extremos(df), default=limpo)),
        "faltantes": an.faltantes(df),
        "corr_tamanho_risco": limpo(an.spearman(df, "log_body", "danger")[0]),
    }


def main() -> None:
    dados = montar()
    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    with open(DESTINO, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    tamanho = os.path.getsize(DESTINO) / 1024
    print(f"{DESTINO}  ({tamanho:.1f} KB, {len(dados['especies'])} espécies)")


if __name__ == "__main__":
    main()
