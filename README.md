# Hipnos

Uma narrativa rolável sobre o sono de 58 mamíferos, construída em cima de uma base de dados de 1976. A tese cabe em duas linhas.

**O tamanho do bicho explica quanto ele dorme. O risco de ser comido explica quanto ele sonha.**

O site não troca de gráfico a cada seção. São 58 marcas, uma por espécie, que atravessam sete formas diferentes conforme você rola. A marca do morcego é sempre a mesma marca, esteja ela deitada numa barra de 24 horas, perdida num enxame ou virada num raio de roda. É isso que segura a comparação de uma tela para a seguinte.

## Contexto

Eu queria fazer uma análise exploratória de um dado que não fosse o de sempre. Titanic, Iris, preço de casa na Califórnia. Bases que já foram lidas tantas vezes que qualquer coisa que você encontre nelas já foi encontrada antes, e melhor.

Essa é de 1976, tem 62 linhas e mede uma coisa que ninguém mede mais desse jeito. Allison e Cicchetti puseram mamíferos para dormir em laboratório, cronometraram quanto cada um dormia, separaram o sono profundo do sono REM e classificaram numa escala de 1 a 5 o quanto cada espécie corre risco de virar comida enquanto dorme. Nada aqui é telemetria de smartwatch, é gente com prancheta em 1976.

Achei ela primeiro no Kaggle. A versão de lá tem 8 colunas e não serve.

```text
kaggle_original.csv     8 colunas, sem nome de espécie, sem separar o sonho
mamiferos.csv          12 colunas, com nome e com a divisão profundo / REM
```

Sem o nome da espécie não existe narrativa. Não dá para dizer "a equidna" quando a linha se chama `38`. E sem a separação entre sono profundo e sono REM some metade da tese, porque é justamente ali que está a descoberta mais bonita da base. Fui atrás da fonte original, distribuída no pacote R `openintro`, e refiz o trabalho a partir dela.

Os nomes em português eu traduzi à mão, e seis deles ainda estão marcados como duvidosos em `data/NOMES.md`.

## O que a base diz

Das 62 espécies publicadas, 4 nunca tiveram o sono total medido e ficaram de fora. Sobram 58, e elas contam isto.

* Do morcego-marrom-pequeno, que dorme **19,9 das 24 horas**, à corça, que dorme **2,6**. A corça dorme menos em um dia do que o morcego dorme numa manhã.
* Corpo grande, sono curto. Mas o musaranho, o mais leve de todos com 5 gramas, dorme 9,1 horas, menos que o morcego que pesa o dobro dele. O tamanho puxa o sono e não manda nele.
* Quem corre risco mínimo de ser comido dorme **13,1 horas** em média. Quem corre risco máximo, **4,1**.
* Tamanho e risco não são a mesma coisa disfarçada. A correlação entre os dois é de **0,17**.
* Do menor para o maior risco, o sono profundo encolhe **62%** e o sonho encolhe **78%**. Quem dorme em perigo abre mão do sonho antes de abrir mão do descanso.
* A equidna dorme 8,6 horas e **nenhum minuto disso é sonho**. É a única espécie da base com REM medido em zero, um monotremado, o ramo mais antigo dos mamíferos.
* Nós dormimos 8 horas, o que nos põe em 44º entre as 58. Mas sonhamos 1,9 hora, o que nos põe em 22º entre 48. Dormimos como quem tem medo e sonhamos como quem não tem.

## As sete telas

| | forma | o que ela mostra |
|---|---|---|
| 1 | 58 barras de 24 horas | quanto cada bicho dorme |
| 2 | nuvem peso × sono | o tamanho entra na conta |
| 3 | enxame colorido por risco | as cores se separam quase sozinhas |
| 4 | dispersão peso × risco | os dois fatores não são o mesmo |
| 5 | barras partidas em profundo e sonho | o sonho é o primeiro a ser cortado |
| 6 | um mostrador de 24 horas | a equidna, que não sonha |
| 7 | roda polar | nós, no meio das outras 57 |

## Funcionamento

