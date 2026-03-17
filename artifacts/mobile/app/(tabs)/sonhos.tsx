import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAppData, type Sonho } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";

function SonhoCard({ sonho }: { sonho: Sonho }) {
  const [expanded, setExpanded] = useState(false);
  const { toggleSonhoTarefa } = useAppData();

  const totalTarefas = sonho.fases.reduce((acc, f) => acc + f.tarefas.length, 0);
  const doneTarefas = sonho.fases.reduce((acc, f) => acc + f.tarefas.filter(t => t.concluido).length, 0);
  const progresso = totalTarefas > 0 ? Math.round((doneTarefas / totalTarefas) * 100) : sonho.progresso;

  return (
    <Card style={styles.sonhoCard}>
      <Pressable onPress={() => setExpanded(e => !e)}>
        <View style={styles.sonhoHeader}>
          <View style={[styles.sonhoColorDot, { backgroundColor: sonho.cor }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sonhoTitulo}>{sonho.titulo}</Text>
            <Text style={styles.sonhoDesc}>{sonho.descricao}</Text>
          </View>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} />
        </View>
        <View style={styles.progressRow}>
          <ProgressBar value={progresso} max={100} color={sonho.cor} height={4} style={{ flex: 1 }} />
          <Text style={[styles.progressText, { color: sonho.cor }]}>{progresso}%</Text>
        </View>
        {sonho.prazo && (
          <Text style={styles.prazoText}>
            <Feather name="calendar" size={11} color={Colors.textTertiary} /> Meta: {new Date(sonho.prazo).getFullYear()}
          </Text>
        )}
      </Pressable>

      {expanded && (
        <View style={styles.fasesContainer}>
          <View style={styles.divider} />
          {sonho.fases.map((fase, fIdx) => {
            const faseDone = fase.tarefas.filter(t => t.concluido).length;
            return (
              <View key={fase.id} style={styles.faseItem}>
                <View style={styles.faseHeader}>
                  <View style={[styles.faseBullet, { backgroundColor: fase.concluida ? sonho.cor : Colors.surfaceElevated }]}>
                    {fase.concluida ? (
                      <Feather name="check" size={12} color="#fff" />
                    ) : (
                      <Text style={styles.faseBulletNum}>{fIdx + 1}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.faseTitulo}>{fase.titulo}</Text>
                    <Text style={styles.faseDesc}>{fase.descricao}</Text>
                  </View>
                  <Badge
                    label={`${faseDone}/${fase.tarefas.length}`}
                    color={sonho.cor + "22"}
                    textColor={sonho.cor}
                    size="sm"
                  />
                </View>
                {fase.tarefas.map(tarefa => (
                  <Pressable
                    key={tarefa.id}
                    style={styles.tarefaItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleSonhoTarefa(sonho.id, fase.id, tarefa.id);
                    }}
                  >
                    <View style={[styles.checkbox, tarefa.concluido && { backgroundColor: sonho.cor, borderColor: sonho.cor }]}>
                      {tarefa.concluido && <Feather name="check" size={11} color="#fff" />}
                    </View>
                    <Text style={[styles.tarefaText, tarefa.concluido && styles.tarefaTextDone]}>
                      {tarefa.texto}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

export default function SonhosScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useAppData();
  const isWeb = Platform.OS === "web";

  const hoje = new Date();
  const londresToday = new Date("2026-09-05");
  const diffDias = Math.max(0, Math.ceil((londresToday.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (isWeb ? 67 : 0) + 16, paddingBottom: (isWeb ? 34 : 0) + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Sonhos e Objetivos</Text>
      <Text style={styles.subtitle}>Metas SMART • Passo a passo</Text>

      {/* London Feature Card */}
      <Pressable
        onPress={() => router.push({ pathname: "/chat", params: { initialMessage: "Como posso conseguir o Global Talent Visa Tech Nation para trabalhar em Londres como desenvolvedor?" } })}
        style={styles.londonFeature}
      >
        <View style={styles.londonContent}>
          <Text style={styles.londonFlag}>🇬🇧</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.londonTitle}>Londres 2026-2027</Text>
            <Text style={styles.londonSub}>
              {diffDias > 0 ? `${diffDias} dias para a Fase 2` : "Hora de aplicar o visto!"}
            </Text>
            <Text style={styles.londonRange}>Salário-alvo: £38.000 – £45.000/ano</Text>
          </View>
        </View>
        <View style={styles.londonAiHint}>
          <Feather name="cpu" size={12} color={Colors.gold} />
          <Text style={styles.londonAiText}>Perguntar à IA sobre o Global Talent Visa</Text>
          <Feather name="chevron-right" size={12} color={Colors.gold} />
        </View>
      </Pressable>

      {data.sonhos.map(s => (
        <View key={s.id} style={{ marginBottom: 12 }}>
          <SonhoCard sonho={s} />
        </View>
      ))}

      {/* Salary Comparison */}
      <Text style={styles.sectionLabel}>Salários UK 2026 (estimativa)</Text>
      <Card style={styles.salaryCard}>
        {[
          { role: "Backend Java", salary: "£38k – £52k" },
          { role: "Backend Go", salary: "£40k – £55k" },
          { role: "Nest.js / Express", salary: "£35k – £48k" },
          { role: "React / Next.js", salary: "£36k – £50k" },
          { role: "Fullstack TS", salary: "£38k – £55k" },
        ].map((item, i) => (
          <View key={i} style={[styles.salaryRow, i < 4 && styles.salaryRowBorder]}>
            <Text style={styles.salaryRole}>{item.role}</Text>
            <Text style={styles.salaryAmount}>{item.salary}</Text>
          </View>
        ))}
        <Pressable
          style={styles.updateSalaryBtn}
          onPress={() => router.push({ pathname: "/chat", params: { initialMessage: "Atualize os salários médios para desenvolvedor junior em Londres 2026: backend Java, Go, Node.js, React, Fullstack TypeScript. Inclua média, mínimo e máximo em libras por ano." } })}
        >
          <Feather name="refresh-cw" size={12} color={Colors.accent} />
          <Text style={styles.updateSalaryText}>Atualizar via IA</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 16, marginTop: 2 },
  londonFeature: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.goldDim,
  },
  londonContent: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  londonFlag: { fontSize: 32 },
  londonTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.gold },
  londonSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  londonRange: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.green, marginTop: 4 },
  londonAiHint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.goldDim + "44", borderRadius: 8, padding: 8,
  },
  londonAiText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.gold, flex: 1 },
  sonhoCard: { marginBottom: 0 },
  sonhoHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  sonhoColorDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  sonhoTitulo: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  sonhoDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  progressText: { fontSize: 13, fontFamily: "Inter_700Bold", minWidth: 36, textAlign: "right" },
  prazoText: { fontSize: 11, color: Colors.textTertiary, fontFamily: "Inter_400Regular", marginTop: 6 },
  fasesContainer: { marginTop: 8 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 14 },
  faseItem: { marginBottom: 16 },
  faseHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  faseBullet: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  faseBulletNum: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  faseTitulo: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  faseDesc: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 1 },
  tarefaItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5, paddingLeft: 36 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 1.5,
    borderColor: Colors.textTertiary, justifyContent: "center", alignItems: "center",
  },
  tarefaText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text, flex: 1 },
  tarefaTextDone: { color: Colors.textTertiary, textDecorationLine: "line-through" },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 10, marginTop: 8 },
  salaryCard: { marginBottom: 16 },
  salaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  salaryRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  salaryRole: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  salaryAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.green },
  updateSalaryBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 10, justifyContent: "center" },
  updateSalaryText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.accent },
});
