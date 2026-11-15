import {
  MAX_MESSAGE_LENGTH, wordsOf, type ChatMessage, type ClientMessage, type MatchResult, type MonsterId, type Snapshot,
} from "@psicose/rules";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { AudioControls, useRoomSounds } from "../audio";
import { PREVIEW } from "../config";
import { usePreviewRoom } from "../preview";
import { useRoom, type Status } from "../room";
import { Button, color, ErrorText, Field, font, Muted, Title } from "../ui";

const RESULT_TEXT: Record<MatchResult["reason"], string> = {
  monstro_abandonou: "O Monstro abandonou a partida.",
  monstro_morto: "O Monstro foi morto com o revólver.",
  infeccao: "Os Inocentes que restaram foram infectados.",
  ultimo_inocente: "Só restou um Inocente diante do Monstro.",
};

export const MONSTER_NAME: Record<MonsterId, string> = {
  concordante: "O Concordante", contestador: "O Contestador", silencioso: "O Silencioso", socorro: "O Socorro",
  delator: "O Delator", confidente: "O Confidente", eco: "O Eco", reflexo: "O Reflexo", anfitriao: "O Anfitrião",
  observador: "O Observador",
};

const STATUS_TEXT: Record<Status, string> = {
  conectando: "Conectando…",
  conectado: "Conectado",
  reconectando: "Conexão perdida. Reconectando…",
  encerrado: "Desconectado",
};

const useRoomConnection = PREVIEW ? usePreviewRoom : useRoom; // escolhido uma vez, fora da renderização

export function RoomScreen({ code, onExit }: { code: string; onExit: () => void }) {
  const { snapshot, status, ended, error, send, clearError } = useRoomConnection(code);
  useRoomSounds(snapshot);

  if (ended) {
    return (
      <View>
        <Title>Sala {code}</Title>
        <Muted>{ended}</Muted>
        <Button title="Voltar" onPress={onExit} />
      </View>
    );
  }

  const result = snapshot?.result;
  return (
    <View style={s.fill}>
      <View style={s.header}>
        <Text style={s.code} accessibilityLabel={`Código da sala ${code.split("").join(" ")}`}>{code}</Text>
        <Text style={[s.status, status === "conectado" && { color: color.ok }]}>{STATUS_TEXT[status]}</Text>
        <AudioControls compact />
      </View>
      <ErrorText>{error}</ErrorText>
      {error ? <Button title="OK" onPress={clearError} /> : null}
      {!snapshot ? (
        <Muted>Carregando a sala…</Muted>
      ) : snapshot.phase === "lobby" ? (
        <Lobby snapshot={snapshot} code={code} onLeave={() => send({ t: "leave" })} />
      ) : snapshot.phase === "encerrada" ? (
        <View>
          <Title>Fim da partida</Title>
          <Text style={s.role} accessibilityRole="header">
            {result?.winner === "inocentes" ? "Os Inocentes venceram" : "O Monstro venceu"}
          </Text>
          <Muted>{result ? RESULT_TEXT[result.reason] : ""}</Muted>
          {result ? (
            <Muted>
              O Monstro era {result.monster.codename}
              {result.monster.type ? `: ${MONSTER_NAME[result.monster.type]}` : ""}.
            </Muted>
          ) : null}
          <Button title="Voltar" onPress={onExit} />
        </View>
      ) : (
        <Match snapshot={snapshot} send={send} />
      )}
    </View>
  );
}

