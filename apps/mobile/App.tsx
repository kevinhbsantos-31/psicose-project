import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, StatusBar as RNStatusBar, StyleSheet, Text, View } from "react-native";
import { initAudio, setAmbient } from "./src/audio";
import { missingConfig, PREVIEW } from "./src/config";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RoomScreen } from "./src/screens/RoomScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEEP_SIGNED_IN, supabase } from "./src/supabase";
import { color, Muted, Title } from "./src/ui";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [previewIn, setPreviewIn] = useState(false);
  const [room, setRoom] = useState<string | null>(null);

  useEffect(() => {
    initAudio();
    setAmbient("lobby");
  }, []);

  useEffect(() => {
    if (PREVIEW) return; // prévia: sem Supabase
    AsyncStorage.getItem(KEEP_SIGNED_IN)
      .then((keep) => (keep === "0" ? supabase.auth.signOut({ scope: "local" }) : undefined))
      .catch(() => undefined)
      .then(() => supabase.auth.getSession())
      .then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  let content;
  if (PREVIEW) {
    content = !previewIn ? (
      <LoginScreen onPreviewSignIn={() => setPreviewIn(true)} />
    ) : room ? (
      <RoomScreen key={room} code={room} onExit={() => setRoom(null)} />
    ) : (
      <HomeScreen onEnter={setRoom} onPreviewSignOut={() => setPreviewIn(false)} />
    );
  } else if (missingConfig.length > 0) {
    content = (
      <View>
        <Title>Configuração ausente</Title>
        <Muted>Defina em apps/mobile/.env: {missingConfig.join(", ")}</Muted>
      </View>
    );
  } else if (session === undefined) {
    content = <Muted>Carregando…</Muted>;
  } else if (!session) {
    content = <LoginScreen />;
  } else if (room) {
    content = <RoomScreen key={room} code={room} onExit={() => setRoom(null)} />;
  } else {
    content = <HomeScreen onEnter={setRoom} />;
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior="height">
      {PREVIEW ? <Text style={s.banner}>PRÉVIA — dados simulados, sem servidor</Text> : null}
      <View style={s.page}>{content}</View>
      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  page: { flex: 1, padding: 16, paddingTop: PREVIEW ? 16 : (RNStatusBar.currentHeight ?? 24) + 16 },
  banner: { color: color.text, backgroundColor: color.accent, fontSize: 12, fontWeight: "700", textAlign: "center", paddingVertical: 4, marginTop: RNStatusBar.currentHeight ?? 24 },
});
