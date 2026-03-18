import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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
import { useAppData } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

const LONDON_DATE = new Date("2026-09-05");

export default function SonhosScreen() {
  const insets = useSafeAreaInsets();
  const { goals } = useAppData();
  const isWeb = Platform.OS === "web";

  const diasLondres = Math.max(0, Math.ceil((LONDON_DATE.getTime() - Date.now()) / 86400000));
  const totalDias = 365;
  const londonProgress = Math.min(100, Math.round(((totalDias - diasLondres) / totalDias) * 100));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (isWeb ? 67 : 0) + 16, paddingBottom: 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Sonhos</Text>
      <Text style={styles.subtitle}>London 2026 • Metas SMART</Text>

      {/* London Feature Card */}
      <Card style={styles.londonCard}>
        <View style={styles.londonTop}>
          <Text style={styles.londonFlag}>🇬🇧</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.londonTitle}>Londres 2026–2027</Text>
            <Text style={styles.londonSub}>Trabalhar como dev • £38k–£45k/ano</Text>
          </View>
        </View>
        <Text style={styles.londonDays}>{diasLondres} dias</Text>
        <Text style={styles.londonDate}>até 05/09/2026 (alvo Fase 2 — Global Talent Visa)</Text>
        <ProgressBar value={londonProgress} max={100} color={Colors.gold} height={5} style={styles.londonBar} />

        <View style={styles.londonSteps}>
          {[
            { num: "1", label: "Base sólida", desc: "Portfólio, inglês B2, primeiro freela", done: false },
            { num: "2", label: "Global Talent Visa", desc: "Tech Nation UK — a partir de 18 anos", done: false },
            { num: "3", label: "Londres — Primeiro Emprego", desc: "Junior dev £38k+ • Mudança real", done: false },
          ].map((step, i) => (
            <View key={i} style={styles.londonStep}>
              <View style={[styles.stepNum, step.done && { backgroundColor: Colors.gold }]}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.londonAiBtn}
          onPress={() => router.push({ pathname: "/chat", params: { initialMessage: "Crie um plano detalhado passo a passo para eu conseguir o Global Talent Visa UK (Tech Nation) sendo desenvolvedor brasileiro de 17 anos. Inclua requisitos, evidências necessárias, timeline e como construir meu portfólio até lá." } })}
        >
          <Feather name="cpu" size={13} color={Colors.gold} />
          <Text style={styles.londonAiBtnText}>Plano detalhado London via IA</Text>
          <Feather name="arrow-right" size={13} color={Colors.gold} />
        </Pressable>
      </Card>

      {/* Goals SMART Summary */}
      <View style={styles.goalsHeader}>
        <Text style={styles.sectionLabel}>Minhas Metas SMART</Text>
        <Pressable
          style={styles.addGoalBtn}
          onPress={() => router.push("/(tabs)/estudos")}
        >
          <Feather name="target" size={14} color={Colors.accent} />
          <Text style={styles.addGoalBtnText}>Gerenciar</Text>
        </Pressable>
      </View>

      {goals.length === 0 ? (
        <Card style={styles.noGoalsCard}>
          <Feather name="target" size={32} color={Colors.textTertiary} />
          <Text style={styles.noGoalsTitle}>Nenhuma meta cadastrada</Text>
          <Text style={styles.noGoalsDesc}>
            Crie metas SMART na aba Estudos para acompanhar seu progresso.
          </Text>
          <Pressable
            style={styles.confirmBtn}
            onPress={() => router.push("/(tabs)/estudos")}
          >
            <Text style={styles.confirmBtnText}>Criar primeira meta</Text>
          </Pressable>
        </Card>
      ) : (
        goals.map(g => {
          const done = g.milestones.filter(m => m.concluido).length;
          const total = g.milestones.length;
          const progress = total > 0 ? Math.round((done / total) * 100) : g.progresso;
          return (
            <Pressable
              key={g.id}
              style={styles.goalCard}
              onPress={() => router.push("/(tabs)/estudos")}
            >
              <View style={styles.goalHeader}>
                <View style={[styles.goalDot, { backgroundColor: g.cor }]} />
                <Text style={styles.goalTitulo} numberOfLines={1}>{g.titulo}</Text>
                <Text style={[styles.goalPct, { color: g.cor }]}>{progress}%</Text>
              </View>
              <ProgressBar value={progress} max={100} color={g.cor} height={3} style={styles.goalBar} />
              {g.prazo && (
                <Text style={styles.goalPrazo}>
                  Meta: {new Date(g.prazo).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </Text>
              )}
              {total > 0 && (
                <Text style={styles.goalMilestones}>{done}/{total} milestones concluídos</Text>
              )}
            </Pressable>
          );
        })
      )}

      {/* UK Salaries */}
      <Text style={styles.sectionLabel}>Salários UK — Dev Junior 2026</Text>
      <Card style={styles.salaryCard}>
        {[
          { role: "Backend Java", range: "£38k – £52k" },
          { role: "Backend Go", range: "£40k – £55k" },
          { role: "Node.js / Express", range: "£35k – £48k" },
          { role: "React / Next.js", range: "£36k – £50k" },
          { role: "Fullstack TypeScript", range: "£38k – £55k" },
        ].map((item, i) => (
          <View key={i} style={[styles.salaryRow, i < 4 && styles.salaryRowBorder]}>
            <Text style={styles.salaryRole}>{item.role}</Text>
            <Text style={styles.salaryRange}>{item.range}</Text>
          </View>
        ))}
        <Pressable
          style={styles.updateBtn}
          onPress={() => router.push({ pathname: "/chat", params: { initialMessage: "Atualize os salários médios 2026 para desenvolvedor junior em Londres: Java, Go, Node.js, React, Fullstack TypeScript. Formato: cargo — salário mínimo, médio e máximo em libras por ano." } })}
        >
          <Feather name="refresh-cw" size={12} color={Colors.accent} />
          <Text style={styles.updateBtnText}>Atualizar via IA</Text>
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
  londonCard: { borderWidth: 1, borderColor: Colors.goldDim, marginBottom: 20 },
  londonTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  londonFlag: { fontSize: 36 },
  londonTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.gold },
  londonSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 3 },
  londonDays: { fontSize: 44, fontFamily: "Inter_700Bold", color: Colors.gold, letterSpacing: -2 },
  londonDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 12 },
  londonBar: { marginBottom: 16 },
  londonSteps: { gap: 12, marginBottom: 16 },
  londonStep: { flexDirection: "row", alignItems: "flex-start" },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.goldDim, justifyContent: "center", alignItems: "center",
  },
  stepNumText: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.gold },
  stepLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  stepDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  londonAiBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.goldDim + "44", borderRadius: 8, padding: 10,
  },
  londonAiBtnText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.gold },
  goalsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 10 },
  addGoalBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.accentDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  addGoalBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.accent },
  noGoalsCard: { alignItems: "center", paddingVertical: 30, gap: 10, marginBottom: 16 },
  noGoalsTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  noGoalsDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 20 },
  confirmBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24, marginTop: 6 },
  confirmBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  goalCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  goalDot: { width: 8, height: 8, borderRadius: 4 },
  goalTitulo: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  goalPct: { fontSize: 14, fontFamily: "Inter_700Bold" },
  goalBar: {},
  goalPrazo: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 6 },
  goalMilestones: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginTop: 2 },
  salaryCard: { marginBottom: 16 },
  salaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  salaryRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  salaryRole: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  salaryRange: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.green },
  updateBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 10, justifyContent: "center" },
  updateBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.accent },
});