function Lobby({ snapshot, code, onLeave }: { snapshot: Snapshot; code: string; onLeave: () => void }) {
  const slots = Array.from({ length: snapshot.maxPlayers }, (_, i) => snapshot.seats[i]);
  return (
    <View>
      <Title>Aguardando jogadores</Title>
      {slots.map((seat, i) => (
        <Text key={i} style={s.seat}>
          {seat ? `${seat.you ? "Você" : "Ocupada"} · ${seat.online ? "online" : "offline"}` : "Vaga livre"}
        </Text>
      ))}
      <Muted>As identidades ficam ocultas. Os codinomes são sorteados no início da partida.</Muted>
      <Muted>
        A partida começa automaticamente quando as {snapshot.maxPlayers} vagas forem ocupadas ({snapshot.seats.length}/{snapshot.maxPlayers}).
      </Muted>
      <Button title="Convidar (compartilhar código)" onPress={() => Share.share({ message: `Entre na minha sala do PSICOSE. Código: ${code}` })} />
      <Button title="Sair da sala" onPress={onLeave} />
    </View>
  );
}

type Send = (m: ClientMessage) => void;

/** Relógio de 1 s para contagens regressivas. */
function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const secondsLeft = (until: number, now: number) => Math.max(0, Math.ceil((until - now) / 1000));

function Match({ snapshot, send }: { snapshot: Snapshot; send: Send }) {
  const me = snapshot.me!;
  const now = useNow();
  const [channel, setChannel] = useState<string | null>(null); // null = chat público; senão, codinome do PV
  const [text, setText] = useState("");
  const [picking, setPicking] = useState(false); // Monstro escolhendo a mensagem-isca
  const [bait, setBait] = useState<ChatMessage | null>(null);

  const spectator = !me.alive; // D-55: eliminado só assiste ao chat público
  const ch = spectator ? null : channel;
  const visible = snapshot.messages.filter((m) => inChannel(m, ch, me.codename));
  const targetGone = ch !== null && !snapshot.players.find((p) => p.codename === ch)?.alive;
  const confirmQuit = () =>
    Alert.alert("Abandonar a partida?", "Você sai definitivamente e não poderá voltar a esta partida.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Abandonar", style: "destructive", onPress: () => send({ t: "leave" }) },
    ]);
  const submit = () => {
    const t = text.trim();
    if (!t || targetGone) return;
    send(ch === null ? { t: "chat", text: t } : { t: "pm", to: ch, text: t });
    setText("");
  };

  return (
    <View style={s.fill}>
      <Text style={s.role} accessibilityRole="header">
        Você é {me.codename} · {spectator ? "ELIMINADO (espectador)" : me.role === "monstro" ? "MONSTRO" : "INOCENTE"}
      </Text>
      {me.infected ? <Text style={s.alert} accessibilityLiveRegion="assertive">Você foi infectado.</Text> : null}
      {!spectator ? <GunPanel snapshot={snapshot} send={send} /> : null}
      {me.monster && !spectator ? (
        <MonsterMenu
          snapshot={snapshot} send={send} now={now} bait={bait} picking={picking}
          setPicking={setPicking} clearBait={() => setBait(null)}
        />
      ) : null}
      {!spectator ? (
        <View style={s.tabs} accessibilityRole="tablist">
          <Tab label="Público" active={ch === null} onPress={() => setChannel(null)} />
          {snapshot.players
            .filter((p) => !p.you)
            .map((p) => (
              <Tab
                key={p.codename}
                label={`${p.codename}${p.abandoned ? " (saiu)" : !p.alive ? " (morto)" : p.online ? "" : " (off)"}`}
                active={ch === p.codename}
                onPress={() => setChannel(p.codename)}
              />
            ))}
        </View>
      ) : null}
      <Muted>
        {picking
          ? "Toque na mensagem que será a isca."
          : ch === null
            ? spectator ? "Você assiste ao chat público." : "Todos veem estas mensagens."
            : targetGone ? `${ch} está fora da partida.` : `Conversa privada com ${ch}.`}
      </Muted>
      <FlatList
        style={s.fill}
        data={visible}
        keyExtractor={(m) => String(m.seq)}
        renderItem={({ item }) => (
          <Pressable
            disabled={!picking || !!item.system}
            onPress={() => {
              setBait(item);
              setPicking(false);
            }}
            style={bait?.seq === item.seq ? s.baitMsg : undefined}
          >
            {item.system ? (
              <Text style={s.system}>{item.text}</Text>
            ) : (
              <Text style={s.msg}>
                <Text style={s.from}>{item.from === me.codename ? "Você" : item.from}: </Text>
                {item.text}
              </Text>
            )}
          </Pressable>
        )}
      />
      {!spectator ? (
        <>
          <Field value={text} onChangeText={setText} placeholder="Mensagem" maxLength={MAX_MESSAGE_LENGTH} onSubmitEditing={submit} accessibilityLabel="Mensagem" />
          <Button title="Enviar" onPress={submit} disabled={!text.trim() || targetGone} />
        </>
      ) : null}
      <Button title={spectator ? "Sair" : "Abandonar partida"} onPress={confirmQuit} />
    </View>
  );
}

