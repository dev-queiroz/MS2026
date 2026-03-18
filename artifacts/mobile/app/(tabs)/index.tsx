import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, SECTION_COLORS } from "@/constants/colors";
import { useAppData } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

const LONDON_TARGET = new Date("2026-09-05");

function diasPara(d: Date) {
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

interface SectionCardProps {
  title: string;
  icon: string;
  color: string;
  dimColor: string;
  value: string;
  subtitle: string;
  route: string;
}

function SectionCard({ title, icon, color, dimColor, value, subtitle, route }: SectionCardProps) {
  return (
    <Card onPress={() => router.push(route as any)} style={styles.sectionCard}>
      <View style={[styles.sectionIcon, { backgroundColor: dimColor }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={[styles.sectionValue, { color }]}>{value}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </Card>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { materias, atividades, goals, transacoes, pesos, freelas } = useAppData();
  const isWeb = Platform.OS === "web";

  const diasLondres = diasPara(LONDON_TARGET);
  const londonProgress = Math.max(0, Math.min(100, ((365 - diasLondres) / 365) * 100));

  const stats = useMemo(() => {
    const pendAtividades = atividades.filter(a => a.status === "pendente").length;
    const totalGoals = goals.length;
    const avgGoalProgress = totalGoals > 0
      ? Math.round(goals.reduce((a, g) => a + g.progresso, 0) / totalGoals)
      : 0;
    const saldo = transacoes.reduce((acc, t) => t.tipo === "entrada" ? acc + t.valor : acc - t.valor, 0);
    const pesoAtual = pesos.length > 0 ? pesos[pesos.length - 1].peso : null;
    const freelaAbertos = freelas.filter(f => f.status !== "concluido").length;
    return { pendAtividades, totalGoals, avgGoalProgress, saldo, pesoAtual, freelaAbertos };
  }, [materias, atividades, goals, transacoes, pesos, freelas]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (isWeb ? 67 : 0) + 16, paddingBottom: 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>{greeting()}, Douglas 👋</Text>
          <Text style={styles.subGreeting}>UFC Quixadá CC • 1º semestre</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.aiBtn} onPress={() => router.push("/chat")}>
            <Feather name="cpu" size={18} color={Colors.accent} />
          </Pressable>
          <Pressable style={styles.settingsBtn} onPress={() => router.push("/settings" as any)}>
            <Feather name="settings" size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Zero State Mocks */}
      {materias.length === 0 && stats.totalGoals === 0 && (
        <Card style={styles.zeroStateCard}>
          <Feather name="zap" size={40} color={Colors.accent} style={{ marginBottom: 12 }} />
          <Text style={styles.zeroStateTitle}>Bem-vindo ao Meu Futuro 2026!</Text>
          <Text style={styles.zeroStateDesc}>
            O aplicativo está 100% limpo e pronto para uso. Adicione suas matérias do 1º semestre para começar!
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <Pressable
              style={styles.zeroStateBtn}
              onPress={() => router.push("/(tabs)/faculdade" as any)}
            >
              <Text style={[styles.zeroStateBtnText, { color: "#fff" }]}>
                Ir para Faculdade
              </Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>
          </View>
        </Card>
      )}

      {/* London Countdown */}
      <Card style={styles.londonCard}>
        <View style={styles.londonTop}>
          <View style={styles.londonLabel}>
            <View style={styles.londonDot} />
            <Text style={styles.londonLabelText}>Meta Londres</Text>
          </View>
          <Text style={styles.londonFlag}>🇬🇧</Text>
        </View>
        <Text style={styles.londonDays}>{diasLondres}</Text>
        <Text style={styles.londonSub}>dias até 05/09/2026 • £38k-£45k</Text>
        <ProgressBar value={londonProgress} max={100} color={Colors.gold} height={4} style={styles.londonBar} />
      </Card>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: pendAtividadeColor(stats.pendAtividades) }]}>
            {stats.pendAtividades}
          </Text>
          <Text style={styles.statLabel}>Atividades pend.</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: stats.saldo >= 0 ? Colors.green : Colors.red }]}>
            R${Math.abs(stats.saldo).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Saldo</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.orange }]}>
            {stats.pesoAtual ? `${stats.pesoAtual}kg` : "--"}
          </Text>
          <Text style={styles.statLabel}>Peso atual</Text>
        </Card>
      </View>

      {/* Seções */}
      <Text style={styles.sectionsTitle}>Seções</Text>
      <View style={styles.sectionsGrid}>
        <SectionCard
          title="Faculdade"
          icon="book"
          color={SECTION_COLORS.faculdade.main}
          dimColor={SECTION_COLORS.faculdade.dim}
          value={`${stats.pendAtividades} pend.`}
          subtitle={`${materias.length} matérias cadastradas`}
          route="/(tabs)/faculdade"
        />
        <SectionCard
          title="Estudos"
          icon="target"
          color={SECTION_COLORS.estudos.main}
          dimColor={SECTION_COLORS.estudos.dim}
          value={`${stats.totalGoals} metas`}
          subtitle={`Média ${stats.avgGoalProgress}% progresso`}
          route="/(tabs)/estudos"
        />
        <SectionCard
          title="Sonhos"
          icon="star"
          color={SECTION_COLORS.sonhos.main}
          dimColor={SECTION_COLORS.sonhos.dim}
          value={`${diasLondres}d`}
          subtitle="Countdown Londres"
          route="/(tabs)/sonhos"
        />
        <SectionCard
          title="Finanças"
          icon="dollar-sign"
          color={SECTION_COLORS.financas.main}
          dimColor={SECTION_COLORS.financas.dim}
          value={`R$${stats.saldo.toFixed(0)}`}
          subtitle="Saldo atual"
          route="/(tabs)/mais"
        />
        <SectionCard
          title="Saúde"
          icon="activity"
          color={SECTION_COLORS.saude.main}
          dimColor={SECTION_COLORS.saude.dim}
          value={stats.pesoAtual ? `${stats.pesoAtual}kg` : "--"}
          subtitle="Bodyweight training"
          route="/(tabs)/mais"
        />
        <SectionCard
          title="Freela"
          icon="briefcase"
          color={SECTION_COLORS.freela.main}
          dimColor={SECTION_COLORS.freela.dim}
          value={`${stats.freelaAbertos} ativos`}
          subtitle="Pipeline de clientes"
          route="/(tabs)/mais"
        />
      </View>

      {/* Próximas atividades */}
      {atividades.filter(a => a.prazo && a.status !== "concluída").length > 0 && (
        <View style={styles.proximasCard}>
          <Text style={styles.proximasTitle}>Prazos próximos</Text>
          {atividades
            .filter(a => a.prazo && a.status !== "concluída")
            .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime())
            .slice(0, 3)
            .map(a => {
              const dias = Math.ceil((new Date(a.prazo!).getTime() - Date.now()) / 86400000);
              const cor = dias <= 1 ? Colors.red : dias <= 5 ? Colors.gold : Colors.textSecondary;
              return (
                <View key={a.id} style={styles.proximaItem}>
                  <Text style={[styles.proximaDias, { color: cor }]}>{dias <= 0 ? "hoje" : `${dias}d`}</Text>
                  <Text style={styles.proximaTitulo} numberOfLines={1}>{a.titulo}</Text>
                </View>
              );
            })
          }
        </View>
      )}

      {/* AI Chat Quick Actions */}
      <Card style={styles.aiCard}>
        <View style={styles.aiCardHeader}>
          <Feather name="cpu" size={16} color={Colors.accent} />
          <Text style={styles.aiCardTitle}>IA Pessoal</Text>
        </View>
        <View style={styles.aiPrompts}>
          {[
            "Dicas para meu primeiro freela",
            "Salários dev junior UK",
            "Plano de treino bodyweight",
          ].map(p => (
            <Pressable
              key={p}
              style={styles.aiPromptBtn}
              onPress={() => router.push({ pathname: "/chat", params: { initialMessage: p } })}
            >
              <Text style={styles.aiPromptText}>{p}</Text>
              <Feather name="arrow-right" size={12} color={Colors.accent} />
            </Pressable>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function pendAtividadeColor(n: number) {
  if (n === 0) return Colors.green;
  if (n <= 3) return Colors.gold;
  return Colors.red;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  subGreeting: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  aiBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.accentDim, justifyContent: "center", alignItems: "center",
  },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surfaceElevated, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  zeroStateCard: { alignItems: "center", padding: 24, marginBottom: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.accentDim },
  zeroStateTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 8, textAlign: "center" },
  zeroStateDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  zeroStateBtn: { backgroundColor: Colors.accent, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  zeroStateBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  londonCard: {
    marginBottom: 16, padding: 16, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.goldDim,
  },
  londonTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  londonLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  londonDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.red },
  londonLabelText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  londonFlag: { fontSize: 24 },
  londonDays: { fontSize: 52, fontFamily: "Inter_700Bold", color: Colors.gold, letterSpacing: -2 },
  londonSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 10 },
  londonBar: { marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 12 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2, textAlign: "center" },
  sectionsTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 10 },
  sectionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  sectionCard: { flex: 1, minWidth: "44%", gap: 5 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  sectionValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  proximasCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  proximasTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 10 },
  proximaItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
  proximaDias: { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 32 },
  proximaTitulo: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text },
  aiCard: { marginBottom: 12 },
  aiCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  aiCardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  aiPrompts: { gap: 6 },
  aiPromptBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.surfaceElevated, borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  aiPromptText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
});
