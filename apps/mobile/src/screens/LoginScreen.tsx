import { useState } from "react";
import { View } from "react-native";
import { supabase } from "../supabase";
import { Button, ErrorText, Field, Logo, Muted } from "../ui";

/** D-24: login por código enviado por e-mail. Na prévia, qualquer e-mail e código de 6 dígitos entram. */
export function LoginScreen({ onPreviewSignIn }: { onPreviewSignIn?: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
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

  const sendCode = async () => {
    if (onPreviewSignIn) return setSent(true);
    if (await run(() => supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } }))) setSent(true);
  };
  const verify = () =>
    onPreviewSignIn ? onPreviewSignIn() : run(() => supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" }));

  return (
    <View>
      <Logo />
      {!sent ? (
        <>
          <Muted>Entre com seu e-mail. Enviaremos um código de acesso.</Muted>
          <Field value={email} onChangeText={setEmail} placeholder="seu@email.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" accessibilityLabel="E-mail" />
          <Button title="Enviar código" onPress={sendCode} disabled={busy || !email.includes("@")} />
        </>
      ) : (
        <>
          <Muted>
            {onPreviewSignIn
              ? "Prévia: nenhum e-mail é enviado. Digite qualquer código de 6 dígitos (ex.: 123456)."
              : `Digite o código enviado para ${email.trim()}.`}
          </Muted>
          <Field value={code} onChangeText={setCode} placeholder="Código" keyboardType="number-pad" autoComplete="one-time-code" accessibilityLabel="Código de acesso" />
          <Button title="Entrar" onPress={verify} disabled={busy || code.trim().length < 6} />
          <Button title="Trocar e-mail" onPress={() => setSent(false)} disabled={busy} />
        </>
      )}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}
