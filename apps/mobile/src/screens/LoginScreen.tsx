import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { View } from "react-native";
import { KEEP_SIGNED_IN, supabase } from "../supabase";
import { Button, ErrorText, Field, Logo, Muted } from "../ui";

type Mode = "login" | "signup" | "confirm";

/** D-47: cadastro com e-mail e senha, código por e-mail só para confirmar o cadastro, login com senha. Na prévia, tudo entra. */
export function LoginScreen({ onPreviewSignIn }: { onPreviewSignIn?: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [keep, setKeep] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<{ error: { message: string } | null }>) {
    setBusy(true);
    setError(null);
    const { error } = await action();
    setBusy(false);
    if (error) setError(error.message);
    return !error;
  }

  // Gravado antes de entrar: o App lê na próxima abertura e encerra a sessão se for "0".
  const remember = () => AsyncStorage.setItem(KEEP_SIGNED_IN, keep ? "1" : "0");

  const signIn = async () => {
    if (onPreviewSignIn) return onPreviewSignIn();
    await remember();
    await run(() => supabase.auth.signInWithPassword({ email: email.trim(), password }));
  };
  const signUp = async () => {
    if (onPreviewSignIn) return setMode("confirm");
    if (await run(() => supabase.auth.signUp({ email: email.trim(), password }))) setMode("confirm");
  };
  const confirm = async () => {
    if (onPreviewSignIn) return onPreviewSignIn();
    await remember();
    await run(() => supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "signup" }));
  };

  const validEmail = email.includes("@");
  const keepToggle = (
    <Button title={`Manter conectado: ${keep ? "sim" : "não"}`} onPress={() => setKeep(!keep)} disabled={busy} />
  );

  return (
    <View>
      <Logo />
      {mode === "confirm" ? (
        <>
          <Muted>
            {onPreviewSignIn
              ? "Prévia: nenhum e-mail é enviado. Digite qualquer código de 6 dígitos (ex.: 123456)."
              : `Digite o código enviado para ${email.trim()} para confirmar o cadastro.`}
          </Muted>
          <Field value={code} onChangeText={setCode} placeholder="Código" keyboardType="number-pad" autoComplete="one-time-code" accessibilityLabel="Código de confirmação" />
          {keepToggle}
          <Button title="Confirmar cadastro" onPress={confirm} disabled={busy || code.trim().length < 6} />
          <Button title="Voltar" onPress={() => setMode("signup")} disabled={busy} />
        </>
      ) : (
        <>
          <Muted>{mode === "login" ? "Entre com seu e-mail e senha." : "Crie sua conta. Enviaremos um código para confirmar o e-mail."}</Muted>
          <Field value={email} onChangeText={setEmail} placeholder="seu@email.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" accessibilityLabel="E-mail" />
          <Field
            value={password}
            onChangeText={setPassword}
            placeholder={mode === "signup" ? "Senha (mínimo 6 caracteres)" : "Senha"}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            accessibilityLabel="Senha"
          />
          {mode === "login" ? (
            <>
              {keepToggle}
              <Button title="Entrar" onPress={signIn} disabled={busy || !validEmail || !password} />
              <Button title="Criar conta" onPress={() => setMode("signup")} disabled={busy} />
            </>
          ) : (
            <>
              <Button title="Cadastrar" onPress={signUp} disabled={busy || !validEmail || password.length < 6} />
              <Button title="Já tenho conta" onPress={() => setMode("login")} disabled={busy} />
            </>
          )}
        </>
      )}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}
