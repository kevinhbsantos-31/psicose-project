import type { ReactNode } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, type TextInputProps } from "react-native";

// Identidade derivada do logotipo oficial (docs/design/IDENTIDADE_VISUAL.md): sépia, osso, vermelho-sangue.
export const color = {
  bg: "#0d0a08",
  panel: "#2a1f16",
  edge: "#3d2d20", // borda gasta da fotografia
  text: "#ebe0cb", // osso / marfim
  muted: "#b6a78c",
  accent: "#7a1414", // contorno e pincelada vermelha
  accentHi: "#a3201c",
  ok: "#7a8f5f",
};
// shortcut: fontes do sistema (serifa/monoespaçada) em vez de fontes customizadas; trocar quando houver fonte licenciada da marca.
export const font = { title: Platform.select({ android: "serif", default: "Georgia" }), mono: "monospace" };

const LOGO = require("../assets/branding/logo-psicose.jpeg"); // cópia exata do logotipo oficial — não editar

/** Logotipo oficial, sem recorte (proporção original 3:2). */
export function Logo() {
  return <Image source={LOGO} style={s.logo} resizeMode="contain" accessibilityRole="image" accessibilityLabel="PSICOSE" />;
}

export function Button({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.button, disabled && s.disabled, pressed && s.pressed]}
    >
      <Text style={s.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={color.muted} {...props} style={[s.field, props.style]} />;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={s.muted}>{children}</Text>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? <Text style={s.error} accessibilityLiveRegion="polite">{children}</Text> : null;
}

const s = StyleSheet.create({
  button: {
    backgroundColor: color.accent, borderWidth: 1, borderColor: color.accentHi, paddingVertical: 14, paddingHorizontal: 18,
    borderRadius: 6, alignItems: "center", marginVertical: 6,
  },
  disabled: { opacity: 0.4 },
  pressed: { backgroundColor: color.accentHi },
  buttonText: { color: color.text, fontSize: 16, fontWeight: "600", letterSpacing: 0.5 },
  field: {
    backgroundColor: "#16110d", color: color.text, borderWidth: 1, borderColor: color.edge, borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginVertical: 6,
  },
  title: {
    color: color.text, fontFamily: font.title, fontSize: 26, letterSpacing: 1.5, marginBottom: 12,
    textShadowColor: color.accent, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3,
  },
  muted: { color: color.muted, fontSize: 14, marginVertical: 4 },
  error: { color: "#e7a59f", fontSize: 14, marginVertical: 6 },
  logo: { width: "100%", aspectRatio: 1536 / 1024, borderRadius: 10, marginBottom: 16 },
});
