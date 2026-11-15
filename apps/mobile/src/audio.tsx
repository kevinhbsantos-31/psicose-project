// Áudio do app (D-32 a D-34, docs/design/IDENTIDADE_SENSORIAL.md). Sons locais; os eventos saem do snapshot
// enviado pelo servidor — o cliente só toca, nunca decide. Falha de áudio nunca derruba o app: fica em silêncio.
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Snapshot } from "@psicose/rules";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, color, Muted } from "./ui";

const AMBIENT = {
  lobby: require("../assets/audio/amb_lobby.m4a"),
  partida: require("../assets/audio/amb_partida.m4a"),
  fim: require("../assets/audio/amb_fim.m4a"),
};
const SFX = {
  inicio: require("../assets/audio/sfx_inicio.m4a"),
  pv: require("../assets/audio/sfx_pv.m4a"),
  abandono: require("../assets/audio/sfx_abandono.m4a"),
  fim: require("../assets/audio/sfx_fim.m4a"),
};
export type Ambient = keyof typeof AMBIENT;
export type Sfx = keyof typeof SFX;

const AMBIENT_LEVEL = 0.6; // ambiente sempre abaixo dos efeitos, para não competir com a leitura
const DUCK = 0.35; // o ambiente abaixa para 35% quando toca um efeito e volta em ~1,3 s
const FADE_S = 1.5; // crossfade entre fases e na emenda do loop (o AAC tem silêncio no fim do arquivo)
const TICK_MS = 100;
const STEP = TICK_MS / 1000 / FADE_S;
const KEY = "psicose.audio";

type Settings = { volume: number; muted: boolean };
let settings: Settings = { volume: 0.7, muted: false };
const listeners = new Set<() => void>();

type Voice = { player: AudioPlayer; gain: number };
let current: (Voice & { name: Ambient }) | null = null;
let fading: Voice[] = [];
let wanted: Ambient | null = null;
let duck = 1;
let foreground = AppState.currentState === "active";
let timer: ReturnType<typeof setInterval> | null = null;
const sfxPlayers: Partial<Record<Sfx, AudioPlayer>> = {};

const master = () => (settings.muted ? 0 : settings.volume);

function safe(fn: () => void) {
  try {
    fn();
  } catch (e) {
    if (__DEV__) console.warn("[audio]", e);
  }
}

function startAmbient(name: Ambient) {
  const player = createAudioPlayer(AMBIENT[name]);
  player.volume = 0;
  player.play();
  if (current) fading.push(current);
  current = { name, player, gain: 0 };
}

function tick() {
  safe(() => {
    if (!current && wanted && foreground) startAmbient(wanted);
    if (!current) return;
    const p = current.player;
    if (p.duration > 0 && p.currentTime >= p.duration - FADE_S) startAmbient(current.name); // emenda do loop
    current.gain = Math.min(1, current.gain + STEP);
    duck = Math.min(1, duck + 0.05);
    const level = master() * AMBIENT_LEVEL * duck;
    current.player.volume = current.gain * level;
    fading = fading.filter((v) => {
      v.gain -= STEP;
      if (v.gain > 0) {
        v.player.volume = v.gain * level;
        return true;
      }
      v.player.remove();
      return false;
    });
  });
}

function stopAll() {
  safe(() => {
    for (const v of [...fading, ...(current ? [current] : [])]) v.player.remove();
    fading = [];
    current = null;
  });
}

/** Chamar uma vez na abertura do app. */
export function initAudio() {
  if (timer) return;
  timer = setInterval(tick, TICK_MS);
  setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: "mixWithOthers" }).catch(() => {});
  AsyncStorage.getItem(KEY)
    .then((raw) => {
      const s = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
      update({
        volume: typeof s.volume === "number" ? clamp(s.volume) : settings.volume,
        muted: typeof s.muted === "boolean" ? s.muted : settings.muted,
      });
    })
    .catch(() => {});
  AppState.addEventListener("change", (state) => {
    foreground = state === "active";
    if (!foreground) stopAll(); // em segundo plano não toca; o tick recomeça o ambiente ao voltar
  });
}

/** Troca a trilha ambiente com crossfade. */
export function setAmbient(name: Ambient) {
  wanted = name;
  if (current?.name !== name && foreground) safe(() => startAmbient(name));
}

export function playSfx(name: Sfx) {
  if (!master() || !foreground) return;
  safe(() => {
    const p = (sfxPlayers[name] ??= createAudioPlayer(SFX[name]));
    p.volume = master();
    p.seekTo(0).catch(() => {});
    p.play();
    duck = DUCK;
  });
}

const clamp = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 10) / 10;

function update(next: Settings) {
  settings = next;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}

export const setVolume = (v: number) => update({ ...settings, volume: clamp(v) });
export const toggleMute = () => update({ ...settings, muted: !settings.muted });

export function useAudioSettings(): Settings {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => settings,
  );
}

/** Traduz mudanças do snapshot em sons. Ao sair da sala, volta para o ambiente do lobby. */
export function useRoomSounds(s: Snapshot | null) {
  const prev = useRef<Snapshot | null>(null);
  useEffect(() => () => setAmbient("lobby"), []);
  useEffect(() => {
    if (!s) return;
    setAmbient(s.phase === "lobby" ? "lobby" : s.phase === "partida" ? "partida" : "fim");
    const p = prev.current;
    prev.current = s;
    if (!p) return; // primeiro snapshot (inclusive reconexão): sem efeito
    const me = s.me?.codename;
    const lastSeq = p.messages.reduce((max, m) => Math.max(max, m.seq), -1);
    if (p.phase === "lobby" && s.phase === "partida") playSfx("inicio");
    else if (p.phase !== "encerrada" && s.phase === "encerrada") playSfx("fim");
    else if (abandoned(s) > abandoned(p)) playSfx("abandono");
    else if (me && s.messages.some((m) => m.seq > lastSeq && m.to === me && m.from !== me)) playSfx("pv");
  }, [s]);
}

const abandoned = (s: Snapshot) => s.players.filter((p) => p.abandoned).length;

/** Controles de som. `compact`: só o botão de silenciar (cabeçalho da sala). */
export function AudioControls({ compact }: { compact?: boolean }) {
  const { volume, muted } = useAudioSettings();
  const label = muted ? "Som desligado" : "Som ligado";
  if (compact) {
    return (
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: !muted }} accessibilityLabel="Som" onPress={toggleMute} hitSlop={8}>
        <Text style={s.compact}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <View>
      <Muted>Som</Muted>
      <View style={s.row}>
        <View style={s.cell}>
          <Button title="−" onPress={() => setVolume(volume - 0.1)} disabled={muted || volume <= 0} />
        </View>
        <Text style={s.value} accessibilityLabel={`Volume ${Math.round(volume * 100)} por cento`}>
          {muted ? "Silenciado" : `${Math.round(volume * 100)}%`}
        </Text>
        <View style={s.cell}>
          <Button title="+" onPress={() => setVolume(volume + 0.1)} disabled={muted || volume >= 1} />
        </View>
      </View>
      <Button title={muted ? "Ativar som" : "Silenciar"} onPress={toggleMute} />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  cell: { width: 64 },
  value: { flex: 1, textAlign: "center", color: color.text, fontSize: 16 },
  compact: { color: color.muted, fontSize: 13, paddingVertical: 4 },
});
