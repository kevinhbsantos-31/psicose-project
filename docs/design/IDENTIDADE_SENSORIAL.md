# PSICOSE — Áudio e identidade sensorial

Status:
- Diretriz aprovada (**D-32**). Licenças: **D-33**. Responsáveis: **D-34**.
- A **proposta técnica** abaixo aguarda aprovação antes de qualquer produção extensa.

Responsáveis (D-34):
- **Agente 4** coordena e integra: direção sonora, ambiente, efeitos de interface, alertas.
- **Agente 2** cuida da identidade sonora dos Monstros.
- **Agente 1** define quais acontecimentos acionam som.

## 1. Diretriz (D-32)

A experiência combina quatro camadas:
1. Trilha ambiente contínua de suspense psicológico, grave e atmosférica.
2. Ruídos sutis e interferências de terror analógico/VHS.
3. Efeitos específicos para os acontecimentos importantes (alertas do governo, notícias em VHS, infecção…).
4. Identidade sonora própria para cada Monstro.

Regras:
- Loop contínuo com transições suaves.
- Volume e silenciar.
- Arquivos locais no app.
- O som nunca prejudica a leitura das mensagens.
- Voz fora do beta (D-19).

## 2. Origem e licença (D-33)

- **Prioridade:** áudio original feito para o PSICOSE.
- **Permitido:**
  - bibliotecas com licença comercial explícita para jogos e apps;
  - domínio público e CC0;
  - IA, quando os termos autorizarem o uso comercial pretendido.
- **Proibido:**
  - material com restrição a uso comercial, distribuição ou modificação (ex.: CC BY-NC, CC BY-ND, "uso pessoal");
  - músicas comerciais conhecidas;
  - cópia de trilhas de outros jogos.
- **Todo arquivo** entra no registro da seção 8 antes de ir para o app.

## 3. Referências (apenas conceituais, nada é copiado)

| Camada | Referência de linguagem sonora |
|---|---|
| Ambiente | *Dark ambient* e *drone*: notas longas e graves, poucas mudanças, sem melodia marcante. Sintetizador minimalista ao estilo das trilhas de terror dos anos 1980 |
| Analógico/VHS | Chiado de fita; oscilação de velocidade (*wow & flutter*); ruído de *tracking*; zumbido elétrico de 60 Hz; estática de rádio; tom de teste (barras e tom) |
| Transmissões | Gênero *analog horror*: transmissões oficiais "quase normais" que soam erradas |
| Monstros | Cada criatura com uma assinatura curta e reconhecível (timbre, ritmo ou textura), definida pelo Agente 2 |

**Cuidado com os alertas do governo:** o som deve ser **original** e **não imitar** alertas reais (Defesa Civil, sirenes oficiais, *cell broadcast*). Isso evita confundir ou assustar alguém fora do jogo.

## 4. Necessidades técnicas

- **Biblioteca:** `expo-audio`.
  - É o módulo oficial do Expo SDK 58 e já está incluído no Expo Go.
  - Ainda **não está instalado**. Precisa de `npx expo install expo-audio`, que só rodo depois da aprovação.
- **Um módulo** no app (`apps/mobile/src/audio.ts`). Ele faz quatro coisas:
  - carrega os arquivos locais;
  - toca o ambiente da fase atual;
  - dispara os efeitos;
  - aplica volume e silenciar.
- **Configurações:** volume e silenciar, salvos no aparelho com AsyncStorage, que já está instalado.
- **Loop sem corte:** o formato AAC deixa um pequeno silêncio no fim do arquivo. Por isso o loop usa **dois players alternados com crossfade** de 1–2 s, que também faz a troca de fase.
- **Legibilidade:**
  - o ambiente toca baixo;
  - quando chega um efeito, o ambiente abaixa por cerca de 1 s (*ducking*);
  - todo evento também aparece em **texto**.
- **Servidor:** não muda para o áudio.
  - Os sons dos eventos que já existem saem do snapshot que o app já recebe.
  - Os eventos novos (alerta, VHS, infecção) virão com as mecânicas do GDD.
- **Android:** respeitar o modo silencioso e pausar o som quando o app vai para segundo plano.

## 5. Formatos e mixagem

| Item | Padrão |
|---|---|
| Arquivo no app | `.m4a` (AAC-LC), 44,1 kHz |
| Ambiente | Estéreo, 96 kbps |
| Texturas e efeitos | Mono, 64–96 kbps |
| Originais (*masters*) | WAV 48 kHz / 24 bits, guardados **fora** do app |
| Volume do ambiente | −28 a −24 LUFS (baixo, de fundo) |
| Volume dos efeitos | −20 a −16 LUFS |
| Pico máximo | −1 dBTP |
| Nomes | `amb_partida.m4a`, `sfx_inicio.m4a`, `mon_<monstro>_<efeito>.m4a` |

