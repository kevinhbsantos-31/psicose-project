# PSICOSE — Identidade visual

Dono: Agente 4. Referência central: **logotipo oficial** (D-36). O arquivo é `assets/branding/logo-psicose.jpeg`, de 1536×1024 px.

## Regra do logotipo

- Usar sempre o arquivo original. As cópias ficam em `apps/web/public/img/` e em `apps/mobile/assets/branding/` e são idênticas: mesmo hash.
- **Nunca** recortar, filtrar, redesenhar nem converter o arquivo. Efeitos (interferência, sombra) ficam **por cima**, em CSS ou no componente.
- Pendente com o proprietário: versão **quadrada** do logotipo para o ícone do app e o favicon, e versão para a splash.

## O que o logotipo define

| Elemento | No logotipo | Como aplicar |
|---|---|---|
| Suporte | Fotografia antiga, cantos arredondados gastos, borda creme | Cards e imagens com cantos de 10 px e borda creme/sépia |
| Letras | Serifa vitoriana em caixa-alta, cor de osso rachado, contorno vermelho | Títulos em serifa clássica, cor osso, contorno ou brilho vermelho |
| Pincelada | Traço vermelho-sangue sob o nome | Sublinhado irregular sob títulos e no item ativo do menu |
| Sinal | Cortes horizontais de VHS nas letras | Corte rápido no hover e na transição de página, nunca contínuo |
| Luz | Quente e fraca, sombras densas | Fundo quase preto com vinheta e brilho âmbar discreto |
| Símbolos | Porta escura, figura cinza esguia, mão de dedos longos, papel de parede floral descascado, retrato antigo | Silhuetas provisórias em cinza esfumaçado; o logotipo como capa |

## Paleta (tokens)

| Token | Hex | Uso |
|---|---|---|
| preto-sépia | `#0d0a08` | Fundo |
| tinta | `#16110d` | Campos e áreas recuadas |
| marrom | `#2a1f16` | Painéis e cards |
| borda | `#3d2d20` | Borda gasta |
| âmbar | `#64492f` | Luz e realce |
| osso | `#ebe0cb` | Texto principal |
| osso apagado | `#b6a78c` | Texto secundário |
| creme | `#d9ccb2` | Moldura de fotografia |
| rosa floral | `#8e5d4f` | Detalhe (papel de parede) |
| vermelho | `#7a1414` / `#a3201c` | Botão principal, pincelada, alertas |

## Tipografia

- **Site:** títulos em *IM Fell English SC*, rótulos em *Special Elite*, texto corrido em *Inter*, para manter a legibilidade.
- **App:** serifa e monoespaçada do sistema, sem novas dependências. Trocar quando houver uma fonte licenciada da marca.

## Onde está aplicado

- **Site:** `apps/web/public/css/style.css`, com tokens em `:root`. Na capa, o logotipo entra em `app.js`, no `BRAND`.
- **App:**
  - paleta, fonte e o componente `Logo` em `apps/mobile/src/ui.tsx`;
  - logotipo no login;
  - estilos da sala em `RoomScreen.tsx`;
  - tema escuro no `app.json`.