/** Revólver (D-49). Todos veem os mesmos botões; o servidor decide o resto. */
function GunPanel({ snapshot, send }: { snapshot: Snapshot; send: Send }) {
  const g = snapshot.gun!;
  const mine = g.holder === snapshot.me!.codename;
  const gun = (action: "pegar" | "largar" | "permitir" | "disparar", target?: string) => send({ t: "gun", action, target });
  const shoot = (target: string) =>
    Alert.alert(`Atirar em ${target}?`, "Não há como voltar atrás.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Atirar", style: "destructive", onPress: () => gun("disparar", target) },
    ]);
  return (
    <View style={s.panel}>
      <Text style={s.panelText}>
        Revólver {g.holder ? (mine ? "com você" : `com ${g.holder}`) : "no chão"} · {g.bullets} {g.bullets === 1 ? "bala" : "balas"}
        {g.armed ? " · disparo permitido" : ""}
      </Text>
      <View style={s.row}>
        {!g.holder ? <Chip label="Pegar o revólver" onPress={() => gun("pegar")} /> : null}
        {g.holder && !mine && !g.armed && g.bullets > 0 ? <Chip label="Permitir disparo" onPress={() => gun("permitir")} /> : null}
        {mine && g.armed
          ? snapshot.players.filter((p) => !p.you && p.alive).map((p) => <Chip key={p.codename} label={`Atirar em ${p.codename}`} danger onPress={() => shoot(p.codename)} />)
          : null}
        {mine ? <Chip label="Largar" onPress={() => gun("largar")} /> : null}
      </View>
    </View>
  );
}

type MonsterMenuProps = {
  snapshot: Snapshot; send: Send; now: number; bait: ChatMessage | null; picking: boolean;
  setPicking: (v: boolean) => void; clearBait: () => void;
};

