import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { Colors } from "@/constants/colors";
import { useAppData } from "@/contexts/AppDataContext";

export default function NotaEditorScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; isNew?: string }>();
  const { notas, addNota, updateNota, deleteNota } = useAppData();
  const isWeb = Platform.OS === "web";

  const existingNota = params.id ? notas.find(n => n.id === params.id) : null;
  const [titulo, setTitulo] = useState(existingNota?.titulo ?? "");
  const [conteudo, setConteudo] = useState(existingNota?.conteudo ?? "");
  const [saved, setSaved] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [notaId, setNotaId] = useState<string | null>(existingNota?.id ?? null);

  async function handleSave() {
    if (!titulo.trim()) return;
    if (notaId) {
      await updateNota(notaId, { titulo: titulo.trim(), conteudo });
    } else {
      const id = await addNota(titulo.trim(), conteudo);
      setNotaId(id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (isWeb ? 67 : 0) + 8 }]}>
        <Pressable style={styles.iconBtn} onPress={() => { handleSave(); router.back(); }}>
          <Feather name="chevron-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconBtn} onPress={() => setIsPreview(!isPreview)}>
          <Feather name={isPreview ? "edit-2" : "eye"} size={20} color={Colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={handleSave}>
          <Feather name={saved ? "check" : "save"} size={20} color={saved ? Colors.green : Colors.accent} />
        </Pressable>
        {notaId && (
          <Pressable
            style={styles.iconBtn}
            onPress={async () => {
              await deleteNota(notaId);
              router.back();
            }}
          >
            <Feather name="trash-2" size={18} color={Colors.red} />
          </Pressable>
        )}
      </View>

      {/* Título */}
      <TextInput
        style={[styles.tituloInput, { fontSize: 22 }]}
        placeholder="Título da nota..."
        placeholderTextColor={Colors.textTertiary}
        value={titulo}
        onChangeText={setTitulo}
        multiline={false}
        editable={!isPreview}
      />

      {/* Markdown hints */}
      {!isPreview && (
        <View style={styles.markdownHints}>
          {["# H1", "- lista", "1. num", "**bold**", "*italic*"].map(h => (
            <Pressable
              key={h}
              style={styles.hintChip}
              onPress={() => setConteudo(c => c + "\n" + h + " ")}
            >
              <Text style={styles.hintText}>{h}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Conteúdo */}
      {isPreview ? (
        <ScrollView style={styles.previewContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          <Markdown style={markdownStyles}>
            {conteudo || "_Nenhum conteúdo ainda._"}
          </Markdown>
        </ScrollView>
      ) : (
        <TextInput
          style={styles.conteudoInput}
          placeholder={"Escreva aqui... (suporte a markdown básico)\n\n# Título\n- Item de lista\n1. Lista numerada\n\nTexto normal..."}
          placeholderTextColor={Colors.textTertiary}
          value={conteudo}
          onChangeText={setConteudo}
          multiline
          textAlignVertical="top"
        />
      )}
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  body: { color: Colors.text, fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24 },
  heading1: { color: Colors.text, fontFamily: "Inter_700Bold", fontSize: 28, marginTop: 16, marginBottom: 8 },
  heading2: { color: Colors.text, fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 16, marginBottom: 8 },
  heading3: { color: Colors.text, fontFamily: "Inter_600SemiBold", fontSize: 20, marginTop: 12, marginBottom: 8 },
  heading4: { color: Colors.text, fontFamily: "Inter_600SemiBold", fontSize: 18, marginTop: 12, marginBottom: 8 },
  heading5: { color: Colors.text, fontFamily: "Inter_600SemiBold", fontSize: 16, marginTop: 12, marginBottom: 4 },
  heading6: { color: Colors.text, fontFamily: "Inter_600SemiBold", fontSize: 16, marginTop: 12, marginBottom: 4 },
  paragraph: { color: Colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24, marginBottom: 16 },
  list_item: { color: Colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24, marginBottom: 4 },
  bullet_list: { marginBottom: 16 },
  ordered_list: { marginBottom: 16 },
  strong: { fontFamily: "Inter_700Bold", color: Colors.text },
  em: { fontStyle: "italic" },
  link: { color: Colors.accent },
  blockquote: { borderLeftWidth: 4, borderLeftColor: Colors.border, paddingLeft: 12, marginLeft: 0, marginTop: 8, marginBottom: 16, opacity: 0.8 },
  code_inline: { backgroundColor: Colors.surfaceElevated, borderRadius: 4, paddingHorizontal: 4, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 14, color: Colors.accentDim },
  code_block: { backgroundColor: Colors.surfaceElevated, borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 16 },
  fence: { backgroundColor: Colors.surfaceElevated, borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 16 },
  hr: { backgroundColor: Colors.border, height: 1, marginTop: 16, marginBottom: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  tituloInput: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    color: Colors.text, fontFamily: "Inter_700Bold",
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  markdownHints: {
    flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  hintChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
  },
  hintText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  conteudoInput: {
    flex: 1, paddingHorizontal: 20, paddingTop: 14,
    color: Colors.text, fontFamily: "Inter_400Regular", fontSize: 15,
    lineHeight: 24,
  },
  previewContainer: {
    flex: 1, paddingHorizontal: 20, paddingTop: 14,
  },
});
