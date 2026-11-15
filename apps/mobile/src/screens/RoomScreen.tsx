import { MAX_MESSAGE_LENGTH, type ChatMessage, type ClientMessage, type MatchResult, type Snapshot } from "@psicose/rules";
import { useState } from "react";
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { AudioControls, useRoomSounds } from "../audio";
import { PREVIEW } from "../config";
import { usePreviewRoom } from "../preview";
import { useRoom, type Status } from "../room";
import { Button, color, ErrorText, Field, font, Muted, Title } from "../ui";

const RESULT_TEXT: Record<MatchResult["reason"], string> = {
  monstro_abandonou: "O Monstro abandonou a partida.",
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
            {snapshot.result?.winner === "inocentes" ? "Os Inocentes venceram" : "O Monstro venceu"}
          </Text>
          <Muted>{snapshot.result ? RESULT_TEXT[snapshot.result.reason] : ""}</Muted>
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

function Match({ snapshot, send }: { snapshot: Snapshot; send: Send }) {
  const me = snapshot.me!;
  const [channel, setChannel] = useState<string | null>(null); // null = chat público; senão, codinome do PV
  const [text, setText] = useState("");

  const visible = snapshot.messages.filter((m) => inChannel(m, channel, me.codename));
  const targetGone = channel !== null && !!snapshot.players.find((p) => p.codename === channel)?.abandoned;
  const confirmQuit = () =>
    Alert.alert("Abandonar a partida?", "Você sai definitivamente e não poderá voltar a esta partida.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Abandonar", style: "destructive", onPress: () => send({ t: "leave" }) },
    ]);
  const submit = () => {
    const t = text.trim();
    if (!t || targetGone) return;
    send(channel === null ? { t: "chat", text: t } : { t: "pm", to: channel, text: t });
    setText("");
  };

  return (
    <View style={s.fill}>
      <Text style={s.role} accessibilityRole="header">
        Você é {me.codename} · {me.role === "monstro" ? "MONSTRO" : "INOCENTE"}
      </Text>
      <View style={s.tabs} accessibilityRole="tablist">
        <Tab label="Público" active={channel === null} onPress={() => setChannel(null)} />
        {snapshot.players
          .filter((p) => !p.you)
          .map((p) => (
            <Tab
              key={p.codename}
              label={`${p.codename}${p.abandoned ? " (saiu)" : p.online ? "" : " (off)"}`}
              active={channel === p.codename}
              onPress={() => setChannel(p.codename)}
            />
          ))}
      </View>
      <Muted>
        {channel === null ? "Todos veem estas mensagens." : targetGone ? `${channel} abandonou a partida.` : `Conversa privada com ${channel}.`}
      </Muted>
      <FlatList
        style={s.fill}
        data={visible}
        keyExtractor={(m) => String(m.seq)}
        renderItem={({ item }) => (
          <Text style={s.msg}>
            <Text style={s.from}>{item.from === me.codename ? "Você" : item.from}: </Text>
            {item.text}
          </Text>
        )}
      />
      <Field value={text} onChangeText={setText} placeholder="Mensagem" maxLength={MAX_MESSAGE_LENGTH} onSubmitEditing={submit} accessibilityLabel="Mensagem" />
      <Button title="Enviar" onPress={submit} disabled={!text.trim() || targetGone} />
      <Button title="Abandonar partida" onPress={confirmQuit} />
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
  tabs: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: color.panel, borderWidth: 1, borderColor: color.edge, margin: 3 },
  tabActive: { backgroundColor: color.accent, borderColor: color.accentHi },
  tabText: { color: color.text, fontSize: 14 },
  msg: { color: color.text, fontSize: 15, lineHeight: 21, marginVertical: 3 },
  from: { fontWeight: "700", color: color.muted },
});