**Nenhuma conta acontece no navegador.** O Python calcula tudo, escreve um JSON, e o React só desenha o que está lá.

```text
data/mamiferos.csv  +  data/nomes.csv
        ↓
prep/analise.py      pandas e numpy, nada mais
        ↓
prep/preparar.py     serializa
        ↓
web/src/dados.json
        ↓
web/src/App.jsx      só desenha
```

A separação existe por um motivo prático. Os números que aparecem na tela são exatamente os mesmos que os 16 testes de `prep/test_analise.py` verificam. Se a média mudar, o teste quebra antes de a tela mentir.

Do lado do front, cada arquivo responde por uma pergunta só.

```text
formas.js    onde cada marca fica, em cada uma das sete formas
tema.js      qual cor tudo tem, em cada ponto da rolagem
secoes.js    o roteiro, um item por trecho de texto
Grafico.jsx  desenha, e só
```

A marca é sempre um segmento de reta com ponta arredondada. Com comprimento zero ele já é um ponto, e inclinado ele já é um raio de roda. Nenhuma fase precisa montar elemento novo, o que interpola de uma tela para a outra são quatro números e uma espessura. Montar e desmontar cortaria a animação no meio, que é justamente o que segura a leitura.

## O céu

O fundo da página é um dia passando. Ele começa no creme da madrugada, abre para o azul da manhã, fecha no azul do meio-dia, cai na areia e na terracota do entardecer e termina no azul-noite. Nuvens atravessam o meio do dia, e a lua e as estrelas acendem no fim.

Isso não é enfeite solto. A leitura do sono termina de noite porque é sobre isso que a página fala, e as cores das marcas viram junto. Elas são escuras enquanto o céu está claro e claras depois que ele escurece, e a virada acontece entre a quarta e a quinta tela.

Cada cor foi medida contra o fundo dela em toda a rolagem. O texto nunca desce de 3,7 de contraste, as marcas ficam entre 2,7 e 8,5 nas sete fases.

## Rodar localmente

Duas partes. O preparo dos dados roda uma vez, o front roda enquanto você edita.

```bash
git clone https://github.com/helo-labs/sono-dos-mamiferos.git
cd sono-dos-mamiferos

python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python prep/preparar.py     # regera web/src/dados.json
.venv/bin/python prep/test_analise.py # 16 testes

cd web
npm install
npm run dev
```

Depois, abra `http://localhost:5173`.

O `dados.json` já está versionado, então dá para rodar só o front se você não for mexer nas contas.

## Limites conhecidos

* **Seis traduções por conferir.** Estão marcadas com ⚠ em `data/NOMES.md`. Cuíca-d'água, falanger e os dois hirax são os que mais me deixaram em dúvida.
* **A virada de cor das marcas.** Um fundo que vai de creme a azul-noite obriga a marca a trocar de lado em algum ponto, e nesse ponto ela passa por um contraste baixo. Está em 6,2% da rolagem, entre a quarta e a quinta tela, colocado ali porque é onde nenhuma fase está sendo lida.
* **Quatro espécies fora.** Girafa, canguru, okapi e marmota-de-barriga-amarela não tiveram o sono total medido. Sem essa medida a marca ficaria vazia nas sete telas, e vazio não é zero. Elas aparecem nomeadas no rodapé do site.
* **Os índices são classificação, não medida.** Predação, exposição e perigo são notas de 1 a 5 que os autores atribuíram em 1976, não levantamento de campo.
* **Correlação entre espécies não demonstra causa.** Bichos aparentados se parecem em muitas coisas ao mesmo tempo.
* **Não está publicado.** Por enquanto roda local.

Esses pontos são decisões e trade-offs conhecidos, não bugs escondidos.

## Sobre

Feito para aprender a contar uma coisa com um gráfico só, em vez de sete.

Fonte dos dados: Allison, T. & Cicchetti, D. (1976). *Sleep in Mammals: Ecological and Constitutional Correlates*. Science 194:732-734. Distribuída no pacote R `openintro`, via Rdatasets.

O código pode ser usado, copiado e adaptado livremente.
