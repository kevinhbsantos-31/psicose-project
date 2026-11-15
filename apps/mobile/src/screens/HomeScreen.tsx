import { isRoomCode, ROOM_CODE_LENGTH } from "@psicose/rules";
import { useState } from "react";
import { View } from "react-native";
import { AudioControls } from "../audio";
import { PREVIEW } from "../config";
import { PREVIEW_ROOM_CODE } from "../preview";
import { createRoom } from "../room";
import { supabase } from "../supabase";
import { Button, ErrorText, Field, Muted, Title } from "../ui";

export function HomeScreen({ onEnter, onPreviewSignOut }: { onEnter: (code: string) => void; onPreviewSignOut?: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      onEnter(PREVIEW ? PREVIEW_ROOM_CODE : await createRoom());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  };

  const normalized = code.trim().toUpperCase();

  return (
    <View>
      <Title>Salas privadas</Title>
      <Button title="Criar sala" onPress={create} disabled={busy} />
      <Muted>Ou entre com o código recebido por convite:</Muted>
      <Field
        value={code}
        onChangeText={setCode}
        placeholder="CÓDIGO"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={ROOM_CODE_LENGTH}
        accessibilityLabel="Código da sala"
      />
      <Button title="Entrar na sala" onPress={() => onEnter(normalized)} disabled={busy || !isRoomCode(normalized)} />
      <ErrorText>{error}</ErrorText>
      <AudioControls />
      <Button title="Sair da conta" onPress={() => (onPreviewSignOut ? onPreviewSignOut() : supabase.auth.signOut())} disabled={busy} />
    </View>
  );
}
