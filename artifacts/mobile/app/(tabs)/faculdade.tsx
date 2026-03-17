import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { Colors } from "@/constants/colors";
import { useAppData, type Materia, type Atividade } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";

function MateriaCard({ materia, onAddAtividade, onToggleAtividade }: {
  materia: Materia;
  onAddAtividade: (materiaId: string, titulo: string) => void;
  onToggleAtividade: (materiaId: string, atividadeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [novaAtiv, setNovaAtiv] = useState("");

  const pendentes = materia.atividades.filter(a => !a.concluida).length;
  const faltasPercent = (materia.faltas / materia.maxFaltas) * 100;
  const faltasColor = faltasPercent > 70 ? Colors.red : faltasPercent > 40 ? Colors.gold : Colors.green;

  return (
    <Card style={styles.materiaCard} accentColor={materia.cor}>
      <Pressable
        onPress={() => setExpanded(e => !e)}
        style={styles.materiaHeader}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.materiaNome}>{materia.nome}</Text>
          <Text style={styles.materiaSemestre}>Semestre {materia.semestre}</Text>
        </View>
        <View style={styles.materiaRight}>
          {pendentes > 0 && (
            <Badge label={`${pendentes}`} color={Colors.accentDim} textColor={Colors.accentBright} size="sm" />
          )}
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} />
        </View>
      </Pressable>

      <View style={styles.faltasRow}>
        <Text style={[styles.faltasText, { color: faltasColor }]}>
          {materia.faltas}/{materia.maxFaltas} faltas
        </Text>
        <ProgressBar value={materia.faltas} max={materia.maxFaltas} color={faltasColor} height={3} style={{ flex: 1, marginLeft: 10 }} />
      </View>

      {expanded && (
        <View style={styles.atividades}>
          <Text style={styles.atividadesLabel}>Atividades</Text>
          {materia.atividades.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma atividade cadastrada</Text>
          )}
          {materia.atividades.map(a => (
            <Pressable
              key={a.id}
              style={styles.atividadeItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleAtividade(materia.id, a.id);
              }}
            >
              <View style={[styles.checkbox, a.concluida && styles.checkboxDone]}>
                {a.concluida && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text style={[styles.atividadeText, a.concluida && styles.atividadeTextDone]}>
                {a.titulo}
              </Text>
            </Pressable>
          ))}
          {adding ? (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="Nome da atividade..."
                placeholderTextColor={Colors.textTertiary}
                value={novaAtiv}
                onChangeText={setNovaAtiv}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (novaAtiv.trim()) {
                    onAddAtividade(materia.id, novaAtiv.trim());
                    setNovaAtiv("");
                    setAdding(false);
                  }
                }}
              />
              <Pressable
                style={styles.addBtn}
                onPress={() => {
                  if (novaAtiv.trim()) {
                    onAddAtividade(materia.id, novaAtiv.trim());
                    setNovaAtiv("");
                    setAdding(false);
                  }
                }}
              >
                <Feather name="check" size={16} color={Colors.accent} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.addAtividade} onPress={() => setAdding(true)}>
              <Feather name="plus" size={14} color={Colors.accent} />
              <Text style={styles.addAtividadeText}>Adicionar atividade</Text>
            </Pressable>
          )}
        </View>
      )}
    </Card>
  );
}

export default function FaculdadeScreen() {
  const insets = useSafeAreaInsets();
  const { data, updateData, toggleAtividade } = useAppData();
  const isWeb = Platform.OS === "web";

  const handleAddAtividade = async (materiaId: string, titulo: string) => {
    await updateData(prev => ({
      ...prev,
      materias: prev.materias.map(m =>
        m.id === materiaId
          ? {
              ...m,
              atividades: [
                ...m.atividades,
                {
                  id: Date.now().toString(),
                  titulo,
                  concluida: false,
                  materiaId,
                },
              ],
            }
          : m
      ),
    }));
  };

  const handleAddFalta = async (materiaId: string) => {
    const m = data.materias.find(m => m.id === materiaId);
    if (!m) return;
    if (m.faltas >= m.maxFaltas) {
      Alert.alert("Atenção!", "Você já atingiu o limite de faltas nessa matéria!");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateData(prev => ({
      ...prev,
      materias: prev.materias.map(m =>
        m.id === materiaId ? { ...m, faltas: m.faltas + 1 } : m
      ),
    }));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (isWeb ? 67 : 0) + 16, paddingBottom: (isWeb ? 34 : 0) + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Faculdade</Text>
      <Text style={styles.subtitle}>UFC Quixadá • CC • 1º Semestre</Text>

      <View style={styles.semesterCard}>
        <Text style={styles.semesterTitle}>Semestre Atual</Text>
        <Text style={styles.semesterInfo}>
          {data.materias.filter(m => m.semestre === 1).length} matérias •{" "}
          {data.materias.reduce((acc, m) => acc + m.atividades.filter(a => !a.concluida).length, 0)} atividades pendentes
        </Text>
      </View>

      {data.materias.map(m => (
        <View key={m.id} style={{ marginBottom: 10 }}>
          <MateriaCard
            materia={m}
            onAddAtividade={handleAddAtividade}
            onToggleAtividade={toggleAtividade}
          />
          <Pressable
            style={styles.faltaBtn}
            onPress={() => handleAddFalta(m.id)}
          >
            <Feather name="minus-circle" size={13} color={Colors.red} />
            <Text style={styles.faltaBtnText}>Registrar falta</Text>
          </Pressable>
        </View>
      ))}

      <Pressable
        style={styles.addMateriaBtn}
        onPress={() => Alert.alert("Em breve", "Adicionar nova matéria em próxima versão!")}
      >
        <Feather name="plus" size={16} color={Colors.accent} />
        <Text style={styles.addMateriaBtnText}>Adicionar matéria</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 16, marginTop: 2 },
  semesterCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  semesterTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  semesterInfo: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  materiaCard: { marginBottom: 0 },
  materiaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  materiaNome: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  materiaSemestre: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 1 },
  materiaRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  faltasRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  faltasText: { fontSize: 11, fontFamily: "Inter_500Medium", minWidth: 80 },
  atividades: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  atividadesLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginBottom: 8 },
  emptyText: { fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular", marginBottom: 8 },
  atividadeItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
    borderColor: Colors.textTertiary, justifyContent: "center", alignItems: "center",
  },
  checkboxDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  atividadeText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text, flex: 1 },
  atividadeTextDone: { color: Colors.textTertiary, textDecorationLine: "line-through" },
  addForm: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  input: {
    flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, color: Colors.text,
    fontFamily: "Inter_400Regular", fontSize: 13, borderWidth: 1, borderColor: Colors.border,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.surfaceElevated,
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  addAtividade: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, marginTop: 4 },
  addAtividadeText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.accent },
  faltaBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 5, paddingHorizontal: 12, alignSelf: "flex-end",
  },
  faltaBtnText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.red },
  addMateriaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.surface, borderRadius: 12,
    paddingVertical: 14, borderWidth: 1, borderColor: Colors.border,
    marginTop: 8,
  },
  addMateriaBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.accent },
});
