# PSICOSE — Game Design Document

> Dono: Agente 1 (Game Design e Balanceamento) · Criado em 12/11/2026
> Este documento contém **apenas regras aprovadas pelo proprietário**. Pendências e lacunas ficam no fim e em `DECISIONS.md`.

## 1. Conceito

Jogo multiplayer de dedução social e terror psicológico, com mecânicas próprias. Among Us e Town of Salem são referências apenas conceituais.

**Formato (D-17):** jogo de chat e interface, sem mapa, movimentação ou exploração de cenário em tempo real.

## 2. Modo inicial

- 1 **Monstro**.
- 3 **Inocentes**.

### Sala e lobby (D-25 a D-29)

- Sala privada por código. A partida **começa automaticamente** quando a 4ª vaga é ocupada.
- O lobby mostra só as vagas, sem identidades. Os codinomes são sorteados no início, em ordem embaralhada.
- O chat (público e privado) abre no início da partida. Mensagens com até 500 caracteres.
- Queda de conexão mantém a vaga. "Sair" no lobby libera a vaga. **"Sair" durante a partida é abandono definitivo**:
  o jogador não volta, e os demais veem que ele saiu.
- **D-31:** se o **Monstro** abandona, os **Inocentes vencem na hora**. Queda de conexão não é abandono.
  *Abandono de um Inocente: efeito na vitória ainda pendente (PGD-12).*

## 3. Condições de vitória

**Inocentes** vencem **exclusivamente** quando matam o Monstro com o revólver.
*Exceção aprovada depois (D-31): vencem também se o Monstro abandonar a partida.*

**Monstro** vence quando:

1. Os três Inocentes recebem infecções válidas; **ou**
2. Restam somente o Monstro e um Inocente; **ou**
3. Um Inocente morre e os outros dois Inocentes estão **realmente** infectados.

Uma infecção isolada não impede a vitória dos Inocentes.

## 4. Revólver

- Começa com **2 balas**. Não existe recarga. Cada tiro consome uma bala.
- Qualquer jogador pode pegar a arma.
- **Todos** recebem uma notificação pública quando alguém pega o revólver.
- Cada disparo exige a **autorização de pelo menos outro jogador**, e cada disparo exige uma autorização independente.
- O autorizador **não** escolhe o alvo. O **portador** escolhe o alvo e pode desistir do disparo.
- O Monstro pode pegar a arma, mas **não pode disparar**.

## 5. Infecção

- O Monstro tem um **botão secreto** para iniciar a tentativa e escolhe **um** alvo. Se vários alvos forem elegíveis, ele escolhe apenas um.
- A janela de validação dura **cerca de 35 segundos**.
- A infecção é confirmada quando o alvo escreve uma **expressão válida** durante a janela.
- Só contam mensagens do alvo no **chat público** ou no **PV com o Monstro**.
  Mensagens privadas com terceiros **não** contam. Voz **não** conta.
- O Monstro recebe a confirmação **imediatamente**.
- A vítima recebe a notificação **2 minutos depois** da confirmação.
- Cada jogador só pode ser infectado **uma vez** por partida.
- Uma tentativa fracassada gera uma **recarga de 60 segundos**.
- O Monstro pode **simular a própria infecção** para manipular os demais. Isso **não** conta como infecção real.

**Regras por Monstro (D-44):** cada Monstro tem condição, janela, canais e quantidade de tentativas próprios em
`INFECCAO.md`, e elas prevalecem sobre os padrões acima (por exemplo: Silencioso 80 s, Anfitrião 25 s, Eco e
Observador sem janela).

**Requisito do sistema:** distinguir **infecção real**, **informação apresentada à vítima** e **simulação**.

## 6. Comunicação

- Chat público.
- Mensagens privadas individuais.
- Mensagens **não podem ser apagadas**.
- Capturas de tela podem ser usadas como evidência.
- **Voz modificada** prevista:
  - Pedido de fala com autorização de outro participante.
  - No máximo **1 minuto** por liberação.
  - Intervalo **global** de pelo menos **5 minutos** entre áudios.

## 7. Jornal VHS

Transmissões ocasionais interrompem a partida e trazem **duas pistas** sobre possíveis Monstros:
**uma verdadeira** e **uma falsa**. O jornal **não** revela diretamente a identidade do Monstro.

## 8. Anonimato

- Durante a partida: **codinomes e avatares temporários**.
- É proibido ver nomes reais, perfis, rankings, insígnias ou histórico dos demais.
- As identidades públicas são reveladas **somente depois do encerramento**.
- Jogadores eliminados podem continuar como **espectadores** ou **sair**.

## 9. Monstros

Dez Monstros iniciais, com personalidades, habilidades, mitologia e expressões de infecção, sob responsabilidade do Agente 2.
As habilidades propostas passam pela avaliação de equilíbrio do Agente 1 antes de entrarem neste documento.
**Cards oficiais recebidos (D-37):** nome, especialidade, condição de infecção e frase principal de cada um, em `docs/MONSTROS.md`.
Ficha narrativa, variações das frases e avaliação de equilíbrio ainda pendentes.

## 10. Pendências de game design (definidas pelo proprietário; não inventar)

Ver `DECISIONS.md`, itens **PGD-01 a PGD-12**: validação de negação, ironia, citação e variações; frases exatas ou
equivalência semântica; auto-infecção simulada; comunicação entre eliminados; isolamento dos espectadores; capturas de
tela; edição de mensagens; frequência do VHS; voz no beta; expiração da autorização de voz; fórmulas de XP e rating;
desconexão, abandono e reconexão.

## 11. Lacunas identificadas na organização (aguardam o proprietário)

Ver `DECISIONS.md`, itens **L-01 a L-09**.