## 6. Mapa de eventos sonoros

A lista final de acontecimentos é do **Agente 1** (D-34). A tabela abaixo é ponto de partida.

| Evento | Existe hoje? | Som | Dono |
|---|---|---|---|
| Lobby aguardando | Sim | Ambiente "lobby" | Agente 4 |
| Partida começa | Sim | Efeito de início + troca para o ambiente "partida" | Agente 4 |
| Mensagem privada recebida | Sim | Efeito discreto | Agente 4 |
| Jogador abandonou | Sim | Interferência curta | Agente 4 |
| Fim da partida | Sim | Efeito final + ambiente "fim" | Agente 4 |
| Alerta do governo | Não (aguarda GDD) | Alerta original | Agente 4 |
| Notícia em VHS | Não (aguarda GDD) | Fita rebobinando, chiado | Agente 4 |
| Infecção | Não (aguarda GDD) | Efeito de infecção | Agentes 4 e 2 |
| Ação ou presença do Monstro | Não (aguarda GDD e L-07) | Assinatura do Monstro | Agente 2 |

Os sons não podem revelar informação oculta. Exemplo: nenhum som só para o Monstro que outros possam ouvir no mesmo ambiente (relacionado à L-04).

## 7. Estimativa de recursos

| Grupo | Quantidade | Duração | Tamanho aprox. |
|---|---|---|---|
| Ambientes (lobby, partida, fim) | 3 loops | 60–120 s | 3–4 MB |
| Texturas VHS/ruído | 2 loops | 20–30 s | 0,4 MB |
| Efeitos de interface e eventos atuais | ~8 | 0,3–3 s | 0,3 MB |
| Alertas, VHS, infecção | ~5 | 2–8 s | 0,5 MB |
| Monstros | 2–3 por Monstro, só os do beta (L-07) | 1–4 s | ~0,2 MB por Monstro |
| **Total do beta** | **~20–30 arquivos** | | **~5–7 MB** |

Esforço de código:
- O módulo de áudio mais a tela de volume e silenciar formam uma tarefa pequena.
- Não muda o servidor.

O custo de produção dos sons depende da origem escolhida, que é decisão do proprietário dentro da D-33: compor, encomendar, licenciar biblioteca ou gerar com IA. Este documento não estima preço.

## 8. Registro de origem e licença (obrigatório, D-33)

| Arquivo | Origem | Autor/fonte | Licença | Condições (atribuição etc.) | Data | Responsável |
|---|---|---|---|---|---|---|
| `amb_lobby.m4a`, `amb_partida.m4a`, `amb_fim.m4a` | Sintetizado com `ffmpeg` (osciladores + ruído), sem amostras de terceiros | Projeto PSICOSE | CC0 (provisório) | Nenhuma | 12/11/2026 | Agente 4 |
| `apps/web/public/audio/ambiente.m4a` (site) | Cópia exata de `amb_lobby.m4a` | Projeto PSICOSE | CC0 (provisório) | Nenhuma | 12/11/2026 | Agente 4 |
| `sfx_inicio.m4a`, `sfx_pv.m4a`, `sfx_abandono.m4a`, `sfx_fim.m4a` | Sintetizado com `ffmpeg`, sem amostras de terceiros | Projeto PSICOSE | CC0 (provisório) | Nenhuma | 12/11/2026 | Agente 4 |

Os arquivos ficam em `apps/mobile/assets/audio/`. Os definitivos serão **originais gerados por IA** com termos que permitam uso comercial (decisão do proprietário). Registrar aqui a ferramenta, o plano/termos vigentes e a data de geração de cada um.

## 9. Ordem de implementação (arquitetura aprovada pelo proprietário: PT-11)

1. ✅ `expo-audio` ~58.0.12 instalado, com a permissão de microfone desligada no `app.json`. Módulo `apps/mobile/src/audio.tsx` criado com:
   - ambiente com crossfade por fase e na emenda do loop;
   - *ducking* do ambiente quando toca um efeito;
   - pausa em segundo plano;
   - volume e silenciar salvos no AsyncStorage (`psicose.audio`).

   Controles completos na tela de salas e botão de silenciar no cabeçalho da sala. Os sons provisórios CC0 já tocam nos eventos que existem hoje.
2. Ambientes e efeitos dos eventos que já existem.
3. Alertas, VHS e infecção, quando o Agente 1 especificar esses eventos.
4. Assinaturas dos Monstros, quando a L-07 for resolvida.
5. Trocar os sons provisórios pelos definitivos, sempre registrados na seção 8.

## Fora do escopo agora

- Produção extensa de áudio.
- Mixagem dinâmica, áudio espacial, música adaptativa em camadas.
- Voz (D-19).