/** Menu secreto do Monstro (D-54): isca, infectar, infectar a si mesmo. Só o Monstro recebe estes dados. */
function MonsterMenu({ snapshot, send, now, bait, picking, setPicking, clearBait }: MonsterMenuProps) {
  const m = snapshot.me!.monster!;
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState<string | null>(null);

  if (!m.type) {
    return (
      <View style={s.panel}>
        <Text style={s.panelText}>Escolha o seu Monstro (só você vê isto):</Text>
        <View style={s.row}>
          {m.available.map((id) => <Chip key={id} label={MONSTER_NAME[id]} onPress={() => send({ t: "monster", id })} />)}
        </View>
      </View>
    );
  }

  const active = m.attempts.filter((a) => a.status === "ativa");
  const cooldown = secondsLeft(m.cooldownUntil, now);
  const eco = m.type === "eco";
  const needsBait = eco || m.type === "silencioso";
  const words = eco && bait ? [...new Set(wordsOf(bait.text))] : [];
  const targets = snapshot.players.filter(
    (p) => !p.you && p.alive && !m.infected.includes(p.codename) && (!eco || p.codename === bait?.from),
  );
  const infect = (target: string) => {
    send({ t: "infect", target, bait: bait?.seq, word: word ?? undefined });
    clearBait();
    setWord(null);
  };

  return (
    <View style={s.panel}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={s.panelText}>
          {open ? "▾" : "▸"} {MONSTER_NAME[m.type]} · infectados {m.infected.length}/3{cooldown ? ` · recarga ${cooldown}s` : ""}
        </Text>
      </Pressable>
      {active.map((a) => (
        <View key={a.id} style={s.row}>
          <Text style={s.small}>
            Observando {a.target}
            {a.endsAt ? ` · ${secondsLeft(a.endsAt, now)}s` : ""}
            {a.word ? ` · “${a.word}” ${a.count}/4` : ""}
          </Text>
          {a.rule === "eco" ? <Chip label="Cancelar" onPress={() => send({ t: "infect_cancel", id: a.id })} /> : null}
        </View>
      ))}
      {open ? (
        <View>
          {needsBait ? (
            <Chip
              label={picking ? "Toque numa mensagem…" : bait ? `Isca: “${bait.text.slice(0, 40)}”` : eco ? "Isca: mensagem da vítima" : "Isca: sua mensagem pública"}
              active={!!bait}
              onPress={() => setPicking(!picking)}
            />
          ) : null}
          {words.length ? (
            <View style={s.row}>
              {words.map((w) => <Chip key={w} label={w} active={word === w} onPress={() => setWord(w)} />)}
            </View>
          ) : null}
          <Text style={s.small}>Infectar:</Text>
          <View style={s.row}>
            {targets.map((p) => <Chip key={p.codename} label={p.codename} danger disabled={cooldown > 0} onPress={() => infect(p.codename)} />)}
          </View>
          {!m.selfInfected ? <Chip label="Infectar a si mesmo (simulação)" onPress={() => send({ t: "self_infect" })} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function inChannel(m: ChatMessage, channel: string | null, me: string): boolean {
  if (channel === null) return m.to === null;
  return (m.from === me && m.to === channel) || (m.from === channel && m.to === me);
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[s.tab, active && s.tabActive]}>
      <Text style={s.tabText}>{label}</Text>
    </Pressable>
  );
}

function Chip({ label, onPress, active, danger, disabled }: { label: string; onPress: () => void; active?: boolean; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={[s.tab, active && s.tabActive, danger && s.danger, disabled && s.disabled]}
    >
      <Text style={s.tabText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  code: { color: color.text, fontFamily: font.mono, fontSize: 22, fontWeight: "700", letterSpacing: 4 },
  status: { color: color.muted, fontFamily: font.mono, fontSize: 12 },
  seat: { color: color.text, fontSize: 16, backgroundColor: color.panel, borderWidth: 1, borderColor: color.edge, padding: 12, borderRadius: 10, marginVertical: 3 },
  role: {
    color: color.text, fontFamily: font.title, fontSize: 19, letterSpacing: 1, backgroundColor: color.panel, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: color.edge, borderBottomWidth: 4, borderBottomColor: color.accent,
  },
  alert: { color: color.text, backgroundColor: color.accent, padding: 10, borderRadius: 8, marginTop: 6, fontWeight: "700", textAlign: "center" },
  panel: { backgroundColor: color.panel, borderWidth: 1, borderColor: color.edge, borderRadius: 10, padding: 8, marginTop: 6 },
  panelText: { color: color.text, fontSize: 14, fontWeight: "700" },
  small: { color: color.muted, fontSize: 13, marginVertical: 2 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  tabs: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: color.panel, borderWidth: 1, borderColor: color.edge, margin: 3 },
  tabActive: { backgroundColor: color.accent, borderColor: color.accentHi },
  danger: { borderColor: color.accentHi },
  disabled: { opacity: 0.4 },
  tabText: { color: color.text, fontSize: 14 },
  msg: { color: color.text, fontSize: 15, lineHeight: 21, marginVertical: 3 },
  system: { color: color.muted, fontSize: 14, fontStyle: "italic", marginVertical: 3 },
  baitMsg: { backgroundColor: color.panel, borderLeftWidth: 3, borderLeftColor: color.accent, paddingLeft: 6 },
  from: { fontWeight: "700", color: color.muted },
});
