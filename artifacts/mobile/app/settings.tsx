import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
// Use the new File class to avoid deprecation warnings if available, otherwise fallback
const { File } = FileSystem as any;
import * as Sharing from "expo-sharing";
import { Colors } from "@/constants/colors";
import { useSettings, GROQ_MODELS } from "@/contexts/SettingsContext";
import { exportAllDataAsJSON } from "@/lib/db";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { groqApiKey, groqModel, setGroqApiKey, setGroqModel } = useSettings();
  const [keyInput, setKeyInput] = useState(groqApiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const isWeb = Platform.OS === "web";

  async function handleSave() {
    await setGroqApiKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport() {
    try {
      const json = await exportAllDataAsJSON();
      const fileUri = (FileSystem as any).documentDirectory + "meu_futuro_2026_backup.json";
      
      if (typeof File !== 'undefined') {
        const f = new File(fileUri);
        await f.writeAsync(json);
      } else {
        await (FileSystem as any).writeAsStringAsync(fileUri, json);
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Erro", "Compartilhamento não disponível neste dispositivo.");
      }
    } catch (e: any) {
      Alert.alert("Erro", "Falha ao exportar backup: " + e.message);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (isWeb ? 67 : 0) + 16, paddingBottom: 60 },
      ]}
    >
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Configurações</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Groq API Key */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 IA — Groq API Key</Text>
        <Text style={styles.sectionDesc}>
          A Groq oferece API gratuita com modelos rápidos (Llama 3, Mixtral). Crie sua conta em{" "}
          <Text style={styles.link}>console.groq.com</Text> e copie a API Key.
        </Text>

        <View style={styles.keyInputRow}>
          <TextInput
            style={styles.keyInput}
            value={keyInput}
            onChangeText={setKeyInput}
            placeholder="gsk_..."
            placeholderTextColor={Colors.textTertiary}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowKey(s => !s)}>
            <Feather name={showKey ? "eye-off" : "eye"} size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <Pressable
          style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
          onPress={handleSave}
        >
          <Feather name={saved ? "check" : "save"} size={16} color="#fff" />
          <Text style={styles.saveBtnText}>{saved ? "Salvo!" : "Salvar API Key"}</Text>
        </Pressable>

        {!groqApiKey && (
          <View style={styles.warningBox}>
            <Feather name="alert-triangle" size={14} color={Colors.gold} />
            <Text style={styles.warningText}>
              Sem API Key, o chat com IA não funcionará. A Groq tem plano gratuito generoso.
            </Text>
          </View>
        )}

        {groqApiKey ? (
          <View style={styles.successBox}>
            <Feather name="check-circle" size={14} color={Colors.green} />
            <Text style={styles.successText}>API Key configurada ✓</Text>
          </View>
        ) : null}
      </View>

      {/* Model */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modelo de IA</Text>
        {GROQ_MODELS.map(m => (
          <Pressable
            key={m.id}
            style={[styles.modelOption, groqModel === m.id && styles.modelOptionActive]}
            onPress={() => setGroqModel(m.id)}
          >
            <View style={[styles.modelRadio, groqModel === m.id && styles.modelRadioActive]}>
              {groqModel === m.id && <View style={styles.modelRadioDot} />}
            </View>
            <Text style={[styles.modelLabel, groqModel === m.id && { color: Colors.accent }]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Backup */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup</Text>
        <Text style={styles.sectionDesc}>
          Gere um arquivo JSON com todos os seus dados salvos localmente (Matérias, faltas, finanças, atividades, etc).
        </Text>
        <Pressable style={styles.exportBtn} onPress={handleExport}>
          <Feather name="download" size={16} color={Colors.text} />
          <Text style={styles.exportBtnText}>Exportar Backup JSON</Text>
        </Pressable>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre o App</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutKey}>Versão</Text>
          <Text style={styles.aboutVal}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutKey}>Banco de dados</Text>
          <Text style={styles.aboutVal}>SQLite (local)</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutKey}>Desenvolvedor</Text>
          <Text style={styles.aboutVal}>Douglas, UFC</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  sectionDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 14, lineHeight: 19 },
  link: { color: Colors.accent },
  keyInputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  keyInput: {
    flex: 1, color: Colors.text, fontFamily: "Inter_400Regular",
    fontSize: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  eyeBtn: { padding: 12 },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingVertical: 12, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: 8,
  },
  saveBtnSuccess: { backgroundColor: Colors.green },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  warningBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 12,
    backgroundColor: Colors.goldDim + "44", borderRadius: 8, padding: 10,
  },
  warningText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.gold, flex: 1 },
  successBox: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10,
  },
  successText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.green },
  modelOption: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderRadius: 8, paddingHorizontal: 4,
  },
  modelOptionActive: { backgroundColor: Colors.accentDim + "33" },
  modelRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: "center", alignItems: "center",
  },
  modelRadioActive: { borderColor: Colors.accent },
  modelRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  modelLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  aboutRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  aboutKey: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  aboutVal: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  exportBtn: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingVertical: 12, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  exportBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
});
