# Fontes locais

Servidas via `next/font/local` (ver `src/app/layout.tsx`) para que o build
não dependa de acesso à internet.

| Fonte   | Arquivo                            | Eixo        | Licença                     |
| ------- | ---------------------------------- | ----------- | --------------------------- |
| Inter   | `inter/inter-latin-wght.woff2`     | wght 100–900 | SIL OFL 1.1 (`inter/OFL.txt`)   |
| Manrope | `manrope/manrope-latin-wght.woff2` | wght 200–800 | SIL OFL 1.1 (`manrope/OFL.txt`) |

Origem: subconjunto `latin` (U+0000-00FF e pontuação geral, suficiente para
pt-BR) distribuído pelo Google Fonts (`fonts.gstatic.com`, Inter v20 e
Manrope v20), o mesmo arquivo usado antes por `next/font/google`. Licenças
obtidas de `github.com/google/fonts` (`ofl/inter` e `ofl/manrope`); nenhuma
declara Reserved Font Name.

Para atualizar, baixe o bloco `/* latin */` de
`https://fonts.googleapis.com/css2?family=Inter:wght@100..900` (idem Manrope
com `wght@200..800`) e substitua o `.woff2` correspondente.
